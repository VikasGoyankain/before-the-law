/* Stills and checks for the two site pages built here:
     dist/index.html             the home page, games first
     dist/acknowledgements.html  the tribute, with its gate that opens
   At desktop and phone width. Reports whether both Play buttons are on the
   first screen, network requests, errors and sideways overflow.
   Usage: node shoot-hub.mjs [outDir] */
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(process.argv[2] || here);
fs.mkdirSync(out, { recursive: true });
const url = f => pathToFileURL(path.join(here, '../dist/' + f)).href;
const wait = ms => new Promise(r => setTimeout(r, ms));

const b = await puppeteer.launch({ headless: true });
const external = [], errs = [], fail = [];
const open = async (f, w, h) => {
  const page = await b.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  page.on('request', r => { const u = r.url(); if (!u.startsWith('file:') && !u.startsWith('data:')) external.push(u); });
  page.on('pageerror', e => errs.push(f + ' PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(f + ' CONSOLE ' + m.text()); });
  await page.goto(url(f), { waitUntil: 'load' });
  return page;
};
const shot = (page, name, full) => page.screenshot({ path: path.join(out, name + '.png'), fullPage: !!full });
const jump = (page, id) => page.evaluate(i => document.getElementById(i).scrollIntoView({ behavior: 'instant' }), id);
const sweep = async page => {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) { await page.evaluate(v => window.scrollTo(0, v), y); await wait(120); }
  await page.evaluate(() => window.scrollTo(0, 0));
};
const overflow = page => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const check = (ok, what) => { console.log((ok ? '  ok    ' : '  FAIL  ') + what); if (!ok) fail.push(what); };
/* where the Play buttons sit when the page first opens */
const plays = page => page.evaluate(() => [...document.querySelectorAll('.card a.play')].map(a => Math.round(a.getBoundingClientRect().bottom)));

console.log('home page');
for (const [tag, w, h] of [['desk', 1280, 800], ['laptop', 1366, 768], ['phone', 375, 812]]) {
  const page = await open('index.html', w, h);
  await wait(1800);
  const p = await plays(page);
  if (tag === 'phone') check(p[0] <= h, `phone: the first Play button is on the first screen (bottom edge ${p[0]}px of ${h})`);
  else check(p.length === 2 && p.every(y => y <= h), `${tag} ${w}x${h}: both Play buttons are on the first screen (bottom edges ${p.join(', ')}px)`);
  check(await overflow(page) === 0, `${tag}: no sideways scroll`);
  await shot(page, 'home-' + tag + '-top');
  if (tag === 'desk') for (const id of ['how', 'why']) { await jump(page, id); await wait(500); await shot(page, 'home-desk-' + id); }
  if (tag === 'phone') await shot(page, 'home-phone-full', true);
  const first = await page.evaluate(() => ({ h1: document.querySelector('h1').textContent, games: [...document.querySelectorAll('.card h2')].map(e => e.textContent),
    ack: !!document.querySelector('.way a[href^="acknowledgements.html"]') && !!document.querySelector('footer a[href^="acknowledgements.html"]'),
    noTribute: !document.querySelector('.medal, #dedication, #gift') }));
  if (tag === 'desk') {
    check(first.games.join(' | ') === 'Before the Law | An Imperial Message', 'the games are listed first: ' + first.games.join(', '));
    check(first.noTribute, 'the tribute is no longer on the home page');
    check(first.ack, 'the acknowledgements are linked from the bar and the footer');
  }
  await page.close();
}

console.log('acknowledgements');
for (const [tag, w, h] of [['desk', 1280, 800], ['phone', 375, 812]]) {
  const page = await open('acknowledgements.html', w, h);
  await wait(2200);
  await shot(page, 'ack-' + tag + '-top');
  if (tag === 'desk') {
    for (const id of ['gift', 'scholar', 'honours', 'road', 'lighthouse', 'shelf', 'doors']) { await jump(page, id); await wait(1600); await shot(page, 'ack-desk-' + id); }
    await jump(page, 'plaque'); await wait(250); await shot(page, 'ack-desk-gate-shut');
    await wait(8000); await shot(page, 'ack-desk-gate-open');
    check(await page.evaluate(() => document.getElementById('plaque').classList.contains('open')), 'the dedication gate opens');
    check(await page.evaluate(() => [...document.querySelectorAll('a[href^="index.html"]')].length >= 2), 'links back to the games');
  } else {
    await sweep(page); await wait(4500);
    check(await page.evaluate(() => [...document.querySelectorAll('.rv')].every(e => e.classList.contains('on'))), 'phone: every section reveals after a full scroll');
    await shot(page, 'ack-phone-full', true);
  }
  check(await overflow(page) === 0, `${tag}: no sideways scroll`);
  await page.close();
}

check(!external.length, 'no network requests' + (external.length ? ': ' + external.join(', ') : ''));
check(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
await b.close();
if (fail.length) { console.log('FAILED: ' + fail.length); process.exit(1); }
console.log('all checks passed');
