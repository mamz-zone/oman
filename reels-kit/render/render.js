// usage: node render.js <outDir> <dsf> <fmt:png|jpeg> <frames: "a-b" or comma list> [workers]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [outDir, dsfS, fmt, spec, wS] = process.argv.slice(2);
  const dsf = +dsfS, workers = +(wS || 1);
  fs.mkdirSync(outDir, { recursive: true });
  let frames = [];
  for (const part of spec.split(',')) { if (part.includes('-')) { const [a, b] = part.split('-').map(Number); for (let i = a; i <= b; i++) frames.push(i); } else frames.push(+part); }
  frames = frames.filter(f => !fs.existsSync(path.join(outDir, `${String(f).padStart(5, '0')}.${fmt === 'png' ? 'png' : 'jpg'}`)));
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb', '--font-render-hinting=none'] });
  const url = 'file://' + path.join(__dirname, 'index.html');
  const chunks = Array.from({ length: workers }, (_, k) => frames.filter((_, i) => i % workers === k));
  const t0 = Date.now(); let done = 0;
  await Promise.all(chunks.map(async list => {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: dsf });
    page.on('pageerror', e => console.error('PAGEERR', e.message));
    await page.goto(url); await page.evaluate(() => window.ready);
    // warm up sequentially from earliest frame for caption state
    for (const f of list) {
      await page.evaluate(t => window.renderFrame(t), f / 60);
      const file = path.join(outDir, `${String(f).padStart(5, '0')}.${fmt === 'png' ? 'png' : 'jpg'}`);
      await page.screenshot(fmt === 'png' ? { path: file, type: 'png' } : { path: file, type: 'jpeg', quality: 100 });
      if (++done % 50 === 0) console.log(done, '/', frames.length, ((Date.now() - t0) / done).toFixed(0) + 'ms/f');
    }
    await page.close();
  }));
  await browser.close();
  console.log('done', frames.length, 'frames in', ((Date.now() - t0) / 1000).toFixed(1), 's');
})();
