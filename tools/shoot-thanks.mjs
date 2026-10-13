/* Layout check for the acknowledgement on each game's end screen. It puts the
   four dist pages into their end state directly (the classes the ending sets),
   so it is quick; play.mjs and play-im.mjs reach the same screen by playing.
   Usage: node shoot-thanks.mjs [outDir] */
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(process.argv[2] || here);
fs.mkdirSync(out, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
const FINAL = {
  'before-the-law': 'You were there <b>41</b> years. The gate was never locked.',
  'imperial-message': 'The message never arrived. It was never going to.<span class="dreamt">&#8220;Live as though it had arrived.&#8221;</span>That is the only version there is. Nobody else ever wrote it, not Kafka and not this game. You did.',
};

const b = await puppeteer.launch({ headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--mute-audio'] });
let bad = 0;
for (const f of ['before-the-law', 'before-the-law-text', 'imperial-message', 'imperial-message-text']) {
  for (const [tag, w, h] of [['desk', 1280, 720], ['phone', 375, 700]]) {
    const page = await b.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(pathToFileURL(path.join(here, '../dist/' + f + '.html')).href, { waitUntil: 'load', timeout: 60000 });
    await wait(1500);
    await page.evaluate(html => {
      const $ = id => document.getElementById(id);
      if ($('intro')) $('intro').style.display = 'none';
      $('black').classList.add('on');
      $('final').innerHTML = html; $('final').classList.add('in');
      document.querySelectorAll('#after button, #again, #toReflect, #toHome, #home, #thanks').forEach(e => e.classList.add('in'));
    }, FINAL[f.replace('-text', '')]);
    /* the 3D pages render a frame a second in SwiftShader, so wait on the fade itself */
    await page.waitForFunction(() => +getComputedStyle(document.getElementById('thanks')).opacity > 0.99, { timeout: 60000 }).catch(() => {});
    await wait(600);
    const r = await page.evaluate(() => {
      const t = document.getElementById('thanks'), home = document.querySelector('a[href="index.html"]#toHome, a[href="index.html"]#home, #after a[href="index.html"], #toHub');
      const box = e => e.getBoundingClientRect();
      const shown = e => !!e && +getComputedStyle(e).opacity > 0.99 && getComputedStyle(e).pointerEvents !== 'none';
      const all = [document.getElementById('final'), t, home].filter(Boolean).map(box);
      return {
        thanks: !!t && +getComputedStyle(t).opacity > 0.99,
        names: !!t && /Prasannanshu/.test(t.textContent) && /LLB26057/.test(t.textContent),
        home: shown(home), homeLabel: home ? home.textContent.trim() : '',
        fits: all.every(r => r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth),
      };
    });
    const ok = r.thanks && r.names && r.home && r.fits && !errs.length;
    if (!ok) bad++;
    console.log((f + ' ' + tag).padEnd(30), ok ? 'ok ' : 'FAIL', JSON.stringify(r), errs.length ? errs.join(' | ') : '');
    await page.screenshot({ path: path.join(out, 'thanks-' + f + '-' + tag + '.png') });
    await page.close();
  }
}
await b.close();
if (bad) process.exit(1);
