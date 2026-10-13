/* Photographs the doorkeeper, the halls vision, the stool scene and the man
   ageing, on a frozen, stepped clock.  node shoot-new.mjs  ->  n-*.png */
import puppeteer from 'puppeteer';
import path from 'path';
import { pathToFileURL } from 'url';
const file = pathToFileURL(path.resolve('../before-the-law-3d.html')).href;
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 900000,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 690 });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
await page.goto(file, { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction('window.__frames > 5', { timeout: 60000 });
await page.evaluate(() => { document.getElementById('intro').hidden = true; window.__freeze = true; window.__advance = 0; });
const E = (fn, ...a) => page.evaluate(fn, ...a);
const advance = async s => { await E(d => { window.__advance = d; }, s); await page.waitForFunction('!(window.__advance > 0.001)', { timeout: 300000, polling: 100 }); };
const shot = async n => { await page.screenshot({ path: `n-${n}.png` }); console.log('shot', n); };

await E(() => __game.scene.placeAt('stand')); await advance(2); await shot('1-keeper');
await E(() => __game.scene.approach(false, 1, () => {})); await advance(9); await shot('2-keeper-close');
await E(() => { __game.scene.lookIntoHall(); __game.scene.imagine(true); }); await advance(9); await shot('3-halls');
await E(() => { __game.scene.imagine(false); __game.scene.lookAtKeeper(); }); await advance(4);
await E(() => __game.scene.giveStool(false, () => { window.__sat = true; }));
for (const [t, n] of [[1.8, '4-stool-turn'], [1.2, '5-stool-reach'], [2.0, '6-stool-carry'], [2.4, '7-stool-down'], [3.5, '8-seated']]) { await advance(t); await shot(n); }
for (const [y, n] of [[8, '9-age-8'], [26, '10-age-26'], [44, '11-age-44']]) {
  await E(y => { __game.scene.setYears(y); __game.scene.timelapse(1, true); }, y);
  await advance(1.2); await shot(n); await advance(3);
}
console.log('sat:', await E(() => !!window.__sat));
console.log(errs.length ? errs.join('\n') : 'no page errors');
await browser.close();
