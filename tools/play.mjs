import puppeteer from 'puppeteer';
import path from 'path';

const MOBILE = process.argv.includes('--mobile');
const tag = MOBILE ? 'm' : 'g';
const file = 'file:///' + path.resolve('../before-the-law-3d.html').replace(/\\/g, '/');

const browser = await puppeteer.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--enable-webgl', '--ignore-gpu-blocklist',
    '--autoplay-policy=no-user-gesture-required', '--mute-audio'],
});
const page = await browser.newPage();
if (MOBILE) {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
} else {
  await page.setViewport({ width: 1280, height: 800 });
}

const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

await page.goto(file, { waitUntil: 'load', timeout: 60000 });
const ready = () => page.waitForFunction('window.__game && window.__game.ready()', { timeout: 90000 });
const st = () => page.evaluate(() => ({
  years: window.__game.state().years,
  stage: window.__game.stageOf(),
  labels: window.__game.labels(),
  text: window.__game.text().slice(0, 62),
}));
const shot = n => page.screenshot({ path: `${tag}-${n}.png` });

await ready();
console.log('low-detail mode:', await page.evaluate(() => window.__game.low));
console.log('fps:', await page.evaluate(() => window.__fps));
await shot('01-arrival');

let turn = 0, seenStages = new Set(), enterEverywhere = true, log = [];
const S1 = ['Ask to be admitted', 'Look through the gate', 'Enter'];

while (true) {
  const s = await st();
  seenStages.add(s.stage);
  if (!s.labels.includes('Enter')) enterEverywhere = false;
  /* ENTER must always be last so it never moves */
  if (s.labels[s.labels.length - 1] !== 'Enter') enterEverywhere = false;
  log.push(`  t${String(turn).padStart(2)} stage${s.stage} ${String(s.years).padStart(2)}y  [${s.labels.join(' | ')}]`);
  if (s.stage === 3) break;

  const pick = s.stage === 1 ? S1[turn % 3] : 'Study the doorkeeper';
  await page.evaluate(l => window.__game.press(l), pick);
  turn++;
  if (turn === 3) { await ready(); await shot('02-wait'); continue; }
  if (turn > 40) throw new Error('runaway');
  await ready();
}

await shot('03-oldage');
const s3 = await st();
console.log('\n--- transcript ---');
console.log(log.join('\n'));
console.log(`\nstage 3 reached at ${s3.years} years, choices: [${s3.labels.join(' | ')}]`);

/* ENTER in old age must respond, not admit */
await page.evaluate(() => window.__game.press('Enter'));
await ready();
const afterEnter = await st();
console.log('ENTER in stage 3 ->', JSON.stringify(afterEnter.text.trim()));
console.log('still playable after ENTER:', !(await page.evaluate(() => window.__game.state().over)));

/* the one choice that ends it */
await page.evaluate(() => window.__game.press('Ask the question you have never asked'));
await page.waitForFunction('window.__ended === true', { timeout: 90000 });
await page.waitForFunction('document.getElementById("final").classList.contains("in")', { timeout: 40000 });
await new Promise(r => setTimeout(r, 2600));
await shot('04-ending');

const fin = await page.evaluate(() => document.getElementById('final').textContent);
const againEarly = await page.evaluate(() => document.getElementById('again').classList.contains('in'));
await new Promise(r => setTimeout(r, 5200));
const againLate = await page.evaluate(() => document.getElementById('again').classList.contains('in'));

console.log('\n--- ending ---');
console.log('final line   :', JSON.stringify(fin));
console.log('years match  :', fin.includes(String(s3.years)));
console.log('restart @2.6s:', againEarly, '(must be false)');
console.log('restart @7.8s:', againLate, '(must be true)');

/* --- audio: did the cues fire, and on the right beat? --- */
const au = await page.evaluate(() => ({
  log: (window.__audio && window.__audio.log) || [],
  state: (window.__audio && window.__audio.ready && window.__audio.ready()) || null,
}));
console.log('\n--- audio ---');
console.log('decode state :', JSON.stringify(au.state), '(2 = loaded)');
for (const e of au.log) console.log('  ' + e.cue.padEnd(14), e.at + 'ms' + (e.err ? '  ' + e.err : ''));
const ev = n => au.log.find(e => e.cue === n);
const gateEv = ev('gate:play'), bellEv = ev('bell:play'), duckEv = ev('drone:duck');
if (gateEv && duckEv) {
  const d = gateEv.at - duckEv.at;
  console.log(`gate fires ${d}ms after blackout begins (target 1900 +/-300):`, Math.abs(d - 1900) < 300);
  console.log(`gate runs 3600ms -> ends ${d + 3600}ms; closing line at 7500ms`);
  console.log(`silence before the line: ${7500 - d - 3600}ms`, (7500 - d - 3600) > 1200 ? '(two beats)' : '(TOO SHORT)');
}
console.log('drone playing during play:', !!ev('drone:play'));
console.log('bell fired on stage 3    :', !!bellEv);

console.log('\n--- invariants ---');
console.log('ENTER present & last in every scene:', enterEverywhere);
console.log('stages visited:', [...seenStages].sort().join(','));
console.log('fps at end:', await page.evaluate(() => window.__fps));
console.log(errs.length ? '\nERRORS:\n' + errs.slice(0, 10).join('\n') : '\nno page errors');
await browser.close();
