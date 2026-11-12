// PLC link for the digital twin (browser side).
// Talks to bridge/server.js: SSE for PLC values, fetch for settings and input writes.
// Signal names ("sig") and device addresses come from the editable I/O table (io.js).
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const P = {
    available: false,       // bridge server answered
    connected: false,
    mode: 'off', access: 'readwrite', xyBase: 8,
    values: {},             // device -> 0/1 read from the PLC
    status: { state: 'off' },
    inputs: {},             // sig -> bool, computed by the simulation
    pressed: {},            // sig -> bool, momentary buttons held by the user
    listeners: new Set(),
  };
  window.twinPLC = P;

  // ---------- public helpers used by app.js ----------
  P.onChange = (fn) => P.listeners.add(fn);
  const emit = () => P.listeners.forEach((fn) => { try { fn(P); } catch (e) { console.error(e); } });
  P.output = (sig) => bindings().outputs.some((b) => b.sig === sig && P.values[b.addr]);
  P.input = (sig) => bindings().inputs.some((b) => b.sig === sig && P.values[b.addr]);
  P.setInputs = (map) => { P.inputs = map; };
  P.press = (sig, on) => { if (on) P.pressed[sig] = Date.now(); else releaseLater(sig); };
  P.pulse = (sig) => { P.pressed[sig] = Date.now(); releaseLater(sig); };
  // Hold every press at least 350 ms so the PLC scan (and a 100 ms timer) sees it.
  function releaseLater(sig) {
    const t = P.pressed[sig]; if (!t) return;
    setTimeout(() => { if (P.pressed[sig] === t) delete P.pressed[sig]; }, Math.max(0, 350 - (Date.now() - t)));
  }
  const bindings = () => (window.ioTable ? window.ioTable.bindings() : { inputs: [], outputs: [] });

  // ---------- server calls ----------
  async function api(path, body) {
    const r = await fetch(path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return r.json();
  }

  // ---------- UI ----------
  const STEPS_SIM = `
    <li>ติดตั้ง <b>MX Component</b> (v4 หรือ v5) และ Python ที่มี <code>pywin32</code> แล้วกด <b>ตรวจสอบ Python + MX Component</b> ด้านบนให้ผ่านก่อน</li>
    <li>เปิด <b>Communication Setup Utility</b> (มากับ MX Component) → <b>Wizard</b> → ตั้ง <b>Logical Station Number</b> เช่น 1 → PC side I/F = <b>GX Simulator3</b> → CPU Type = <b>FX5U</b> → Finish</li>
    <li>ใน GX Works3 เปิดโปรเจกต์ FX5U ที่มีโปรแกรมคัดแยก แล้ว <b>Debug → Simulation → Start Simulation</b> (รอจน GX Simulator3 เป็น RUN)</li>
    <li>ใส่ Station No. ให้ตรงกับข้อ 2 แล้วกด <b>ทดสอบ</b> → ถ้าเห็น SM400 = 1 แปลว่าอ่านได้ → กด <b>เชื่อมต่อ</b></li>
    <li>เลือก <b>จำลองเครื่องจักร</b> เพื่อให้เว็บเป็นเครื่องจักร: เว็บเขียน X (เซนเซอร์/ปุ่ม/รีดสวิตช์) และอ่าน Y ไปขยับมอเตอร์ กระบอกลม และไฟ</li>`;
  const STEPS_REAL = `
    <li>GX Works3 → Navigation → <b>Parameter → FX5UCPU → Module Parameter → Ethernet Port</b></li>
    <li><b>Own Node Settings</b>: IP เช่น <code>192.168.3.250</code>, Subnet <code>255.255.255.0</code>, <b>Communication Data Code = Binary</b>, <b>Enable/Disable Online Change = Enable All (SLMP)</b></li>
    <li><b>External Device Configuration → Detailed Setting</b> → ลาก <b>SLMP Connection Module</b> มาวาง → Protocol <b>TCP</b>, Port No. เช่น <code>5007</code> → Close with Reflecting</li>
    <li>Convert All → <b>Online → Write to PLC</b> (Parameter + Program) → Reset หรือปิด-เปิดไฟ PLC เพื่อให้พารามิเตอร์ Ethernet มีผล</li>
    <li>ตั้ง IP คอมพิวเตอร์ให้อยู่วงเดียวกัน เช่น <code>192.168.3.10</code> / 255.255.255.0 แล้วต่อสายแลนตรงหรือผ่านสวิตช์</li>
    <li>ใส่ IP/Port แล้วกด <b>ทดสอบ</b> → SM400 = 1 คือสำเร็จ → กด <b>เชื่อมต่อ</b></li>
    <li><b>Monitor อย่างเดียว</b> เหมาะกับเครื่องจริงที่ต่อสาย I/O ครบ: เว็บแค่อ่าน X/Y มาแสดง · <b>จำลองเครื่องจักร</b> ใช้เมื่อ PLC ไม่ได้ต่อเครื่องจริง (X ที่มีสายจริงจะถูก PLC เขียนทับทุกสแกน ให้เปลี่ยน Address ในตาราง I/O เป็น M แทน)</li>`;

  const dlg = document.createElement('dialog');
  dlg.id = 'plc-dialog';
  dlg.setAttribute('aria-labelledby', 'plc-title');
  dlg.innerHTML = `
  <form method="dialog" class="plc-form" autocomplete="off">
    <div class="plc-head"><div><div class="eyebrow">GX WORKS3 LINK</div><h2 id="plc-title">เชื่อมต่อ PLC</h2>
      <p>FX5U-32MR/ES · ใช้ Address จากตาราง I/O</p></div><button type="button" class="plc-x" data-close aria-label="ปิด">×</button></div>
    <div class="plc-body">
      <div class="plc-status" id="plc-status"><i></i><div><b>ไม่ได้เชื่อมต่อ</b><small></small></div></div>
      <div class="plc-nobridge" id="plc-nobridge" hidden>
        <b>หน้านี้เปิดผ่าน server ที่ไม่มีตัวเชื่อม PLC</b>
        <p>ปิดหน้าต่าง server เดิม แล้วดับเบิลคลิก <code>start.bat</code> ใหม่ (ต้องมี Node.js) จากนั้นเปิด <code>http://localhost:8000</code></p>
      </div>
      <fieldset class="plc-modes"><legend>รูปแบบการเชื่อมต่อ</legend>
        <label><input type="radio" name="mode" value="off"><span><b>จำลองในเว็บ</b><small>ไม่ต่อ PLC ใช้ลำดับจำลองในตัว</small></span></label>
        <label><input type="radio" name="mode" value="sim"><span><b>GX Simulator3</b><small>ผ่าน MX Component บนเครื่องนี้</small></span></label>
        <label><input type="radio" name="mode" value="real"><span><b>PLC จริง (LAN)</b><small>SLMP ผ่านสายแลน</small></span></label>
      </fieldset>
      <div class="plc-pane" data-pane="sim">
        <div class="plc-row"><label>Logical Station No.<input name="station" type="number" min="0" max="1023"></label>
          <label class="grow">Python ที่มี pywin32<input name="python" placeholder="python หรือ py -3.12-32"></label></div>
        <button type="button" id="plc-diag" class="plc-ghost">ตรวจสอบ Python + MX Component</button>
        <div id="plc-diag-out" class="plc-diag" hidden></div>
        <details><summary>ขั้นตอนตั้งค่า GX Simulator3</summary><ol>${STEPS_SIM}</ol></details>
      </div>
      <div class="plc-pane" data-pane="real">
        <div class="plc-row"><label class="grow">IP ของ PLC<input name="host" placeholder="192.168.3.250" inputmode="decimal"></label>
          <label>Port (TCP)<input name="port" type="number" min="1" max="65535"></label></div>
        <details><summary>ขั้นตอนตั้งค่า FX5U ใน GX Works3</summary><ol>${STEPS_REAL}</ol></details>
      </div>
      <div class="plc-pane" data-pane="link">
        <fieldset class="plc-access"><legend>หน้าที่ของเว็บ</legend>
          <label><input type="radio" name="access" value="readwrite"><span><b>จำลองเครื่องจักร</b><small>เว็บเขียน Input (X) · PLC สั่ง Output (Y) ให้ 3D ขยับ</small></span></label>
          <label><input type="radio" name="access" value="read"><span><b>Monitor อย่างเดียว</b><small>อ่าน X/Y มาแสดง ไม่เขียนค่าใดๆ ไปที่ PLC</small></span></label>
        </fieldset>
        <p class="plc-warn" id="plc-warn" hidden>⚠ โหมดนี้เขียนค่าลง PLC จริง ถ้า Output ต่อกับมอเตอร์หรือวาล์วจริง เครื่องจะขยับตาม ให้ตัดไฟ/ลมของอุปกรณ์ก่อน หรือเลือก Monitor อย่างเดียว</p>
        <div class="plc-row"><label>เลข X/Y<select name="xyBase"><option value="8">ฐาน 8 · FX5 (iQ-F)</option><option value="16">ฐาน 16 · iQ-R / Q</option></select></label>
          <label>อ่านทุก (ms)<input name="pollMs" type="number" min="20" max="2000" step="10"></label></div>
      </div>
      <p class="plc-test" id="plc-test" aria-live="polite"></p>
    </div>
    <div class="plc-foot">
      <button type="button" id="plc-test-btn" class="plc-ghost">ทดสอบ</button>
      <span class="spacer"></span>
      <button type="button" id="plc-off" class="plc-ghost">ตัดการเชื่อมต่อ</button>
      <button type="button" id="plc-go" class="plc-primary">เชื่อมต่อ</button>
    </div>
  </form>`;
  document.body.appendChild(dlg);
  const form = $('form', dlg);
  const field = (n) => form.elements[n];

  function formConfig() {
    return {
      mode: form.mode.value, access: form.access.value,
      station: +field('station').value, python: field('python').value.trim() || 'python',
      host: field('host').value.trim(), port: +field('port').value,
      xyBase: +field('xyBase').value, pollMs: +field('pollMs').value || 60,
    };
  }
  function fillForm(c) {
    for (const k of ['station', 'python', 'host', 'port', 'xyBase', 'pollMs']) if (c[k] !== undefined) field(k).value = c[k];
    form.querySelector(`input[name=mode][value="${c.mode || 'off'}"]`).checked = true;
    form.querySelector(`input[name=access][value="${c.access || 'readwrite'}"]`).checked = true;
    syncPanes();
  }
  function syncPanes() {
    const m = form.mode.value;
    dlg.querySelectorAll('.plc-pane').forEach((p) => { p.hidden = p.dataset.pane === 'link' ? m === 'off' : p.dataset.pane !== m; });
    $('#plc-warn', dlg).hidden = !(m === 'real' && form.access.value === 'readwrite');
    $('#plc-go', dlg).textContent = m === 'off' ? 'ใช้การจำลองในเว็บ' : 'เชื่อมต่อ';
    $('#plc-test-btn', dlg).hidden = m === 'off';
  }
  form.addEventListener('change', syncPanes);
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });

  const testOut = $('#plc-test', dlg);
  const say = (html, cls = '') => { testOut.className = 'plc-test ' + cls; testOut.innerHTML = html; };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  $('#plc-diag', dlg).onclick = async () => {
    const out = $('#plc-diag-out', dlg);
    out.hidden = false; out.innerHTML = 'กำลังตรวจสอบ…';
    try {
      const d = await api('/api/diag', { python: field('python').value.trim() || 'python' });
      if (d.error && !d.python) { out.innerHTML = `<p class="bad">✕ ${esc(d.error)}</p>`; return; }
      const okId = Object.entries(d.progids || {}).find(([, v]) => v === 'ok');
      out.innerHTML = `
        <p class="${d.python ? 'good' : 'bad'}">${d.python ? '✓' : '✕'} Python ${esc(d.version)} · ${esc(d.bits)}-bit<br><small>${esc(d.python)}</small></p>
        <p class="${d.pywin32 ? 'good' : 'bad'}">${d.pywin32 ? '✓ pywin32 พร้อม' : '✕ ยังไม่มี pywin32 → รัน <code>' + esc(d.python) + ' -m pip install pywin32</code>'}</p>
        <p class="${okId ? 'good' : 'bad'}">${okId ? '✓ MX Component: ' + esc(okId[0]) : '✕ สร้าง MX Component ไม่ได้ · ติดตั้ง MX Component หรือใช้ Python 32-bit (v4 เป็น COM 32-bit) เช่น <code>py -3.12-32</code>'}</p>`;
    } catch (e) { out.innerHTML = `<p class="bad">✕ ${esc(e.message)}</p>`; }
  };

  $('#plc-test-btn', dlg).onclick = async () => {
    say('กำลังทดสอบ…');
    try {
      const r = await api('/api/test', formConfig());
      if (r.ok) say(`✓ ติดต่อได้ · ${esc(r.info)} · SM400 = ${r.sm400} · ${r.ms} ms${r.sm400 ? '' : ' (CPU อาจอยู่ STOP)'}`, 'good');
      else say('✕ ' + esc(r.error), 'bad');
    } catch (e) { say('✕ ' + esc(e.message), 'bad'); }
  };

  $('#plc-go', dlg).onclick = async () => {
    const c = formConfig();
    if (c.mode === 'real' && c.access === 'readwrite' &&
      !confirm('เว็บจะเขียนค่า Input ลง PLC จริง และ PLC อาจสั่ง Output ไปที่อุปกรณ์จริง\nยืนยันว่าตัดไฟ/ลมของมอเตอร์และกระบอกลมแล้ว หรือไม่มีอุปกรณ์ต่ออยู่?')) return;
    if (c.mode === 'real' && !/^[\w.-]+$/.test(c.host)) { say('✕ ใส่ IP ของ PLC ให้ถูกต้อง', 'bad'); return; }
    say(c.mode === 'off' ? '' : 'กำลังเชื่อมต่อ…');
    const r = await api('/api/connect', c);
    if (!r.ok) say('✕ ' + esc(r.error), 'bad');
    else if (c.mode === 'off') dlg.close();
  };
  $('#plc-off', dlg).onclick = async () => { await api('/api/disconnect', {}); fillForm({ ...formConfig(), mode: 'off' }); say(''); };

  // Header badge + footer + panel button reflect the link state.
  function paint() {
    const st = P.status, s = st.state;
    const text = { off: 'ไม่ได้เชื่อมต่อ · ใช้การจำลองในเว็บ', connecting: 'กำลังเชื่อมต่อ…', connected: 'เชื่อมต่อแล้ว', error: 'เชื่อมต่อไม่สำเร็จ · กำลังลองใหม่' }[s] || s;
    const box = $('#plc-status', dlg);
    box.className = 'plc-status ' + s;
    $('b', box).textContent = text;
    $('small', box).textContent = [st.info, st.state === 'connected' && st.access === 'read' ? 'Monitor อย่างเดียว' : '', st.pollMs != null && s === 'connected' ? `อ่านรอบละ ${st.pollMs} ms` : '', st.error].filter(Boolean).join(' · ');
    const badge = document.querySelector('header .badge');
    if (badge) {
      badge.className = 'badge ' + s;
      badge.innerHTML = `<i></i> ${s === 'connected' ? (P.mode === 'sim' ? 'GX SIMULATOR3' : 'PLC · ' + esc(P.status.info || '').split(' ')[1]) + ' · ONLINE' : s === 'off' ? 'SIMULATION · OFFLINE' : s === 'connecting' ? 'CONNECTING…' : 'PLC · ERROR'}`;
    }
    const foot = document.getElementById('link-text');
    if (foot) foot.textContent = s === 'connected' ? `เชื่อมต่อ ${P.status.info} · ${P.access === 'read' ? 'Monitor' : 'จำลองเครื่องจักร'}` : s === 'off' ? 'การเชื่อมต่อ PLC ปิดอยู่' : text;
    const btn = document.getElementById('plc-open');
    if (btn) { btn.classList.toggle('on', s === 'connected'); btn.classList.toggle('err', s === 'error'); }
  }

  document.getElementById('plc-open')?.addEventListener('click', async () => {
    say('');
    try { const c = await api('/api/config'); fillForm(c); } catch { fillForm({ mode: 'off' }); }
    dlg.showModal();
  });

  // ---------- live link ----------
  let lastSent = {};          // device -> value last written successfully
  let inflight = false, backoff = 0;

  function setStatus(st) {
    const was = P.connected;
    P.status = st; P.mode = st.mode || 'off'; P.access = st.access || 'readwrite';
    P.connected = st.state === 'connected';
    if (P.connected && !was) { lastSent = {}; sendWatch(); }
    paint(); emit();
    window.ioTable && window.ioTable.refresh();
  }

  async function sendWatch() {
    if (!P.available) return;
    const b = bindings();
    try { await api('/api/watch', { devices: [...b.inputs, ...b.outputs].map((x) => x.addr), outputs: b.outputs.map((x) => x.addr) }); } catch {}
  }

  async function syncInputs() {
    if (!P.connected || P.access !== 'readwrite' || inflight || Date.now() < backoff) return;
    const want = {};
    for (const b of bindings().inputs) if (b.sig) want[b.addr] = (P.inputs[b.sig] || P.pressed[b.sig]) ? 1 : 0;
    const writes = [];
    for (const [a, v] of Object.entries(want)) if (lastSent[a] !== v) writes.push({ device: a, value: v });
    // An address removed from the table: release it once, then forget it.
    for (const [a, v] of Object.entries(lastSent)) if (!(a in want)) { if (v) writes.push({ device: a, value: 0 }); else delete lastSent[a]; }
    if (!writes.length) return;
    inflight = true;
    try {
      const r = await api('/api/write', { writes });
      if (!r.ok) throw new Error(r.error);
      for (const w of writes) { if (w.device in want) lastSent[w.device] = w.value; else delete lastSent[w.device]; }
    } catch (e) {
      backoff = Date.now() + 1000;
      P.status = { ...P.status, error: 'เขียนค่าไม่สำเร็จ: ' + e.message }; paint();
    } finally { inflight = false; }
  }
  setInterval(syncInputs, 30);

  // Leaving the page: drop every input this page set (E-stop NC inputs going to 0 = stopped, the safe side).
  window.addEventListener('pagehide', () => {
    if (!P.connected || P.access !== 'readwrite') return;
    const writes = Object.keys(lastSent).map((a) => ({ device: a, value: 0 }));
    if (writes.length) navigator.sendBeacon('/api/write', new Blob([JSON.stringify({ writes })], { type: 'application/json' }));
  });

  async function start() {
    try {
      const h = await api('/api/hello');
      P.available = !!h.ok;
    } catch { P.available = false; }
    $('#plc-nobridge', dlg).hidden = P.available;
    form.querySelectorAll('input,select,#plc-go,#plc-test-btn,#plc-off,#plc-diag').forEach((el) => { if (!P.available) el.disabled = true; });
    if (!P.available) { setStatus({ state: 'off', mode: 'off' }); return; }
    try { const c = await api('/api/config'); P.xyBase = c.xyBase || 8; } catch {}
    const es = new EventSource('/events');
    es.addEventListener('status', (e) => { const st = JSON.parse(e.data); setStatus(st); });
    es.addEventListener('data', (e) => { Object.assign(P.values, JSON.parse(e.data)); emit(); });
    es.addEventListener('reset', () => { P.values = {}; lastSent = {}; emit(); });
    es.onerror = () => setStatus({ state: 'error', mode: P.mode, error: 'ติดต่อ server ไม่ได้ · เปิด start.bat ค้างไว้หรือไม่?' });
    window.ioTable && window.ioTable.onChange(() => { sendWatch(); emit(); });
    const cfgSync = setInterval(async () => { try { const c = await api('/api/config'); if (c.xyBase !== P.xyBase) { P.xyBase = c.xyBase; sendWatch(); } } catch {} }, 4000);
    void cfgSync;
  }
  paint();
  start();
})();
