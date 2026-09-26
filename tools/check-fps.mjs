import puppeteer from 'puppeteer';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const base = pathToFileURL(require('path').resolve('../before-the-law-3d.html')).href;
const b = await puppeteer.launch({ headless: true,
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl'] });
for (const [label, url, mobile] of [
  ['default (no param)', base, false],
  ['?debug=fps        ', base + '?debug=fps', false],
  ['?debug=fps mobile ', base + '?debug=fps', true],
]) {
  const p = await b.newPage();
  if (mobile) { await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'); }
  else await p.setViewport({ width: 1280, height: 800 });
  await p.goto(url, { waitUntil: 'load', timeout: 60000 });
  await new Promise(r => setTimeout(r, 5000));
  const r = await p.evaluate(() => {
    const el = document.getElementById('fpsdbg');
    return { present: !!el, text: el ? el.textContent : null };
  });
  console.log(label, '-> overlay present:', r.present);
  if (r.text) console.log(r.text.split('\n').map(l => '      ' + l).join('\n'));
  if (mobile && r.present) await p.screenshot({ path: 'fps-overlay-mobile.png' });
  await p.close();
}
await b.close();
