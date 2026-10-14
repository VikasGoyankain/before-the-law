/* Classroom-board check. Opens the published pages the way an interactive flat
   panel does: 1920x1080, touch only, no keyboard or mouse.
   It checks that board mode comes on by itself, that it enlarges the page,
   that the setting follows the links into the games, and that each game can
   be started and played by touch: tapping a choice in Before the Law, and
   holding Run and tapping Push in An Imperial Message.
   Usage: node shoot-board.mjs [outDir]    ->  board-*.png */
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(process.argv[2] || here);
fs.mkdirSync(out, { recursive: true });
const url = f => pathToFileURL(path.join(here, '../dist/' + f)).href;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const b = await puppeteer.launch({ headless: true, protocolTimeout: 900000,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist',
    '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const page = await b.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1, hasTouch: true });
const errs = [], fail = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
const G = (fn, ...a) => page.evaluate(fn, ...a);
const until = (fn, ms = 240000, ...a) => page.waitForFunction(fn, { timeout: ms, polling: 250 }, ...a);
const shot = n => page.screenshot({ path: path.join(out, 'board-' + n + '.png') });
const check = (ok, what) => { console.log((ok ? '  ok    ' : '  FAIL  ') + what); if (!ok) fail.push(what); };
/* a finger on the middle of an element */
const tap = async sel => {
  const r = await G(s => { const e = document.querySelector(s).getBoundingClientRect(); return { x: e.left + e.width / 2, y: e.top + e.height / 2 }; }, sel);
  await page.touchscreen.tap(r.x, r.y);
};
const size = sel => G(s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), font: parseFloat(getComputedStyle(e).fontSize), left: Math.round(r.left), bottom: Math.round(innerHeight - r.bottom) }; }, sel);
const board = () => G(() => ({ on: document.documentElement.classList.contains('board'), root: parseFloat(getComputedStyle(document.documentElement).fontSize) }));

/* ---- the home page: no setting given, so it has to notice the board itself ---- */
console.log('home page');
await page.goto(url('index.html'), { waitUntil: 'load' });
await sleep(2500);
let s = await board();
check(s.on && s.root >= 23, 'board mode came on by itself, root size ' + s.root + 'px (16 off a board)');
check(await G(() => !!document.querySelector('.way [data-board]') && /on$/.test(document.querySelector('.way [data-board]').textContent)), 'the toggle is in the bar and reads "on"');
check(await G(() => [...document.querySelectorAll('.card a.play')].every(a => /\?board=1$/.test(a.getAttribute('href')))), 'the Play links carry ?board=1');
check(await G(() => document.documentElement.scrollWidth <= innerWidth), 'no sideways scroll');
await shot('1-home');
await G(() => document.getElementById('how').scrollIntoView({ behavior: 'instant' }));
await sleep(1500);
await shot('2-how');

/* ---- the teachers' page ---- */
console.log('for teachers');
await page.goto(url('for-teachers.html'), { waitUntil: 'load' });
await sleep(800);
s = await board();
check(s.on, 'board mode is on (remembered from the home page)');
check(await G(() => document.documentElement.scrollWidth <= innerWidth), 'no sideways scroll');
await shot('3-teachers');

/* ---- Before the Law ---- */
console.log('Before the Law');
await page.goto(url('before-the-law.html') + '?board=1', { waitUntil: 'load', timeout: 120000 });
await until('window.__frames > 5');
s = await board();
check(s.on && s.root >= 23, 'board mode is on, root size ' + s.root + 'px');
check(await G(() => { const c = document.querySelector('#view canvas'); return c.width <= 1920; }), 'the 3D picture is drawn no wider than 1920 pixels');
await shot('4-btl-title');
await tap('#begin');
await until(() => __game.phase() !== 'intro', 20000).catch(() => {});
check(await G(() => __game.phase() !== 'intro'), 'Begin answers a tap');
await G(() => { window.__h = setInterval(() => __game.hurry(), 400); __game.skipPrologue(); });
await until(() => __game.phase() === 'walk');
/* touch and hold to walk */
const steps = () => G(() => ((window.__audio && window.__audio.log) || []).filter(e => e.cue === 'step').length);
const st0 = await steps();
await page.touchscreen.touchStart(960, 500);
await until(n => ((window.__audio && window.__audio.log) || []).filter(e => e.cue === 'step').length >= n + 2, 120000, st0).catch(() => {});
await page.touchscreen.touchEnd();
check(await steps() >= st0 + 2, 'touching and holding walks him: ' + (await steps() - st0) + ' footsteps');
await G(() => __game.skipWalk());
await until(() => __game.ready());
const btn = await size('#choices button'), text = await size('#text .line'), set = await size('#settings');
check(btn.h >= 48 && btn.font >= 17, 'choices are finger-sized: ' + btn.h + 'px tall, ' + btn.font + 'px type');
check(text.font >= 23, 'story text is ' + text.font + 'px');
check(set.left < 60 && set.bottom < 60, 'the small controls sit in the bottom-left corner');
check(await G(() => { const l = __game.labels(); return l[l.length - 1] === 'Enter'; }), 'Enter is the last choice');
await shot('5-btl-choices');
const before = await G(() => __game.state().years);
await tap('#choices button');
await until(() => !document.getElementById('choices').classList.contains('in'), 20000).catch(() => {});
await until(() => __game.ready());
const after = await G(() => __game.state().years);
check(after > before, 'tapping a choice plays it: ' + before + ' -> ' + after + ' years');
check(await G(() => !!document.querySelector('#settings [data-fs]') && getComputedStyle(document.querySelector('#settings [data-fs]')).display !== 'none'), 'a Full screen button is offered');
await shot('6-btl-after');

/* ---- An Imperial Message ---- */
console.log('An Imperial Message');
/* the software renderer used for tests cannot draw the palace at board size in
   useful time, so this part asks for the lighter picture; layout and touch are the same */
await page.goto(url('imperial-message.html') + '?board=1&low=1', { waitUntil: 'load', timeout: 120000 });
await until('window.__frames > 2');
s = await board();
check(s.on && s.root >= 23, 'board mode is on, root size ' + s.root + 'px');
await shot('7-im-title');
/* From here the test plays the scene, and the software renderer manages under
   a frame a second at board size. The rest runs in a smaller touch window:
   board mode stays on, and sizes are judged against the root size. */
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1, hasTouch: true });
await sleep(1500);
const root = (await board()).root;
await tap('#begin');
await until(() => __game.phase() !== 'intro', 20000).catch(() => {});
check(await G(() => __game.phase() !== 'intro'), 'Begin answers a tap');
await G(() => { window.__h = setInterval(() => __game.hurry(), 400); __game.skipPrologue(); });
await until(() => __game.choicesIn() && __game.labels().includes('Kneel by the bed'));
await tap('#choices button');
await until(() => __game.phase() === 'listen');
check(await G(() => /Touch and hold/.test(document.getElementById('prompt').textContent)), 'the prompt speaks of touch, not keys: "' + await G(() => document.getElementById('prompt').textContent) + '"');
/* touch and hold to lean in, until the pad for whispering it back appears */
await page.touchscreen.touchStart(640, 280);
await until(() => __game.padIn(), 600000);
await page.touchscreen.touchEnd();
const key = await size('#pad .keys button');
check(key.w >= root * 2.5 && key.h >= root * 2.5, 'touching and holding leans in, and the whisper pad keys are finger-sized: ' + key.w + 'x' + key.h + 'px at a root size of ' + root + 'px');
await shot('8-im-pad');
/* whisper it back by tapping the glyphs in order */
for (const k of await G(() => __game.seq())) { await tap('#pad .keys button:nth-child(' + (k + 1) + ')'); await sleep(350); }
await until(() => __game.choicesIn() && __game.labels().includes('Go'), 600000);
await G(() => __game.choose('Go'));
await until(() => __game.phase() === 'run', 600000);
await until(() => __game.runButton().shown, 600000);
const run = await size('#run');
check(run.h >= root * 3, 'Run is finger-sized: ' + run.w + 'x' + run.h + 'px');
const s0 = await G(() => __game.palace.st.s);
const rr = await G(() => { const e = document.getElementById('run').getBoundingClientRect(); return { x: e.left + e.width / 2, y: e.top + e.height / 2 }; });
await page.touchscreen.touchStart(rr.x, rr.y);
await until(s => __game.palace.st.s > s + 0.5, 300000, s0).catch(() => {});
const s1 = await G(() => __game.palace.st.s);
await page.touchscreen.touchEnd();
check(s1 > s0 + 0.5, 'holding Run with a finger moves him: ' + s0.toFixed(1) + ' -> ' + s1.toFixed(1));
const p0 = await G(() => __game.palace.st.pushes);
await tap('#pushL');
await sleep(600);
check(await G(p => __game.palace.st.pushes > p, p0), 'Push answers a tap');
await shot('9-im-run');

/* ---- the text-only pages take the setting too ---- */
console.log('text-only pages');
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1, hasTouch: true });
for (const f of ['before-the-law-text.html', 'imperial-message-text.html']) {
  await page.goto(url(f) + '?board=1', { waitUntil: 'load' });
  await sleep(600);
  s = await board();
  check(s.on && s.root >= 23 && await G(() => !!document.querySelector('.board-corner [data-board]')), f + ': board mode on, toggle present');
}

console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
await b.close();
if (fail.length || errs.length) { console.log('FAILED: ' + fail.length + ' check(s)'); process.exit(1); }
console.log('all board checks passed');
