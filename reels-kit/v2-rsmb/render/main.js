// RSMB Pro reel — deterministic renderer. window.renderFrame(t) -> Promise
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
function show(el, op, tf = '', blur = 0, extraFilter = '') {
  el.style.opacity = op; el.style.visibility = op <= 0.001 ? 'hidden' : 'visible';
  el.style.transform = tf;
  const f = (blur > 0.05 ? `blur(${blur.toFixed(2)}px) ` : '') + extraFilter;
  el.style.filter = f.trim() || 'none';
}
function popIn(t, t0, dur = .45, dy = 40, s0 = .85, bl = 14) {
  const p = P(t, t0, t0 + dur), e = back(p, 1.4), eb = eout(p);
  return { op: clamp(p * 2.2), y: (1 - e) * dy, s: lerp(s0, 1, e), b: (1 - eb) * bl };
}
function popOut(t, t0, dur = .35, dy = -50, bl = 14) {
  const p = P(t, t0, t0 + dur), e = ein(p);
  return { op: 1 - p, y: e * dy, s: 1 - .06 * e, b: e * bl };
}
const combine = (a, b) => ({ op: Math.min(a.op, b.op), y: a.y + b.y, s: a.s * b.s, b: a.b + b.b });
function apply(el, st, extra = '', ef = '') { show(el, st.op, `translateY(${st.y.toFixed(2)}px) scale(${st.s.toFixed(4)}) ${extra}`, st.b, ef); }
const inout = (t, a, b, o = {}) => combine(popIn(t, a, o.di || .45, o.dy ?? 40, o.s0 || .85, o.bl ?? 14), popOut(t, b, o.do || .35, o.ody ?? -50, o.bl ?? 14));
// Deep-Glow-like layered exponential glow
const G = { g: '43,255,160', c: '34,211,238', o: '255,190,60', p: '255,95,162', w: '230,255,245' };
function dgText(col, k = 1) {
  const c = G[col] || col;
  return [`0 0 ${(1.5 * k).toFixed(1)}px rgba(255,255,255,.95)`, `0 0 ${(5 * k).toFixed(1)}px rgba(${c},.95)`, `0 0 ${(12 * k).toFixed(1)}px rgba(${c},.85)`,
    `0 0 ${(28 * k).toFixed(1)}px rgba(${c},.7)`, `0 0 ${(60 * k).toFixed(1)}px rgba(${c},.45)`, `0 0 ${(120 * k).toFixed(1)}px rgba(${c},.3)`].join(',');
}
function dgFilter(col, k = 1) {
  const c = G[col] || col;
  return `drop-shadow(0 0 ${(3 * k).toFixed(1)}px rgba(255,255,255,.7)) drop-shadow(0 0 ${(10 * k).toFixed(1)}px rgba(${c},.9)) drop-shadow(0 0 ${(28 * k).toFixed(1)}px rgba(${c},.6)) drop-shadow(0 0 ${(60 * k).toFixed(1)}px rgba(${c},.4))`;
}
const flare = (t, t0) => t < t0 ? 1 : 1 + 1.4 * Math.exp(-(t - t0) * 5);

/* ---------------- time mapping ---------------- */
const FPS = 60, SRC = 60000 / 1001;
const CUT = 12.35, INS = 7.5, EXS = 1.0, END = 51.2 + INS;
const mT = m => m < CUT ? m : m + INS;
const mainAt = T => T < CUT ? T : (T >= CUT + INS ? T - INS : null);

/* ---------------- captions (main-time word starts) ---------------- */
const W = (w, s, c = '') => ({ w, s: mT(s), c });
const CAPS = [
  [W('اليوم', 0), W('بعلمك', .30), W('إفكت', .78, 'dg')],
  [W('جداً', 1.16), W('راح', 1.68), W('يناسبك', 1.88)],
  [W('في', 2.32), W('تصوير', 2.40), W('الإيفنتات', 2.78, 'dg')],
  [W('أو', 3.34), W('حتى', 3.56), W('الأعراس', 3.86, 'dg')],
  [W('بطابع', 4.26), W('ثبات', 4.98), W('اللقطة', 5.38, 'dg')],
  [W('مع', 5.86), W('ضبابية', 6.08, 'dg'), W('الحركة', 6.54, 'dg')],
  [W('باستخدام', 7.12), W('محبوبة', 7.64), W('الجميع', 8.12)],
  [W('RSMB Pro', 8.70, 'kw'), W('Plugin', 9.68, 'kw')],
  [W('لايك', 10.16), W('وشير', 10.52), W('وفولو', 10.84)],
  [W('لتقديم', 11.26), W('المزيد', 11.90, 'dg')],
  [W('صوّر', 12.40), W('نفسك', 12.62), W('مقطعين', 13.02, 'dg')],
  [W('نفس', 13.48), W('المكان', 13.98), W('وتوزيع', 14.44), W('الإضاءة', 15.04)],
  [W('الأول', 15.54), W('وانت', 15.98), W('ثابت', 16.42, 'dg')],
  [W('والثاني', 16.86), W('وانت', 17.68), W('تتحرك', 18.02, 'dg')],
  [W('أكثر', 18.48), W('من', 18.86), W('مكان', 19.02)],
  [W('في', 19.44), W('أكثر', 19.68), W('من', 19.96), W('زاوية', 20.10)],
  [W('الحين', 20.48), W('أدرج', 20.86), W('مقطعك', 21.22), W('الأول', 21.70)],
  [W('على', 22.06), W('التايملاين', 22.22, 'dg')],
  [W('وبعدها', 22.92), W('جيب', 23.34), W('المقطع', 23.56), W('الثاني', 24.00)],
  [W('أعلاه', 24.50)],
  [W('وابدأ', 24.96), W('قطّع', 25.36, 'dg'), W('كل', 25.70), W('لحظة', 25.94)],
  [W('تمر', 26.30), W('فيها', 26.54), W('أمام', 26.86), W('الكاميرا', 27.24)],
  [W('لحد', 27.66), W('ما', 28.06), W('يكون', 28.22), W('عندك', 28.54)],
  [W('أكثر', 28.90), W('من', 29.30), W('مقطع', 29.44, 'dg')],
  [W('بهذا', 29.96), W('الشكل', 30.38), W('على', 30.78), W('التايملاين', 30.98)],
  [W('المطلوب', 31.66), W('منك', 32.08), W('الحين', 32.34)],
  [W('هو', 32.70), W('تشغيل', 32.80), W('إبداعك', 33.28, 'gold'), W('قليلاً', 33.70)],
  [W('كرر', 34.20, 'dg'), W('المقاطع', 34.46), W('مثلاً', 35.00)],
  [W('أو', 35.38), W('اعمل', 35.54), W('لها', 35.86), W('ريفيرس', 36.06, 'dg')],
  [W('وإلى', 36.60), W('آخره', 36.94)],
  [W('الحين', 37.38), W('ضيف', 37.76), W('عليهم', 38.06)],
  [W('RSMB Pro', 38.54, 'kw'), W('Plugin', 39.34, 'kw')],
  [W('بقيمة', 39.80), W('تتراوح', 40.36)],
  [W('ما', 40.90), W('بين', 41.02), W('2', 41.22, 'num'), W('و', 41.62), W('5', 41.70, 'num')],
  [W('لحتى', 42.16), W('تعطيك', 42.72)],
  [W('ضبابية', 43.06, 'dg'), W('حركة', 43.56), W('أكثر', 43.98)],
  [W('وبالمناسبة', 44.30)],
  [W('راح', 45.10), W('أرسلك', 45.24), W('إياها', 45.58), W('مجانًا', 45.84)],
  [W('اللي', 46.36), W('هي', 46.58), W('النسخة', 46.64), W('المدفوعة', 47.08)],
  [W('فقط', 47.60), W('اكتب', 47.86), W('لي', 48.20), W('أي', 48.32), W('شيء', 48.44)],
  [W('بالتعليقات', 48.60, 'dg')],
  [W('راح', 49.24), W('أرسلك', 49.46), W('إياها', 49.82), W('مباشرة', 50.20, 'dg')],
];
// on-screen lines over the example insert (top position)
const T0 = CUT;
const CAPT = [
  [{ w: 'مثل', s: T0 + .45 }, { w: 'ما', s: T0 + .6 }, { w: 'تشوف', s: T0 + .75 }, { w: 'هنا', s: T0 + .95, c: 'dg' }],
  [{ w: 'الشخصية', s: T0 + 2.1 }, { w: 'ثابتة', s: T0 + 2.45, c: 'dg' }, { w: 'بمكان', s: T0 + 2.8 }, { w: 'واحد', s: T0 + 3.0 }],
  [{ w: 'والي', s: T0 + 4.05 }, { w: 'حوله', s: T0 + 4.3 }, { w: 'يتحرك', s: T0 + 4.6, c: 'dg' }],
  [{ w: 'وكأن', s: T0 + 5.6 }, { w: 'اللقطة', s: T0 + 5.85 }, { w: 'مأخوذة', s: T0 + 6.1 }, { w: 'من', s: T0 + 6.35 }, { w: 'التايم لابس', s: T0 + 6.55, c: 'dg' }],
];
function capsRender(container, groups, t, state, endAt) {
  let gi = -1;
  for (let i = 0; i < groups.length; i++) if (t >= groups[i][0].s - .06) gi = i;
  let gEnd = gi + 1 < groups.length ? groups[gi + 1][0].s - .06 : endAt;
  if (gi >= 0 && groups[gi][0].s < CUT && gEnd > CUT) gEnd = CUT - .02;
  if (gi >= 0 && t >= gEnd) gi = -1;
  if (gi !== state.i) {
    state.i = gi; container.innerHTML = '';
    if (gi >= 0) for (const w of groups[gi]) { const s = document.createElement('span'); s.className = 'w ' + (w.c || ''); s.textContent = w.w; container.appendChild(s); }
  }
  if (gi < 0) return;
  const g = groups[gi];
  const out = P(t, gEnd - .1, gEnd);
  [...container.children].forEach((el, k) => {
    const w = g[k], c = w.c || '';
    const pi = popIn(t, w.s - .05, .32, 34, .7, 12);
    const st = { op: pi.op * (1 - out), y: pi.y - out * 24, s: pi.s, b: pi.b + out * 8 };
    const nextS = k + 1 < g.length ? g[k + 1].s - .03 : gEnd;
    const active = t >= w.s - .03 && t < nextS;
    el.classList.toggle('act', active && !/kw|dg|gold|num/.test(c));
    let extra = '';
    if (active) { const ap = P(t, w.s - .03, w.s + .15); extra = `scale(${(1 + .08 * Math.sin(ap * Math.PI)).toFixed(4)})`; }
    if (c.includes('dg') || c.includes('num')) el.style.textShadow = dgText('g', (t >= w.s ? flare(t, w.s) : .6) * (active ? 1 : .75));
    if (c.includes('gold')) el.style.textShadow = dgText('o', (t >= w.s ? flare(t, w.s) : .6) * (active ? 1 : .75));
    apply(el, st, extra);
  });
}
const capState = { i: -2 }, capTState = { i: -2 };

/* ---------------- background ---------------- */
const bg = $('bg'), bx = bg.getContext('2d');
function drawBg(t, amp) {
  bx.setTransform(2, 0, 0, 2, 0, 0);
  bx.fillStyle = '#04060A'; bx.fillRect(0, 0, 1080, 1920);
  bx.globalCompositeOperation = 'lighter';
  const blobs = [[540 + 260 * Math.sin(t * .35), 520 + 120 * Math.cos(t * .27), 760, [0, 194, 122], .55],
    [200 + 120 * Math.cos(t * .3), 1300 + 160 * Math.sin(t * .22), 700, [10, 124, 255], .45],
    [900 + 100 * Math.sin(t * .41 + 1), 1050 + 200 * Math.cos(t * .19), 620, [43, 255, 160], .35]];
  for (const [x, y, r, c, a] of blobs) {
    const g = bx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${c},${a * .55})`); g.addColorStop(.45, `rgba(${c},${a * .18})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    bx.fillStyle = g; bx.fillRect(0, 0, 1080, 1920);
  }
  const hor = 1020, f = 640;
  const wave = (x, z) => amp * (.10 * Math.sin(x * 2.1 + t * 1.6 + z * .7) + .07 * Math.cos(z * 1.9 - t * 1.2));
  const proj = (x, z) => [540 + x * f / z, hor + (1 - wave(x, z)) * f / z];
  bx.lineWidth = 1.4;
  for (let i = 0; i <= 18; i++) { const z = 1 + i * .35; bx.beginPath(); for (let j = 0; j <= 60; j++) { const [sx, sy] = proj(-3.2 + 6.4 * j / 60, z); j ? bx.lineTo(sx, sy) : bx.moveTo(sx, sy); } bx.strokeStyle = `rgba(43,255,160,${.22 * (1 - i / 18)})`; bx.stroke(); }
  for (let j = 0; j <= 22; j++) { const x = -3.2 + 6.4 * j / 22; bx.beginPath(); for (let i = 0; i <= 40; i++) { const [sx, sy] = proj(x, 1 + 6.3 * i / 40); i ? bx.lineTo(sx, sy) : bx.moveTo(sx, sy); } const gr = bx.createLinearGradient(0, 1920, 0, hor + 40); gr.addColorStop(0, 'rgba(43,255,160,.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); bx.strokeStyle = gr; bx.stroke(); }
  for (let k = 0; k < 90; k++) {
    const sp = 20 + 60 * rnd(k + 3), x = rnd(k) * 1080 + 30 * Math.sin(t * .5 + k);
    const y = ((rnd(k + 7) * 2100 - t * sp) % 2100 + 2100) % 2100 - 90;
    bx.fillStyle = `rgba(200,255,230,${(.15 + .5 * rnd(k + 11)) * (.5 + .5 * Math.sin(t * 2 + k)) * .6})`; bx.beginPath(); bx.arc(x, y, .8 + 2.2 * rnd(k + 5), 0, 7); bx.fill();
  }
  bx.globalCompositeOperation = 'source-over';
}
const gc = $('grain'), gx = gc.getContext('2d'), gimg = gx.createImageData(540, 960);
function drawGrain(fi) { const d = gimg.data; let s = fi * 9301 + 49297; for (let i = 0; i < d.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const v = (s >> 16) & 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } gx.putImageData(gimg, 0, 0); }

/* ---------------- light streak overlay for transitions ---------------- */
const stc = $('streaks'), stx = stc.getContext('2d');
function drawStreaks(t, amt, seed) {
  stx.clearRect(0, 0, 1080, 1920); if (amt <= 0) { stc.style.opacity = 0; return; }
  stc.style.opacity = 1; stx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 26; k++) {
    const y = rnd(k + seed) * 1920, h = 2 + 10 * rnd(k + seed + 3), len = 300 + 900 * rnd(k + seed + 5);
    const x = (rnd(k + seed + 9) * 1600 - 300) + (t * 4000 * (0.5 + rnd(k))) % 1600 - 800;
    const g = stx.createLinearGradient(x, 0, x + len, 0);
    const c = k % 3 ? '43,255,160' : '120,220,255';
    g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(.5, `rgba(${c},${.55 * amt})`); g.addColorStop(1, `rgba(${c},0)`);
    stx.fillStyle = g; stx.fillRect(x, y, len, h);
  }
}

/* ---------------- full <-> circle geometry ---------------- */
const MODE = [[0, 0], [2.3, 0], [2.85, 1], [9.85, 1], [10.35, 0], [19.85, 1], [39.1, 1], [39.65, 0], [44.7, 0], [45.25, 1], [51.55, 1], [52.05, 0], [54.85, 0], [55.35, 1], [99, 1]];
function modeAt(T) { let i = 0; while (i + 1 < MODE.length && T >= MODE[i + 1][0]) i++; const a = MODE[i], b = MODE[i + 1] || a; return lerp(a[1], b[1], eio(P(T, a[0], b[0]))); }
const CX = 540, CY = 1180, CD = 440, RL = 410; // circle centre/diameter on screen, radius in layer coords
function faceAt(fi) { const k = clamp(fi, 0, FACE.x.length - 1); return [FACE.x[k] * 1080, FACE.y[k] * 1920 + 12]; }

/* ---------------- figure / ghosts in viewfinder (S2) ---------------- */
function rotoPath(scale, ox, oy, sx = 1) { return 'M' + ROTO.map(p => `${(ox + (p[0] - .42) * scale * sx).toFixed(1)},${(oy + (p[1] - .62) * scale * 1.777).toFixed(1)}`).join('L') + 'Z'; }
const ghostsG = $('ghosts');
for (let k = 0; k < 4; k++) { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('fill', 'rgba(140,220,255,.35)'); ghostsG.appendChild(p); }
const bladesG = $('blades');
for (let k = 0; k < 6; k++) { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('fill', '#0b1015'); p.setAttribute('stroke', 'rgba(43,255,160,.6)'); p.setAttribute('stroke-width', '2'); bladesG.appendChild(p); }

/* ---------------- timeline lanes ---------------- */
const lanes = $('lanes'), NL = 12, LH = 17, TW = 836;
for (let i = 0; i < NL; i++) { const d = document.createElement('div'); d.className = 'lane'; d.style.top = (i * LH) + 'px'; lanes.appendChild(d); }
const ruler = $('ruler'); for (let i = 0; i < 18; i++) { const d = document.createElement('div'); style(d, { position: 'absolute', left: (20 + i * 46) + 'px', top: '8px', fontFamily: 'Sora', fontSize: '12px', color: 'rgba(255,255,255,.45)' }); d.textContent = String(i).padStart(2, '0') + 's'; ruler.appendChild(d); }
const bar1 = document.createElement('div'); bar1.className = 'bar'; style(bar1, { background: 'linear-gradient(90deg,#3d7f86,#5aa7ae)' }); lanes.appendChild(bar1);
const NSEG = 9, SEGX = j => 20 + j * 70, SEGW = 64;
const segs = []; for (let j = 0; j < NSEG; j++) { const b = document.createElement('div'); b.className = 'bar'; style(b, { background: 'linear-gradient(90deg,#8a7a55,#b49e6c)', boxShadow: '0 0 0 1px rgba(255,255,255,.15)' }); lanes.appendChild(b); segs.push(b); }
const cutMarks = []; for (let j = 1; j < NSEG; j++) { const c = document.createElement('div'); style(c, { position: 'absolute', width: '3px', height: '26px', background: '#FF5FA2', boxShadow: '0 0 12px #FF5FA2', borderRadius: '2px' }); lanes.appendChild(c); cutMarks.push(c); }

/* ---------------- settings replica ---------------- */
const SROWS = [
  ['h', 'fx', 'RSMB Pro'], ['b', 'Manage License', ''], ['c', 'Less GPU Mem', true, 1], ['d', 'Use GPU', 'ON'], ['d', 'Display', 'Color Src Blurred', 1],
  ['n', 'Main_BG: Blur Amt', '5.00', 1, 'blur'], ['s', 'Track Settings'], ['d2', 'Alt Motion Src', 'None', 'Source'], ['d', 'Track Frame', 'Auto', 2], ['d', 'Track Enhance', 'None', 2],
  ['c', 'Track RGB+A', false, 2], ['c', '360 Video', false], ['d', 'Draw Geom', 'None', 1], ['s', 'Main_BG Settings'], ['n', 'Main_BG: Sensitivity', '70.00', 2],
  ['ct', 'Main_BG: Image Track', 'Main: Image Track', 2], ['d', 'Main_BG: First Mask', 'None'], ['d', 'Main_BG: Last Mask', 'None'], ['s', 'FG1 Settings', '', 0, 'closed'], ['n', 'Boost FG Alpha', '1.00', 1], ['s', 'Track Points', '', 0, 'closed'],
];
const setH = $('setH'), RH = 29.5, RT = 14; let blurNum = null, blurRowY = 0;
SROWS.forEach((r, i) => {
  const row = document.createElement('div'); row.className = 'sr'; row.style.top = (RT + i * RH) + 'px'; row.style.height = RH + 'px'; row.style.fontSize = '19px';
  const [type, label, val, ind = 0, extra] = r; const x0 = 22 + ind * 22;
  const k = document.createElement('div'); k.className = 'k'; k.style.left = x0 + 'px';
  if (type === 'h') { k.innerHTML = `<span style="color:#8a8f96">▾ ☐ </span><b style="color:#fff">RSMB Pro</b>`; row.appendChild(k); row.style.background = 'rgba(255,255,255,.04)'; setH.appendChild(row); return; }
  if (type === 's') { k.innerHTML = `<span style="color:#8a8f96">${extra === 'closed' ? '›' : '⌄'}</span> ${label}`; row.appendChild(k); setH.appendChild(row); return; }
  k.innerHTML = (type === 'n' || type === 'd' || type === 'c' ? '<span class="sw">◷ </span>' : '') + label; row.appendChild(k);
  if (type === 'b') { const v = document.createElement('div'); style(v, { position: 'absolute', left: '300px', right: '40px', height: '24px', borderRadius: '12px', background: '#5a5e64' }); row.appendChild(v); }
  if (type === 'c' || type === 'ct') { const v = document.createElement('div'); v.className = 'v'; v.style.left = '300px'; v.innerHTML = `<div class="cb ${val === true || type === 'ct' ? 'on' : ''}"></div>`; row.appendChild(v); if (type === 'ct') { const l = document.createElement('div'); l.className = 'v'; l.style.left = '340px'; l.textContent = val; row.appendChild(l); } }
  if (type === 'd') { const v = document.createElement('div'); v.className = 'dd'; style(v, { left: '300px', height: '24px', fontSize: '18px' }); v.innerHTML = `<span>${val}</span><span>⌄</span>`; row.appendChild(v); }
  if (type === 'd2') { for (const [l, txt] of [[300, val], [430, ind]]) { const v = document.createElement('div'); v.className = 'dd'; style(v, { left: l + 'px', right: 'auto', width: '118px', height: '24px', fontSize: '18px' }); v.innerHTML = `<span>${txt}</span><span>⌄</span>`; row.appendChild(v); } }
  if (type === 'n') { const v = document.createElement('div'); v.className = 'v num'; v.style.left = '300px'; v.textContent = val; row.appendChild(v); if (extra === 'blur') { blurNum = v; blurRowY = RT + i * RH; } }
  setH.appendChild(row);
});
const hl = document.createElement('div'); hl.id = 'hl'; setH.appendChild(hl);
const slider = document.createElement('div'); slider.id = 'slider'; slider.innerHTML = '<div id="sliderFill"></div><div id="sliderKnob"></div>'; setH.appendChild(slider);

/* ---------------- cursor ---------------- */
const CUR = [ // T, x, y, click
  [9.95, 1150, 1500], [10.12, 820, 1150, 1], [10.45, 560, 1150], [10.5, 555, 1150, 1], [10.8, 300, 1150], [10.86, 295, 1150, 1], [11.6, 420, 1500],
  [mT(20.7), 1150, 1300], [mT(20.95), 260, 1000], [mT(21.85), 330, 873, 1], [mT(22.3), 700, 1060],
  [mT(22.95), 1150, 1300], [mT(23.4), 300, 1000], [mT(24.45), 330, 856, 1], [mT(24.9), 880, 1000],
];
function cursorAt(t) {
  if (!((t >= 9.95 && t <= 11.6) || (t >= mT(20.7) && t <= mT(24.9)))) return null;
  let i = 0; while (i + 1 < CUR.length && t >= CUR[i + 1][0]) i++;
  const a = CUR[i], b = CUR[i + 1] || a; const p = eio(P(t, a[0], b[0]));
  return { x: lerp(a[1], b[1], p), y: lerp(a[2], b[2], p) };
}

const imgs = { main: $('mainImg'), ex: $('exImg') };
function setImg(el, src) { if (el._src === src) return null; el._src = src; el.src = src; return el.decode().catch(() => { }); }
let ACTIVE_T = 0;

window.renderFrame = async function (t) {
  const fi = Math.round(t * FPS);
  const waits = [];
  // ---------- camera ----------
  const punch = (t0, a = .035, d = .5) => { const p = P(t, t0, t0 + d); return p > 0 && p < 1 ? a * Math.sin(p * Math.PI) * (1 - p) : 0; };
  const shake = (t0, a, d) => { const p = P(t, t0, t0 + d); if (p <= 0 || p >= 1) return [0, 0]; const k = a * (1 - p) * (1 - p); return [k * Math.sin(t * 95), k * Math.cos(t * 83)]; };
  const sc = 1 + punch(.78, .03) + punch(mT(8.7), .05, .6) + punch(CUT, .04) + punch(mT(41.22), .03) + punch(mT(41.70), .03);
  const sh = [shake(mT(8.72), 9, .5), shake(CUT + .02, 8, .4), shake(mT(29.96), 5, .35)].reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
  $('stage').style.transform = `translate(${sh[0].toFixed(2)}px,${sh[1].toFixed(2)}px) scale(${sc.toFixed(4)})`;

  drawBg(t, .6 + .4 * Math.sin(t * .3));
  drawGrain(fi);

  // ---------- main video layer ----------
  const m = mainAt(t);
  const k = modeAt(t);
  const mainV = $('mainV');
  // whip out before insert
  const whipOut = t < CUT ? P(t, CUT - .17, CUT) : 0;
  // circle entrance after insert
  const ent = t >= CUT + INS ? back(P(t, CUT + INS, CUT + INS + .55), 1.6) : 1;
  const mainVisible = (t < CUT || t >= CUT + INS);
  let cx = CX, cy = CY, R = CD / 2;
  if (mainVisible) {
    const mf = Math.min(3068, Math.round((m ?? 0) * SRC));
    const w = setImg(imgs.main, `../seq/main/${String(mf).padStart(5, '0')}.jpg`); if (w) waits.push(w);
    const [fx, fy] = faceAt(mf);
    const sC = CD / (2 * RL);
    const e1 = clamp(k / .55), e2 = clamp((k - .4) / .6); // iris-close first, then move/scale into place
    let s = lerp(1, sC, e2), tx = lerp(0, CX - sC * fx, e2), ty = lerp(0, CY - sC * fy, e2);
    // entrance scaling around circle centre
    s *= ent; tx = CX + ent * (tx - CX); ty = CY + ent * (ty - CY);
    // whip out (translate up fast)
    ty += -2200 * ein(whipOut);
    const rl = Math.exp(lerp(Math.log(1300), Math.log(RL), e1)); // radius in layer coords
    const Rs = rl * s;
    mainV.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${s.toFixed(5)})`;
    mainV.style.clipPath = k > 0.001 ? `circle(${rl.toFixed(1)}px at ${fx.toFixed(1)}px ${fy.toFixed(1)}px)` : 'none';
    mainV.style.visibility = 'visible'; mainV.style.opacity = t >= CUT + INS ? clamp(P(t, CUT + INS, CUT + INS + .12)) : 1;
    cx = tx + s * fx; cy = ty + s * fy; R = Rs;
  } else mainV.style.visibility = 'hidden';
  // ring / border / glow follow circle
  const ringVis = mainVisible ? clamp((k - .55) / .45) * clamp(ent) : 0;
  const rs = R * 2 * 1.3;
  style($('ring'), { left: (cx - rs / 2) + 'px', top: (cy - rs / 2) + 'px', width: rs + 'px', height: rs + 'px', opacity: ringVis, visibility: ringVis > 0 ? 'visible' : 'hidden' });
  $('ctext').setAttribute('transform', `rotate(${(t * 14) % 360} 500 500)`);
  $('ticks').setAttribute('transform', `rotate(${(-t * 22) % 360} 500 500)`);
  $('ringC').setAttribute('transform', `rotate(${(t * 40) % 360} 500 500)`);
  style($('border'), { left: (cx - R) + 'px', top: (cy - R) + 'px', width: 2 * R + 'px', height: 2 * R + 'px', opacity: ringVis, visibility: ringVis > 0 ? 'visible' : 'hidden' });
  const gs = R * 3;
  style($('glowC'), { left: (cx - gs / 2) + 'px', top: (cy - gs / 2) + 'px', width: gs + 'px', height: gs + 'px', opacity: ringVis * .9, background: `radial-gradient(circle, rgba(43,255,160,${.22 + .08 * Math.sin(t * 2.5)}) 0%, rgba(34,211,238,.08) 45%, transparent 68%)` });

  // ---------- example layer ----------
  const exV = $('exV');
  const exOn = t >= CUT && t < CUT + INS + .4;
  if (exOn) {
    const ef = clamp(Math.round((t - CUT + EXS) * SRC), 0, 884);
    const w = setImg(imgs.ex, `../seq/ex/${String(ef).padStart(5, '0')}.jpg`); if (w) waits.push(w);
    const pin = eout(P(t, CUT, CUT + .3));
    const po = eio(P(t, CUT + INS - .15, CUT + INS + .35));
    const s = lerp(1.0, .42, po), ty = lerp(1500, 0, pin) - 900 * po;
    exV.style.transform = `translate(${(540 - 540 * s).toFixed(1)}px,${(960 - 960 * s + ty).toFixed(1)}px) scale(${s.toFixed(4)})`;
    exV.style.clipPath = po > 0 ? `inset(0 round ${(po * 90 / s).toFixed(1)}px)` : 'none';
    exV.style.opacity = 1 - P(t, CUT + INS + .1, CUT + INS + .38); exV.style.visibility = 'visible';
  } else exV.style.visibility = 'hidden';
  const fullness = mainVisible ? (1 - k) : (exOn ? 1 : 0);
  $('shade').style.opacity = fullness;
  $('vig').style.opacity = 1 - fullness * .5;

  // ---------- S1 hook (full) ----------
  {
    const h = $('hook'), on = t < 2.6;
    h.style.display = on ? '' : 'none';
    if (on) {
      const st = inout(t, .15, 2.25, { dy: 60, s0: .7, bl: 20 });
      const ht = $('hookT');
      apply(h, st);
      ht.style.textShadow = dgText('g', flare(t, .3) * .9);
      ht.style.letterSpacing = lerp(40, 6, eout(P(t, .15, .9))) + 'px';
      $('hookS').style.opacity = P(t, .7, 1.1);
    }
  }
  // ---------- S2 events / weddings / viewfinder ----------
  {
    const on = t > 2.6 && t < 7.4;
    for (const id of ['tEvt', 'lEvt', 'orb1', 'tWed', 'lWed', 'orb2', 'vf']) $(id).style.display = on ? '' : 'none';
    if (on) {
      const a = inout(t, 2.74, 4.2, { dy: 90, s0: .5, bl: 18 }), b = inout(t, 3.82, 4.25, { dy: 90, s0: .5, bl: 18 });
      style($('tEvt'), { left: '200px', top: '420px' }); apply($('tEvt'), a, `rotate(${(1 - back(P(t, 2.74, 3.2), 1.6)) * -18}deg)`);
      style($('lEvt'), { left: '200px', top: '630px', width: '190px' }); apply($('lEvt'), inout(t, 2.85, 4.2, { dy: 20 }));
      style($('orb1'), { left: '165px', top: '385px' }); $('orb1').style.opacity = a.op * .55;
      style($('tWed'), { left: '690px', top: '420px' }); apply($('tWed'), b, `rotate(${(1 - back(P(t, 3.82, 4.28), 1.6)) * 18}deg)`);
      style($('lWed'), { left: '690px', top: '630px', width: '190px' }); apply($('lWed'), inout(t, 3.95, 4.25, { dy: 20 }));
      style($('orb2'), { left: '655px', top: '385px' }); $('orb2').style.opacity = b.op * .55;
      // viewfinder
      const vf = inout(t, 4.22, 7.08, { dy: 60, s0: .88, bl: 16 });
      apply($('vf'), vf);
      const figOn = P(t, 4.3, 4.6);
      $('figP').setAttribute('d', rotoPath(430, 350, 330));
      $('figP').style.opacity = figOn;
      // focus square locks at "ثبات"
      const fp = P(t, 4.98, 5.3);
      style($('focus'), { transform: `scale(${lerp(1.6, 1, eout(fp))})`, opacity: fp > 0 ? 1 : 0, borderColor: t > 5.3 ? 'rgba(43,255,160,.95)' : 'rgba(255,214,107,.95)' });
      // shutter blades at "اللقطة"
      const sp = P(t, 5.38, 5.62), close = Math.sin(sp * Math.PI);
      [...bladesG.children].forEach((bl, i) => {
        const ang = i * Math.PI / 3, r0 = 420, r1 = lerp(420, 0, close);
        const cxv = 350, cyv = 300, a1 = ang, a2 = ang + Math.PI / 3 + .2;
        bl.setAttribute('d', `M${cxv + Math.cos(a1) * r0},${cyv + Math.sin(a1) * r0} L${cxv + Math.cos(a2) * r0},${cyv + Math.sin(a2) * r0} L${cxv + Math.cos(a2 - .9) * r1},${cyv + Math.sin(a2 - .9) * r1}Z`);
        bl.style.opacity = close > .02 ? 1 : 0;
      });
      // motion-blur ghosts at "ضبابية الحركة": silhouettes sweeping past
      [...ghostsG.children].forEach((g, i) => {
        const t0 = 6.0 + i * .22, p = P(t, t0, t0 + .55);
        const x = lerp(-350, 1050, ein(p) * .5 + p * .5);
        g.setAttribute('d', rotoPath(430, x, 330 + (i % 2) * 15, i % 2 ? -1 : 1));
        g.style.opacity = p > 0 && p < 1 ? .55 : 0;
      });
      $('vfShut').textContent = t > 5.9 ? '1/15' : '1/120';
    }
  }
  // ---------- S3 RSMB reveal ----------
  {
    const on = t > 7.0 && t < 10.2;
    $('heart').style.display = $('rs').style.display = on ? '' : 'none';
    if (on) {
      const hp = inout(t, 7.6, 8.55, { dy: 40, s0: .3, bl: 10 });
      apply($('heart'), hp, `scale(${1 + .08 * Math.sin(Math.max(0, t - 7.6) * 12) * Math.exp(-Math.max(0, t - 7.6) * 2)})`, dgFilter('p', 1));
      const rs = inout(t, 8.62, 9.92, { dy: 0, s0: 1, bl: 0, do: .3, ody: -120 });
      apply($('rs'), rs);
      const rp = P(t, 8.62, 9.1);
      style($('rsWord'), { transform: `scale(${lerp(2.4, 1, back(rp, 1.5))})`, filter: `blur(${(1 - eout(rp)) * 18}px) ${dgFilter('g', flare(t, 8.7) * .6)}`, opacity: clamp(rp * 3), letterSpacing: lerp(60, 6, eout(rp)) + 'px' });
      apply($('rsPro'), popIn(t, 8.95, .45, 0, .2, 10), '', dgFilter('g', flare(t, 9.0) * .7));
      apply($('rsBy'), popIn(t, 9.2, .4, 20, .9, 8));
      apply($('ch1'), popIn(t, 9.25, .4, 30, .6, 8)); apply($('ch2'), popIn(t, 9.33, .4, 30, .6, 8)); apply($('ch3'), popIn(t, 9.41, .4, 30, .6, 8));
    }
  }
  // ---------- S4 social (full) ----------
  {
    const on = t > 9.9 && t < 12.4;
    for (const id of ['bLike', 'bShare', 'bFollow', 'bell']) $(id).style.display = on ? '' : 'none';
    if (on) {
      [['bLike', 10.0, 10.12], ['bShare', 10.08, 10.5], ['bFollow', 10.16, 10.86]].forEach(([id, a, c]) => {
        const st = inout(t, a, 12.18, { dy: 80, s0: .6, bl: 14, do: .2 });
        const press = Math.sin(Math.PI * P(t, c, c + .16));
        const el = $(id); el.classList.toggle('on', t >= c + .05);
        apply(el, st, `scale(${1 - .12 * press})`, t >= c + .05 ? dgFilter('g', flare(t, c + .05) * .5) : '');
      });
      const bp = inout(t, 11.26, 12.18, { dy: 40, s0: .3, bl: 10, do: .2 });
      apply($('bell'), bp, `rotate(${Math.sin(Math.max(0, t - 11.3) * 22) * 18 * Math.exp(-Math.max(0, t - 11.3) * 2.5)}deg)`, dgFilter('o', flare(t, 11.9) * .6));
    }
  }
  // ---------- S5 example overlays ----------
  {
    const on = t > CUT && t < CUT + INS + .2;
    for (const id of ['lockRing', 'exTag', 'moveTag', 'tlBadge']) $(id).style.display = on ? '' : 'none';
    if (on) {
      const lr = inout(t, CUT + 2.4, CUT + 4.0, { dy: 0, s0: 1.6, bl: 10 });
      style($('lockRing'), { left: '235px', top: '900px', width: '400px', height: '400px' });
      apply($('lockRing'), lr, `rotate(${t * 30}deg)`, dgFilter('g', .6));
      style($('exTag'), { left: '330px', top: '860px' }); apply($('exTag'), inout(t, CUT + 2.55, CUT + 4.0, { dy: 20, s0: .6 }));
      style($('moveTag'), { left: '690px', top: '1120px' }); apply($('moveTag'), inout(t, CUT + 4.6, CUT + 5.5, { dy: 20, s0: .6 }));
      const tb = inout(t, CUT + 6.5, CUT + INS - .05, { dy: 0, s0: 1.8, bl: 24, do: .2 });
      apply($('tlBadge'), tb); $('tlBadgeT').style.textShadow = dgText('g', flare(t, CUT + 6.6));
      $('tlBadgeT').style.letterSpacing = lerp(50, 6, eout(P(t, CUT + 6.5, CUT + 7.0))) + 'px';
    }
  }
  // ---------- S6 clip cards ----------
  {
    const a0 = mT(12.9), a1 = mT(20.42), on = t > a0 - .1 && t < a1 + .5;
    for (const id of ['cc1', 'cc2', 'mPin', 'mLight', 'cam1', 'cam2', 'cam3']) $(id).style.display = on ? '' : 'none';
    if (on) {
      const hi1 = env(t, mT(15.54), mT(16.86), .25, .25), hi2 = env(t, mT(16.86), a1, .25, .2);
      const c1 = inout(t, mT(12.98), a1, { dy: 140, s0: .6, bl: 18 }), c2 = inout(t, mT(13.1), a1 + .05, { dy: 140, s0: .6, bl: 18 });
      apply($('cc1'), c1, `perspective(900px) rotateY(${lerp(14, 0, hi1)}deg) rotate(${lerp(-6, 0, hi1)}deg) scale(${1 + .08 * hi1 - .05 * hi2})`, hi1 > .01 ? dgFilter('g', hi1 * .8) : '');
      apply($('cc2'), c2, `perspective(900px) rotateY(${lerp(-14, 0, hi2)}deg) rotate(${lerp(6, 0, hi2)}deg) scale(${1 + .08 * hi2 - .05 * hi1})`, hi2 > .01 ? dgFilter('c', hi2 * .8) : '');
      $('cc1').style.borderColor = hi1 > .5 ? 'rgba(43,255,160,.9)' : 'rgba(255,255,255,.25)';
      $('cc2').style.borderColor = hi2 > .5 ? 'rgba(34,211,238,.9)' : 'rgba(255,255,255,.25)';
      style($('mPin'), { left: '395px', top: '640px' }); apply($('mPin'), inout(t, mT(13.5), mT(15.5), { s0: .5 }));
      style($('mLight'), { left: '385px', top: '730px' }); apply($('mLight'), inout(t, mT(14.5), mT(15.5), { s0: .5 }));
      [['cam1', 18.95, 600, 360], ['cam2', 19.65, 900, 470], ['cam3', 20.05, 860, 760]].forEach(([id, s, x, y]) => {
        style($(id), { left: x + 'px', top: y + 'px' }); apply($(id), inout(t, mT(s), a1, { dy: 30, s0: .3 }), `rotate(${Math.sin(t * 3 + x) * 6}deg)`);
      });
    }
  }
  // ---------- S7 timeline ----------
  {
    const a0 = mT(20.40), a1 = mT(31.62), on = t > a0 && t < a1 + .5;
    $('tl').style.display = $('razor').style.display = $('shot').style.display = on ? '' : 'none';
    if (on) {
      const tl = inout(t, a0, mT(30.0), { dy: 120, s0: .9, bl: 16, do: .3 });
      apply($('tl'), tl, `perspective(1400px) rotateX(${lerp(25, 0, eout(P(t, a0, a0 + .6)))}deg)`);
      const tc = Math.max(0, t - a0) * 1.0; const ff = Math.floor(tc * 60) % 60, ss = Math.floor(tc);
      $('tlTime').textContent = `0;00;${String(ss).padStart(2, '0')};${String(ff).padStart(2, '0')}`;
      // clip 1 drop on lane 11
      const d1 = P(t, mT(20.95), mT(21.85)), d2 = P(t, mT(23.4), mT(24.45));
      style(bar1, { left: '20px', width: '800px', top: (11 * LH + 1 + (1 - eout5(d1)) * 220) + 'px', opacity: d1 > 0 ? 1 : 0, transform: `scale(${lerp(.4, 1, eout(d1))})`, transformOrigin: '10% 50%' });
      // clip 2 on lane 10, then cut into segments, then staircase
      const stair = j => eio(P(t, mT(27.7) + j * .1, mT(28.3) + j * .1));
      segs.forEach((b, j) => {
        const cutDone = t >= mT(25.0) + (j) * .32;
        const gap = cutDone ? 2 : 0;
        const lane = lerp(10, j, stair(j));
        style(b, { left: (SEGX(j) + gap) + 'px', width: (SEGW + (j === NSEG - 1 ? 0 : 6) - gap) + 'px', top: (lane * LH + 1 + (1 - eout5(d2)) * 220) + 'px', opacity: d2 > 0 ? 1 : 0,
          background: stair(j) > .5 ? 'linear-gradient(90deg,#9b8a5e,#cbb47a)' : 'linear-gradient(90deg,#8a7a55,#b49e6c)' });
      });
      cutMarks.forEach((c, j) => { const ct = mT(25.0) + (j + 1) * .32; const p = P(t, ct, ct + .4); style(c, { left: (SEGX(j + 1) - 1) + 'px', top: (10 * LH - 5) + 'px', opacity: p > 0 && p < 1 ? 1 - p : 0, transform: `scaleY(${1 + 1.5 * (1 - p)})` }); });
      const ph = P(t, mT(24.95), mT(27.9)); $('playhead').style.left = lerp(20, 20 + NSEG * 70, ph) + 'px';
      // razor follows playhead
      const rz = env(t, mT(24.95), mT(27.95), .2, .2);
      const tlRect = { x: 100 + 22, y: 290 + 350 + 30 };
      style($('razor'), { left: (tlRect.x + lerp(20, 20 + NSEG * 70, ph) - 10) + 'px', top: (tlRect.y + 10 * LH - 60) + 'px', opacity: rz * tl.op, visibility: rz > 0 ? 'visible' : 'hidden' });
      // rotoscope outline drawing in viewer
      const rp = $('rotoP'); rp.setAttribute('d', 'M' + ROTO.map(p => `${p[0] * 1000},${p[1] * 1000}`).join('L') + 'Z');
      const len = 4200; rp.style.strokeDasharray = len; const dr = P(t, mT(25.2), mT(27.4)); rp.style.strokeDashoffset = len * (1 - dr);
      rp.style.fillOpacity = P(t, mT(27.2), mT(27.6)); rp.style.filter = `drop-shadow(0 0 4px #2BFFA0)`;
      // "بهذا الشكل" — real screenshot flips in and zooms on the staircase
      const sp = P(t, mT(29.9), mT(30.35));
      const so = 1 - P(t, a1 - .05, a1 + .3);
      const shot = $('shot');
      show(shot, clamp(sp * 3) * so, `perspective(1600px) rotateX(${lerp(70, 0, eout(sp))}deg) scale(${lerp(.8, 1, back(sp, 1.3))}) translateY(${lerp(140, 0, eout(sp))}px)`, (1 - eout(sp)) * 14);
      const z = eio(P(t, mT(30.5), mT(31.3)));
      const zs = lerp(1, 2.3, z), zx = lerp(0, -0.27 * 880 * (2.3 - 1) / 1.3 * 1.3, z), zy = lerp(0, -0.70 * 495 * (2.3 - 1), z);
      $('shotIn').style.transform = `translate(${zx}px,${zy}px) scale(${zs})`;
    }
  }
  // ---------- S8 creativity (full) ----------
  {
    const a0 = mT(31.9), a1 = mT(37.25), on = t > a0 - .1 && t < a1 + .4;
    for (const id of ['bulb', 'ctRep', 'ctRev', 'ctSpd']) $(id).style.display = on ? '' : 'none';
    if (on) {
      const b = inout(t, mT(32.6), a1, { dy: 60, s0: .4, bl: 14 });
      const lit = P(t, mT(33.28), mT(33.45));
      apply($('bulb'), b, `rotate(${Math.sin(t * 2) * 4}deg)`, lit > 0 ? dgFilter('o', lerp(.3, 1.4, lit) * flare(t, mT(33.3)) * .8) : 'grayscale(1) brightness(.6)');
      [['ctRep', 34.2], ['ctRev', 36.06], ['ctSpd', 36.75]].forEach(([id, s]) => {
        const st = inout(t, mT(s) - .05, a1 + .05, { dy: 90, s0: .5, bl: 16 });
        const spin = id === 'ctRev' ? `rotateY(${(1 - eout(P(t, mT(s), mT(s) + .5))) * 180}deg)` : '';
        apply($(id), st, spin, t > mT(s) ? dgFilter(id === 'ctSpd' ? 'o' : id === 'ctRev' ? 'c' : 'g', flare(t, mT(s)) * .45) : '');
      });
    }
  }
  // ---------- S9 settings ----------
  {
    const a0 = mT(37.6), a1 = mT(44.15), on = t > a0 - .1 && t < a1 + .4;
    $('set').style.display = $('bigVal').style.display = on ? '' : 'none';
    if (on) {
      const sp = P(t, a0, a0 + .6);
      const st = inout(t, a0, a1, { dy: 0, s0: 1, bl: 0, do: .3 });
      style($('set'), { left: '250px', width: '580px', height: '650px', top: '285px' });
      const zz = eio(P(t, mT(39.75), mT(40.35))) * (1 - eio(P(t, mT(43.4), mT(43.95))));
      $('set').style.transformOrigin = `50% ${blurRowY + RH / 2}px`;
      { const top = lerp(0, Math.max(0, blurRowY - 3.2 * RH), zz), bot = lerp(0, 650 - (blurRowY + 4.2 * RH), zz);
        $('set').style.clipPath = zz > 0.001 ? `inset(${top.toFixed(1)}px 0 ${bot.toFixed(1)}px 0 round 24px)` : 'none'; }
      apply($('set'), st, `translateY(${zz * (330 - blurRowY)}px) perspective(1600px) rotateY(${lerp(-60, 0, eout(sp))}deg) scale(${lerp(.7, 1, back(sp, 1.2)) * (1 + .75 * zz)})`);
      $('setImg').style.display = 'none';
      // header glow at "RSMB Pro"
      const hdr = setH.children[0]; hdr.style.boxShadow = t > mT(38.54) ? `inset 0 0 ${20 * flare(t, mT(38.54))}px rgba(43,255,160,.5)` : 'none';
      // blur amount animates 2 -> 5
      const v = t < mT(41.0) ? 2 : lerp(2, 5, eio(P(t, mT(41.15), mT(42.1))));
      blurNum.textContent = v.toFixed(2);
      blurNum.style.textShadow = t > mT(41.1) ? dgText('c', .5 * flare(t, mT(41.2))) : 'none'; blurNum.style.color = t > mT(41.1) ? '#E6FBFF' : '#3B9CFF';
      const hp = P(t, mT(39.7), mT(40.1));
      style(hl, { top: (blurRowY - 8) + 'px', height: (RH + 16) + 'px', opacity: hp * (1 - P(t, a1 - .3, a1)) });
      style(slider, { left: '300px', right: '40px', height: '6px', top: (blurRowY + RH - 3) + 'px', opacity: P(t, mT(40.6), mT(41.0)) });
      $('sliderFill').style.width = (v / 10 * 100) + '%'; $('sliderKnob').style.left = `calc(${v / 10 * 100}% - 14px)`;
      // big value under panel
      const bv = $('bigVal');
      bv.innerHTML = `<span style="font-family:Sora;font-weight:800;font-size:110px;color:#F4FFFA;text-shadow:${dgText('c', flare(t, mT(41.7)) * .9)}">${v.toFixed(1)}</span>`;
      show(bv, 0);
      bv.style.top = '960px';
    }
  }
  // ---------- S10 chat icon (full) ----------
  {
    const a0 = mT(44.6), a1 = mT(47.6), on = t > a0 - .1 && t < a1 + .3;
    $('chatI').style.display = on ? '' : 'none';
    if (on) apply($('chatI'), inout(t, a0, a1 - .1, { dy: 70, s0: .4, bl: 14 }), `rotate(${Math.sin(t * 2.4) * 6}deg) translateY(${Math.sin(t * 3) * 8}px)`, dgFilter('g', .55 * flare(t, mT(45.84))));
  }
  // ---------- S11 CTA ----------
  {
    const a0 = mT(47.7), on = t > a0 - .1;
    $('cmt').style.display = on ? '' : 'none';
    if (on) {
      apply($('cmt'), popIn(t, a0, .5, 80, .9, 16));
      const msg = 'RSMB Pro 🔥'; const chars = [...msg];
      const n = Math.floor(chars.length * P(t, mT(47.95), mT(48.5)));
      const posted = t >= mT(48.62);
      const typed = $('typed'); typed.className = 't' + ((n === 0 || posted) ? ' ph' : '');
      typed.innerHTML = (n === 0 || posted ? 'أضف تعليقًا…' : chars.slice(0, n).join('')) + (!posted && Math.floor(t * 4) % 2 === 0 ? '<span id="caret"></span>' : '');
      $('send').style.transform = `scale(${1 - .18 * Math.sin(Math.PI * P(t, mT(48.5), mT(48.66)))})`;
      $('postedT').textContent = msg;
      apply($('posted'), popIn(t, mT(48.62), .45, 40, .8, 10), '', t > mT(48.62) ? dgFilter('g', .35 * flare(t, mT(48.62))) : '');
      apply($('hrt'), popIn(t, mT(48.9), .35, 0, .2, 0));
      apply($('dmBubble'), popIn(t, mT(49.5), .45, 30, .6, 10));
      apply($('seen'), popIn(t, mT(50.2), .35, 14, .9, 6), '', dgFilter('o', .4 * flare(t, mT(50.2))));
      const pp = P(t, mT(49.2), mT(49.6)), pl = $('plane');
      if (pp > 0 && pp < 1) { const e = eio(pp), x = lerp(205, 600, e), y = lerp(830, 590, e) - Math.sin(e * Math.PI) * 160; show(pl, Math.sin(pp * Math.PI) * 1.4, `rotate(${-20 + e * 30}deg) scale(${1 + .4 * Math.sin(pp * Math.PI)})`); style(pl, { left: (x - 35) + 'px', top: (y - 35) + 'px' }); }
      else show(pl, 0);
    } else show($('plane'), 0);
  }
  // ---------- cursor ----------
  {
    const c = cursorAt(t), cu = $('cursor'), cr = $('clickRing');
    if (c) {
      cu.style.visibility = 'visible'; style(cu, { left: (c.x - 8) + 'px', top: (c.y - 6) + 'px' });
      let pressed = 0, ring = null;
      for (const q of CUR) if (q[3]) { const p = P(t, q[0], q[0] + .35); if (p > 0 && p < 1) { ring = [q[1], q[2], p]; } pressed = Math.max(pressed, Math.sin(Math.PI * P(t, q[0], q[0] + .14))); }
      cu.style.transform = `scale(${1 - .2 * pressed})`;
      if (ring) { const r = lerp(10, 70, eout(ring[2])); style(cr, { visibility: 'visible', left: (ring[0] - r) + 'px', top: (ring[1] - r) + 'px', width: 2 * r + 'px', height: 2 * r + 'px', opacity: 1 - ring[2] }); }
      else cr.style.visibility = 'hidden';
    } else { cu.style.visibility = 'hidden'; cr.style.visibility = 'hidden'; }
  }
  // ---------- captions ----------
  capsRender($('cap'), CAPS, t, capState, END + 1);
  capsRender($('capT'), CAPT, t, capTState, CUT + INS - .1);
  // ---------- transitions: flashes & streaks ----------
  const tr = [2.3, 9.85, CUT, CUT + INS, 39.1, 44.7, 51.55, 54.85];
  let amt = 0, seed = 0; tr.forEach((t0, i) => { const p = P(t, t0 - .12, t0 + .5); if (p > 0 && p < 1) { amt = Math.max(amt, Math.sin(p * Math.PI)); seed = i * 50; } });
  drawStreaks(t, amt * .9, seed);
  const fl = [[.78, .5], [mT(8.7), .8], [CUT, .9], [CUT + INS, .5], [mT(45.84), .5], [mT(41.7), .4]].map(([t0, a]) => { const p = P(t, t0 - .04, t0 + .35); return p > 0 && p < 1 ? a * (p < .12 ? p / .12 : 1 - (p - .12) / .88) : 0; });
  $('flash').style.opacity = Math.max(...fl);
  const wf = P(t, CUT - .05, CUT + .25); $('wflash').style.opacity = wf > 0 && wf < 1 ? .55 * (wf < .2 ? wf / .2 : 1 - (wf - .2) / .8) : 0;

  await Promise.all(waits);
};
// geometry probe for adaptive motion blur: returns list of element rects (css px)
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
