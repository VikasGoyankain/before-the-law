/* Stills of the hub page (dist/index.html): one per section at desktop width,
   the dedication gate shut and open, and a phone-width full page. Also reports
   network requests, errors and sideways overflow.
   Usage: node shoot-hub.mjs [outDir] */
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(process.argv[2] || here);
fs.mkdirSync(out, { recursive: true });
const url = pathToFileURL(path.join(here, '../dist/index.html')).href;
const wait = ms => new Promise(r => setTimeout(r, ms));

const b = await puppeteer.launch({ headless: true });
const external = [], errs = [];
const open = async (w, h) => {
  const page = await b.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  page.on('request', r => { const u = r.url(); if (!u.startsWith('file:') && !u.startsWith('data:')) external.push(u); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto(url, { waitUntil: 'load' });
  return page;
};
const jump = (page, id) => page.evaluate(i => document.getElementById(i).scrollIntoView({ behavior: 'instant' }), id);
/* scroll the whole page once so every reveal has fired */
const sweep = async page => {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) { await page.evaluate(v => window.scrollTo(0, v), y); await wait(120); }
};

const desk = await open(1280, 800);
await wait(2600);
await desk.screenshot({ path: path.join(out, 'hub-0-top.png') });
await desk.evaluate(() => window.scrollTo(0, 620));
await wait(400);
await desk.screenshot({ path: path.join(out, 'hub-0b-name.png') });
const ids = ['gift', 'readings', 'why', 'scholar', 'honours', 'road', 'lighthouse', 'shelf', 'doors'];
for (let i = 0; i < ids.length; i++) {
  await jump(desk, ids[i]);
  await wait(1900);
  await desk.screenshot({ path: path.join(out, `hub-${i + 1}-${ids[i]}.png`) });
  if (ids[i] === 'gift') {
    await desk.evaluate(() => window.scrollBy(0, 700));
    await wait(1500);
    await desk.screenshot({ path: path.join(out, 'hub-1b-tagore.png') });
    await desk.evaluate(() => window.scrollBy(0, 640));
    await wait(1500);
    await desk.screenshot({ path: path.join(out, 'hub-1c-vow.png') });
  }
  if (ids[i] === 'why') {
    await desk.evaluate(() => window.scrollBy(0, 690));
    await wait(1500);
    await desk.screenshot({ path: path.join(out, 'hub-why-b.png') });
  }
  if (ids[i] === 'scholar') {
    await desk.evaluate(() => window.scrollBy(0, 720));
    await wait(1500);
    await desk.screenshot({ path: path.join(out, 'hub-2b-elements.png') });
  }
}
await jump(desk, 'dedication');
await wait(1500);
await jump(desk, 'plaque');
await wait(250);
await desk.screenshot({ path: path.join(out, 'hub-8-gate-shut.png') });
await wait(8000);
await desk.screenshot({ path: path.join(out, 'hub-9-gate-open.png') });
const info = await desk.evaluate(() => ({
  opened: document.getElementById('plaque').classList.contains('open'),
  overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => !/^(#|https?:)/.test(h)).join(' '),
  outside: [...document.querySelectorAll('a[href^="http"]')].length,
}));

const phone = await open(375, 812);
await wait(1200);
await sweep(phone);
await wait(4500);
await phone.evaluate(() => window.scrollTo(0, 0));
await wait(400);
await phone.screenshot({ path: path.join(out, 'hub-phone.png'), fullPage: true });
for (const id of ['gift', 'why', 'scholar', 'road', 'shelf', 'doors', 'plaque']) {
  await jump(phone, id);
  await wait(500);
  await phone.screenshot({ path: path.join(out, 'hub-phone-' + id + '.png') });
}
await phone.evaluate(() => window.scrollTo(0, 0));
await wait(300);
await phone.screenshot({ path: path.join(out, 'hub-phone-top.png') });
const phoneHidden = await phone.evaluate(() => [...document.querySelectorAll('.rv')].filter(e => !e.classList.contains('on')).length);
const phoneOverflow = await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

console.log('gate opened:', info.opened, '| blocks never revealed after a full scroll (phone):', phoneHidden);
console.log('sideways overflow (desktop, phone):', info.overflowX, phoneOverflow);
console.log('local links:', info.links, '| outside links:', info.outside);
console.log('external network requests:', external.length ? external.join(', ') : 'none');
console.log('errors:', errs.length ? errs.join(' | ') : 'none');
await b.close();
