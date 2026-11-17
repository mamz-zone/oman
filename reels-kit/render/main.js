// Deterministic frame renderer: window.renderFrame(t) -> Promise
const $ = id => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => a + (b - a) * p;
const P = (t, a, b) => clamp((t - a) / (b - a));
const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const eout = p => 1 - Math.pow(1 - p, 3);
const eout5 = p => 1 - Math.pow(1 - p, 5);
const ein = p => p * p * p;
const back = (p, s = 1.7) => { const c3 = s + 1; return 1 + c3 * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2); };
const spring = (p, f = 4.5, d = 6) => p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.exp(-d * p) * Math.cos(f * Math.PI * p) * (1 - p) - 0 * p;
function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
// in/out envelope: fade in over [a,a+di], out over [b-do_, b]
const env = (t, a, b, di = .3, dout = .3) => Math.min(P(t, a, a + di), 1 - P(t, b - dout, b));
function style(el, o) { for (const k in o) el.style[k] = o[k]; }
function show(el, op, tf = '', blur = 0) {
  el.style.opacity = op; el.style.visibility = op <= 0.001 ? 'hidden' : 'visible';
  el.style.transform = tf; el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
}
// pop-in transform: from scale s0, y offset dy, blur
function popIn(t, t0, dur = .45, dy = 40, s0 = .85, bl = 14) {
  const p = P(t, t0, t0 + dur), e = back(p, 1.4), eb = eout(p);
  return { op: clamp(p * 2.2), y: (1 - e) * dy, s: lerp(s0, 1, e), b: (1 - eb) * bl };
}
function popOut(t, t0, dur = .35, dy = -50, bl = 14) {
  const p = P(t, t0, t0 + dur), e = ein(p);
  return { op: 1 - p, y: e * dy, s: 1 - .06 * e, b: e * bl };
}
function combine(a, b) { return { op: Math.min(a.op, b.op), y: a.y + b.y, s: a.s * b.s, b: a.b + b.b }; }
function apply(el, st, extra = '') { show(el, st.op, `translateY(${st.y.toFixed(2)}px) scale(${st.s.toFixed(4)}) ${extra}`, st.b); }
const inout = (t, a, b, o = {}) => combine(popIn(t, a, o.di || .45, o.dy || 40, o.s0 || .85, o.bl || 14), popOut(t, b, o.do || .35, o.ody || -50, o.bl || 14));

/* ---------- timing ---------- */
const FPS = 60, EX0 = 5.2052, EX1 = 11.0944;
const EXF0 = 313, EXF1 = 665;

/* ---------- captions ---------- */
const W = (w, s, e, c = '') => ({ w, s, e, c });
const CAPS = [
  [W('لوك', 0.0, .2), W('داون', .2, .52)],
  [W('النسخة', .52, .96), W('الرابعة', .96, 1.24), W('الجديدة', 1.24, 1.7)],
  [W('تتحرك', 1.7, 2.24), W('صفحة', 2.24, 2.58), W('عمل', 2.58, 2.84)],
  [W('داخل', 2.84, 3.14), W('After Effects', 3.14, 3.76, 'kw')],
  [W('للتراكنج', 3.76, 4.56), W('الاحترافي', 4.56, 5.1)],
  [W('وهذا', 5.1, 5.5), W('مثال', 5.5, 5.86), W('بسيط', 5.86, 6.22)],
  [W('بحيث', 6.22, 6.54), W('أن', 6.54, 6.68), W('اللوغو', 6.68, 7.1), W('يتحرك', 7.1, 7.56)],
  [W('مشابه', 7.56, 8.08), W('للواقع', 8.08, 8.66)],
  [W('لأنه', 8.66, 8.98), W('عملت', 8.98, 9.32), W('له', 9.32, 9.4), W('Mesh Tracking', 9.4, 10.08, 'kw')],
  [W('داخل', 10.08, 10.48), W('البلجن', 10.48, 10.92)],
  [W('اكتب', 10.92, 11.3), W('لي', 11.3, 11.42), W('أي', 11.42, 11.54), W('شيء', 11.54, 11.72)],
  [W('بالتعليقات', 11.72, 12.22, 'big')],
  [W('وبرسلها', 12.22, 12.66), W('لك', 12.66, 12.94), W('إياها', 12.94, 13.12)],
  [W('مباشرة', 13.12, 13.6), W('مجانًا', 13.6, 14.56, 'big')],
  [W('نسخة', 14.56, 15.1), W('Windows', 15.26, 15.46, 'kw'), W('و', 15.46, 16.0), W('Mac', 16.0, 16.18, 'kw')],
  [W('وهذه', 16.18, 16.94), W('أقوى', 16.94, 18.02, 'big'), W('بلجن', 18.02, 18.36)],
  [W('راح', 18.36, 18.5), W('تستخدمها', 18.5, 18.98), W('على', 18.98, 19.1), W('After Effects', 19.1, 19.86, 'kw')],
  [W('للـ', 19.86, 20.2), W('Mesh Tracking', 20.2, 21.4, 'kw')],
];
let capIdx = -1;
function renderCaps(t) {
  const cap = $('cap');
  let gi = -1;
  for (let i = 0; i < CAPS.length; i++) if (t >= CAPS[i][0].s - .06) gi = i;
  if (gi !== capIdx) {
    capIdx = gi; cap.innerHTML = '';
    if (gi >= 0) for (const w of CAPS[gi]) { const s = document.createElement('span'); s.className = 'w ' + w.c; s.textContent = w.w; cap.appendChild(s); }
  }
  if (gi < 0) return;
  const g = CAPS[gi], gEnd = gi + 1 < CAPS.length ? CAPS[gi + 1][0].s - .06 : 99;
  const out = P(t, gEnd - .1, gEnd);
  [...cap.children].forEach((el, k) => {
    const w = g[k];
    const pi = popIn(t, w.s - .05, .32, 34, .7, 12);
    const st = { op: pi.op * (1 - out), y: pi.y - out * 24, s: pi.s, b: pi.b + out * 8 };
    const active = t >= w.s - .03 && t < (k + 1 < g.length ? g[k + 1].s - .03 : gEnd);
    el.classList.toggle('act', active && !w.c.includes('kw'));
    let extra = '';
    if (active) { const ap = P(t, w.s - .03, w.s + .15); extra = `scale(${(1 + .08 * Math.sin(ap * Math.PI)).toFixed(4)})`; }
    apply(el, st, extra);
  });
}

/* ---------- background canvas ---------- */
const bg = $('bg'), bx = bg.getContext('2d');
const PAL = [ // time, [blob colors]
  [0, ['#00C27A', '#0A7CFF', '#00E5A8']],
  [2, ['#0A7CFF', '#00C2D6', '#2BFFA0']],
  [5.2, ['#00B37A', '#0E8FB0', '#2BFFA0']],
  [11.1, ['#6D28D9', '#2563EB', '#22D3EE']],
  [13.6, ['#F59E0B', '#2563EB', '#FB7185']],
  [14.6, ['#0EA5E9', '#2563EB', '#22D3EE']],
  [16.2, ['#00D68F', '#0EA5E9', '#2BFFA0']],
  [18.4, ['#00C27A', '#0A7CFF', '#2BFFA0']],
];
function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
function palAt(t) {
  let i = 0; while (i + 1 < PAL.length && t >= PAL[i + 1][0]) i++;
  const a = PAL[i], b = PAL[Math.min(i + 1, PAL.length - 1)];
  const p = b === a ? 0 : eio(P(t, b[0] - .6, b[0]));
  const A = i + 1 < PAL.length && t >= b[0] - .6 ? a : PAL[Math.max(0, i)];
  return A[1].map((c, k) => { const x = hex(c), y = hex(b[1][k]); return x.map((v, j) => Math.round(lerp(v, y[j], p))); });
}
function drawBg(t, meshAmp) {
  bx.setTransform(2, 0, 0, 2, 0, 0);
  bx.fillStyle = '#04060A'; bx.fillRect(0, 0, 1080, 1920);
  const cols = palAt(t);
  const blobs = [
    [540 + 260 * Math.sin(t * .35), 520 + 120 * Math.cos(t * .27), 760, cols[0], .55],
    [200 + 120 * Math.cos(t * .3), 1300 + 160 * Math.sin(t * .22), 700, cols[1], .45],
    [900 + 100 * Math.sin(t * .41 + 1), 1050 + 200 * Math.cos(t * .19), 620, cols[2], .35],
  ];
  bx.globalCompositeOperation = 'lighter';
  for (const [x, y, r, c, a] of blobs) {
    const g = bx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a * .55})`);
    g.addColorStop(.45, `rgba(${c[0]},${c[1]},${c[2]},${a * .18})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    bx.fillStyle = g; bx.fillRect(0, 0, 1080, 1920);
  }
  // perspective deforming mesh floor (the Lockdown motif)
  const c = cols[2];
  const hor = 1020, f = 640, camH = 1;
  const wave = (x, z) => meshAmp * (.10 * Math.sin(x * 2.1 + t * 1.6 + z * .7) + .07 * Math.cos(z * 1.9 - t * 1.2));
  const proj = (x, z) => { const y = wave(x, z); return [540 + x * f / z, hor + (camH - y) * f / z]; };
  const zN = 18, xN = 22;
  bx.lineWidth = 1.4;
  for (let i = 0; i <= zN; i++) {
    const z = 1 + i * .35; bx.beginPath();
    for (let j = 0; j <= 60; j++) { const x = -3.2 + 6.4 * j / 60; const [sx, sy] = proj(x, z); j ? bx.lineTo(sx, sy) : bx.moveTo(sx, sy); }
    bx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(.22 * (1 - i / zN)) * (.5 + .5 * meshAmp)})`; bx.stroke();
  }
  for (let j = 0; j <= xN; j++) {
    const x = -3.2 + 6.4 * j / xN; bx.beginPath();
    for (let i = 0; i <= 40; i++) { const z = 1 + (zN * .35) * i / 40; const [sx, sy] = proj(x, z); i ? bx.lineTo(sx, sy) : bx.moveTo(sx, sy); }
    const gr = bx.createLinearGradient(0, 1920, 0, hor + 40);
    gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${.2 * (.5 + .5 * meshAmp)})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    bx.strokeStyle = gr; bx.stroke();
  }
  // nodes on the mesh
  for (let i = 1; i < zN; i += 2) for (let j = 1; j < xN; j += 2) {
    const z = 1 + i * .35, x = -3.2 + 6.4 * j / xN; const [sx, sy] = proj(x, z);
    const tw = .5 + .5 * Math.sin(t * 3 + i * 1.3 + j * 2.1);
    bx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(.5 * (1 - i / zN)) * tw * (.4 + .6 * meshAmp)})`;
    bx.beginPath(); bx.arc(sx, sy, 2.6 * (1.4 - i / zN), 0, 7); bx.fill();
  }
  // particles
  for (let k = 0; k < 90; k++) {
    const sp = 20 + 60 * rnd(k + 3), x = rnd(k) * 1080 + 30 * Math.sin(t * .5 + k);
    const y = ((rnd(k + 7) * 2100 - t * sp) % 2100 + 2100) % 2100 - 90;
    const a = (.15 + .5 * rnd(k + 11)) * (.5 + .5 * Math.sin(t * 2 + k));
    const r = .8 + 2.2 * rnd(k + 5);
    bx.fillStyle = `rgba(200,255,230,${a * .6})`; bx.beginPath(); bx.arc(x, y, r, 0, 7); bx.fill();
  }
  bx.globalCompositeOperation = 'source-over';
}

/* ---------- grain ---------- */
const gc = $('grain'), gx = gc.getContext('2d'), gimg = gx.createImageData(540, 960);
function drawGrain(fi) {
  const d = gimg.data; let s = fi * 9301 + 49297;
  for (let i = 0; i < d.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const v = (s >> 16) & 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  gx.putImageData(gimg, 0, 0);
}

/* ---------- UI viewer canvas ---------- */
const vc = $('vc'), vx = vc.getContext('2d');
function drawViewer(t, prog) {
  vx.setTransform(2, 0, 0, 2, 0, 0); vx.clearRect(0, 0, 470, 380);
  const N = 7, cx = 235, cy = 190;
  const pt = (i, j) => {
    const u = i / (N - 1) - .5, v = j / (N - 1) - .5;
    const w1 = Math.sin(t * 2.2 + u * 3 + v * 2) * 10, w2 = Math.cos(t * 1.7 + v * 3.4) * 8;
    return [cx + u * 300 + w1 + v * 30 * Math.sin(t * 1.3), cy + v * 260 + w2 + u * 20 * Math.cos(t * 1.1)];
  };
  // attached "layer": colored patch on inner cells
  for (let i = 2; i < 4 + 1 - 1; i++) for (let j = 2; j < 4 + 1 - 1; j++) { }
  const a = pt(2, 2), b = pt(4, 2), c = pt(4, 4), d = pt(2, 4);
  vx.save(); vx.beginPath(); vx.moveTo(...a); vx.lineTo(...b); vx.lineTo(...c); vx.lineTo(...d); vx.closePath();
  const g = vx.createLinearGradient(a[0], a[1], c[0], c[1]); g.addColorStop(0, `rgba(43,255,160,${.15 + .55 * prog})`); g.addColorStop(1, `rgba(34,211,238,${.1 + .5 * prog})`);
  vx.fillStyle = g; vx.fill(); vx.restore();
  // lock glyph on patch
  const m = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
  vx.globalAlpha = .3 + .7 * prog; vx.strokeStyle = '#04060A'; vx.lineWidth = 5; vx.beginPath(); vx.arc(m[0], m[1] - 12, 13, Math.PI, 0); vx.stroke();
  vx.fillStyle = '#04060A'; vx.fillRect(m[0] - 20, m[1] - 12, 40, 30); vx.globalAlpha = 1;
  vx.lineWidth = 1.3;
  for (let i = 0; i < N; i++) {
    vx.beginPath(); for (let j = 0; j < N; j++) { const p = pt(i, j); j ? vx.lineTo(...p) : vx.moveTo(...p); }
    vx.strokeStyle = 'rgba(43,255,160,.45)'; vx.stroke();
    vx.beginPath(); for (let j = 0; j < N; j++) { const p = pt(j, i); j ? vx.lineTo(...p) : vx.moveTo(...p); }
    vx.stroke();
  }
  const total = N * N;
  for (let k = 0; k < total; k++) {
    const i = k % N, j = Math.floor(k / N), p = pt(i, j);
    const on = k < prog * total;
    vx.fillStyle = on ? '#2BFFA0' : 'rgba(255,255,255,.55)';
    vx.beginPath(); vx.arc(p[0], p[1], on ? 4.2 : 3, 0, 7); vx.fill();
    if (on) { vx.strokeStyle = 'rgba(43,255,160,.35)'; vx.beginPath(); vx.arc(p[0], p[1], 9, 0, 7); vx.stroke(); }
  }
  // crosshair
  vx.strokeStyle = 'rgba(255,255,255,.12)'; vx.beginPath(); vx.moveTo(235, 0); vx.lineTo(235, 380); vx.moveTo(0, 190); vx.lineTo(470, 190); vx.stroke();
}

/* ---------- mesh overlay on example ---------- */
const meshG = $('meshG');
const SVGNS = 'http://www.w3.org/2000/svg';
let meshBuilt = false; const meshLines = [], meshDots = [], meshQuad = [];
function buildMesh() {
  const n = MESH.nx;
  for (let k = 0; k < 2 * n; k++) { const pl = document.createElementNS(SVGNS, 'polyline'); pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', '#2BFFA0'); pl.setAttribute('stroke-width', '2.2'); pl.setAttribute('stroke-linecap', 'round'); meshG.appendChild(pl); meshLines.push(pl); }
  for (let k = 0; k < 4; k++) { const pl = document.createElementNS(SVGNS, 'polyline'); pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', '#E9FFF5'); pl.setAttribute('stroke-width', '4'); pl.setAttribute('stroke-linecap', 'round'); pl.setAttribute('stroke-linejoin', 'round'); meshG.appendChild(pl); meshQuad.push(pl); }
  for (let k = 0; k < n * n; k++) { const c = document.createElementNS(SVGNS, 'circle'); c.setAttribute('fill', '#2BFFA0'); c.setAttribute('stroke', '#04060A'); c.setAttribute('stroke-width', '1.5'); meshG.appendChild(c); meshDots.push(c); }
  meshG.setAttribute('filter', 'drop-shadow(0 0 6px rgba(43,255,160,.9))');
  meshBuilt = true;
}
function renderMesh(t, fi, pw, ph) {
  if (!meshBuilt) buildMesh();
  $('meshSvg').setAttribute('viewBox', `0 0 ${pw} ${ph}`);
  const fr = MESH.frames[String(clamp(fi, EXF0, EXF1))]; const n = MESH.nx;
  const reticle = env(t, 6.62, 10.95, .25, .25), grid = env(t, 8.95, 10.95, .2, .25);
  meshG.style.opacity = Math.max(reticle, grid);
  if (!fr || Math.max(reticle, grid) <= 0) return;
  const pt = k => [fr[k][0] * pw, fr[k][1] * ph];
  // grid lines drawn progressively
  const gp = eout(P(t, 8.98, 9.7));
  for (let r = 0; r < n; r++) {
    const row = [], col = [];
    for (let c = 0; c < n; c++) { row.push(pt(r * n + c)); col.push(pt(c * n + r)); }
    const lim = Math.max(0, gp * (n + 2) - r * .3);
    const cut = (arr) => { const m = Math.min(arr.length - 1, lim); const out = []; for (let k = 0; k <= Math.floor(m); k++) out.push(arr[k]); const f = m - Math.floor(m); if (Math.floor(m) < arr.length - 1 && f > 0) { const a = arr[Math.floor(m)], b = arr[Math.floor(m) + 1]; out.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f)]); } return out; };
    meshLines[r].setAttribute('points', cut(row).map(p => p.join(',')).join(' '));
    meshLines[n + r].setAttribute('points', cut(col).map(p => p.join(',')).join(' '));
    meshLines[r].style.opacity = meshLines[n + r].style.opacity = grid * .85;
  }
  for (let k = 0; k < n * n; k++) {
    const [x, y] = pt(k); const d = meshDots[k];
    const pp = back(P(t, 9.0 + (k % n + Math.floor(k / n)) * .035, 9.25 + (k % n + Math.floor(k / n)) * .035), 2.2);
    d.setAttribute('cx', x); d.setAttribute('cy', y); d.setAttribute('r', (5.5 * pp * (1 + .15 * Math.sin(t * 8 + k))).toFixed(2));
    d.style.opacity = grid;
  }
  // reticle: corner brackets around outer quad
  const corners = [pt(0), pt(n - 1), pt(n * n - 1), pt(n * (n - 1))];
  const rp = eout5(P(t, 6.66, 7.05)), L = .22;
  for (let k = 0; k < 4; k++) {
    const c = corners[k], a = corners[(k + 3) % 4], b = corners[(k + 1) % 4];
    const ex = (q) => [lerp(c[0], q[0], L), lerp(c[1], q[1], L)];
    // scale toward center when appearing
    const cen = [(corners[0][0] + corners[2][0]) / 2, (corners[0][1] + corners[2][1]) / 2], sc = lerp(1.6, 1, rp);
    const S = p => [cen[0] + (p[0] - cen[0]) * sc, cen[1] + (p[1] - cen[1]) * sc];
    meshQuad[k].setAttribute('points', [S(ex(a)), S(c), S(ex(b))].map(p => p.join(',')).join(' '));
    meshQuad[k].style.opacity = reticle * rp;
  }
}

/* ---------- title ---------- */
const tWord = $('tWord');
'LOCKDOWN'.split('').forEach(ch => { const s = document.createElement('span'); s.textContent = ch; tWord.appendChild(s); });
function renderTitle(t) {
  const title = $('title');
  // two appearances: intro [0,2.1] and end [18.35, end]
  let base, letterT0, fourT, pillsOn, endMode = t > 15;
  if (!endMode) { letterT0 = .06; fourT = .93; }
  else { letterT0 = 18.38; fourT = 18.85; }
  const vis = endMode ? env(t, 18.3, 99, .01, .01) : 1 - P(t, 1.72, 2.08);
  if (vis <= 0) { title.style.visibility = 'hidden'; } else title.style.visibility = 'visible';
  const exitP = endMode ? 0 : eio(P(t, 1.68, 2.08));
  style(title, { opacity: 1 - exitP, transform: `translateY(${-90 * exitP}px) scale(${1 - .08 * exitP})`, filter: exitP > .01 ? `blur(${12 * exitP}px)` : 'none' });
  [...tWord.children].forEach((s, i) => {
    const pi = popIn(t, letterT0 + i * .05, .5, 70, .6, 18);
    s.style.opacity = pi.op; s.style.transform = `translateY(${pi.y}px) scale(${pi.s}) rotateX(${(1 - eout(P(t, letterT0 + i * .05, letterT0 + i * .05 + .5))) * 70}deg)`;
    s.style.filter = pi.b > .1 ? `blur(${pi.b}px)` : 'none';
  });
  const fp = P(t, fourT, fourT + .55), fe = back(fp, 2.4);
  const four = $('tFour');
  show(four, clamp(fp * 4), `scale(${lerp(2.6, 1, fe)}) rotate(${(1 - eout(fp)) * -12}deg)`, (1 - eout(fp)) * 20);
  const pills = $('tPills');
  if (!endMode) { const a = popIn(t, .95, .4, 30, .8, 10), b = popIn(t, 1.22, .4, 30, .6, 10); apply($('verPill'), a); apply($('newPill'), b); pills.style.opacity = 1; }
  else pills.style.opacity = 0;
  const es = $('endSub'); if (endMode) apply(es, popIn(t, 19.0, .5, 30, .9, 10)); else show(es, 0);
}

/* ---------- portal geometry ---------- */
const KF = [ // t, cx, cy, w, h, radius-fraction(0.5=circle)
  [0.00, 540, 1010, 600, 600, .5],
  [1.70, 540, 1010, 600, 600, .5],
  [2.15, 540, 1170, 440, 440, .5],
  [4.92, 540, 1170, 440, 440, .5],
  [5.38, 540, 860, 896, 560, 40 / 560],
  [10.92, 540, 860, 896, 560, 40 / 560],
  [11.38, 540, 1170, 440, 440, .5],
  [18.30, 540, 1170, 440, 440, .5],
  [18.85, 540, 1080, 520, 520, .5],
  [99, 540, 1080, 520, 520, .5],
];
function portalAt(t) {
  let i = 0; while (i + 1 < KF.length && t >= KF[i + 1][0]) i++;
  const a = KF[i], b = KF[i + 1] || a; const p = eio(P(t, a[0], b[0]));
  const r = [1, 2, 3, 4].map(k => lerp(a[k], b[k], p));
  // radius: interpolate in px
  const ra = a[5] * Math.min(a[3], a[4]), rb = b[5] * Math.min(b[3], b[4]);
  return { cx: r[0], cy: r[1], w: r[2], h: r[3], rad: lerp(ra, rb, p), morph: (a[3] !== b[3] || a[4] !== b[4]) && b[0] - a[0] < 1 ? p : 0 };
}

const imgCache = {};
function setImg(el, src) { if (el._src === src) return null; el._src = src; el.src = src; return el.decode().catch(() => { }); }

/* ---------- main ---------- */
window.renderFrame = async function (t) {
  const fi = Math.round(t * FPS);
  const waits = [];
  // camera
  const punch = (t0, a = .035, d = .5) => { const p = P(t, t0, t0 + d); return p > 0 && p < 1 ? a * Math.sin(p * Math.PI) * (1 - p) : 0; };
  const shake = (t0, a, d) => { const p = P(t, t0, t0 + d); if (p <= 0 || p >= 1) return [0, 0]; const k = a * (1 - p) * (1 - p); return [k * Math.sin(t * 95), k * Math.cos(t * 83)]; };
  let sc = 1 + .012 * Math.sin(t * .4) + punch(.93, .04) + punch(5.2, .05, .6) + punch(11.09, .04, .6) + punch(16.94, .06, .6) + punch(13.6, .03);
  const sh = [shake(.95, 7, .45), shake(16.95, 14, .6), shake(5.21, 6, .35), shake(13.62, 6, .4)].reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
  $('stage').style.transform = `translate(${sh[0].toFixed(2)}px,${sh[1].toFixed(2)}px) scale(${sc.toFixed(4)})`;

  // background
  const meshAmp = .45 + .55 * Math.max(env(t, 3.7, 5.2, .4, .4), env(t, 19.8, 30, .6, .1), env(t, 0, 1.8, .01, .5));
  drawBg(t, meshAmp);
  drawGrain(fi);

  // example background
  const exOn = env(t, 5.05, 11.35, .4, .4);
  show($('exBg'), exOn * .95, `scale(${1.05 + .03 * Math.sin(t * .5)})`); $('exDim').style.opacity = exOn;
  if (exOn > 0) { const w = setImg($('exBg'), `../seq/exbg/${String(clamp(fi, EXF0, EXF1)).padStart(5, '0')}.jpg`); if (w) waits.push(w); }

  renderTitle(t);

  // UI window
  const win = $('win');
  apply(win, inout(t, 2.08, 4.88, { di: .5, dy: 80, s0: .9, bl: 16, do: .32 }));
  if (t > 2 && t < 5.3) {
    const prog = eio(P(t, 3.76, 4.85));
    drawViewer(t, prog);
    $('progFill').style.width = (prog * 100).toFixed(1) + '%';
    $('progPct').textContent = Math.round(prog * 100) + '%';
    $('pPts').textContent = Math.round(prog * 49);
    $('pSt').textContent = t < 3.76 ? 'Ready' : prog < 1 ? 'Tracking…' : 'Locked ✓';
  }
  const ae = $('ae');
  const aep = inout(t, 3.12, 4.86, { di: .5, dy: 60, s0: .3, bl: 10 });
  style(ae, { left: '800px', top: '258px' }); apply(ae, aep, `rotate(${(1 - back(P(t, 3.12, 3.62), 2)) * -25}deg)`);

  // example header + chips
  apply($('exHead'), inout(t, 5.3, 10.85, { dy: -40, s0: .9 }));
  apply($('c1'), inout(t, 7.56, 10.85, { s0: .6 }));
  apply($('c2'), inout(t, 9.4, 10.85, { s0: .6 }));

  // CTA
  const cmt = $('cmt');
  apply(cmt, inout(t, 11.12, 14.45, { di: .5, dy: 80, s0: .9, bl: 16 }));
  if (t > 11 && t < 14.9) {
    const msg = 'أبي البلجن 🔥'; const chars = [...msg];
    const n = Math.floor(chars.length * P(t, 11.22, 11.66));
    const typed = $('typed');
    const posted = t >= 11.74;
    typed.className = 't' + ((n === 0 || posted) ? ' ph' : '');
    typed.innerHTML = (n === 0 || posted ? 'أضف تعليقًا…' : chars.slice(0, n).join('')) + (!posted && Math.floor(t * 4) % 2 === 0 ? '<span id="caret"></span>' : '');
    $('send').style.transform = `scale(${1 - .18 * Math.sin(Math.PI * P(t, 11.66, 11.82))})`;
    apply($('posted'), popIn(t, 11.74, .45, 40, .8, 10));
    $('postedT').textContent = msg;
    apply($('hrt'), popIn(t, 12.0, .35, 0, .2, 0));
    apply($('dmBubble'), popIn(t, 12.62, .45, 30, .6, 10));
    apply($('seen'), popIn(t, 13.12, .35, 14, .9, 6));
    show($('input'), 1 - P(t, 13.38, 13.55), '');
    // paper plane flight
    const pp = P(t, 12.2, 12.68), pl = $('plane');
    if (pp > 0 && pp < 1) {
      const e = eio(pp), x = lerp(205, 600, e), y = lerp(830, 590, e) - Math.sin(e * Math.PI) * 160;
      show(pl, Math.sin(pp * Math.PI) * 1.4, `rotate(${-20 + e * 30}deg) scale(${1 + .4 * Math.sin(pp * Math.PI)})`);
      style(pl, { left: (x - 35) + 'px', top: (y - 35) + 'px' });
    } else show(pl, 0);
    const fr = $('free');
    const fpp = P(t, 13.58, 14.1);
    show(fr, Math.min(clamp(fpp * 5), 1 - P(t, 14.4, 14.7)), `scale(${lerp(2.4, 1, back(fpp, 2.2))}) rotate(${(1 - eout(fpp)) * 8 - 4}deg)`, (1 - eout(fpp)) * 18);
  } else { show($('plane'), 0); show($('free'), 0); }
  $('cmt').style.display = (t > 11 && t < 14.9) ? 'block' : 'none';
  $('win').style.display = (t > 2 && t < 5.3) ? 'block' : 'none';
  $('exHead').style.display = $('chips').style.display = (t > 5.2 && t < 11.3) ? '' : 'none';

  // OS tiles
  apply($('osW'), inout(t, 15.18, 16.2, { dy: 80, s0: .6, bl: 12 }), `rotate(${(1 - back(P(t, 15.18, 15.63), 1.6)) * -8}deg)`);
  apply($('osM'), inout(t, 15.92, 16.2, { dy: 80, s0: .6, bl: 12, di: .4 }), `rotate(${(1 - back(P(t, 15.92, 16.32), 1.6)) * 8}deg)`);

  // power
  const pw = $('power');
  const pwv = env(t, 16.85, 18.45, .05, .3);
  pw.style.display = pwv > 0 ? 'block' : 'none';
  if (pwv > 0) {
    const sp = P(t, 16.92, 17.4);
    show($('powTxt'), clamp(sp * 6) * (1 - P(t, 18.2, 18.45)), `scale(${lerp(3, 1, back(sp, 1.8))})`, (1 - eout(sp)) * 26 + P(t, 18.2, 18.45) * 16);
    apply($('powSub'), combine(popIn(t, 17.3, .4, 20, .9, 8), popOut(t, 18.15, .3)));
    apply($('meter'), combine(popIn(t, 17.35, .4, 20, .9, 8), popOut(t, 18.15, .3)));
    $('meterFill').style.width = (eio(P(t, 17.4, 18.0)) * 100) + '%';
  }
  // shockwaves + flash
  const shocks = [[.95, 540, 430], [16.95, 540, 470], [13.62, 540, 780]];
  let sk = null; for (const s of shocks) if (t >= s[0] && t < s[0] + .7) sk = s;
  const shock = $('shock');
  if (sk) { const p = P(t, sk[0], sk[0] + .7), r = lerp(40, 760, eout(p)); style(shock, { left: (sk[1] - r) + 'px', top: (sk[2] - r) + 'px', width: 2 * r + 'px', height: 2 * r + 'px', opacity: (1 - p) * .9, borderWidth: (10 * (1 - p) + 1) + 'px', visibility: 'visible' }); }
  else shock.style.visibility = 'hidden';
  const fl = [.93, 5.2052, 11.0944, 16.94, 13.6].map(t0 => { const p = P(t, t0 - .04, t0 + .35); return p > 0 && p < 1 ? (p < .12 ? p / .12 : 1 - (p - .12) / .88) : 0; });
  $('flash').style.opacity = Math.max(fl[0] * .8, fl[1] * .55, fl[2] * .55, fl[3] * .9, fl[4] * .5);

  // portal
  const g = portalAt(t);
  const portal = $('portal');
  const ent = back(P(t, .02, .6), 1.5), entOp = clamp(P(t, 0, .25));
  const w = g.w * ent, h = g.h * ent;
  style(portal, { left: (g.cx - w / 2) + 'px', top: (g.cy - h / 2) + 'px', width: w + 'px', height: h + 'px', borderRadius: (g.rad * ent) + 'px', opacity: entOp,
    boxShadow: `0 0 0 3px rgba(43,255,160,.75), 0 0 60px rgba(43,255,160,.35), 0 40px 90px rgba(0,0,0,.6)` });
  const floatY = 0;
  const useEx = t >= EX0 && t < EX1;
  const fImg = $('faceImg'), eImg = $('exImg');
  if (useEx) { const p = setImg(eImg, `../seq/ex/${String(clamp(fi, EXF0, EXF1)).padStart(5, '0')}.jpg`); if (p) waits.push(p); eImg.style.opacity = 1; fImg.style.opacity = 0; }
  else { const p = setImg(fImg, `../seq/face/${String(clamp(fi, 0, 1281)).padStart(5, '0')}.jpg`); if (p) waits.push(p); fImg.style.opacity = 1; eImg.style.opacity = 0; }
  const cardOn = env(t, 5.3, 10.95, .3, .2);
  ['hud1', 'hud2', 'hud3', 'hud4'].forEach((id, k) => { const p = back(P(t, 5.4 + k * .05, 5.8 + k * .05), 2); const el = $(id); el.style.opacity = cardOn * clamp(p * 3); el.style.transform = `scale(${lerp(1.8, 1, p)})`; });
  const scP = P(t, 5.45, 6.35); const scan = $('scan'); scan.style.top = lerp(-120, h, eio(scP)) + 'px'; scan.style.opacity = scP > 0 && scP < 1 ? 1 : 0;
  $('portalFlash').style.opacity = Math.max(fl[1], fl[2]) * .85;
  if (t > 6.5 && t < 11.1) { $('meshSvg').style.visibility = 'visible'; renderMesh(t, fi, w, h); } else $('meshSvg').style.visibility = 'hidden';

  // ring around circle
  const ringVis = Math.min(env(t, .25, 4.95, .5, .2), 1) + env(t, 11.2, 99, .5, .01);
  const ring = $('ring'), rs = g.w * 1.3 * ent;
  style(ring, { left: (g.cx - rs / 2) + 'px', top: (g.cy - rs / 2) + 'px', width: rs + 'px', height: rs + 'px', opacity: ringVis * entOp, visibility: ringVis > 0 ? 'visible' : 'hidden' });
  $('ctext').setAttribute('transform', `rotate(${(t * 14) % 360} 500 500)`);
  $('ticks').setAttribute('transform', `rotate(${(-t * 22) % 360} 500 500)`);
  $('ringC').setAttribute('transform', `rotate(${(t * 40) % 360} 500 500)`);
  const pg = $('portalGlow'), gs = Math.max(w, h) * 1.5;
  style(pg, { left: (g.cx - gs / 2) + 'px', top: (g.cy - gs / 2) + 'px', width: gs + 'px', height: gs + 'px', opacity: entOp * .9,
    background: `radial-gradient(circle, rgba(43,255,160,${.22 + .08 * Math.sin(t * 2.5)}) 0%, rgba(34,211,238,.08) 45%, transparent 68%)`, borderRadius: '50%' });

  renderCaps(t);
  await Promise.all(waits);
};
window.ready = document.fonts.ready.then(() => true);
