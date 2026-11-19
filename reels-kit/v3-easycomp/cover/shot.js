const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--force-color-profile=srgb'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: +process.argv[3] });
  p.on('pageerror', e => console.error('PAGEERR', e.message));
  await p.goto('file://' + __dirname + '/cover.html'); await p.evaluate(() => window.ready); await p.waitForTimeout(300);
  await p.screenshot({ path: process.argv[2], type: 'png' }); await b.close(); })();
