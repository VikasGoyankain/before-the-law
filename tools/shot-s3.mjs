import puppeteer from 'puppeteer';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const file = pathToFileURL(require('path').resolve('../before-the-law-3d.html')).href;
const MOBILE = process.argv.includes('--mobile');
const b = await puppeteer.launch({ headless: true,
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl'] });
const p = await b.newPage();
if (MOBILE) { await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'); }
else await p.setViewport({ width: 1280, height: 800 });
await p.goto(file, { waitUntil: 'load', timeout: 60000 });
await p.waitForFunction('window.__game && window.__game.ready()', { timeout: 90000 });
/* jump the clock rather than replay three minutes of real pacing */
await p.evaluate(() => { window.__game.state().years = 39; });
await p.evaluate(() => window.__game.press('Enter'));
await p.waitForFunction('window.__game.stageOf() === 3 && window.__game.ready()', { timeout: 120000 });
await new Promise(r => setTimeout(r, 1200));
await p.screenshot({ path: MOBILE ? 'fix-m-s3.png' : 'fix-g-s3.png' });
console.log('shot', MOBILE ? 'fix-m-s3.png' : 'fix-g-s3.png', '| years:', await p.evaluate(()=>window.__game.state().years));
await b.close();
