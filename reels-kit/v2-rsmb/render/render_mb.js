// Adaptive temporal-supersampling motion blur renderer (contiguous chunks, backward-difference probe).
// usage: node render_mb.js <outDir> <a-b> <workers> [shutterFrames=0.75]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [outDir, spec, wS, shS] = process.argv.slice(2);
  const workers = +(wS || 4), SHF = +(shS || .75), SH = SHF / 60;
  const subDir = path.join(outDir, 'sub'); fs.mkdirSync(subDir, { recursive: true });
  const [a, b] = spec.split('-').map(Number);
  const exists = f => { const n = String(f).padStart(5, '0'); return fs.existsSync(path.join(outDir, n + '.jpg')) || fs.existsSync(path.join(subDir, n + '.done')); };
  const all = []; for (let i = a; i <= b; i++) all.push(i);
  const per = Math.ceil(all.length / workers);
  const chunks = Array.from({ length: workers }, (_, k) => all.slice(k * per, (k + 1) * per));
  const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none'] });
  const url = 'file://' + path.join(__dirname, 'index.html');
  const t0 = Date.now(); let done = 0, shots = 0;
  const log = fs.createWriteStream(path.join(outDir, 'samples.log'), { flags: 'a' });
  const diff = (ra, rb) => {
    if (!ra || ra.length !== rb.length) return 30;
    let disp = 0;
    for (let i = 0; i < ra.length; i++) { const p = ra[i], q = rb[i]; if (!p || !q) continue;
      const d = Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]), Math.abs(p[0] + p[2] - q[0] - q[2]), Math.abs(p[1] + p[3] - q[1] - q[3]));
      if (d > disp && d < 2500) disp = d; }
    return disp;
  };
  await Promise.all(chunks.map(async list => {
    if (!list.length) return;
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
    page.on('pageerror', e => console.error('PAGEERR', e.message));
    await page.goto(url); await page.evaluate(() => window.ready);
    let prev = await page.evaluate(async t => { await window.renderFrame(t); return window.probeRects(); }, (list[0] - 1) / 60);
    for (const f of list) {
      const t = f / 60, name = String(f).padStart(5, '0');
      const cur = await page.evaluate(async t => { await window.renderFrame(t); return window.probeRects(); }, t);
      const disp = diff(prev, cur) * SHF; prev = cur;
      if (exists(f)) { done++; continue; }
      const n = disp < 1.5 ? 1 : Math.max(3, Math.min(24, Math.ceil(disp / 2.5)));
      log.write(`${f} ${n} ${disp.toFixed(1)}\n`);
      if (n === 1) {
        await page.screenshot({ path: path.join(subDir, `${name}_00.png`), type: 'png' }); shots++;
        fs.writeFileSync(path.join(subDir, name + '.done'), '1');
      } else {
        for (let k = 0; k < n; k++) {
          const tk = t - SH / 2 + SH * (k + .5) / n;
          await page.evaluate(t => window.renderFrame(t), tk);
          await page.screenshot({ path: path.join(subDir, `${name}_${String(k).padStart(2, '0')}.png`), type: 'png' }); shots++;
        }
        fs.writeFileSync(path.join(subDir, name + '.done'), String(n));
        await page.evaluate(t => window.renderFrame(t), t);
      }
      if (++done % 100 === 0) console.log(done, '/', all.length, 'shots', shots, ((Date.now() - t0) / done).toFixed(0) + 'ms/f');
    }
    await page.close();
  }));
  await browser.close(); log.end();
  console.log('done', all.length, 'frames', shots, 'shots in', ((Date.now() - t0) / 1000).toFixed(1), 's');
})();
