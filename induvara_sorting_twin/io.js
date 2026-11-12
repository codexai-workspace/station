// Editable I/O assignment table: FX5U local I/O and CC-Link IE Field Basic remote I/O.
// Defaults are a training layout, not measured from the real machine. Edits are kept in this browser.
(() => {
  const STORE = 'induvara-io-table-v1';
  // sig = live key published by app.js on window.twinIO (optional).
  const DEFAULTS = {
    plcX: [
      ['X0', '', 'สำรอง', ''],
      ['X1', 'PB_IN1', 'ปุ่ม INPUT 1 · STOP', 'pbIn1'],
      ['X2', 'PB_IN2', 'ปุ่ม INPUT 2 · STOP', 'pbIn2'],
      ['X3', 'PB_IN3', 'ปุ่ม INPUT 3 · STOP', 'pbIn3'],
      ['X4', 'PB_IN4', 'ปุ่ม INPUT 4 · STOP', 'pbIn4'],
      ['X5', 'PB_IN5', 'ปุ่ม INPUT 5 · START', 'pbIn5'],
      ['X6', 'PB_IN6', 'ปุ่ม INPUT 6 · START', 'pbIn6'],
      ['X7', 'PB_IN7', 'ปุ่ม INPUT 7 · START', 'pbIn7'],
      ['X10', '', 'สำรอง', ''],
      ['X11', '', 'สำรอง', ''],
      ['X12', '', 'สำรอง', ''],
      ['X13', '', 'สำรอง', ''],
      ['X14', '', 'สำรอง', ''],
      ['X15', '', 'สำรอง', ''],
      ['X16', '', 'สำรอง', ''],
      ['X17', '', 'สำรอง', ''],
      // Blank address = not wired to the PLC on the real cabinet (kept at the bottom).
      ['', 'PB_MASTER_ON', 'ปุ่ม MASTER ON = START Auto (ตู้คอนโทรล)', 'masterOn'],
      ['', 'PB_CONTROL_POWER', 'ปุ่ม CONTROL POWER', 'controlPower'],
      ['', 'PB_IN0', 'ปุ่ม INPUT 0 = STOP Auto', 'pbIn0'],
      ['', 'ES_CABINET', 'Emergency stop ตู้คอนโทรล (NC)', 'estopOk']
    ],
    plcY: [
      ['Y0', 'PL_OUT0', 'ไฟ OUTPUT 0 · RUN', 'lamp0'],
      ['Y1', 'PL_OUT1', 'ไฟ OUTPUT 1 · FEEDING', 'lamp1'],
      ['Y2', 'PL_OUT2', 'ไฟ OUTPUT 2 · SORTING', 'lamp2'],
      ['Y3', 'PL_OUT3', 'ไฟ OUTPUT 3 · STOP', 'lamp3'],
      ['Y4', 'PL_OUT4', 'ไฟ OUTPUT 4 · ALARM', 'lamp4'],
      ['Y5', 'PL_OUT5', 'ไฟ OUTPUT 5 · ALARM', 'lamp5'],
      ['Y6', 'PL_CONTROL_ON', 'ไฟ CONTROL ON', 'controlOn'],
      ['Y7', '', 'สำรอง', ''],
      ['Y10', '', 'สำรอง', ''],
      ['Y11', '', 'สำรอง', ''],
      ['Y12', '', 'สำรอง', ''],
      ['Y13', '', 'สำรอง', ''],
      ['Y14', '', 'สำรอง', ''],
      ['Y15', '', 'สำรอง', ''],
      ['Y16', '', 'สำรอง', ''],
      ['Y17', '', 'สำรอง', '']
    ],
    ccX: [
      ['X100', 'FEED_RET', 'กระบอกป้อน · หดสุด', 'feedRet'],
      ['X101', 'FEED_EXT', 'กระบอกป้อน · ยืดสุด', 'feedExt'],
      ['X102', 'CYL_A_RET', 'กระบอกราง A · หดสุด', 'aRet'],
      ['X103', 'CYL_A_EXT', 'กระบอกราง A · ยืดสุด', 'aExt'],
      ['X104', 'CYL_B_RET', 'กระบอกราง B · หดสุด', 'bRet'],
      ['X105', 'CYL_B_EXT', 'กระบอกราง B · ยืดสุด', 'bExt'],
      ['X106', 'SEN_CAP', 'เซนเซอร์ Capacitive', 'cap'],
      ['X107', 'SEN_IND', 'เซนเซอร์ Inductive', 'ind'],
      ['X110', 'SEN_PHOTO', 'เซนเซอร์ Photoelectric', 'photo'],
      ['X111', 'MAG_EMPTY', 'แมกกาซีนว่าง', 'magEmpty'],
      ['X112', 'ES_STATION', 'Emergency stop สถานี (NC)', 'estopOk'],
      ['X113', '', 'สำรอง', ''],
      ['X114', '', 'สำรอง', ''],
      ['X115', '', 'สำรอง', ''],
      ['X116', '', 'สำรอง', ''],
      ['X117', '', 'สำรอง', '']
    ],
    ccY: [
      ['Y120', 'SOL_FEED_OUT', 'วาล์วกระบอกป้อน · ยืดออก', 'solFeed'],
      ['Y121', 'SOL_FEED_IN', 'วาล์วกระบอกป้อน · ดึงกลับ', ''],
      ['Y122', 'SOL_A', 'วาล์วกระบอกราง A', 'solA'],
      ['Y123', 'SOL_B', 'วาล์วกระบอกราง B', 'solB'],
      ['Y124', 'MOTOR_CONV', 'มอเตอร์สายพาน', 'motor'],
      ['Y125', 'MOTOR_REV', 'มอเตอร์สายพาน · กลับทาง (ไปราง A)', 'motorRev'],
      ['Y126', '', 'สำรอง', ''],
      ['Y127', '', 'สำรอง', ''],
      ['Y130', '', 'สำรอง', ''],
      ['Y131', '', 'สำรอง', ''],
      ['Y132', '', 'สำรอง', ''],
      ['Y133', '', 'สำรอง', ''],
      ['Y134', '', 'สำรอง', ''],
      ['Y135', '', 'สำรอง', ''],
      ['Y136', '', 'สำรอง', ''],
      ['Y137', '', 'สำรอง', '']
    ]
  };
  const TABS = [
    ['plcX', 'PLC · Input', 'FX5U-32MR/ES ในตู้คอนโทรล'],
    ['plcY', 'PLC · Output', 'FX5U-32MR/ES ในตู้คอนโทรล'],
    ['ccX', 'CC-Link · Input', 'NZ2MFB1-32DTE1 ที่สถานี · เริ่ม X100'],
    ['ccY', 'CC-Link · Output', 'NZ2MFB1-32DTE1 ที่สถานี · เริ่ม Y120']
  ];
  const toRows = list => list.map(([addr, tag, desc, sig]) => ({ addr, tag, desc, sig }));
  const fresh = () => Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, toRows(v)]));
  let data = fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved) for (const k of Object.keys(data)) if (Array.isArray(saved[k])) {
      // Keep the user's rows; adopt signal bindings added in later versions.
      data[k] = saved[k].map((r) => {
        const def = data[k].find((d) => d.addr && d.addr === r.addr);
        if (!def || r.sig || !def.sig) return r;
        if (!r.tag) return { ...def };
        return r.tag === def.tag ? { ...r, sig: def.sig } : r;
      });
      // Unwired rows (blank address) go below the wired ones; order otherwise kept.
      data[k] = [...data[k].filter((r) => String(r.addr).trim()), ...data[k].filter((r) => !String(r.addr).trim())];
    }
  } catch (e) { /* storage unavailable: use defaults */ }
  const listeners = new Set();
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (e) {} listeners.forEach((fn) => fn()); };

  // Inputs (machine -> PLC) may use X or internal relays M/L/B; outputs (PLC -> machine) Y or M/L/B.
  const xyBase = () => (window.twinPLC && window.twinPLC.xyBase) || 8;
  function validAddr(a, kind) {
    const m = /^(X|Y|M|L|B)([0-9A-F]+)$/.exec(String(a).trim().toUpperCase());
    if (!m || (m[1] !== kind && !'MLB'.includes(m[1]))) return null;
    const base = m[1] === 'B' ? 16 : (m[1] === 'X' || m[1] === 'Y') ? xyBase() : 10;
    const n = parseInt(m[2], base);
    if (Number.isNaN(n) || n.toString(base).toUpperCase() !== m[2].replace(/^0+(?=.)/, '')) return null;
    return m[1] + n.toString(base).toUpperCase();
  }
  const kindOf = (k) => (k.endsWith('X') ? 'X' : 'Y');
  // Public read-only view for the PLC link (plc.js) and the simulation.
  window.ioTable = {
    bindings() {
      const out = { inputs: [], outputs: [] };
      for (const [k, rows] of Object.entries(data)) for (const r of rows) {
        const addr = validAddr(r.addr, kindOf(k));
        if (addr) (kindOf(k) === 'X' ? out.inputs : out.outputs).push({ addr, sig: r.sig || '', tag: r.tag });
      }
      return out;
    },
    onChange(fn) { listeners.add(fn); },
    refresh() { if (dlg.open) render(); },
  };

  // FX5U X/Y numbers are octal.
  const nextAddr = addr => {
    const m = /^([XY])([0-7]+)$/i.exec(addr || '');
    if (!m) return '';
    return m[1].toUpperCase() + (parseInt(m[2], 8) + 1).toString(8);
  };

  let tab = 'plcX';
  const dlg = document.getElementById('io-dialog');
  const body = document.getElementById('io-body');
  const tabsEl = document.getElementById('io-tabs');
  const note = document.getElementById('io-note');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function render() {
    tabsEl.innerHTML = TABS.map(([k, label]) => `<button role="tab" data-tab="${k}" aria-selected="${k === tab}" class="${k === tab ? 'active' : ''}">${label}</button>`).join('');
    note.textContent = TABS.find(t => t[0] === tab)[2];
    const all = Object.entries(data).flatMap(([k, rows]) => rows.map(r => validAddr(r.addr, kindOf(k)) || r.addr.trim().toUpperCase()));
    body.innerHTML = data[tab].map((r, i) => {
      const kind = kindOf(tab);
      const a = validAddr(r.addr, kind);
      // Blank address is allowed: the signal is simply not wired to the PLC.
      const bad = r.addr.trim() !== '' && (!a || all.filter(x => x === a).length > 1);
      return `<tr data-i="${i}">
        <td><span class="io-led" data-sig="${esc(r.sig || '')}" data-addr="${esc(a || '')}"></span></td>
        <td><input data-f="addr" value="${esc(r.addr)}" class="io-addr${bad ? ' bad' : ''}" aria-label="Address" placeholder="—" title="${bad ? 'ใช้ ' + kind + ' (เลขฐาน ' + xyBase() + ') หรือ M/L (ฐาน 10) หรือ B (ฐาน 16) และห้ามซ้ำ' : ''}"></td>
        <td><input data-f="tag" value="${esc(r.tag)}" aria-label="Tag" placeholder="—"></td>
        <td><input data-f="desc" value="${esc(r.desc)}" aria-label="คำอธิบาย"></td>
        <td><button class="io-del" data-del="${i}" aria-label="ลบแถว" title="ลบแถว">×</button></td>
      </tr>`;
    }).join('');
  }

  tabsEl.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; render(); } });
  body.addEventListener('input', e => {
    const f = e.target.dataset.f; if (!f) return;
    const i = +e.target.closest('tr').dataset.i;
    data[tab][i][f] = e.target.value; save();
  });
  body.addEventListener('change', e => { if (e.target.dataset.f === 'addr') render(); });
  body.addEventListener('click', e => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    data[tab].splice(+b.dataset.del, 1); save(); render();
  });
  document.getElementById('io-add').onclick = () => {
    const rows = data[tab];
    const last = rows.length ? rows[rows.length - 1].addr : (DEFAULTS[tab][0][0]);
    rows.push({ addr: rows.length ? nextAddr(last) : last, tag: '', desc: '', sig: '' });
    save(); render();
    body.querySelector('tr:last-child input[data-f="tag"]')?.focus();
  };
  document.getElementById('io-reset').onclick = () => {
    if (!confirm('คืนค่าเริ่มต้นของตาราง I/O ทั้ง 4 แท็บ? ค่าที่แก้ไว้จะหายไป')) return;
    data = fresh(); save(); render();
  };
  document.getElementById('io-export').onclick = () => {
    const lines = [['Group', 'Address', 'Tag', 'Description']];
    for (const [k, label] of TABS) for (const r of data[k]) lines.push([label, r.addr, r.tag, r.desc]);
    const csv = '﻿' + lines.map(l => l.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'induvara_io_table.csv'; a.click(); URL.revokeObjectURL(a.href);
  };
  document.getElementById('io-open').onclick = () => { render(); dlg.showModal(); };
  document.getElementById('io-close').onclick = () => dlg.close();
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  // Live status from the simulation.
  (function tick() {
    requestAnimationFrame(tick);
    if (!dlg.open) return;
    const s = window.twinIO || {}, plc = window.twinPLC;
    const live = plc && plc.connected;
    for (const led of body.querySelectorAll('.io-led')) {
      const k = led.dataset.sig, a = led.dataset.addr;
      const on = live && a ? !!plc.values[a] : !!(k && s[k]);
      led.classList.toggle('on', on);
      led.classList.toggle('na', !(live && a) && !k);
    }
  })();
})();
