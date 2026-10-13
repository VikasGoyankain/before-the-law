/* Jumps straight to old age and photographs the ending beat by beat.
   The scene clock is frozen and stepped (window.__freeze / __advance), so
   each frame is the exact moment named, however slow the renderer is.
   Usage: node shoot-end.mjs [--mobile]   ->  e-*.png / em-*.png */
import puppeteer from 'puppeteer';
import path from 'path';
import { pathToFileURL } from 'url';

const MOBILE = process.argv.includes('--mobile');
const file = pathToFileURL(path.resolve('../before-the-law-3d.html')).href;
const browser = await puppeteer.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--mute-audio'],
});
const page = await browser.newPage();
if (MOBILE) {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
} else await page.setViewport({ width: 1100, height: 690 });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const tag = MOBILE ? 'em' : 'e';
const shot = n => page.screenshot({ path: `${tag}-${n}.png`, type: 'png' });
let sceneT = 0;
async function advanceTo(sec) {
  await page.evaluate(d => { window.__advance = d; }, sec - sceneT);
  await page.waitForFunction('!(window.__advance > 0.001)', { timeout: 120000, polling: 50 });
  sceneT = sec;
}

await page.goto(file, { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction('window.__frames > 10', { timeout: 60000 });
await page.click('#begin');
await sleep(300);
await page.evaluate(() => __game.skipWalk());
await page.waitForFunction('__game.ready()', { timeout: 120000 });
await page.evaluate(() => __game.debugAge());
await sleep(4000);
await shot('0-aged'); console.log('aged ok');

/* from here the scene is driven directly, with the game's timers out of it */
await page.evaluate(() => { window.__freeze = true; window.__advance = 0; document.getElementById('ui').style.display = 'none'; });
await page.evaluate(() => __game.scene.bendDown());
await advanceTo(4.5);
await shot('1-bend'); console.log('bend ok');

await page.evaluate(() => __game.scene.endSequence());
sceneT = 0;
for (const [i, at] of [[2, 1.5], [3, 3.4], [4, 4.6], [5, 6.0], [6, 9.0]]) {
  await advanceTo(at);
  await shot(`${i}-end`);
  console.log(`${tag}-${i}-end.png  scene t=${at}s`);
}
console.log(errs.length ? errs.join('\n') : 'no page errors');
await browser.close();
