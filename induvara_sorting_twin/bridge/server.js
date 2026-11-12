// Induvara digital twin server: serves the 3D page and bridges it to a Mitsubishi PLC.
//   Browser ⇄ HTTP + Server-Sent Events ⇄ this server ⇄ MX Component ⇄ GX Simulator3 (GX Works3)
//                                                     ⇄ SLMP 3E binary over TCP ⇄ real FX5U (LAN)
// No npm install needed: Node.js only.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { SlmpClient } = require('./slmp');
const { MxClient, splitCommand } = require('./mx');
const { parse, name } = require('./devices');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');            // the twin's static files
const CONFIG_FILE = path.join(__dirname, 'config.json');
const argPort = process.argv.indexOf('--port');
const HTTP_PORT = Number(argPort > 0 ? process.argv[argPort + 1] : process.env.PORT) || 8000;
const HOST = process.env.HOST || '127.0.0.1';

const DEFAULT_CONFIG = {
  mode: 'off',               // 'off' | 'sim' (GX Simulator3 via MX Component) | 'real' (SLMP over LAN)
  access: 'readwrite',       // 'readwrite' = twin plays the machine (writes inputs) | 'buttons' = sensors from the PLC, twin writes only its push buttons | 'read' = monitor only
  station: 1,                // MX Component logical station number (Communication Setup Utility)
  python: 'python',          // Python that has pywin32 (32-bit for MX Component v4)
  host: '192.168.3.250',     // FX5U factory default IP
  port: 5007,                // SLMP Connection Module port set in GX Works3
  xyBase: 8,                 // FX5 (iQ-F) = octal, iQ-R/Q = 16
  pollMs: 30,
};

let config = loadConfig();
let client = null;
let watch = [];               // device names the page wants (from its I/O table)
let watchOut = [];            // outputs among them: read every cycle
let state = {};               // device -> 0/1, last values read
let status = { state: 'off', mode: config.mode, access: config.access, error: null, info: null, pollMs: null };
const sse = new Set();

function loadConfig() {
  try { return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) }; }
  catch { return { ...DEFAULT_CONFIG }; }
}
function saveConfig() { fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2)); }

function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sse) res.write(msg);
}
function setStatus(patch) {
  const next = { ...status, ...patch };
  if (JSON.stringify(next) === JSON.stringify(status)) return;
  status = next;
  broadcast('status', status);
}

function makeClient(cfg = config) {
  if (cfg.mode === 'sim') return new MxClient({ station: cfg.station, python: cfg.python, xyBase: cfg.xyBase });
  if (cfg.mode === 'real') return new SlmpClient({ host: cfg.host, port: cfg.port, xyBase: cfg.xyBase });
  return null;
}
const label = (cfg = config) => cfg.mode === 'sim' ? `GX Simulator3 · MX station ${cfg.station}` : `PLC ${cfg.host}:${cfg.port} · SLMP`;

// ---------- connection + polling ----------
let generation = 0;           // bumps on every (re)configure so stale async work is ignored
let connecting = false;

async function ensureConnected() {
  if (config.mode === 'off' || connecting || (client && client.connected)) return;
  const gen = generation;
  connecting = true;
  setStatus({ state: 'connecting', error: null });
  const c = makeClient();
  try {
    await c.connect();
    if (gen !== generation) { c.close(); return; }
    client = c;
    state = {};
    broadcast('reset', {});
    setStatus({ state: 'connected', error: null, info: c.info || label() });
    console.log(`[plc] connected: ${label()}`);
  } catch (e) {
    c.close();
    if (gen === generation) setStatus({ state: 'error', error: friendly(e) });
  } finally {
    connecting = false;
  }
}

// Turn a device list into a few block reads: same device, contiguous-ish numbers.
function plan(devices) {
  const byDev = {};
  for (const n of devices) {
    try { const d = parse(n, config.xyBase); if (d.isBit) (byDev[d.dev] ||= new Set()).add(d.num); } catch { /* ignore bad */ }
  }
  const blocks = [];
  for (const [dev, set] of Object.entries(byDev)) {
    const nums = [...set].sort((a, b) => a - b);
    let start = nums[0], end = nums[0];
    for (const n of nums.slice(1)) {
      if (n - start < 64) end = n;
      else { blocks.push({ dev, start, count: end - start + 1 }); start = end = n; }
    }
    blocks.push({ dev, start, count: end - start + 1 });
  }
  return blocks;
}

async function pollOnce() {
  await ensureConnected();
  const c = client;
  if (!c || !c.connected) return;
  const gen = generation;
  const t0 = Date.now();
  const changed = {};
  // A client that batches (MX: readBlocks = one MX call per poll) reads everything every cycle.
  // Otherwise, in simulate mode the page itself drives the inputs, so outputs are read every
  // cycle and inputs only every 5th.
  const list = !c.readBlocks && config.access === 'readwrite' && cycle++ % 5 && watchOut.length ? watchOut : watch;
  try {
    const blocks = plan(list);
    const results = c.readBlocks
      ? await c.readBlocks(blocks.map((b) => ({ addr: name(b.dev, b.start, config.xyBase), n: b.count })))
      : [];
    for (const [bi, b] of blocks.entries()) {
      const vals = c.readBlocks ? results[bi] : await c.readBits(name(b.dev, b.start, config.xyBase), b.count);
      vals.forEach((v, i) => {
        const key = name(b.dev, b.start + i, config.xyBase);
        if (!watch.includes(key)) return;
        if (state[key] !== v) { state[key] = v; changed[key] = v; }
      });
    }
    if (gen !== generation) return;
    if (Object.keys(changed).length) broadcast('data', changed);
    setStatus({ state: 'connected', error: null, pollMs: Date.now() - t0 });
  } catch (e) {
    if (gen !== generation) return;
    if (!c.connected) client = null;
    setStatus({ state: c.connected ? 'connected' : 'error', error: friendly(e) });
  }
}

// Exactly one poll loop. pollSoon() used to start an extra loop whenever it was called while a
// poll was in flight (every /api/write does that), so loops piled up, all queued on the single
// MX Component bridge, and a read could take seconds. Now an early poll is only requested.
let timer = null, cycle = 0, polling = false, soon = false;
async function loop() {
  timer = null;
  polling = true; soon = false;
  const t = Date.now();
  try { await pollOnce(); } finally { polling = false; }
  const wait = soon ? 0 : client && client.connected ? config.pollMs : 2000;
  timer = setTimeout(loop, Math.max(soon ? 0 : 10, wait - (Date.now() - t)));
}
function pollSoon() {
  if (polling) { soon = true; return; }             // the running poll schedules the next one right away
  if (timer) { clearTimeout(timer); timer = setTimeout(loop, 5); }
}
loop();

function reconfigure(patch) {
  generation++;
  const prev = config;
  config = sanitize({ ...config, ...patch });
  saveConfig();
  const changedLink = ['mode', 'station', 'python', 'host', 'port', 'xyBase'].some((k) => prev[k] !== config[k]);
  if (changedLink || config.mode === 'off') {
    if (client) client.close();
    client = null;
    state = {};
    broadcast('reset', {});
  }
  setStatus({ state: config.mode === 'off' ? 'off' : (client && client.connected ? 'connected' : 'connecting'),
    mode: config.mode, access: config.access, error: null, info: config.mode === 'off' ? null : label(), pollMs: null });
  pollSoon();
}

function sanitize(c) {
  const out = { ...DEFAULT_CONFIG, ...c };
  if (!['off', 'sim', 'real'].includes(out.mode)) out.mode = 'off';
  if (!['read', 'readwrite', 'buttons'].includes(out.access)) out.access = 'readwrite';
  out.station = Math.max(0, Math.min(1023, parseInt(out.station, 10) || 1));
  out.port = Math.max(1, Math.min(65535, parseInt(out.port, 10) || 5007));
  out.xyBase = Number(out.xyBase) === 16 ? 16 : 8;
  out.pollMs = Math.max(20, Math.min(2000, parseInt(out.pollMs, 10) || 60));
  out.host = String(out.host || '').trim();
  out.python = String(out.python || 'python').trim();
  return out;
}

async function writeMany(list) {
  if (config.access === 'read') throw new Error('โหมดอ่านอย่างเดียว: ไม่อนุญาตให้เขียนค่าไปที่ PLC');
  if (!client || !client.connected) throw new Error('ยังไม่ได้เชื่อมต่อ PLC');
  const clean = list.map((w) => {
    const d = parse(w.device, config.xyBase);
    if (!d.isBit) throw new Error(`${w.device}: เขียนได้เฉพาะ bit device`);
    return { device: name(d.dev, d.num, config.xyBase), value: w.value ? 1 : 0 };
  });
  await client.writeMany(clean);
  const changed = {};
  for (const w of clean) if (watch.includes(w.device) && state[w.device] !== w.value) { state[w.device] = w.value; changed[w.device] = w.value; }
  if (Object.keys(changed).length) broadcast('data', changed);
  pollSoon();
}

// One-shot test with the settings on the form (does not touch the live connection).
async function testConnection(cfg) {
  cfg = sanitize({ ...config, ...cfg });
  if (cfg.mode === 'off') throw new Error('เลือกรูปแบบการเชื่อมต่อก่อน');
  if (client && client.connected && ['mode', 'station', 'python', 'host', 'port', 'xyBase'].every((k) => cfg[k] === config[k])) {
    const t = Date.now(); const [sm] = await client.readBits('SM400', 1);
    return { ok: true, ms: Date.now() - t, sm400: sm, info: label(cfg), shared: true };
  }
  const c = makeClient(cfg);
  const t = Date.now();
  try {
    await c.connect();
    const [sm] = await c.readBits('SM400', 1);   // SM400 = always ON while the CPU runs
    return { ok: true, ms: Date.now() - t, sm400: sm, info: c.info || label(cfg) };
  } finally { c.close(); }
}

function diagPython(python) {
  return new Promise((resolve) => {
    const [cmd, ...args] = splitCommand(python || config.python);
    let out = '', err = '';
    const p = spawn(cmd, [...args, path.join(__dirname, 'mx_bridge.py'), '--diag'], { windowsHide: true });
    const t = setTimeout(() => p.kill(), 15000);
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    p.on('error', (e) => { clearTimeout(t); resolve({ ok: false, error: `เรียก "${python}" ไม่ได้: ${e.message}` }); });
    p.on('close', () => {
      clearTimeout(t);
      try { const j = JSON.parse(out.trim().split('\n').pop()); j.ok = j.pywin32 && Object.values(j.progids).includes('ok'); resolve(j); }
      catch { resolve({ ok: false, error: (err || out || 'ไม่มีผลลัพธ์').trim().split('\n').slice(-3).join(' ') }); }
    });
  });
}

function friendly(e) {
  const m = String(e && e.message || e);
  if (/ECONNREFUSED/.test(m)) return `PLC ปฏิเสธการเชื่อมต่อ (${m.split(' ').pop()}) · ตรวจว่าเพิ่ม SLMP Connection Module (TCP) ที่พอร์ตนี้และเขียนพารามิเตอร์ลง PLC แล้ว`;
  if (/ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|Connect timeout/.test(m)) return `ติดต่อ PLC ไม่ได้ (หมดเวลา) · ตรวจสายแลน, IP ของ PLC และ IP ของคอมพิวเตอร์ต้องอยู่วงเดียวกัน`;
  if (/0x01800007|0x01808007/.test(m)) return m + ' · GX Simulator3 ยังไม่ได้เริ่ม: GX Works3 > Debug > Simulation > Start Simulation';
  if (/end code 0xc059/i.test(m)) return m + ' · PLC ไม่รองรับคำสั่งนี้';
  if (/end code 0x(c05c|c056)/i.test(m)) return m + ' · ช่วงที่อยู่อุปกรณ์ไม่ถูกต้อง (ตรวจตาราง I/O)';
  if (/end code 0xc05[01]/i.test(m)) return m + ' · ตั้ง Communication Data Code เป็น Binary ใน Ethernet Port';
  if (/end code 0xc05[5b]|0xc061/i.test(m)) return m + ' · เปิด "Enable/Disable Online Change: Enable All (SLMP)" ใน Ethernet Port';
  return m;
}

// ---------- HTTP ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};
function body(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', (c) => { b += c; if (b.length > 2e5) req.destroy(); });
    req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { reject(new Error('JSON ไม่ถูกต้อง')); } });
  });
}
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  try {
    if (p === '/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write(`event: status\ndata: ${JSON.stringify(status)}\n\n`);
      res.write(`event: data\ndata: ${JSON.stringify(state)}\n\n`);
      sse.add(res);
      const ka = setInterval(() => res.write(': ka\n\n'), 15000);
      req.on('close', () => { clearInterval(ka); sse.delete(res); });
      return;
    }
    if (p === '/api/hello') return json(res, 200, { ok: true, app: 'induvara-twin-bridge', version: 1 });
    if (p === '/api/config' && req.method === 'GET') return json(res, 200, config);
    if (p === '/api/connect' && req.method === 'POST') { reconfigure(await body(req)); return json(res, 200, { ok: true, config }); }
    if (p === '/api/disconnect' && req.method === 'POST') { reconfigure({ mode: 'off' }); return json(res, 200, { ok: true, config }); }
    if (p === '/api/watch' && req.method === 'POST') {
      const { devices = [], outputs = [] } = await body(req);
      const ok = [], bad = [];
      const norm = (d) => { try { const x = parse(d, config.xyBase); if (!x.isBit) throw 0; return name(x.dev, x.num, config.xyBase); } catch { bad.push(d); return null; } };
      for (const d of devices) { const n = norm(d); if (n) ok.push(n); }
      watch = [...new Set(ok)];
      watchOut = [...new Set(outputs.map(norm).filter(Boolean))];
      for (const k of Object.keys(state)) if (!watch.includes(k)) delete state[k];
      pollSoon();
      return json(res, 200, { ok: true, watching: watch.length, bad });
    }
    if (p === '/api/write' && req.method === 'POST') {
      const b = await body(req);
      await writeMany(Array.isArray(b.writes) ? b.writes : [b]);
      return json(res, 200, { ok: true });
    }
    if (p === '/api/test' && req.method === 'POST') {
      try { return json(res, 200, await testConnection(await body(req))); }
      catch (e) { return json(res, 200, { ok: false, error: friendly(e) }); }
    }
    if (p === '/api/diag' && req.method === 'POST') { const b = await body(req); return json(res, 200, await diagPython(b.python)); }
    if (p.startsWith('/api/')) return json(res, 404, { ok: false, error: 'not found' });

    // static files from the twin folder (the bridge folder itself is not served)
    let file = path.normalize(path.join(ROOT, decodeURIComponent(p === '/' ? '/index.html' : p)));
    if (!file.startsWith(ROOT + path.sep) || file.startsWith(__dirname + path.sep) || /[\\/]\./.test(file.slice(ROOT.length)))
      return json(res, 403, { error: 'forbidden' });
    fs.readFile(file, (err, data) => {
      if (err) return json(res, 404, { error: 'not found' });
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(data);
    });
  } catch (e) {
    json(res, 400, { ok: false, error: friendly(e) });
  }
});
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\nพอร์ต ${HTTP_PORT} ถูกใช้อยู่ (อาจเปิด start.bat หรือ python http.server ค้างไว้)`);
    console.error(`ปิดหน้าต่างนั้นก่อน หรือรันด้วยพอร์ตอื่น:  set PORT=8080 && node bridge\\server.js\n`);
    process.exit(1);
  }
  throw e;
});
server.listen(HTTP_PORT, HOST, () => {
  console.log(`Induvara digital twin:  http://localhost:${HTTP_PORT}`);
  console.log(`PLC link: ${config.mode === 'off' ? 'ปิด (เลือกได้จากปุ่ม "เชื่อมต่อ PLC" บนหน้าเว็บ)' : label()}`);
});
process.on('SIGINT', () => { if (client) client.close(); process.exit(0); });
