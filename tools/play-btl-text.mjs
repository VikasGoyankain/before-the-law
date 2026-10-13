/* Headless playthrough of before-the-law.html (the text-only version), from
   the first line to the end screen and through "Begin again".
   Its pauses are real time with nothing to hurry them, so the page's timers
   are run faster here; the logic they drive is untouched.
   Fails loudly if Enter is ever missing, not last or disabled, if the story
   stalls, or if the ending, the acknowledgement or the restart is wrong.
   Usage: node play-btl-text.mjs [file]     (default ../before-the-law.html) */
import puppeteer from 'puppeteer';
import path from 'path';
import { pathToFileURL } from 'url';

const file = pathToFileURL(path.resolve(process.argv[2] || '../before-the-law.html')).href;
const browser = await puppeteer.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 700 });
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.evaluateOnNewDocument(() => {
  const real = window.setTimeout;
  window.setTimeout = (fn, ms, ...a) => real(fn, (ms || 0) / 15, ...a);
});
await page.goto(file);

const r = await page.evaluate(() => new Promise(done => {
  const $ = id => document.getElementById(id);
  const ch = $('choices'), black = $('black');
  const log = [], enterAt = new Set(), bad = [];
  /* stage 1 costs a year a turn; after that, studying is the quickest way to grow old */
  const plan = ['Ask to be admitted', 'Look through the gate', 'Enter', 'Ask to be admitted', 'Offer him what you have', 'Study the doorkeeper', 'Enter'];
  let turn = 0, idle = 0, waiting = false, triedOld = false;
  const t = setInterval(() => {
    if (black.classList.contains('on')) { clearInterval(t); done({ log, enterAt: [...enterAt], bad, years: $('years').textContent }); return; }
    if (++idle > 1500) { clearInterval(t); done({ stalled: true, log, bad }); return; }
    const open = ch.classList.contains('in');
    if (!open) { waiting = false; return; }
    if (waiting) return;
    const bs = [...ch.querySelectorAll('button')], labels = bs.map(b => b.textContent);
    if (!bs.length) return;
    const last = bs[bs.length - 1];
    if (last.textContent !== 'Enter' || !last.classList.contains('enter')) bad.push('Enter is not the last choice: ' + labels.join(' | '));
    if (last.disabled) bad.push('Enter is disabled at ' + $('years').textContent);
    enterAt.add(Math.round(last.getBoundingClientRect().bottom));
    let want;
    if (labels.length === 2) { want = triedOld ? labels[0] : 'Enter'; triedOld = true; }   /* old age: try the gate once, then ask */
    else want = plan[turn] && labels.includes(plan[turn]) ? plan[turn] : labels.includes('Study the doorkeeper') ? 'Study the doorkeeper' : labels[0];
    turn++;
    log.push($('years').textContent.padStart(8) + '  > ' + want.padEnd(40) + ' Enter at ' + Math.round(last.getBoundingClientRect().bottom) + ', page scrolled ' + Math.round(window.scrollY));
    bs[labels.indexOf(want)].click();
    waiting = true; idle = 0;
  }, 40);
}));

const fail = [...(r.bad || [])];
if (r.stalled) fail.push('the story stalled');
let end = {};
if (!r.stalled) {
  await page.waitForFunction(() => document.getElementById('thanks').classList.contains('in'), { timeout: 30000 }).catch(() => fail.push('the acknowledgement never appeared'));
  end = await page.evaluate(() => {
    const $ = id => document.getElementById(id);
    return { final: $('final').textContent, thanks: $('thanks').textContent.replace(/\s+/g, ' ').trim(),
      again: $('again').classList.contains('in'), home: $('home').classList.contains('in'), href: $('home').getAttribute('href') };
  });
  const m = /^You were there (\d+) years\. The gate was never locked\.$/.exec(end.final);
  if (!m) fail.push('unexpected final line: ' + end.final);
  else if (+m[1] < 40) fail.push('ended at ' + m[1] + ' years, before old age');
  else if (!r.years.startsWith(m[1] + ' ')) fail.push('final line says ' + m[1] + ' years but the counter says ' + r.years);
  if (!/Prasannanshu/.test(end.thanks)) fail.push('the acknowledgement does not name him');
  if (!end.again || !end.home || !/^index\.html/.test(end.href)) fail.push('end-screen links are wrong: ' + JSON.stringify(end));
  await page.screenshot({ path: 'bt-end.png' });
  /* Begin again must bring back the first scene, at nought years */
  await page.click('#again');
  await page.waitForFunction(() => !document.getElementById('black').classList.contains('on') &&
    document.getElementById('choices').classList.contains('in') && document.getElementById('years').textContent === '0 years', { timeout: 30000 })
    .catch(() => fail.push('Begin again did not return to the start'));
}
await browser.close();

console.log((r.log || []).join('\n'));
console.log('---');
console.log('final:', end.final);
console.log('turns:', (r.log || []).length, ' Enter present, last and enabled on every turn:', !(r.bad || []).length);
console.log('Enter button bottom edge (px from top):', r.enterAt);
console.log('restart:', fail.includes('Begin again did not return to the start') ? 'FAILED' : 'ok');
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
if (fail.length) console.log('FAILED:\n  ' + fail.join('\n  '));
if (fail.length || errs.length) process.exit(1);
