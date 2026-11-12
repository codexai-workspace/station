// Driver that uses mx_bridge.py (MX Component -> GX Simulator3).
const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const { parse, name } = require('./devices');

class MxClient {
  constructor({ station = 1, python = 'python', xyBase = 16, timeout = 5000 } = {}) {
    Object.assign(this, { station, python, xyBase, timeout });
    this.proc = null;
    this.seq = 1;
    this.waiting = new Map();
  }

  get connected() { return !!this.proc; }

  connect() {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = splitCommand(this.python);
      const p = spawn(cmd, [...args, path.join(__dirname, 'mx_bridge.py'), String(this.station)], { windowsHide: true });
      const openTimer = setTimeout(() => { if (!opened) { p.kill(); reject(new Error('MX Component Open() ไม่ตอบภายใน 15 วินาที')); } }, 15000);
      let opened = false;
      let stderr = '';
      p.stderr.on('data', (d) => { stderr += d; });
      p.on('error', (e) => reject(new Error(`เรียก Python ไม่ได้ (${this.python}): ${e.message}`)));
      p.on('exit', (code) => {
        this.proc = null;
        for (const w of this.waiting.values()) w.reject(new Error('Bridge exited'));
        this.waiting.clear();
        if (!opened) reject(new Error(`mx_bridge exited (${code}): ${stderr.trim().split('\n').pop() || ''}`));
      });
      readline.createInterface({ input: p.stdout }).on('line', (line) => {
        let msg;
        try { msg = JSON.parse(line); } catch { return; }
        if (msg.id === 0) {
          clearTimeout(openTimer);
          if (msg.ok) { opened = true; this.proc = p; this.info = msg.info; resolve(); }
          else reject(new Error(msg.error));
          return;
        }
        const w = this.waiting.get(msg.id);
        if (!w) return;
        this.waiting.delete(msg.id);
        clearTimeout(w.timer);
        msg.ok ? w.resolve(msg) : w.reject(new Error(msg.error));
      });
    });
  }

  close() { if (this.proc) this.proc.kill(); this.proc = null; }

  _call(obj) {
    return new Promise((resolve, reject) => {
      if (!this.proc) return reject(new Error('Not connected'));
      const id = this.seq++;
      const timer = setTimeout(() => { this.waiting.delete(id); reject(new Error('Bridge timeout')); }, this.timeout);
      this.waiting.set(id, { resolve, reject, timer });
      this.proc.stdin.write(JSON.stringify({ id, ...obj }) + '\n');
    });
  }

  _list(addr, n) {
    const d = parse(addr, this.xyBase);
    return Array.from({ length: n }, (_, i) => name(d.dev, d.num + i, this.xyBase));
  }

  // Each MX call costs ~20-30 ms on GX Simulator3, so bits are read 16 at a time
  // with digit notation (K4X0 = X0..X17 on FX5) instead of one call per bit.
  async readBits(addr, n) {
    const d = parse(addr, this.xyBase);
    const devs = [];
    for (let i = 0; i < n; i += 16) devs.push(`K${Math.ceil(Math.min(16, n - i) / 4)}${name(d.dev, d.num + i, this.xyBase)}`);
    const words = (await this._call({ op: 'get', devs })).values;
    const out = [];
    for (let i = 0; i < n; i++) out.push((words[i >> 4] >> (i & 15)) & 1);
    return out;
  }
  async readWords(addr, n) { return (await this._call({ op: 'get', devs: this._list(addr, n) })).values.map((v) => (v << 16) >> 16); }
  async writeBits(addr, values) { await this._call({ op: 'set', devs: this._list(addr, values.length), values }); }
  // Many scattered bits in one bridge call: [{device, value}]
  async writeMany(list) { if (list.length) await this._call({ op: 'set', devs: list.map((w) => w.device), values: list.map((w) => (w.value ? 1 : 0)) }); }
  async writeWords(addr, values) { await this._call({ op: 'set', devs: this._list(addr, values.length), values }); }
}

// "py -3-32" / "C:\Python\python.exe" -> [cmd, ...args]
function splitCommand(s) {
  const out = []; const re = /"([^"]*)"|(\S+)/g; let m;
  while ((m = re.exec(String(s || 'python')))) out.push(m[1] ?? m[2]);
  return out.length ? out : ['python'];
}

module.exports = { MxClient, splitCommand };
