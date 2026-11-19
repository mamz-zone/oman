// Easy Comp reel — deterministic renderer. window.renderFrame(t) -> Promise
const $ = id => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => a + (b - a) * p;
const P = (t, a, b) => clamp((t - a) / (b - a));
const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const eout = p => 1 - Math.pow(1 - p, 3);
const eout5 = p => 1 - Math.pow(1 - p, 5);
const ein = p => p * p * p;
const back = (p, s = 1.7) => { const c3 = s + 1; return 1 + c3 * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2); };
const env = (t, a, b, di = .3, dout = .3) => Math.min(P(t, a, a + di), 1 - P(t, b - dout, b));
function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function style(el, o) { Object.assign(el.style, o); }
function show(el, op, tf = '', blur = 0, ef = '') {
  el.style.opacity = op; el.style.visibility = op <= 0.001 ? 'hidden' : 'visible'; el.style.transform = tf;
  const f = (blur > 0.05 ? `blur(${blur.toFixed(2)}px) ` : '') + ef; el.style.filter = f.trim() || 'none';
}
function popIn(t, t0, dur = .45, dy = 40, s0 = .85, bl = 14) { const p = P(t, t0, t0 + dur), e = back(p, 1.4), eb = eout(p); return { op: clamp(p * 2.2), y: (1 - e) * dy, s: lerp(s0, 1, e), b: (1 - eb) * bl }; }
function popOut(t, t0, dur = .35, dy = -50, bl = 14) { const p = P(t, t0, t0 + dur), e = ein(p); return { op: 1 - p, y: e * dy, s: 1 - .06 * e, b: e * bl }; }
const combine = (a, b) => ({ op: Math.min(a.op, b.op), y: a.y + b.y, s: a.s * b.s, b: a.b + b.b });
function apply(el, st, extra = '', ef = '') { show(el, st.op, `translateY(${st.y.toFixed(2)}px) scale(${st.s.toFixed(4)}) ${extra}`, st.b, ef); }
const inout = (t, a, b, o = {}) => combine(popIn(t, a, o.di || .45, o.dy ?? 40, o.s0 || .85, o.bl ?? 14), popOut(t, b, o.do || .35, o.ody ?? -50, o.bl ?? 14));
// Deep-Glow-like glow — HALF the layers of the previous reel (3 text layers, 2 filter layers)
const G = { g: '43,255,160', c: '34,211,238', o: '255,190,60', p: '255,95,162', r: '255,59,92' };
function dgText(col, k = 1) { const c = G[col] || col; return [`0 0 ${(2 * k).toFixed(1)}px rgba(255,255,255,.9)`, `0 0 ${(10 * k).toFixed(1)}px rgba(${c},.85)`, `0 0 ${(30 * k).toFixed(1)}px rgba(${c},.5)`].join(','); }
function dgFilter(col, k = 1) { const c = G[col] || col; return `drop-shadow(0 0 ${(6 * k).toFixed(1)}px rgba(${c},.85)) drop-shadow(0 0 ${(24 * k).toFixed(1)}px rgba(${c},.45))`; }
const flare = (t, t0) => t < t0 ? 1 : 1 + 1.2 * Math.exp(-(t - t0) * 5);

const FPS = 60, SRC = 60000 / 1001, END = 50.77, NMAIN = 3043;

/* ---------------- captions ---------------- */
const W = (w, s, c = '') => ({ w, s, c });
const CAPS = [
  [W('واحدة', 0), W('من', .40), W('أعقد', .52, 'dg'), W('الأشياء', .90)],
  [W('اللي', 1.30), W('ممكن', 1.54), W('تواجهها', 1.82)],
  [W('مع', 2.40), W('دمج', 2.54), W('عناصر', 2.82), W('3D', 3.26, 'kw')],
  [W('بالفيديو', 3.66)],
  [W('هي', 4.36), W('مطابقة', 4.52), W('الإضاءة', 5.14, 'dg')],
  [W('مع', 5.62), W('البيئة', 5.74), W('المحيطة', 6.06, 'dg')],
  [W('Easy Comp', 6.60, 'kw'), W('Plugin', 7.12, 'kw')],
  [W('راح', 7.76), W('تختصر', 8.08, 'dg'), W('لك', 8.54)],
  [W('هذا', 8.66), W('المشوار', 8.82), W('بالكامل', 9.26)],
  [W('لايك', 9.84), W('وشير', 10.30), W('وفولو', 10.58)],
  [W('لتقديم', 10.80), W('المزيد', 11.58, 'dg')],
  [W('بعد', 12.02), W('ما', 12.18), W('تجيب', 12.38), W('عنصر', 12.68), W('3D', 13.02, 'kw')],
  [W('على', 13.38), W('الفيديو', 13.60), W('الخاص', 14.06), W('بك', 14.36)],
  [W('وتعمل', 14.58), W('له', 15.02), W('Camera Tracking', 15.14, 'kw')],
  [W('تعمل', 16.08), W('Adjustment Layer', 16.38, 'kw'), W('جديدة', 17.24)],
  [W('وتضيف', 17.86), W('عليها', 18.28), W('Easy Comp', 18.66, 'kw')],
  [W('اختر', 19.86), W('الفيديو', 20.10), W('الأساسي', 20.50, 'dg')],
  [W('Background Layer', 21.10, 'kw')],
  [W('بعدها', 22.26), W('اخفي', 22.56, 'dg'), W('الفيديو', 22.86)],
  [W('من', 23.22), W('التايملاين', 23.34)],
  [W('وتحكم', 24.10), W('بمستوى', 24.60), W('قوة', 25.16), W('الإيفكت', 25.50)],
  [W('من', 25.96), W('خانة', 26.10), W('Strength', 26.52, 'kw')],
  [W('من', 26.76), W('0', 27.26, 'num'), W('إلى', 27.58), W('100%', 28.04, 'num')],
  [W('وهذا', 28.58), W('الفيديو', 28.96), W('الأصلي', 29.36, 'dg')],
  [W('وهذا', 30.74), W('الفيديو', 31.52), W('بدون', 31.94), W('Plugin', 32.44, 'kw')],
  [W('وهذا', 34.78), W('الفيديو', 35.56), W('مع', 36.06), W('Plugin', 36.40, 'kw')],
  [W('الجدير', 38.18), W('بالذكر', 38.96), W('أن', 39.40), W('الـPlugin', 39.50)],
  [W('شغالة', 39.92), W('على', 40.34), W('الذكاء', 40.44, 'dg'), W('الاصطناعي', 40.90, 'dg'), W('المحلي', 41.32)],
  [W('يعني', 41.72), W('ما', 42.06), W('مطلوب', 42.22), W('منك', 42.56)],
  [W('لا', 42.80), W('تسجيل', 42.94), W('دخول', 43.34)],
  [W('ولا', 43.68), W('API Key', 43.92, 'kw')],
  [W('ولا', 44.72), W('حتى', 45.18), W('Credit', 45.48, 'kw')],
  [W('وكالعادة', 45.80), W('اكتب', 46.56), W('لي', 46.86), W('أي', 46.98), W('شيء', 47.20)],
  [W('بالتعليقات', 47.40, 'dg')],
  [W('وراح', 48.08), W('أرسلك', 48.36), W('إياها', 48.68)],
  [W('مباشرة', 49.04), W('مجانًا', 49.54)],
];
const capState = { i: -2 };
function capsRender(container, groups, t, state, endAt) {
  let gi = -1; for (let i = 0; i < groups.length; i++) if (t >= groups[i][0].s - .06) gi = i;
  const gEnd = gi + 1 < groups.length ? groups[gi + 1][0].s - .06 : endAt;
  if (gi >= 0 && t >= gEnd) gi = -1;
  if (gi !== state.i) { state.i = gi; container.innerHTML = ''; if (gi >= 0) for (const w of groups[gi]) { const s = document.createElement('span'); s.className = 'w ' + (w.c || ''); s.textContent = w.w; container.appendChild(s); } }
  if (gi < 0) return;
  const g = groups[gi], out = P(t, gEnd - .1, gEnd);
  [...container.children].forEach((el, k) => {
    const w = g[k], c = w.c || '';
    const pi = popIn(t, w.s - .05, .32, 34, .7, 12);
    const st = { op: pi.op * (1 - out), y: pi.y - out * 24, s: pi.s, b: pi.b + out * 8 };
    const nextS = k + 1 < g.length ? g[k + 1].s - .03 : gEnd, active = t >= w.s - .03 && t < nextS;
    el.classList.toggle('act', active && !/kw|dg|num/.test(c));
    let extra = ''; if (active) { const ap = P(t, w.s - .03, w.s + .15); extra = `scale(${(1 + .08 * Math.sin(ap * Math.PI)).toFixed(4)})`; }
    if (/dg|num/.test(c)) el.style.textShadow = dgText('g', (t >= w.s ? flare(t, w.s) : .6) * (active ? 1 : .75));
    apply(el, st, extra);
  });
}

/* ---------------- background ---------------- */
const bx = $('bg').getContext('2d');
function drawBg(t) {
  bx.setTransform(2, 0, 0, 2, 0, 0); bx.fillStyle = '#04060A'; bx.fillRect(0, 0, 1080, 1920); bx.globalCompositeOperation = 'lighter';
  for (const [x, y, r, c, a] of [[540 + 260 * Math.sin(t * .35), 520 + 120 * Math.cos(t * .27), 760, '0,194,122', .55], [200 + 120 * Math.cos(t * .3), 1300 + 160 * Math.sin(t * .22), 700, '10,124,255', .45], [900 + 100 * Math.sin(t * .41 + 1), 1050 + 200 * Math.cos(t * .19), 620, '43,255,160', .35]]) {
    const g = bx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${c},${a * .55})`); g.addColorStop(.45, `rgba(${c},${a * .18})`); g.addColorStop(1, 'rgba(0,0,0,0)'); bx.fillStyle = g; bx.fillRect(0, 0, 1080, 1920);
  }
  const hor = 1020, f = 640, amp = .6 + .4 * Math.sin(t * .3);
  const wave = (x, z) => amp * (.10 * Math.sin(x * 2.1 + t * 1.6 + z * .7) + .07 * Math.cos(z * 1.9 - t * 1.2));
  const proj = (x, z) => [540 + x * f / z, hor + (1 - wave(x, z)) * f / z];
  bx.lineWidth = 1.4;
  for (let i = 0; i <= 18; i++) { const z = 1 + i * .35; bx.beginPath(); for (let j = 0; j <= 60; j++) { const [sx, sy] = proj(-3.2 + 6.4 * j / 60, z); j ? bx.lineTo(sx, sy) : bx.moveTo(sx, sy); } bx.strokeStyle = `rgba(43,255,160,${.22 * (1 - i / 18)})`; bx.stroke(); }
  for (let j = 0; j <= 22; j++) { const x = -3.2 + 6.4 * j / 22; bx.beginPath(); for (let i = 0; i <= 40; i++) { const [sx, sy] = proj(x, 1 + 6.3 * i / 40); i ? bx.lineTo(sx, sy) : bx.moveTo(sx, sy); } const gr = bx.createLinearGradient(0, 1920, 0, hor + 40); gr.addColorStop(0, 'rgba(43,255,160,.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); bx.strokeStyle = gr; bx.stroke(); }
  for (let k = 0; k < 90; k++) { const sp = 20 + 60 * rnd(k + 3), x = rnd(k) * 1080 + 30 * Math.sin(t * .5 + k), y = ((rnd(k + 7) * 2100 - t * sp) % 2100 + 2100) % 2100 - 90; bx.fillStyle = `rgba(200,255,230,${(.15 + .5 * rnd(k + 11)) * (.5 + .5 * Math.sin(t * 2 + k)) * .6})`; bx.beginPath(); bx.arc(x, y, .8 + 2.2 * rnd(k + 5), 0, 7); bx.fill(); }
  bx.globalCompositeOperation = 'source-over';
}
const gx = $('grain').getContext('2d'), gimg = gx.createImageData(540, 960);
function drawGrain(fi) { const d = gimg.data; let s = fi * 9301 + 49297; for (let i = 0; i < d.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const v = (s >> 16) & 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } gx.putImageData(gimg, 0, 0); }
const stx = $('streaks').getContext('2d');
function drawStreaks(t, amt, seed) {
  stx.clearRect(0, 0, 1080, 1920); if (amt <= 0) { $('streaks').style.opacity = 0; return; } $('streaks').style.opacity = 1; stx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 26; k++) { const y = rnd(k + seed) * 1920, h = 2 + 10 * rnd(k + seed + 3), len = 300 + 900 * rnd(k + seed + 5), x = (rnd(k + seed + 9) * 1600 - 300) + (t * 4000 * (.5 + rnd(k))) % 1600 - 800; const g = stx.createLinearGradient(x, 0, x + len, 0), c = k % 3 ? '43,255,160' : '120,220,255'; g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(.5, `rgba(${c},${.55 * amt})`); g.addColorStop(1, `rgba(${c},0)`); stx.fillStyle = g; stx.fillRect(x, y, len, h); }
}

/* ---------------- circle / full / PIP ---------------- */
const MODE = [[0, 0], [3.55, 0], [4.1, 1], [9.6, 1], [10.1, 0], [11.9, 0], [12.45, 1], [38.25, 1], [38.8, 0], [45.55, 0], [46.1, 1], [99, 1]];
function modeAt(T) { let i = 0; while (i + 1 < MODE.length && T >= MODE[i + 1][0]) i++; const a = MODE[i], b = MODE[i + 1] || a; return lerp(a[1], b[1], eio(P(T, a[0], b[0]))); }
const RL = 390, FOFF = -60; // layer radius (css) around the face, vertical offset to include the cap
function targetAt(T) { // circle centre/diameter on screen
  const pip = eio(P(T, 28.25, 28.75)) * (1 - eio(P(T, 45.5, 46.0)));
  return { x: lerp(540, 250, pip), y: lerp(1180, 500, pip), d: lerp(440, 300, pip) };
}
function faceAt(fi) { const k = clamp(fi, 0, FACE.x.length - 1); return [FACE.x[k] * 1080, FACE.y[k] * 1920 + FOFF]; }

/* ---------------- builders: AE replicas ---------------- */
const EYE = '<svg class="eye" viewBox="0 0 24 16"><path d="M1 8 C5 1,19 1,23 8 C19 15,5 15,1 8Z" fill="#cfd3d8"/><circle cx="12" cy="8" r="3.5" fill="#1d1f22"/></svg>';
const LAYERS = [ // name, colour, icon kind
  ['Adjustment Layer 2', '#a9a9d6', 'adj'], ['IMG_8365.mov', '#9fd4cc', 'mov'], ['hand_animation_test.glb', '#2aa0a6', 'glb'],
  ['Track Solid 1', '#c43c3c', 'solid'], ['3D Tracker Camera', '#e8b9c9', 'cam'], ['الفيديو الاساسي', '#9fd4cc', 'mov'],
];
const rowsEl = $('rows'); const rowEls = [];
LAYERS.forEach((L, i) => {
  const r = document.createElement('div'); r.className = 'lrow';
  const icon = L[2] === 'adj' ? '<span class="licon" style="background:#fff"></span>' : L[2] === 'solid' ? '<span class="licon" style="background:#3ff"></span>' : L[2] === 'cam' ? '<span class="licon" style="background:none;color:#aaa;font-size:11px">■</span>' : L[2] === 'glb' ? '<span class="licon" style="background:none;color:#aaa">⬡</span>' : '<span class="licon" style="background:#fff;border-radius:50%;border:3px solid #e33"></span>';
  r.innerHTML = `<span class="eyeW">${EYE}</span><span class="lcol" style="background:${L[1]}"></span><span class="lnum"></span>${icon}<span class="lname" style="${/[؀-ۿ]/.test(L[0]) ? 'direction:rtl' : ''}">${L[0]}</span><span class="lsw">⊕ &nbsp;${L[2] === 'adj' || L[2] === 'mov' ? '⟋ ' : ''}${L[2] === 'adj' && false ? 'fx' : ''}</span>`;
  rowsEl.appendChild(r); rowEls.push(r);
});
const MENU = [['New', 1], ['-'], ['Composition Settings...'], ['Reveal Composition in Project'], ['-'], ['Preview', 1], ['Switch View Layout', 1], ['Switch 3D View', 1], ['Rename'], ['-'], ['Open in Essential Graphics'], ['-'], ['Composition Flowchart'], ['Composition Mini-Flowchart']];
const SUB = [['Split with New Locked Viewer'], ['-'], ['Text'], ['Solid...'], ['Light...'], ['Camera...'], ['Null Object'], ['Shape Layer'], ['Adjustment Layer'], ['Content-Aware Fill Layer...'], ['Adobe Photoshop File...'], ['Maxon Cinema 4D File...'], ['-'], ['Cube'], ['Sphere'], ['Plane'], ['Torus'], ['Cone'], ['Cylinder']];
function buildMenu(el, items) { const ys = []; let y = 4; items.forEach(it => { const d = document.createElement('div'); if (it[0] === '-') { d.className = 'mi sep'; y += 9; } else { d.className = 'mi'; d.innerHTML = it[0] + (it[1] ? '<span class="ar">›</span>' : ''); ys.push([it[0], y + 11]); y += 22; } el.appendChild(d); }); return ys; }
const menuY = buildMenu($('menu'), MENU), subY = buildMenu($('sub'), SUB);
const subAdjY = subY.find(s => s[0] === 'Adjustment Layer')[1];
// quick apply list
const QA = [['Easy Comp', 'Blace Plugins'], ['Crates Easy Glow', 'ProductionCrate Glow'], ['Crates Easy Godray (Free)', 'ProductionCrate Glow'], ['Seaside Daisy', 'Shapes > Sprites - Still'], ['Effect Controls: Adjustment Layer 2', 'Window > Effect Controls'], ['Convert to Editable Styles', 'Layer > Layer Styles'], ['Light Leaks - layer markers', 'Image - Special Effects'], ['Reveal Properties with Keyframes', 'Animation > Reveal Properties']];
const qaRows = QA.map((q, i) => { const d = document.createElement('div'); d.className = 'qr'; d.innerHTML = `<b style="color:#bbb;font-style:italic">fx</b>${q[0]}<span class="s">${q[1]}</span>` + (i === 0 ? '<span class="btn">Apply to Selected Layer(s)</span>' : ''); $('qaList').appendChild(d); return d; });
// effect controls (background layer)
const FXR = [['h', 'Pre-comp 1 • Adjustment Layer 2'], ['fx', 'Easy Comp'], ['bg', 'Background Layer'], ['k', 'Mixing Mode', 1], ['k', 'High Resolution', 1], ['k', 'Output Mode', 1], ['k', 'Strength', 1, '>'], ['k', 'Backend & Performance', 0, '⌄'], ['k', 'Hardware Acceleration', 2], ['k', 'Use Lower Precision', 2], ['k', 'CUDA Memory Sharing', 2], ['k', 'Model offloading', 2], ['n', 'Timeout', 1, '>', '120'], ['b', 'Stop Processing', 1, '', 'Stop Processing'], ['b', 'Restart', 1, '', 'Restart']];
let bgDD = null;
FXR.forEach((r, i) => {
  const d = document.createElement('div'); d.className = 'fr'; d.style.top = (4 + i * 22) + 'px';
  const [ty, lab, ind = 0, pre = '', val = ''] = r; const x = 10 + ind * 14;
  if (ty === 'h') d.innerHTML = `<span class="k" style="left:10px;color:#ddd">${lab}</span>`;
  else if (ty === 'fx') d.innerHTML = `<span class="k" style="left:10px"><span style="color:#888">⌄ ☐ </span><b style="color:#fff">${lab}</b></span><span class="btnG" style="left:230px;width:110px"></span>`;
  else if (ty === 'bg') { d.innerHTML = `<span class="k" style="left:24px">${lab}</span><span class="dd" id="bgDD" style="left:186px;width:96px"><span id="bgVal">None</span><span>⌄</span></span><span class="dd" style="left:288px;width:66px"><span>Source</span><span>⌄</span></span>`; }
  else if (ty === 'b') d.innerHTML = `<span class="k" style="left:${x}px">${lab}</span><span class="btnG" style="left:186px;width:160px">${val}</span>`;
  else d.innerHTML = `<span class="k" style="left:${x}px"><span style="color:#888">${pre ? pre + ' ' : ''}${ty !== 'h' && lab !== 'Backend & Performance' ? '◷ ' : ''}</span>${lab}</span>` + (val ? `<span class="k" style="left:186px;color:#3B9CFF">${val}</span>` : '');
  $('fxIn').appendChild(d);
});
const DDL = [['None', 'chk'], ['-'], ['1. Adjustment Layer 2'], ['2. IMG_8365.mov'], ['3. hand_animation_test.glb'], ['4. Track Solid 1'], ['6. الفيديو الاساسي']];
const ddRows = []; DDL.forEach(o => { const d = document.createElement('div'); if (o[0] === '-') d.className = 'o sep'; else { d.className = 'o'; d.innerHTML = (o[1] ? '<span style="position:absolute;left:6px">✓</span>' : '<span class="ckm" style="position:absolute;left:6px"></span>') + o[0]; ddRows.push(d); } $('ddList').appendChild(d); });
// strength panel
const STR = [['fx', 'Easy Comp'], ['bg2', 'Background Layer'], ['dd', 'Mixing Mode', 'Overlay'], ['cb', 'High Resolution'], ['dd', 'Output Mode', 'Foreground+Backgr...'], ['st', 'Strength'], ['lab'], ['sl'], ['k', 'Backend & Performance'], ['cb', 'Hardware Acceleration']];
let stVal = null, stRowY = 0, slY = 0;
STR.forEach((r, i) => {
  const d = document.createElement('div'); d.className = 'fr'; const y = 6 + i * 21.5; d.style.top = y + 'px';
  const [ty, lab, v] = r;
  if (ty === 'fx') d.innerHTML = `<span class="k" style="left:10px"><span style="color:#888">⌄ ☐ </span><b style="color:#fff">${lab}</b></span>`;
  else if (ty === 'bg2') d.innerHTML = `<span class="k" style="left:24px">${lab}</span><span class="dd" style="left:186px;width:96px"><span>6. الفيديو...</span><span>⌄</span></span><span class="dd" style="left:288px;width:58px"><span>Source</span><span>⌄</span></span>`;
  else if (ty === 'dd') d.innerHTML = `<span class="k" style="left:24px"><span style="color:#888">◷ </span>${lab}</span><span class="dd" style="left:186px;width:160px"><span>${v}</span><span>⌄</span></span>`;
  else if (ty === 'cb') d.innerHTML = `<span class="k" style="left:24px"><span style="color:#888">◷ </span>${lab}</span><span class="k" style="left:190px;width:14px;height:14px;border-radius:3px;background:#C9CDD2"></span>`;
  else if (ty === 'st') { d.innerHTML = `<span class="k" style="left:10px"><span style="color:#888">⌄ ◷ </span>${lab}</span><span class="k" id="stVal" style="left:186px;color:#3B9CFF">7.12%</span>`; stRowY = y; }
  else if (ty === 'lab') d.innerHTML = `<span class="k" style="left:24px;color:#aaa">0.00%</span><span class="k" style="left:290px;color:#aaa">100.00%</span>`;
  else if (ty === 'sl') { slY = y; d.innerHTML = `<div id="stSlider" style="top:9px"><div id="stFill"></div><div id="stKnob"></div></div>`; }
  else d.innerHTML = `<span class="k" style="left:10px"><span style="color:#888">⌄ </span>${lab}</span>`;
  $('stp').appendChild(d);
});

/* ---------------- 3D cube (hook) ---------------- */
const cubeG = $('cubeG'); const NS = 'http://www.w3.org/2000/svg';
const faces = []; for (let i = 0; i < 6; i++) { const p = document.createElementNS(NS, 'path'); p.setAttribute('stroke', '#2BFFA0'); p.setAttribute('stroke-width', '2.5'); p.setAttribute('stroke-linejoin', 'round'); cubeG.appendChild(p); faces.push(p); }
function drawCube(t) {
  const a = t * .9, b = .55 + .2 * Math.sin(t * .7), V = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    let X = x * Math.cos(a) - z * Math.sin(a), Z = x * Math.sin(a) + z * Math.cos(a); let Y = y * Math.cos(b) - Z * Math.sin(b); Z = y * Math.sin(b) + Z * Math.cos(b);
    const s = 52 * 3.2 / (3.2 + Z * .5); V.push([X * s, Y * s, Z]);
  }
  const F = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
  F.map(f => [f, f.reduce((s, i) => s + V[i][2], 0)]).sort((p, q) => q[1] - p[1]).forEach(([f, z], k) => {
    faces[k].setAttribute('d', 'M' + f.map(i => V[i][0].toFixed(1) + ',' + V[i][1].toFixed(1)).join('L') + 'Z');
    faces[k].setAttribute('fill', `rgba(43,255,160,${(.05 + .12 * (1 - (z + 2) / 4)).toFixed(3)})`);
  });
}
/* ---------------- tracking points on the element card ---------------- */
const trk = $('trk'); const TP = [];
for (let k = 0; k < 26; k++) { const x = 40 + rnd(k + 70) * 390, y = 470 + rnd(k + 90) * 220; const g = document.createElementNS(NS, 'g'); g.innerHTML = `<path d="M-7,-7L7,7M-7,7L7,-7" stroke="${k % 3 ? '#2BFFA0' : '#FFD66B'}" stroke-width="2.4"/>`; g.setAttribute('transform', `translate(${x},${y})`); trk.appendChild(g); TP.push([g, x, y, k]); }
const tgt = document.createElementNS(NS, 'g'); tgt.innerHTML = '<circle r="34" fill="none" stroke="#FF3B5C" stroke-width="3"/><circle r="22" fill="rgba(43,255,160,.25)" stroke="#2BFFA0" stroke-width="3"/><path d="M0,-22V22M-22,0H22" stroke="#2BFFA0" stroke-width="2"/>'; tgt.setAttribute('transform', 'translate(236,590)'); trk.appendChild(tgt);

/* ---------------- cursor path (computed from replica layout) ---------------- */
const C = { compX: 101, compY: 300, compS: .87 };
const cp = (x, y) => [C.compX + x * C.compS, C.compY + y * C.compS];
const mNew = [560, menuY[0][1] + 2], mAdj = [820, subAdjY + 2], rClick = [520, 60];
function compCam(t) { // screen transform of the comp panel during the new-layer scene
  const A = { s: .87, x: 101, y: 300 };
  const sB = 1.3, B = { s: sB, x: 600 - 800 * sB, y: 600 - 160 * sB };
  const sC = 1.7, Cc = { s: sC, x: 430 - 230 * sC, y: 520 - 110 * sC };
  const p1 = eio(P(t, 16.3, 16.7)), p2 = eio(P(t, 17.22, 17.55));
  const m = (a, b, p) => ({ s: lerp(a.s, b.s, p), x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });
  return m(m(A, B, p1), Cc, p2);
}
const toScreen = (t, q) => { const c = compCam(t); return [c.x + q[0] * c.s, c.y + q[1] * c.s]; };
const qaBtn = [155 + 410 * 1.6, 300 + 96 * 1.6];
const fxS = 1.55, fxX = 255, fxY = 295, ddPos = [fxX + 230 * fxS, fxY + (4 + 2 * 22 + 11) * fxS];
const ddItemY = i => fxY + (56 + 4 + 9 + i * 22 + 11) * fxS; // i = option index after separator
const hideS = 1.5, hideX = 130, hideY = 300, eyePos = [hideX + 12 * hideS, hideY + (96 + 5 * 17 + 8) * hideS];
const CUR = [
  [9.7, 1150, 1500], [9.88, 820, 1150, 1], [10.2, 560, 1150], [10.32, 555, 1150, 1], [10.5, 300, 1150], [10.62, 295, 1150, 1], [11.2, 420, 1500],
  [15.95, 1150, 900], [16.2, ...rClick, 1, 'c'], [16.45, ...mNew, 0, 'c'], [16.75, mNew[0] + 160, mNew[1], 0, 'c'], [17.05, ...mAdj, 0, 'c'], [17.18, ...mAdj, 1, 'c'], [17.6, 900, 560],
  [18.7, 900, 620], [19.25, ...qaBtn], [19.32, ...qaBtn, 1], [19.75, 980, 700],
  [19.9, 980, 620], [20.08, ...ddPos, 1], [20.5, ddPos[0], ddItemY(5)], [21.12, ddPos[0], ddItemY(5), 1], [21.9, 980, 700],
  [22.2, 600, 700], [22.5, ...eyePos], [22.6, ...eyePos, 1], [23.6, 520, 760],
];
const CURWIN = [[9.7, 11.2], [15.95, 17.6], [18.7, 19.75], [19.9, 21.9], [22.2, 23.6]];
function cursorAt(t) {
  if (!CURWIN.some(w => t >= w[0] && t <= w[1])) return null;
  let i = 0; while (i + 1 < CUR.length && t >= CUR[i + 1][0]) i++;
  const a = CUR[i], b = CUR[i + 1] || a; const p = eio(P(t, a[0], b[0]));
  const pa = a[4] === 'c' ? toScreen(t, [a[1], a[2]]) : [a[1], a[2]], pb = b[4] === 'c' ? toScreen(t, [b[1], b[2]]) : [b[1], b[2]];
  return { x: lerp(pa[0], pb[0], p), y: lerp(pa[1], pb[1], p) };
}

const imgs = { main: $('mainImg'), ex: $('exImg'), ex2: $('exImg2') };
function setImg(el, src) { if (el._src === src) return null; el._src = src; el.src = src; return el.decode().catch(() => { }); }
const exFrame = (dir, t0, t, n) => `../seq/${dir}/${String(clamp(Math.round((t - t0) * 30), 0, n - 1)).padStart(5, '0')}.jpg`;

window.renderFrame = async function (t) {
  const fi = Math.round(t * FPS), waits = [];
  const punch = (t0, a = .035, d = .5) => { const p = P(t, t0, t0 + d); return p > 0 && p < 1 ? a * Math.sin(p * Math.PI) * (1 - p) : 0; };
  const shake = (t0, a, d) => { const p = P(t, t0, t0 + d); if (p <= 0 || p >= 1) return [0, 0]; const k = a * (1 - p) * (1 - p); return [k * Math.sin(t * 95), k * Math.cos(t * 83)]; };
  const sc = 1 + punch(3.26, .03) + punch(6.6, .05, .6) + punch(28.04, .03) + punch(34.7, .04) + punch(40.44, .03);
  const sh = [shake(6.62, 8, .45), shake(34.72, 6, .35)].reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
  $('stage').style.transform = `translate(${sh[0].toFixed(2)}px,${sh[1].toFixed(2)}px) scale(${sc.toFixed(4)})`;
  drawBg(t); drawGrain(fi);

  // ---------- main video layer (full / circle / PIP) ----------
  const k = modeAt(t), tg = targetAt(t), mainV = $('mainV');
  const mf = Math.min(NMAIN - 1, Math.round(t * SRC));
  { const w = setImg(imgs.main, `../seq/main/${String(mf).padStart(5, '0')}.jpg`); if (w) waits.push(w); }
  const [fx, fy] = faceAt(mf), sC = tg.d / (2 * RL);
  const e1 = clamp(k / .55), e2 = clamp((k - .4) / .6);
  const s = lerp(1, sC, e2), tx = lerp(0, tg.x - sC * fx, e2), ty = lerp(0, tg.y - sC * fy, e2);
  const rl = Math.exp(lerp(Math.log(1300), Math.log(RL), e1)), R = rl * s;
  mainV.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${s.toFixed(5)})`;
  mainV.style.clipPath = k > 0.001 ? `circle(${rl.toFixed(1)}px at ${fx.toFixed(1)}px ${fy.toFixed(1)}px)` : 'none';
  const cx = tx + s * fx, cy = ty + s * fy;
  const ringVis = clamp((k - .55) / .45);
  const rs = R * 2 * 1.3;
  style($('ring'), { left: (cx - rs / 2) + 'px', top: (cy - rs / 2) + 'px', width: rs + 'px', height: rs + 'px', opacity: ringVis, visibility: ringVis > 0 ? 'visible' : 'hidden' });
  $('ctext').setAttribute('transform', `rotate(${(t * 14) % 360} 500 500)`); $('ticks').setAttribute('transform', `rotate(${(-t * 22) % 360} 500 500)`); $('ringC').setAttribute('transform', `rotate(${(t * 40) % 360} 500 500)`);
  style($('border'), { left: (cx - R) + 'px', top: (cy - R) + 'px', width: 2 * R + 'px', height: 2 * R + 'px', opacity: ringVis, visibility: ringVis > 0 ? 'visible' : 'hidden' });
  const gs = R * 3; style($('glowC'), { left: (cx - gs / 2) + 'px', top: (cy - gs / 2) + 'px', width: gs + 'px', height: gs + 'px', opacity: ringVis * .9, background: `radial-gradient(circle, rgba(43,255,160,${.22 + .08 * Math.sin(t * 2.5)}) 0%, rgba(34,211,238,.08) 45%, transparent 68%)` });

  // ---------- examples (full-screen behind the PIP circle) ----------
  const exV = $('exV'), exOn = t > 28.2 && t < 38.9;
  let fullness = 1 - k;
  if (exOn) {
    exV.style.visibility = 'visible';
    let dir, t0, n;
    if (t < 30.6) { dir = 'exA'; t0 = 28.3; n = 158; } else if (t < 34.65) { dir = 'exB'; t0 = 30.6; n = 138; } else { dir = 'exC'; t0 = 34.65; n = 138; }
    { const w = setImg(imgs.ex, exFrame(dir, t0, t, n)); if (w) waits.push(w); }
    const wp = P(t, 36.3, 36.8), wipeOn = t > 36.25 && t < 38.3;
    if (wipeOn) { const w = setImg(imgs.ex2, exFrame('exB', 34.65, t, 138)); if (w) waits.push(w); }
    const wx = wipeOn ? lerp(0, 50 + 14 * Math.sin((t - 36.8) * 2.2) * P(t, 36.8, 37.0), eout(wp)) * (1 - eio(P(t, 37.95, 38.25))) : 0;
    $('exImg2wrap').style.clipPath = `inset(0 ${(100 - wx).toFixed(2)}% 0 0)`; $('exImg2wrap').style.visibility = wipeOn ? 'visible' : 'hidden';
    style($('wipeLine'), { left: wx + '%', opacity: wipeOn && wx > .5 ? 1 : 0 }); style($('wipeKnob'), { left: wx + '%', top: '1150px', opacity: wipeOn && wx > .5 ? 1 : 0 });
    // entrance: rounded card expanding to full screen; exit: fade + blur under the opening iris
    const ip = eio(P(t, 28.25, 28.75));
    const ins = [lerp(290, 0, ip), lerp(100, 0, ip), lerp(1920 - 880, 0, ip), lerp(100, 0, ip)];
    exV.style.clipPath = ip < 1 ? `inset(${ins[0]}px ${ins[1]}px ${ins[2]}px ${ins[3]}px round ${lerp(40, 0, ip)}px)` : 'none';
    exV.style.opacity = 1 - P(t, 38.5, 38.85); exV.style.transform = `scale(${1 + .04 * (1 - ip)})`; exV.style.transformOrigin = '540px 600px';
    fullness = Math.max(fullness, ip * (1 - P(t, 38.5, 38.85)));
  } else exV.style.visibility = 'hidden';
  $('shade').style.opacity = fullness; $('vig').style.opacity = 1 - fullness * .5;
  for (const [id, a, b] of [['exL1', 28.6, 30.6], ['exL2', 30.7, 34.65], ['exL3', 34.75, 38.2]]) { const el = $(id); el.style.display = t > a - .1 && t < b + .4 ? '' : 'none'; if (t > a - .1 && t < b + .4) apply(el, inout(t, a, b, { dy: -30, s0: .6, do: .25 }), '', id === 'exL3' ? dgFilter('g', .4 * flare(t, a)) : ''); }
  for (const [id, side] of [['baL', 0], ['baR', 1]]) { const el = $(id); const on = t > 36.6 && t < 38.3; el.style.display = on ? '' : 'none'; if (on) { style(el, side ? { right: '130px' } : { left: '130px' }); apply(el, inout(t, 36.75, 38.0, { dy: 20, s0: .6, do: .25 })); } }

  // ---------- S1 hook: 3D cube (full) ----------
  { const on = t > 1.4 && t < 3.9; $('cube').style.display = $('hookT').style.display = on ? '' : 'none';
    if (on) { drawCube(t); apply($('cube'), inout(t, 1.6, 3.5, { dy: 80, s0: .3, bl: 16 }), '', dgFilter('g', .55 * flare(t, 3.26))); apply($('hookT'), inout(t, 2.8, 3.5, { dy: 20, s0: .9 })); $('hookT').style.textShadow = dgText('g', .5); } }
  // ---------- S2 light matching (circle) ----------
  { const on = t > 4.0 && t < 6.9; $('lm').style.display = on ? '' : 'none';
    if (on) {
      apply($('lm'), inout(t, 4.15, 6.5, { dy: 70, s0: .9, bl: 14 }));
      const m = eio(P(t, 6.0, 6.45)); // 0 = mismatched light, 1 = matched to the sun
      const hx = lerp(70, 28, m), hy = lerp(72, 28, m);
      $('sphere').style.background = `radial-gradient(circle at ${hx}% ${hy}%, #ffffff 0%, ${m > .5 ? '#ffe7b0' : '#c9e8ff'} 12%, ${m > .5 ? '#d38a3a' : '#4a6fa5'} 45%, #0b1220 100%)`;
      $('sphere').style.filter = `drop-shadow(${lerp(-14, 18, m)}px ${lerp(-10, 14, m)}px 26px rgba(0,0,0,.6))`;
      $('sShadow').style.transform = `translateX(${lerp(-60, 60, m)}px) scaleX(${1 + .3 * m})`;
      const rp = P(t, 5.1, 5.6); $('rayP').style.strokeDashoffset = 0; $('rayP').style.opacity = rp; $('rayP').setAttribute('d', `M150 140 L${lerp(150, 400, eout(rp))} ${lerp(140, 250, eout(rp))}`);
      $('sun').style.transform = `rotate(${t * 20}deg) scale(${1 + .06 * Math.sin(t * 4)})`; $('sun').style.filter = dgFilter('o', .7);
      const eq = $('eqSign'); eq.textContent = m > .5 ? '=' : '≠'; eq.style.color = m > .5 ? '#2BFFA0' : '#FF3B5C'; eq.style.textShadow = dgText(m > .5 ? 'g' : 'r', .6); eq.style.transform = `scale(${1 + .3 * Math.sin(Math.PI * P(t, 6.2, 6.45))})`;
      $('lmIco').className = m > .5 ? 'ck' : 'xx'; $('lmIco').textContent = m > .5 ? '✓' : '✕'; $('lmTxt').textContent = m > .5 ? 'إضاءة مطابقة للبيئة' : 'إضاءة غير مطابقة';
    } }
  // ---------- S3 Easy Comp title + shortcut (circle) ----------
  { const on = t > 6.4 && t < 9.9; $('ec').style.display = $('short').style.display = on ? '' : 'none';
    if (on) {
      apply($('ec'), inout(t, 6.55, 9.5, { dy: 0, s0: 1, bl: 0, do: .3, ody: -100 }));
      const rp = P(t, 6.55, 7.0);
      style($('ecWord'), { transform: `scale(${lerp(2.2, 1, back(rp, 1.5))})`, filter: `blur(${(1 - eout(rp)) * 18}px) ${dgFilter('g', flare(t, 6.6) * .5)}`, opacity: clamp(rp * 3), letterSpacing: lerp(40, 4, eout(rp)) + 'px' });
      apply($('ecAI'), popIn(t, 7.0, .45, 0, .2, 10), '', dgFilter('g', flare(t, 7.05) * .6)); apply($('ecBy'), popIn(t, 7.3, .4, 20, .9, 8));
      apply($('short'), inout(t, 7.85, 9.5, { dy: 40, s0: .9 }));
      const lp = P(t, 7.9, 8.45), fp = P(t, 8.5, 9.05), L1 = 1300, L2 = 740;
      $('longP').style.strokeDasharray = `${L1}`; $('longP').style.strokeDashoffset = L1 * (1 - eout(lp)); $('longP').style.opacity = 1 - .6 * fp;
      $('fastP').style.strokeDasharray = `${L2}`; $('fastP').style.strokeDashoffset = L2 * (1 - eout5(fp)); $('fastP').style.filter = dgFilter('g', .5 * flare(t, 9.0));
      $('fastA').style.opacity = P(t, 8.95, 9.05);
    } }
  // ---------- S4 social (full) ----------
  { const on = t > 9.6 && t < 12.1; for (const id of ['bLike', 'bShare', 'bFollow', 'bell']) $(id).style.display = on ? '' : 'none';
    if (on) {
      [['bLike', 9.7, 9.88], ['bShare', 9.78, 10.32], ['bFollow', 9.86, 10.62]].forEach(([id, a, c]) => { const st = inout(t, a, 11.85, { dy: 80, s0: .6, do: .2 }); const press = Math.sin(Math.PI * P(t, c, c + .16)); const el = $(id); el.classList.toggle('on', t >= c + .05); apply(el, st, `scale(${1 - .12 * press})`, t >= c + .05 ? dgFilter('g', flare(t, c + .05) * .4) : ''); });
      apply($('bell'), inout(t, 10.8, 11.85, { dy: 40, s0: .3, do: .2 }), `rotate(${Math.sin(Math.max(0, t - 11.58) * 22) * 18 * Math.exp(-Math.max(0, t - 11.58) * 2.5)}deg)`, dgFilter('o', flare(t, 11.58) * .5));
    } }
  // ---------- S5 3D element + camera tracking (circle) ----------
  { const on = t > 12.2 && t < 16.3; for (const id of ['elCard', 'chEl', 'chTr']) $(id).style.display = on ? '' : 'none';
    if (on) {
      const sp = P(t, 12.38, 12.9);
      apply($('elCard'), inout(t, 12.38, 15.95, { dy: 0, s0: 1, bl: 0, do: .3 }), `perspective(1400px) rotateY(${lerp(70, 0, eout(sp))}deg) scale(${lerp(.75, 1, back(sp, 1.3))})`);
      TP.forEach(([g, x, y, k2]) => { const p = P(t, 15.14 + k2 * .02, 15.3 + k2 * .02); g.style.opacity = p; g.setAttribute('transform', `translate(${x + Math.sin(t * 3 + k2) * 2},${y}) scale(${lerp(2, 1, eout(p))})`); });
      const tp = P(t, 15.4, 15.7); tgt.style.opacity = tp; tgt.setAttribute('transform', `translate(236,590) scale(${lerp(1.8, 1, back(tp, 2))})`);
      style($('chEl'), { left: '120px', top: '380px' }); apply($('chEl'), inout(t, 13.02, 15.95, { dy: 0, s0: .5 }), `rotate(-4deg)`, dgFilter('g', .3 * flare(t, 13.02)));
      style($('chTr'), { left: '620px', top: '800px' }); apply($('chTr'), inout(t, 15.14, 15.95, { dy: 0, s0: .5, do: .25 }), `rotate(4deg)`, dgFilter('g', .3 * flare(t, 15.14)));
    } }
  // ---------- S6 new adjustment layer & S9 hide video (comp panel) ----------
  { const nl = t > 15.9 && t < 18.0, hd = t > 22.05 && t < 24.2, on = nl || hd; $('comp').style.display = on ? '' : 'none';
    if (on) {
      const comp = $('comp');
      if (nl) { const cc = compCam(t); style(comp, { left: cc.x + 'px', top: cc.y + 'px' }); apply(comp, inout(t, 15.95, 17.75, { dy: 60, s0: .9, bl: 14, do: .3 }), `scale(${cc.s})`); comp.style.transformOrigin = '0 0'; }
      else { style(comp, { left: hideX + 'px', top: hideY + 'px' }); apply(comp, inout(t, 22.1, 23.95, { dy: 60, s0: .9, bl: 14, do: .3 }), `scale(${hideS})`); comp.style.transformOrigin = '0 0'; }
      const added = hd || t > 17.2, ap = hd ? 1 : eout(P(t, 17.2, 17.5));
      rowEls.forEach((r, i) => {
        const idx = i === 0 ? 0 : (added ? i : i - 1);
        const yy = 96 + (i === 0 ? 0 : lerp(i - 1, i, ap)) * 17;
        r.style.top = yy + 'px'; r.style.opacity = i === 0 ? ap : 1; r.style.transform = i === 0 ? `translateY(${(1 - ap) * -12}px)` : 'none';
        r.querySelector('.lnum').textContent = i === 0 ? 1 : (added ? i + 1 : i);
        r.classList.toggle('sel', (i === 0 && added && !hd) || (hd && i === 5));
        const eyeOff = (i === 3) || (hd && i === 5 && t > 22.62);
        r.querySelector('.eyeW').style.visibility = eyeOff ? 'hidden' : 'visible';
        r.style.filter = hd && i === 5 && t > 22.62 ? 'brightness(.55)' : 'none';
        if (i === 0 && added) r.querySelector('.lsw').innerHTML = '⊕ &nbsp;⟋ ' + (t > 19.35 || hd ? '<b style="color:#2BFFA0">fx</b>' : '') + ' &nbsp;◐';
      });
      const mo = nl ? env(t, 16.22, 17.2, .08, .06) : 0, so = nl ? env(t, 16.5, 17.2, .08, .06) : 0;
      show($('menu'), mo); show($('sub'), so);
      [...$('sub').children].forEach(c => c.classList.toggle('hl', c.textContent === 'Adjustment Layer' && t > 16.95));
      [...$('menu').children].forEach(c => c.classList.toggle('hl', c.textContent.startsWith('New') && t > 16.4));
    } }
  // ---------- S7 Quick Apply ----------
  { const on = t > 17.75 && t < 20.0; $('qa').style.display = on ? '' : 'none';
    if (on) {
      apply($('qa'), inout(t, 17.86, 19.75, { dy: 60, s0: .9, bl: 14, do: .3 }), `scale(1.6)`); $('qa').style.transformOrigin = '0 0';
      const txt = 'easy', n = Math.floor(txt.length * P(t, 18.25, 18.6)); $('qaTxt').textContent = txt.slice(0, n);
      $('qaCaret').style.opacity = Math.floor(t * 4) % 2 ? 1 : 0;
      qaRows.forEach((r, i) => { const p = P(t, 18.55 + i * .03, 18.75 + i * .03); r.style.opacity = p; r.style.transform = `translateY(${(1 - eout(p)) * 10}px)`; r.classList.toggle('hl', i === 0 && t > 18.66); });
      const btn = qaRows[0].querySelector('.btn'); btn.style.transform = `scale(${1 - .12 * Math.sin(Math.PI * P(t, 19.32, 19.45))})`; btn.style.boxShadow = t > 19.32 ? `0 0 ${14 * flare(t, 19.32)}px rgba(43,255,160,.9)` : 'none';
    } }
  // ---------- S8 Background Layer dropdown ----------
  { const on = t > 19.75 && t < 22.3; $('fxp').style.display = on ? '' : 'none';
    if (on) {
      apply($('fxp'), inout(t, 19.86, 22.05, { dy: 60, s0: .9, bl: 14, do: .3 }), `scale(${fxS})`); $('fxp').style.transformOrigin = '0 0';
      show($('ddList'), env(t, 20.08, 21.2, .1, .08));
      ddRows.forEach((r, i) => r.classList.toggle('hl', i === 5 && t > 20.5));
      $('bgVal').textContent = t > 21.15 ? '6. الفيديو الاساسي' : 'None';
      $('bgVal').parentElement.style.boxShadow = t > 21.15 ? `0 0 ${10 * flare(t, 21.15)}px rgba(43,255,160,.9)` : 'none';
    } }
  // ---------- S10 Strength 0 -> 100% ----------
  { const on = t > 24.0 && t < 28.45; $('stp').style.display = on ? '' : 'none';
    const hb = $('hlBox');
    if (on) {
      const st = inout(t, 24.1, 28.2, { dy: 60, s0: .9, bl: 14, do: .25 });
      apply($('stp'), st, `scale(2.2)`); $('stp').style.transformOrigin = '0 0';
      let v = 7.12; if (t > 26.9) v = t < 27.3 ? lerp(7.12, 0, eio(P(t, 26.9, 27.26))) : lerp(0, 100, eio(P(t, 27.4, 28.04)));
      $('stVal').textContent = v.toFixed(2) + '%'; $('stVal').style.color = t > 27.3 ? '#E6FBFF' : '#3B9CFF'; $('stVal').style.textShadow = t > 27.3 ? dgText('c', .4) : 'none';
      $('stFill').style.width = v + '%'; $('stKnob').style.left = `calc(${v}% - 9px)`; $('stKnob').style.boxShadow = t > 27.3 ? '0 0 12px rgba(43,255,160,.9)' : 'none';
      const hp = env(t, 26.5, 28.2, .2, .2) * st.op;
      style(hb, { left: (156 + 4 * 2.2) + 'px', top: (300 + (stRowY - 2) * 2.2) + 'px', width: (344 * 2.2 - 16) + 'px', height: (3 * 21.5 * 2.2) + 'px', opacity: hp, visibility: hp > 0 ? 'visible' : 'hidden' });
    } else hb.style.visibility = 'hidden';
  }
  // ---------- S12 Local AI (full) ----------
  { const on = t > 38.9 && t < 45.9; $('ai').style.display = $('xs').style.display = on ? '' : 'none';
    if (on) {
      apply($('ai'), inout(t, 39.4, 45.6, { dy: 60, s0: .5, bl: 14 }), '', dgFilter('g', .45 * flare(t, 40.44)));
      [['x1', 42.94], ['x2', 43.92], ['x3', 45.48]].forEach(([id, s0]) => { const el = $(id); apply(el, inout(t, s0 - .1, 45.6 + (id === 'x3' ? .05 : 0), { dy: 60, s0: .6, bl: 12 })); el.querySelector('.st').style.transform = `scaleX(${eout(P(t, s0 + .15, s0 + .4))})`; });
    } }
  // ---------- S13 CTA (circle) ----------
  { const a0 = 46.1, on = t > a0 - .1; $('cmt').style.display = on ? '' : 'none';
    if (on) {
      apply($('cmt'), popIn(t, a0, .5, 80, .9, 16));
      const msg = 'Easy Comp 🔥', chars = [...msg], n = Math.floor(chars.length * P(t, 46.6, 47.25)), posted = t >= 47.4;
      const typed = $('typed'); typed.className = 't' + ((n === 0 || posted) ? ' ph' : '');
      typed.innerHTML = (n === 0 || posted ? 'أضف تعليقًا…' : chars.slice(0, n).join('')) + (!posted && Math.floor(t * 4) % 2 === 0 ? '<span id="caret"></span>' : '');
      $('send').style.transform = `scale(${1 - .18 * Math.sin(Math.PI * P(t, 47.25, 47.42))})`; $('postedT').textContent = msg;
      apply($('posted'), popIn(t, 47.4, .45, 40, .8, 10), '', t > 47.4 ? dgFilter('g', .3 * flare(t, 47.4)) : '');
      apply($('hrt'), popIn(t, 47.7, .35, 0, .2, 0)); apply($('dmBubble'), popIn(t, 48.36, .45, 30, .6, 10)); apply($('seen'), popIn(t, 49.04, .35, 14, .9, 6));
      const pp = P(t, 48.0, 48.4), pl = $('plane');
      if (pp > 0 && pp < 1) { const e = eio(pp), x = lerp(205, 600, e), y = lerp(810, 570, e) - Math.sin(e * Math.PI) * 160; show(pl, Math.sin(pp * Math.PI) * 1.4, `rotate(${-20 + e * 30}deg) scale(${1 + .4 * Math.sin(pp * Math.PI)})`); style(pl, { left: (x - 35) + 'px', top: (y - 35) + 'px' }); } else show(pl, 0);
    } else show($('plane'), 0); }
  // ---------- cursor ----------
  { const c = cursorAt(t), cu = $('cursor'), cr = $('clickRing');
    if (c) { cu.style.visibility = 'visible'; style(cu, { left: (c.x - 7) + 'px', top: (c.y - 5) + 'px' }); let pressed = 0, ring = null;
      for (const q of CUR) if (q[3]) { const p = P(t, q[0], q[0] + .35); const qq = q[4] === 'c' ? toScreen(t, [q[1], q[2]]) : [q[1], q[2]]; if (p > 0 && p < 1) ring = [qq[0], qq[1], p]; pressed = Math.max(pressed, Math.sin(Math.PI * P(t, q[0], q[0] + .14))); }
      cu.style.transform = `scale(${1 - .2 * pressed})`;
      if (ring) { const r = lerp(8, 56, eout(ring[2])); style(cr, { visibility: 'visible', left: (ring[0] - r) + 'px', top: (ring[1] - r) + 'px', width: 2 * r + 'px', height: 2 * r + 'px', opacity: 1 - ring[2] }); } else cr.style.visibility = 'hidden';
    } else { cu.style.visibility = 'hidden'; cr.style.visibility = 'hidden'; } }
  capsRender($('cap'), CAPS, t, capState, END + 1);
  // ---------- transitions ----------
  const tr = [3.55, 9.6, 11.9, 28.25, 30.6, 34.65, 38.25, 45.55]; let amt = 0, seed = 0;
  tr.forEach((t0, i) => { const p = P(t, t0 - .12, t0 + .5); if (p > 0 && p < 1) { amt = Math.max(amt, Math.sin(p * Math.PI)); seed = i * 50; } });
  drawStreaks(t, amt * .85, seed);
  const fl = [[3.26, .45], [6.6, .7], [30.6, .5], [34.65, .7], [40.44, .4]].map(([t0, a]) => { const p = P(t, t0 - .04, t0 + .35); return p > 0 && p < 1 ? a * (p < .12 ? p / .12 : 1 - (p - .12) / .88) : 0; });
  $('flash').style.opacity = Math.max(...fl);
  await Promise.all(waits);
};
window.probeRects = function () {
  const out = [];
  for (const el of document.querySelectorAll('#stage *')) {
    if (el.closest('svg') && el.tagName !== 'svg') continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .02) { out.push(null); continue; }
    const r = el.getBoundingClientRect(); out.push([r.left, r.top, r.width, r.height]);
  }
  return out;
};
window.ready = document.fonts.ready.then(() => true);
