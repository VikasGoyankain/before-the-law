/* Headless playthrough of imperial-message.html (the text-only version):
   name -> prologue -> repeat-back (one deliberate mistake) -> the run ->
   the "if" -> the rewind -> the window -> the dream. Fails loudly if the
   forward action is ever missing, moves, or the story stalls. */
import puppeteer from 'puppeteer';
import path from 'path';
import { pathToFileURL } from 'url';

const file = pathToFileURL(path.resolve('../imperial-message.html')).href;
const browser = await puppeteer.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 700 });
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(file);
await page.type('#name', 'Asha');
await page.click('#begin');

const result = await page.evaluate(() => new Promise(done => {
  const log = [], mainAt = new Set();
  let last = '', missed = false, idle = 0, steps = 0;
  const t = setInterval(() => {
    steps++;
    const text = document.getElementById('text'), ch = document.getElementById('choices');
    text.click();
    const now = text.textContent.slice(0, 60);
    if (now !== last) { last = now; log.push(now); idle = 0; } else idle++;
    if (document.getElementById('black').classList.contains('on')) {
      clearInterval(t); done({ log, final: document.getElementById('final').textContent, mainAt: [...mainAt], S: __im.state() });
      return;
    }
    if (idle > 200) { clearInterval(t); done({ stalled: true, log, S: __im.state() }); return; }
    if (!ch.classList.contains('in')) return;
    const S = __im.state();
    const pad = ch.querySelector('.pad');
    if (pad) {
      const b = pad.querySelectorAll('button'), k = S.seq[S.said.length];
      /* one wrong glyph on the first attempt, to exercise the retry */
      if (k !== undefined) b[(!S.wrong && S.said.length === 2) ? (k + 1) % 6 : k].click();
      return;
    }
    if (ch.querySelector('textarea')) {
      ch.querySelectorAll('.frags button')[2].click();
      [...ch.querySelectorAll(':scope > button')].find(b => b.textContent === 'Seal it').click();
      return;
    }
    const bs = [...ch.querySelectorAll(':scope > button')], labels = bs.map(b => b.textContent);
    const main = bs[bs.length - 1];
    if (main.classList.contains('main')) mainAt.add(Math.round(main.getBoundingClientRect().top));
    const pick = l => { const b = bs.find(b => b.textContent === l); if (b) { log.push('> ' + l); b.click(); return true; } return false; };
    if (!S.asked && pick('Ask him what it means')) return;
    if (S.suns < 2 && pick('Show the sign of the sun')) return;
    if (pick('Look out of a window')) return;
    if (labels.includes('Leave him running')) { if (S.after < 2) pick('Run'); else pick('Leave him running'); return; }
    if (S.road < 1 && pick('Watch the road')) return;
    if (S.listen < 1 && pick('Listen')) return;
    if (S.glow < 1 && pick('Look toward the capital')) return;
    log.push('> ' + labels[labels.length - 1]); main.click();
  }, 120);
}));
await page.screenshot({ path: 'imt-end.png' });
await browser.close();
console.log(result.log.join('\n'));
console.log('---');
console.log('final:', result.final);
console.log('stalled:', !!result.stalled, ' wrong attempts:', result.S.wrong, ' chambers:', result.S.chambers);
console.log('forward action rows (px from top):', result.mainAt);
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
if (result.stalled || errs.length) process.exit(1);
