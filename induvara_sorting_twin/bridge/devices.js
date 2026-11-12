// Device address helpers (Mitsubishi style: X10, Y0, M100, D0 ...)
// X/Y numbering: iQ-R / Q = hex (16), iQ-F FX5 = octal (8). B/W are always hex.

const SLMP_CODES = {
  X: 0x9c, Y: 0x9d, M: 0x90, L: 0x92, F: 0x93, B: 0xa0, SM: 0x91,
  D: 0xa8, W: 0xb4, R: 0xaf, SD: 0xa9, ZR: 0xb0,
  TS: 0xc1, TC: 0xc0, TN: 0xc2, CS: 0xc4, CC: 0xc3, CN: 0xc5,
};
const BIT_DEVICES = new Set(['X', 'Y', 'M', 'L', 'F', 'B', 'SM', 'TS', 'TC', 'CS', 'CC']);

function baseOf(dev, xyBase) {
  if (dev === 'X' || dev === 'Y') return xyBase;
  if (dev === 'B' || dev === 'W') return 16;
  return 10;
}

function parse(addr, xyBase = 16) {
  const m = /^(SM|SD|ZR|TS|TC|TN|CS|CC|CN|[XYMLFBDWR])([0-9A-F]+)$/i.exec(String(addr).trim());
  if (!m) throw new Error(`Invalid device: ${addr}`);
  const dev = m[1].toUpperCase();
  const base = baseOf(dev, xyBase);
  // parseInt stops at the first bad digit ("M1A" -> 1, "X8" octal -> NaN): reject those
  const digits = m[2].toUpperCase().replace(/^0+(?=.)/, '');
  const num = parseInt(digits, base);
  if (Number.isNaN(num) || num.toString(base).toUpperCase() !== digits) throw new Error(`Invalid number for ${dev} (base ${base}): ${m[2]}`);
  return { dev, num, code: SLMP_CODES[dev], isBit: BIT_DEVICES.has(dev) };
}

function name(dev, num, xyBase = 16) {
  return dev + num.toString(baseOf(dev, xyBase)).toUpperCase();
}

module.exports = { parse, name, SLMP_CODES, BIT_DEVICES };
