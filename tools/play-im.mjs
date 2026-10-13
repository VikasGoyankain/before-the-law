/* Headless playthrough of imperial-message-3d.html, start to finish:
   title -> deathbed (listen, one wrong repeat, then right) -> the chambers
   (push, the sun, the window) -> the open field -> "if" (stairs, courtyard,
   second palace) -> thousands of years -> the gate -> "never" -> back in the
   chambers -> your window -> the dream -> the end -> reflection.
   SwiftShader draws about a frame a second, so distance is skipped by moving
   the messenger along (st.s) rather than by holding Run for real; Run is
   still held throughout, and its button is checked wherever it is shown:
   same pixel, never disabled. Shots land in tools/ as ip-*.png. */
import puppeteer from 'puppeteer';
import path from 'path';
import { pathToFileURL } from 'url';

const file = pathToFileURL(path.resolve('../imperial-message-3d.html')).href;
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 1800000,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 800, height: 500 });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const G = (fn, a) => page.evaluate(fn, a);
const until = (fn, arg, ms = 600000) => page.waitForFunction(fn, { timeout: ms, polling: 300 }, arg);
const shot = n => page.screenshot({ path: 'ip-' + n + '.png' });
const t0 = Date.now();
const log = m => console.log(((Date.now() - t0) / 1000).toFixed(0).padStart(5) + 's  ' + m);
const runAt = [];
async function checkRun(where) {
  const r = await G(() => __game.runButton());
  if (r.shown) runAt.push({ where, ...r });
}

await page.goto(file, { waitUntil: 'load', timeout: 120000 });
await until('window.__frames > 2');
await page.type('#name', 'Asha');
await page.click('#begin');
/* hurry every line: the text is under test, not the reading speed */
await G(() => { window.__hurryT = setInterval(() => __game.hurry(), 400); });
await sleep(3000);
await shot('01-window');
await G(() => __game.skipPrologue());
log('prologue skipped');

await until(() => __game.choicesIn() && __game.labels().includes('Kneel by the bed'));
await shot('02-court');
await G(() => __game.choose('Kneel by the bed'));
await until(() => __game.phase() === 'listen');
log('listening');
await G(() => __game.hold(true));
await until(() => __game.padIn());
await G(() => __game.hold(false));
await shot('03-pad');
/* one wrong answer first: he must whisper it again, not fail you */
await G(() => { const s = __game.seq(); for (const k of s) __game.press((k + 1) % 6); });
await until(() => __game.phase() === 'listen');
log('wrong answer -> listening again (attempt ' + await G(() => __game.state().attempts) + ')');
await G(() => __game.hold(true));
await until(() => __game.padIn());
await G(() => { __game.hold(false); for (const k of __game.seq()) __game.press(k); });
await until(() => __game.choicesIn() && __game.labels().includes('Go'));
log('he nodded');
await G(() => __game.choose('Ask him what it means'));
await until(() => __game.phase() === 'run', null, 900000);
log('run');
await G(() => __game.hold(true));
await sleep(4000);
await checkRun('run');
await shot('04-run');

/* walk him through the chambers: push, show the sun at the knot, look out of the window */
async function to(s) { await G(s => { __game.palace.st.s = s; }, s); await sleep(2500); }
for (let c = 1; c <= 9; c++) {
  await to(14 * c + 1);
  if (c === 2) { await G(() => { __game.push(-1); __game.push(1); __game.push(-1); }); await sleep(1500); await G(() => __game.sun()); await sleep(2500); await shot('05-sun'); }
  if (c === 3) { await G(() => { __game.sun(); }); await sleep(800); await G(() => { __game.sun(); }); }
  if (c === 5) { await to(14 * 5 + 7); await G(() => __game.lookOut()); await sleep(5000); await shot('06-roofs'); }
  if (c === 7) { await sleep(3000); await shot('07-bell'); }
  await checkRun('chamber ' + c);
  log('chamber ' + c + '  phase=' + await G(() => __game.phase()));
}
await to(14 * 10 + 1);
await until(() => __game.phase() === 'field');
log('open field');
await sleep(6000);
await shot('08-field');
await until(() => __game.phase() === 'if', null, 900000);
log('if');
/* stairs, courtyard, the second palace, and through it */
for (let i = 0; i < 40; i++) {
  const st = await G(() => ({ phase: __game.phase(), stage: __game.state().ifStage, s: __game.palace.st.s, seg: __game.palace.segAt(__game.palace.st.s).type }));
  if (st.stage === 'millennia' || st.phase !== 'if') break;
  if (i === 3) await shot('09-stairs');
  if (st.seg === 'court' && !(await G(() => window.__shotCourt))) { await sleep(9000); await shot('10-courtyard'); await G(() => { window.__shotCourt = 1; }); }
  await checkRun('if:' + st.seg);
  await G(() => { __game.palace.st.s += 9; });
  await sleep(2500);
}
log('millennia');
await sleep(12000);
await checkRun('millennia');
await shot('11-millennia');
await until(() => __game.capital.st.mode === 'approach' && __game.stage.current() === __game.capital, null, 900000);
log('the gate');
await sleep(2000);
await checkRun('gate');
await shot('12-gate');
await G(() => { __game.capital.st.s = 125; });
await until(() => __game.capital.st.mode === 'behold');
await sleep(4000);
await shot('13-never');
await until(() => __game.phase() === 'after', null, 900000);
log('back in the chambers');
await sleep(3000);
await checkRun('after');
await shot('14-after');
for (let c = 1; c <= 3; c++) { await G(() => { const p = __game.palace; p.st.s = p.segAt(p.st.s).s0 + 14 + 1; }); await sleep(3500); }
await until(() => __game.choicesIn() && __game.labels().includes('Leave him running'));
await G(() => __game.hold(false));
await G(() => __game.choose('Leave him running'));
await sleep(5000);
await shot('15-pullback');
await until(() => __game.phase() === 'window', null, 900000);
await until(() => __game.choicesIn());
log('your window');
await shot('16-window');
for (const c of ['Watch the road', 'Listen', 'Look toward the capital']) {
  await G(c => __game.choose(c), c);
  await sleep(1500);
  await until(() => __game.choicesIn());
}
await shot('17-road');
await G(() => __game.choose('Dream the message'));
await until(() => __game.dreamIn());
await sleep(1500);
await shot('18-dream');
await G(() => __game.seal('Live as though it had arrived.'));
await until(() => window.__ended === true, null, 900000);
await sleep(9000);
await shot('19-end');
await G(() => document.getElementById('toReflect').click());
await sleep(1500);
await shot('20-reflect');
const rec = await G(() => ({ rec: __game.record(), insights: window.__insights, final: document.getElementById('final').textContent }));
log('done');
console.log('record:', JSON.stringify(rec.rec));
console.log('insights:', rec.insights.join(', '));
console.log('final:', rec.final);
const spots = [...new Set(runAt.map(r => r.x + ',' + r.y))];
console.log('Run button: ' + runAt.length + ' checks, positions ' + spots.join(' | ') + ', disabled ever: ' + runAt.some(r => r.disabled));
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
await browser.close();
if (errs.length || spots.length !== 1 || runAt.some(r => r.disabled)) process.exit(1);
