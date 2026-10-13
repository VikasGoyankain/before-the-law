/* Photographs every first-person pose, so the views from the man's eyes can
   be checked for framing.  node shoot-pov.mjs  ->  pov-*.png */
import puppeteer from 'puppeteer';
import path from 'path';
import { pathToFileURL } from 'url';
const file = pathToFileURL(path.resolve('../before-the-law-3d.html')).href;
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 900000,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 880, height: 550 });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
await page.goto(file, { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction('window.__frames > 5', { timeout: 60000 });
await page.evaluate(() => { document.getElementById('intro').hidden = true; window.__freeze = true; window.__advance = 0; });
const E = (fn, ...a) => page.evaluate(fn, ...a);
const advance = async s => { await E(d => { window.__advance = d; }, s); await page.waitForFunction('!(window.__advance > 0.001)', { timeout: 300000, polling: 100 }); };
const only = process.argv.slice(2);
const SHOTS = [
  ['stand', 1], ['seat', 2], ['pile', 2], ['marksLook', 2], ['rise', 2], ['study', 2], ['peer', 1],
  ['aged', 3], ['strain', 3], ['bend', 3],
];
await E(() => { __game.scene.showStool(true); __game.scene.setYears(20); __game.scene.startMarks(); __game.scene.setYears(30); });
for (const [pose, st] of SHOTS) {
  if (only.length && !only.includes(pose)) continue;
  await E((p, s) => { __game.scene.snap(s); __game.scene.placeAt(p); if (p === 'bend') __game.scene.bendDown(); }, pose, st);
  await advance(pose === 'bend' ? 4.5 : 1.5);
  await page.screenshot({ path: `pov-${pose}.png` });
  console.log('shot', pose);
}
console.log(errs.length ? errs.join('\n') : 'no page errors');
await browser.close();
