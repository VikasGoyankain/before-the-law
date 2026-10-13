import puppeteer from 'puppeteer';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const p2 = require('path');
const b = await puppeteer.launch({ headless: true,
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl',
         '--autoplay-policy=no-user-gesture-required','--mute-audio'] });

for (const f of ['index.html', 'for-teachers.html', 'before-the-law.html', 'before-the-law-text.html', 'imperial-message.html', 'imperial-message-text.html']) {
  const page = await b.newPage();
  const external = [], errs = [];
  page.on('request', r => { const u = r.url(); if (!u.startsWith('file:') && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u); });
  page.on('requestfailed', r => errs.push('REQFAIL ' + r.url()));
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto(pathToFileURL(p2.resolve('../dist/' + f)).href, { waitUntil: 'load', timeout: 60000 });
  await new Promise(r => setTimeout(r, 9000));
  const ok = await page.evaluate(() => ({
    title: document.title,
    choices: document.querySelectorAll('#choices button').length,
    canvas: !!document.querySelector('#view canvas'),
    links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => !/^(#|https?:)/.test(h)).join(' '),
  }));
  console.log(`${f.padEnd(15)} title=${JSON.stringify(ok.title)} choices=${ok.choices} canvas=${ok.canvas}${ok.links ? " links=" + ok.links : ""}`);
  console.log(`  external network requests: ${external.length}${external.length ? ' -> ' + external.join(', ') : '  (none)'}`);
  console.log(`  errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  await page.close();
}
await b.close();
