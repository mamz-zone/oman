// Adaptive temporal-supersampling motion blur renderer.
// Shared block queue, one browser per worker, crash-safe: a crashed/hung page is relaunched and the frame retried.
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
  const BLK = 40, queue = [];
  for (let i = 0; i < all.length; i += BLK) { const blk = all.slice(i, i + BLK); if (blk.some(f => !exists(f))) queue.push(blk); }
  console.log('blocks to render', queue.length);
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
  await Promise.all(Array.from({ length: workers }, async (_, wid) => {
    let browser = null, page = null;
    const open = async () => {
      try { if (browser) await browser.close(); } catch (e) { }
      browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none'] });
      page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
      page.setDefaultTimeout(120000);
      page.on('pageerror', e => console.error('PAGEERR', e.message));
      await page.goto(url); await page.evaluate(() => window.ready);
    };
    const render = t => page.evaluate(async t => { await window.renderFrame(t); return window.probeRects(); }, t);
    await open();
    let blocks = 0;
    while (queue.length) {
      const list = queue.shift();
      if (blocks++ % 2 === 0 && blocks > 1) await open(); // recycle the browser every 2 blocks
      let prev = null;
      for (const f of list) {
        const t = f / 60, name = String(f).padStart(5, '0');
        for (let attempt = 0; ; attempt++) {
          try {
            if (!prev) prev = await render((f - 1) / 60);
            const cur = await render(t);
            const disp = diff(prev, cur) * SHF; prev = cur;
            if (exists(f)) break;
            const n = disp < 2.5 ? 1 : Math.max(3, Math.min(12, Math.ceil(disp / 4)));
            if (n === 1) {
              await page.screenshot({ path: path.join(outDir, name + '.tmp.jpg'), type: 'jpeg', quality: 100 }); shots++;
              fs.renameSync(path.join(outDir, name + '.tmp.jpg'), path.join(outDir, name + '.jpg'));
            } else {
              for (let k = 0; k < n; k++) {
                const tk = t - SH / 2 + SH * (k + .5) / n;
                await page.evaluate(t => window.renderFrame(t), tk);
                await page.screenshot({ path: path.join(subDir, `${name}_${String(k).padStart(2, '0')}.png`), type: 'png' }); shots++;
              }
              fs.writeFileSync(path.join(subDir, name + '.done'), String(n));
              prev = await render(t); // restore exact frame-t state for the next probe
            }
            log.write(`${f} ${n} ${disp.toFixed(1)}\n`);
            break;
          } catch (e) {
            console.error(`worker ${wid} frame ${f} attempt ${attempt}: ${e.message.split('\n')[0]}`);
            if (attempt >= 5) throw e;
            prev = null; await new Promise(r => setTimeout(r, 2000)); await open();
          }
        }
        if (++done % 100 === 0) console.log(done, '/', all.length, 'shots', shots, ((Date.now() - t0) / done).toFixed(0) + 'ms/f');
      }
    }
    try { await browser.close(); } catch (e) { }
  }));
  log.end();
  console.log('done', all.length, 'frames', shots, 'shots in', ((Date.now() - t0) / 1000).toFixed(1), 's');
})();
