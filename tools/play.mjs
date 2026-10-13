/* Headless playthrough of the first-person build: title -> walk -> all three
   stages -> ending -> reflection. Screenshots land in tools/ as g-*.png
   (or m-*.png with --mobile). Text reveals are hurried so a run takes a
   couple of minutes, not ten. */
import puppeteer from 'puppeteer';
import path from 'path';

const MOBILE = process.argv.includes('--mobile');
const tag = MOBILE ? 'm' : 'g';
const file = 'file:///' + path.resolve('../before-the-law-3d.html').replace(/\\/g, '/');

const browser = await puppeteer.launch({
  headless: true, protocolTimeout: 900000,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--enable-webgl', '--ignore-gpu-blocklist',
    '--autoplay-policy=no-user-gesture-required', '--mute-audio'],
});
const page = await browser.newPage();
if (MOBILE) {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
} else {
  await page.setViewport({ width: 880, height: 550 });
}

const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const shot = n => page.screenshot({ path: `${tag}-${n}.png` });
const G = (fn, ...a) => page.evaluate(fn, ...a);
const ready = () => page.waitForFunction('window.__game.ready()', { timeout: 900000, polling: 500 });
const st = () => G(() => ({
  years: __game.state().years, stage: __game.stageOf(), labels: __game.labels(),
  text: __game.text().slice(0, 60),
}));
const press = async label => { if (!(await G(l => __game.press(l), label))) throw new Error('no button: ' + label); };
const autoHurry = on => G(on => {
  clearInterval(window.__hurryT);
  if (on) window.__hurryT = setInterval(() => __game.hurry(), 250);
}, on);

await page.goto(file, { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction('window.__frames > 20', { timeout: 60000 });
console.log('low-detail mode:', await G(() => __game.low));
await shot('00-title');

/* --- the walk --- */
await page.click('#begin');
await sleep(1500);
console.log('phase after Begin:', await G(() => __game.phase()));

/* --- the prologue: photograph each card, then move on with space --- */
for (const [n, art] of ['village', 'man', 'pack', 'road'].entries()) {
  await page.waitForFunction(a => document.getElementById('prologue').dataset.art === a &&
    document.querySelectorAll('#proText .line').length > 0, { timeout: 60000 }, art);
  await sleep(art === 'pack' ? 9000 : 2500);
  await shot('p' + n + '-' + art);
  await G(() => __game.hurry());
  await sleep(400);
  await page.keyboard.press('Space');
}
await page.waitForFunction('window.__game.phase() === "walk"', { timeout: 60000 });
console.log('prologue -> walk ok');
await page.keyboard.down('ArrowUp');
await sleep(4000);
await shot('01-road');
/* software rendering walks at ~1 fps; the walk itself is proven by now */
await G(() => __game.skipWalk());
await page.waitForFunction('window.__game.phase() === "play"', { timeout: 300000 });
await page.keyboard.up('ArrowUp');
await ready();
await shot('02-arrival');
const steps = await G(() => (window.__audio ? window.__audio.log : []).filter(e => e.cue === 'step').length);
console.log('footsteps during walk:', steps);

let enterEverywhere = true;
const checkEnter = async () => {
  const s = await st();
  if (s.labels[s.labels.length - 1] !== 'Enter') enterEverywhere = false;
  return s;
};
const log = [];
const turn = async (label, opts = {}) => {
  const s = await checkEnter();
  log.push(`  stage${s.stage} ${String(s.years).padStart(2)}y  ${label.padEnd(36)} [${s.labels.join(' | ')}]`);
  await press(label);
  if (opts.shotAt) { await sleep(opts.shotAt); await shot(opts.name); }
  await ready();
};

/* --- stage 1 --- */
await autoHurry(true);
await autoHurry(false);
await turn('Look through the gate', { shotAt: 5000, name: '02b-peer' });
await autoHurry(true);
await turn('Ask to be admitted');
await autoHurry(false);
await turn('Enter', { shotAt: 4200, name: '03-approach' });
await autoHurry(true);
console.log('after stage 1:', JSON.stringify(await st()));

/* --- stage 2: the gifts --- */
await shot('04-seated');
await press('Offer him what you have');
await sleep(1200);
await checkEnter();
const giftLabels = await G(() => __game.labels());
console.log('gift picker:', giftLabels.join(' | '));
await shot('05-gifts');
await press('Keep what you have');
await ready();
console.log('cancel returns to:', (await G(() => __game.labels())).join(' | '));
await press('Offer him what you have');
await sleep(1200);
await turn('Your father’s watch', { shotAt: 9000, name: '06-lapse' });
await turn('Study the doorkeeper', { shotAt: 6000, name: '07b-study' });
await turn('Enter');
/* the middle years: the choices change with the era, so take whatever is
   offered, preferring ones not yet tried, and give the rest of the gifts
   while the offer is still there */
const tried = new Set();
const PREF = ['Remember home', 'Curse your fate', 'Count the years', 'Scratch another mark', 'Grumble to yourself',
  'Offer him what you have', 'Study the doorkeeper', 'Ask to be admitted'];
let n2 = 0;
while ((await st()).stage === 2) {
  const labels = await G(() => __game.labels());
  const gift = labels.find(l => /money|coat|letters|bread|stick/.test(l));
  if (gift) { await turn(gift); continue; }
  const pick = PREF.find(l => labels.includes(l) && !tried.has(l)) || PREF.find(l => labels.includes(l) && l !== 'Offer him what you have') || labels[0];
  tried.add(pick);
  if (pick === 'Remember home' && !tried.has('shot-memory')) { tried.add('shot-memory'); await turn(pick, { shotAt: 4500, name: '07c-memory' }); }
  else await turn(pick);
  if (++n2 > 30) throw new Error('runaway in stage 2');
}
console.log('stage 2 choices used:', [...tried].filter(x => !x.startsWith('shot')).join(' | '));
console.log('stage 2 turns:', n2);

/* --- stage 3 --- */
await sleep(1500);
await shot('08-aged');
const s3 = await st();
console.log('stage 3 at', s3.years, 'years, choices:', s3.labels.join(' | '));
await turn('Enter');
console.log('ENTER in stage 3 ->', JSON.stringify((await st()).text.trim()));
await autoHurry(false);
await press('Ask the question you have never asked');
await sleep(9000);
await shot('09-bend');
await autoHurry(true);
await page.waitForFunction('window.__ended === true', { timeout: 120000 });
await sleep(4600);
await shot('10-gate-closing');
await page.waitForFunction('document.getElementById("final").classList.contains("in")', { timeout: 40000 });
await sleep(2600);
await shot('11-final');
const fin = await G(() => __game.final());
await page.waitForFunction('document.getElementById("toReflect").classList.contains("in")', { timeout: 20000 });

/* --- reflection --- */
await page.click('#toReflect');
await sleep(800);
await page.type('#rf-a', 'He only ever spoke. I kept waiting for permission.');
await shot('12-reflect');
const rec = await G(() => __game.record());
const obs = await G(() => document.querySelectorAll('#reflect section p').length);

/* --- audio --- */
const au = await G(() => (window.__audio && window.__audio.log) || []);
const ev = n => au.find(e => e.cue === n);
const gateEv = ev('gate:play'), duckEv = ev('drone:duck');

console.log('\n--- transcript ---\n' + log.join('\n'));
console.log('\n--- ending ---');
console.log('final line   :', JSON.stringify(fin));
console.log('years match  :', fin.includes(String(rec.years)));
console.log('record       :', JSON.stringify(rec));
console.log('reflection paragraphs:', obs);
console.log('\n--- audio ---');
if (gateEv && duckEv) console.log(`gate fires ${gateEv.at - duckEv.at}ms after the ending begins (target 3200)`);
console.log('bell fired on stage 3 :', !!ev('bell:play'));
console.log('years swells          :', au.filter(e => e.cue === 'years').length);
console.log('voiced lines played   :', au.filter(e => e.cue === 'voice').length);
console.log('score moods           :', au.filter(e => e.cue.startsWith('mood:')).map(e => e.cue.slice(5)).join(' > '));
console.log('heartbeats / hall     :', au.filter(e => e.cue === 'heartbeat').length, '/', au.filter(e => e.cue === 'hall').length);
console.log('insights this run     :', JSON.stringify(await G(() => window.__insights)));
console.log('\n--- invariants ---');
console.log('ENTER present & last in every scene:', enterEverywhere);
console.log('fps at end:', await G(() => window.__fps));
console.log(errs.length ? '\nERRORS:\n' + errs.slice(0, 10).join('\n') : '\nno page errors');
await browser.close();
