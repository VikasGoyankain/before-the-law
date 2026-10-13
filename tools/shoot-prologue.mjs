/* Photographs the four prologue shots on a frozen, stepped clock.
   Usage: node shoot-prologue.mjs [--mobile]  ->  pr-*.png */
import puppeteer from 'puppeteer';
import path from 'path';
import { pathToFileURL } from 'url';

const MOBILE = process.argv.includes('--mobile');
const file = pathToFileURL(path.resolve('../before-the-law-3d.html')).href;
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 900000,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--mute-audio'] });
const page = await browser.newPage();
if (MOBILE) await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
else await page.setViewport({ width: 1100, height: 690 });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
const tag = MOBILE ? 'prm' : 'pr';
await page.goto(file, { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction('window.__frames > 5', { timeout: 60000 });
await page.evaluate(() => { window.__freeze = true; window.__advance = 0; });
const advance = async s => {
  await page.evaluate(d => { window.__advance = d; }, s);
  await page.waitForFunction('!(window.__advance > 0.001)', { timeout: 300000, polling: 100 });
};
for (const [n, name, extra, secs] of [[0, 'village', null, 8], [1, 'man', null, 6], [2, 'pack', 'items', 6], [3, 'road', null, 10], [3, 'road-night', 'night', 14]]) {
  await page.evaluate((n, e) => __game.debugPrologue(n, e), n, extra);
  await advance(secs);
  await page.screenshot({ path: `${tag}-${n}-${name}.png` });
  console.log('shot', name);
}
console.log(errs.length ? errs.join('\n') : 'no page errors');
await browser.close();
