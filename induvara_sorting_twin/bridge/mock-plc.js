// Mock FX5U for testing without hardware: a small SLMP 3E binary server (TCP) that runs
// the same sorting program as the example ladder in README_TH.md, scanned every 10 ms.
//   node bridge/mock-plc.js            -> listens on 127.0.0.1:5007
// Then in the web page: เชื่อมต่อ PLC -> PLC จริง (LAN) -> IP 127.0.0.1, Port 5007.
const net = require('net');
const PORT = Number(process.env.MOCK_PORT) || 5007;

const SIZE = 65536;
const CODES = { X: 0x9c, Y: 0x9d, M: 0x90, L: 0x92, B: 0xa0, SM: 0x91 };
const mem = {};
for (const c of Object.values(CODES)) mem[c] = new Uint8Array(SIZE);
const X = mem[0x9c], Y = mem[0x9d], M = mem[0x90], SM = mem[0x91];
const o = (s) => parseInt(s, 8); // FX5 X/Y numbers are octal
SM[400] = 1; // always ON

// ---- the example program (keep in step with README_TH.md) ----
// 100 ms timers: OUT Tn Kk -> done after k*100 ms of continuous drive.
const T = {};
function timer(n, drive, k) {
  const t = (T[n] ||= { acc: 0, done: false });
  if (!drive) { t.acc = 0; t.done = false; return false; }
  t.acc += 10; t.done = t.acc >= k * 100; return t.done;
}
const x = (a) => !!X[o(a)];
const set = (i) => { M[i] = 1; }, rst = (i) => { M[i] = 0; };

function scan() {
  const stop = x('1'), esOk = x('112');
  // AUTO run latch: X5 start (INPUT 5), X1 stop (INPUT 1), X112 NC station E-stop
  M[0] = (x('5') || M[0]) && esOk && !stop ? 1 : 0;
  if (!M[0]) for (let i = 10; i <= 32; i++) M[i] = 0;           // ZRST M10 M32
  const idle = ![10, 11, 12, 13, 14, 15, 16, 17].some((i) => M[i]);
  // start a cycle: running, magazine has parts, all cylinders home
  if (M[0] && idle && !x('111') && x('100') && x('102') && x('104')) set(10);
  // FEED: extend until X101, then wait for X100
  if (M[10] && x('101')) set(30);
  if (M[10] && M[30] && x('100')) { rst(30); rst(10); set(11); rst(20); rst(21); }
  // FWD CHECK (to IND): 0.5 s, latch metal
  const t0 = timer(0, M[11], 5);
  if (M[11] && x('107')) set(20);
  if (M[11] && t0) { rst(11); M[20] ? set(12) : set(14); }
  // TO B: 1.2 s, then PUSH B
  if (timer(1, M[12], 12) && M[12]) { rst(12); set(13); }
  if (M[13] && x('105')) set(31);
  if (M[13] && M[31] && x('104')) { rst(31); rst(13); }
  // REV CHECK (to PHOTO): 1.0 s, latch yellow
  const t2 = timer(2, M[14], 10);
  if (M[14] && x('110')) set(21);
  if (M[14] && t2) { rst(14); M[21] ? set(15) : set(17); }
  // TO A: 0.7 s, then PUSH A
  if (timer(3, M[15], 7) && M[15]) { rst(15); set(16); }
  if (M[16] && x('103')) set(32);
  if (M[16] && M[32] && x('102')) { rst(32); rst(16); }
  // TO END: 4.5 s (black part runs off the belt end)
  if (timer(4, M[17], 45) && M[17]) rst(17);
  // outputs
  Y[o('120')] = M[10] && !M[30] ? 1 : 0;                     // feed valve · extend
  Y[o('121')] = M[10] && M[30] ? 1 : 0;                      // feed valve · retract
  Y[o('123')] = M[13] && !M[31] ? 1 : 0;                     // push B valve
  Y[o('122')] = M[16] && !M[32] ? 1 : 0;                     // push A valve
  Y[o('124')] = M[11] || M[12] || M[14] || M[15] || M[17] ? 1 : 0; // conveyor run
  Y[o('125')] = M[14] || M[15] ? 1 : 0;                      // conveyor reverse
  Y[o('0')] = M[0];                                          // RUN lamp
  Y[o('1')] = M[10];                                         // FEEDING
  Y[o('2')] = M[13] || M[16] ? 1 : 0;                        // SORTING
  Y[o('3')] = M[0] ? 0 : 1;                                  // STOP
  Y[o('4')] = esOk ? 0 : 1;                                  // ALARM (E-stop)
  Y[o('5')] = M[0] && x('111') ? 1 : 0;                      // magazine empty
  Y[o('6')] = SM[400];                                       // CONTROL ON
}
setInterval(scan, 10);

// ---- SLMP 3E binary ----
function reply(sock, req, end, data = Buffer.alloc(0)) {
  const h = Buffer.alloc(11);
  h.writeUInt16BE(0xd000, 0);
  req.copy(h, 2, 2, 7);
  h.writeUInt16LE(2 + data.length, 7);
  h.writeUInt16LE(end, 9);
  sock.write(Buffer.concat([h, data]));
}
function handle(sock, f) {
  const cmd = f.readUInt16LE(11), sub = f.readUInt16LE(13);
  if (cmd === 0x1402 && sub === 0x0001) {                   // random bit write
    const n = f[15];
    for (let i = 0; i < n; i++) {
      const p = 16 + i * 5, a = mem[f[p + 3]];
      if (!a) return reply(sock, f, 0xc056);
      a[f.readUIntLE(p, 3)] = f[p + 4] ? 1 : 0;
    }
    return reply(sock, f, 0);
  }
  const num = f.readUIntLE(15, 3), a = mem[f[18]], n = f.readUInt16LE(19);
  if (!a || num + n > SIZE) return reply(sock, f, 0xc056);
  if (cmd === 0x0401 && sub === 0x0001) {
    const out = Buffer.alloc(Math.ceil(n / 2));
    for (let i = 0; i < n; i++) if (a[num + i]) out[i >> 1] |= i % 2 === 0 ? 0x10 : 0x01;
    return reply(sock, f, 0, out);
  }
  if (cmd === 0x1401 && sub === 0x0001) {
    const d = f.subarray(21);
    for (let i = 0; i < n; i++) a[num + i] = (d[i >> 1] >> (i % 2 === 0 ? 4 : 0)) & 1;
    return reply(sock, f, 0);
  }
  reply(sock, f, 0xc059);
}
net.createServer((sock) => {
  let buf = Buffer.alloc(0);
  console.log('[mock] client connected');
  sock.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (buf.length >= 9) {
      const len = buf.readUInt16LE(7);
      if (buf.length < 9 + len) break;
      handle(sock, buf.subarray(0, 9 + len));
      buf = buf.subarray(9 + len);
    }
  });
  sock.on('error', () => {});
}).listen(PORT, '127.0.0.1', () => console.log(`Mock FX5U (SLMP 3E binary, sorting program) on 127.0.0.1:${PORT}`));
