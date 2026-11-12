// SLMP / MC protocol 3E frame (binary) client over TCP.
const net = require('net');
const { parse } = require('./devices');

class SlmpClient {
  constructor({ host = '127.0.0.1', port = 5007, xyBase = 16, timeout = 2000 } = {}) {
    Object.assign(this, { host, port, xyBase, timeout });
    this.sock = null;
    this.buf = Buffer.alloc(0);
    this.pending = null;
    this.chain = Promise.resolve();
  }

  connect() {
    return new Promise((resolve, reject) => {
      const s = net.createConnection({ host: this.host, port: this.port });
      const t = setTimeout(() => { s.destroy(); reject(new Error('Connect timeout')); }, this.timeout);
      s.once('connect', () => { clearTimeout(t); s.setNoDelay(true); this.sock = s; resolve(); });
      s.once('error', (e) => { clearTimeout(t); reject(e); });
      s.on('data', (d) => this._onData(d));
      s.on('close', () => {
        this.sock = null;
        if (this.pending) { this.pending.reject(new Error('Connection closed')); this.pending = null; }
      });
      s.on('error', () => {});
    });
  }

  close() { if (this.sock) this.sock.destroy(); this.sock = null; }
  get connected() { return !!this.sock; }

  _onData(d) {
    this.buf = Buffer.concat([this.buf, d]);
    while (this.buf.length >= 9) {
      const len = this.buf.readUInt16LE(7);
      if (this.buf.length < 9 + len) break;
      const frame = this.buf.subarray(0, 9 + len);
      this.buf = this.buf.subarray(9 + len);
      const p = this.pending; this.pending = null;
      if (!p) continue;
      clearTimeout(p.timer);
      const end = frame.readUInt16LE(9);
      if (end !== 0) p.reject(new Error(`PLC end code 0x${end.toString(16).padStart(4, '0')}`));
      else p.resolve(frame.subarray(11));
    }
  }

  // Requests are serialized: one outstanding frame at a time.
  _request(cmd, sub, payload) {
    const run = () => new Promise((resolve, reject) => {
      if (!this.sock) return reject(new Error('Not connected'));
      const head = Buffer.alloc(15);
      head.writeUInt16BE(0x5000, 0);           // subheader
      head.writeUInt8(0x00, 2);                // network no.
      head.writeUInt8(0xff, 3);                // PC no.
      head.writeUInt16LE(0x03ff, 4);           // request dest. module I/O
      head.writeUInt8(0x00, 6);                // station
      head.writeUInt16LE(6 + payload.length, 7); // data length (timer..end)
      head.writeUInt16LE(0x0010, 9);           // monitoring timer (x250ms)
      head.writeUInt16LE(cmd, 11);
      head.writeUInt16LE(sub, 13);
      const timer = setTimeout(() => {
        if (!this.pending) return;
        this.pending = null;
        // SLMP frames carry no request id: a late answer would be taken as the reply to the
        // next request. Drop the connection so the server reconnects with a clean stream.
        if (this.sock) this.sock.destroy();
        reject(new Error('Response timeout'));
      }, this.timeout);
      this.pending = { resolve, reject, timer };
      this.sock.write(Buffer.concat([head, payload]));
    });
    const p = this.chain.then(run, run);
    this.chain = p.catch(() => {});
    return p;
  }

  _devSpec(addr, n) {
    const d = parse(addr, this.xyBase);
    const b = Buffer.alloc(6);
    b.writeUIntLE(d.num, 0, 3);
    b.writeUInt8(d.code, 3);
    b.writeUInt16LE(n, 4);
    return b;
  }

  async readBits(addr, n) {
    const data = await this._request(0x0401, 0x0001, this._devSpec(addr, n));
    const out = [];
    for (let i = 0; i < n; i++) {
      const byte = data[i >> 1];
      out.push(i % 2 === 0 ? (byte >> 4) & 1 : byte & 1);
    }
    return out;
  }

  async readWords(addr, n) {
    const data = await this._request(0x0401, 0x0000, this._devSpec(addr, n));
    const out = [];
    for (let i = 0; i < n; i++) out.push(data.readInt16LE(i * 2));
    return out;
  }

  async writeBits(addr, values) {
    const packed = Buffer.alloc(Math.ceil(values.length / 2));
    values.forEach((v, i) => { if (v) packed[i >> 1] |= i % 2 === 0 ? 0x10 : 0x01; });
    await this._request(0x1401, 0x0001, Buffer.concat([this._devSpec(addr, values.length), packed]));
  }

  // Random bit write (0x1402): many non-contiguous bits in one frame. [{device, value}]
  async writeMany(list) {
    if (!list.length) return;
    if (!this.noRandom) {
      try {
        for (let i = 0; i < list.length; i += 94) {
          const part = list.slice(i, i + 94);
          const body = Buffer.alloc(1 + part.length * 5);
          body.writeUInt8(part.length, 0);
          part.forEach((w, k) => {
            const d = parse(w.device, this.xyBase);
            body.writeUIntLE(d.num, 1 + k * 5, 3);
            body.writeUInt8(d.code, 4 + k * 5);
            body.writeUInt8(w.value ? 1 : 0, 5 + k * 5);
          });
          await this._request(0x1402, 0x0001, body);
        }
        return;
      } catch (e) {
        if (!/end code/.test(e.message)) throw e;
        this.noRandom = true; // CPU refused random write: fall back to one write per bit
      }
    }
    for (const w of list) await this.writeBits(w.device, [w.value ? 1 : 0]);
  }

  async writeWords(addr, values) {
    const data = Buffer.alloc(values.length * 2);
    values.forEach((v, i) => data.writeInt16LE(((v << 16) >> 16), i * 2));
    await this._request(0x1401, 0x0000, Buffer.concat([this._devSpec(addr, values.length), data]));
  }
}

module.exports = { SlmpClient };
