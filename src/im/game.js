/* An Imperial Message: the game. Text comes from text.gen.js (extracted
   from imperial-message.html); the scenes are in court.js, palace.js,
   rings.js, capital.js and window.js; sound in sound.js.

   The shape of it follows Kafka's one long sentence:
     the window (you)  ->  the deathbed (the whisper)  ->  the chambers (real)
     ->  "and if he did": stairs, courtyards, the second palace, thousands of
         years, the outermost gate, the capital  (all drawn in pencil)
     ->  "but never, never can that happen" (torn up)  ->  back in the
         chambers, where he still is  ->  your window, where you dream it.

   One promise, checked by the harness: Run is on screen whenever he is
   travelling, in the same place, never disabled, and always moves him. */
import * as THREE from 'three';
import { T } from './text.gen.js';
import * as stage from './stage.js';
import * as A from './sound.js';
import { makeGlyphs, sealTexture } from './kit.js';
import { buildWindow } from './window.js';
import { buildCourt } from './court.js';
import { buildPalace } from './palace.js';
import { buildRings } from './rings.js';
import { buildCapital } from './capital.js';
import { unlock, resetRun, foundThisRun, journalHTML, has } from './insights.js';
import { openReflection, reflectionOpen } from './reflect.js';
import { MODELS } from './models.gen.js';
import { modelGeometries } from './models.js';

const $ = id => document.getElementById(id);
const textEl = $('text'), choices = $('choices'), tableau = $('tableau'), countEl = $('count');
const controls = $('controls'), runBtn = $('run'), pushL = $('pushL'), pushR = $('pushR'), sunBtn = $('sunBtn');
const promptEl = $('prompt'), padEl = $('pad'), sealEl = $('seal'), dreamEl = $('dream'), mapEl = $('map');
const intro = $('intro'), black = $('black'), finalEl = $('final'), chapterEl = $('chapter');
const voiceBtn = $('voiceBtn'), soundBtn = $('soundBtn'), journalBtn = $('journalBtn'), journal = $('journal');

/* ---------------- the scenes, built once ---------------- */
const geos = modelGeometries(MODELS);
const win = buildWindow(geos);
const court = buildCourt(geos);
const palace = buildPalace(geos);
const rings = buildRings();
const capital = buildCapital();
let glyphs = makeGlyphs();

/* ---------------- state ---------------- */
let S;
function reset() {
  S = {
    name: '', phase: 'intro', seq: [], said: [], attempts: 0, asked: false,
    chambers: 0, pushes: 0, suns: 0, years: 0, emperors: 0, after: 0,
    road: 0, listen: 0, glow: 0, dream: '', t0: Date.now(), held: false, back: 0,
  };
}
reset();
const setPhase = p => { S.phase = p; document.body.dataset.phase = p; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const who = () => S.name ? esc(S.name) : 'you';

/* ---------------- narration ----------------
   One line at a time; the voice paces it if there is one, otherwise a
   reading pause. Click the text or press Enter to hurry. During the run
   only the newest line is shown, so the view stays clear. */
let hurryNow = null, token = 0, queue = Promise.resolve();
function reveal(lines, opts = {}) {
  return new Promise(done => {
    const my = token;
    if (!opts.keep) textEl.innerHTML = '';
    textEl.classList.remove('out');
    textEl.className = opts.cls || '';
    A.preload(lines);
    let i = 0, skip = false, pend = null;
    const next = () => {
      if (my !== token) { done(); return; }
      if (i >= lines.length) { hurryNow = null; pend = setTimeout(done, skip ? 200 : 600); return; }
      if (opts.single) textEl.querySelectorAll('.line').forEach(l => { l.classList.add('gone'); setTimeout(() => l.remove(), 700); });
      const p = document.createElement('p');
      p.className = 'line'; p.innerHTML = lines[i];
      textEl.appendChild(p);
      requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('in')));
      if (opts.onLine) opts.onLine(i);
      const line = lines[i], pause = 900 + Math.min(2800, p.textContent.length * 26);
      i++;
      if (skip) { next(); return; }
      const mine = ++speakTok;
      A.speak(line).then(spoken => { if (mine !== speakTok || skip) return; pend = setTimeout(next, spoken ? 450 : pause); });
    };
    hurryNow = () => { if (skip) return; skip = true; speakTok++; A.hush(); clearTimeout(pend); next(); };
    next();
  });
}
let speakTok = 0;
const hurry = () => { if (hurryNow) hurryNow(); };
/* queued: run-time beats wait their turn instead of talking over each other */
function narrate(lines, opts) { const my = token; queue = queue.then(() => my === token ? reveal(lines, Object.assign({ single: true }, opts)) : null); return queue; }
function cut() { token++; speakTok++; A.hush(); hurryNow = null; queue = Promise.resolve(); }
function clearText(ms = 900) { textEl.classList.add('out'); return wait(ms).then(() => { textEl.innerHTML = ''; textEl.classList.remove('out'); }); }

/* ---------------- choices: bottom-anchored, the forward one always last ---------------- */
function offer(list) {
  return new Promise(res => {
    choices.innerHTML = '';
    list.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.innerHTML = c.label;
      if (c.main) b.className = 'main';
      b.addEventListener('click', () => { if (!choices.classList.contains('in')) return; A.choose(); choices.classList.remove('in'); res(c.id || c.label); });
      b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') A.hover(); });
      choices.appendChild(b);
    });
    requestAnimationFrame(() => requestAnimationFrame(() => choices.classList.add('in')));
  });
}
const hideChoices = () => choices.classList.remove('in');

function chapter(kicker, title, ms = 3200) {
  chapterEl.innerHTML = `<span>${kicker}</span><b>${title}</b>`;
  chapterEl.classList.add('in');
  return wait(ms).then(() => { chapterEl.classList.remove('in'); return wait(800); });
}
/* a prompt can be tapped when it is given something to do: a touch screen has no F key */
let promptTap = null;
function prompt(html, onTap) {
  promptEl.innerHTML = html || ''; promptEl.classList.toggle('in', !!html);
  promptTap = (html && onTap) || null; promptEl.classList.toggle('tap', !!promptTap);
}
promptEl.addEventListener('click', () => { if (promptTap) promptTap(); });
/* on a phone or a classroom board the prompts name touches, not keys */
const touchy = () => document.documentElement.classList.contains('board') || window.matchMedia('(pointer: coarse)').matches;
function count(s) { countEl.textContent = s || ''; }
function fadeTo(fn, ms = 1100, white) {
  stage.setPost(white ? 'white' : 'fade', 1, 1000 / ms);
  return wait(ms + 50).then(() => { fn(); stage.setPost(white ? 'white' : 'fade', 0, 0.8); });
}
function showControls(on, sunToo) {
  controls.classList.toggle('in', on);
  sunBtn.hidden = !sunToo;
}

/* the little map: palace rings around a gold dot, and you, far off at the edge */
function drawMap(rings, prog) {
  const n = Math.max(1, rings), outer = 6 * Math.pow(1.3, n - 1), k = 40 / outer;
  let svg = '';
  for (let i = 0; i < Math.min(n, 60); i++) {
    const r = 6 * Math.pow(1.3, i) * k;
    if (r < 0.8) continue;
    svg += `<circle cx="50" cy="50" r="${r.toFixed(2)}" />`;
  }
  const d = Math.min(40, (6 + prog) * k * 0.15);
  mapEl.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true">${svg}<line x1="50" y1="50" x2="93" y2="50" class="dash"/><circle cx="${50 + d}" cy="50" r="1.8" class="me"/><rect x="91" y="48" width="4" height="4" class="you"/></svg><span>${who()}</span>`;
}

/* ---------------- 1. the window ---------------- */
async function begin() {
  if (S.phase !== 'intro') return;
  S.name = $('name').value.trim().slice(0, 24);
  try { localStorage.setItem('im:name', S.name); } catch (e) {}
  A.init();
  resetRun();
  intro.classList.add('gone');
  setTimeout(() => { intro.hidden = true; }, 1500);
  setPhase('prologue');
  document.body.className = 'chrome dusk';
  stage.show(win);
  win.place('seat'); win.evening(0.2, true); win.showSelf(false);
  stage.snapPost('fade', 1); stage.setPost('fade', 0, 0.5);
  A.setMood('window'); A.setWind(0.35); A.setCrickets(0.25);
  $('proSkip').classList.add('in');
  await wait(1600);
  for (let n = 0; n < T.prologue.length && S.phase === 'prologue'; n++) {
    if (n === 1) win.pose('capital', 5);
    if (n === 2) win.pose('seat', 4);
    await reveal(T.prologue[n], { cls: 'pro' });
    if (S.phase !== 'prologue') return;
    if (n === 2) await showSeal();
    await wait(900);
    if (n < T.prologue.length - 1) await clearText(700);
  }
  if (S.phase === 'prologue') toCourt();
}
async function showSeal() {
  const c = sealTexture(S.name).image;
  sealEl.innerHTML = ''; sealEl.appendChild(c);
  sealEl.classList.add('in'); A.seal();
  await wait(2600);
  sealEl.classList.remove('in');
}
function skipPrologue() { if (S.phase !== 'prologue') return; cut(); sealEl.classList.remove('in'); toCourt(); }

/* ---------------- 2. the deathbed ---------------- */
async function toCourt() {
  setPhase('court');
  $('proSkip').classList.remove('in');
  win.pose('up', 3);
  stage.setPost('white', 1, 0.5);
  await wait(2200);
  await clearText(10);
  stage.show(court); court.reset();
  stage.setPost('white', 0, 0.6);
  document.body.className = 'chrome court';
  tableau.textContent = 'The Emperor’s deathbed';
  tableau.classList.add('in');
  A.setMood('court'); A.setCrowd(0.12); A.setWind(0.1); A.setCrickets(0);
  court.pose('near', 11, 'inOut');
  await reveal(T.court);
  await offer([{ label: 'Kneel by the bed', main: true }]);
  court.pose('kneel', 2.4);
  await wait(1200);
  await reveal(T.kneel);
  await listen(1);
}

/* hold to lean in and hear it, one glyph at a time */
let lis = null;
function listen(slow) {
  return new Promise(async done => {
    if (!S.seq.length) S.seq = Array.from({ length: 5 }, () => Math.floor(Math.random() * glyphs.length));
    if (S.attempts === 0) await reveal(T.whisper);
    setPhase('listen');
    prompt(touchy() ? '<b>Touch and hold</b> to lean in and listen' : '<b>Hold</b> <kbd>space</kbd> or the mouse button to lean in and listen');
    lis = { i: 0, t: 0, slow, done, idle: 0, leaning: false };
  });
}
stage.onFrame(dt => {
  if (!lis) return;
  const lean = S.held || lis.idle > 14;
  if (lean !== lis.leaning) {
    lis.leaning = lean;
    court.pose(lean ? 'lean' : 'kneel', 1.1);
    court.lean(lean); court.turnHead(lean);
    if (lean) A.whisper(1.2);
  }
  if (!lean) { lis.idle += dt; return; }
  lis.t += dt;
  const gap = 1.0 * lis.slow;
  if (lis.t > 1.2 + lis.i * gap && lis.i < S.seq.length) {
    const k = S.seq[lis.i];
    court.whisperGlyph(glyphs[k].tex);
    A.glyph(k); A.whisper(0.8);
    heard(k);
    lis.i++;
  }
  if (lis.i >= S.seq.length && lis.t > 1.2 + lis.i * gap + 0.6) {
    const d = lis.done; lis = null;
    prompt('');
    court.pose('kneel', 1.2); court.lean(false);
    d(repeatBack());
  }
});
/* each glyph shows for a moment on screen, too, so it can be remembered */
function heard(k) {
  const strip = $('heard');
  const img = document.createElement('img'); img.src = glyphs[k].url; img.alt = '';
  strip.appendChild(img);
  requestAnimationFrame(() => requestAnimationFrame(() => img.classList.add('in')));
  setTimeout(() => { img.classList.remove('in'); setTimeout(() => img.remove(), 600); }, 1400);
}

async function repeatBack() {
  setPhase('repeat');
  if (S.attempts === 0) await reveal(T.repeat);
  S.attempts++;
  S.said = [];
  padEl.innerHTML = '<div class="said"></div><div class="keys"></div><p class="hint">Whisper it back: press the glyphs in order (or keys 1&#8211;6)</p>';
  const keys = padEl.querySelector('.keys'), said = padEl.querySelector('.said');
  glyphs.forEach((g, k) => {
    const b = document.createElement('button');
    b.type = 'button'; b.innerHTML = `<img src="${g.url}" alt=""><span>${k + 1}</span>`;
    b.setAttribute('aria-label', 'glyph ' + (k + 1));
    b.addEventListener('click', () => press(k));
    keys.appendChild(b);
  });
  /* after two misses the next glyph glows a little, so nobody is stuck at the bed */
  const hintNext = () => { if (S.attempts < 3) return; keys.querySelectorAll('button').forEach((b, k) => b.classList.toggle('next', k === S.seq[S.said.length])); };
  hintNext();
  padEl.classList.add('in');
  return new Promise(res => {
    padPress = k => {
      if (S.said.length >= S.seq.length) return;
      S.said.push(k); A.glyph(k, true);
      const img = document.createElement('img'); img.src = glyphs[k].url; img.alt = '';
      said.appendChild(img);
      hintNext();
      if (S.said.length === S.seq.length) setTimeout(() => res(judge()), 700);
    };
  });
}
let padPress = null;
const press = k => { if (padPress && padEl.classList.contains('in')) padPress(k); };

async function judge() {
  padEl.classList.remove('in'); padPress = null;
  const ok = S.said.every((k, i) => k === S.seq[i]);
  if (!ok) {
    A.wrong();
    await reveal(T.wrong[Math.min(S.attempts, 2) - 1]);
    return listen(1 + S.attempts * 0.6);
  }
  court.turnHead(true);
  setTimeout(() => { court.nod(); A.nod(); }, 500);
  await reveal(T.nod);
  setPhase('court');
  const c = await offer([{ id: 'ask', label: 'Ask him what it means' }, { id: 'go', label: 'Go', main: true }]);
  if (c === 'ask') { S.asked = true; await reveal(T.ask); unlock('carry'); }
  court.turnHead(false);
  court.pose('rise', 3);
  for (let i = 0; i < court.princes.capacity; i++) court.princes.bow(i, 0.5);
  court.princes.flush();
  await reveal(T.dispatch, { onLine: i => { if (i === 1) { $('emblem').classList.add('in'); A.sun(); } } });
  await wait(1200);
  $('emblem').classList.remove('in');
  await clearText(600);
  court.pose('away', 5);
  await chapter('The messenger', 'The innermost palace');
  await fadeTo(startRun, 900);
}

/* ---------------- 3. the chambers ----------------
   What happens in which chamber. The game only knows the chamber number. */
const BEATS = { 2: { knot: true }, 4: { family: true }, 5: { window: true }, 6: { child: true } };
function startRun() {
  setPhase('run');
  document.body.className = 'chrome run';
  tableau.textContent = 'The chambers of the innermost palace';
  stage.show(palace);
  palace.reset(0, Object.assign({}, BEATS));
  palace.setMode('run');
  S.chambers = 0; S.pushes = 0; S.suns = 0;
  count('Chambers crossed: 0');
  drawMap(1, 0); mapEl.classList.add('in');
  showControls(true, false);
  A.setMood('throng'); A.setCrowd(0.6); A.setWind(0);
  narrate(T.go).then(() => { if (S.phase === 'run') prompt(touchy() ? 'Hold <b>Run</b>, or touch and hold anywhere, to run' : 'Hold <kbd>W</kbd> / <kbd>&#8593;</kbd> or the mouse to run'); });
}
const done = new Set();
palace.on((ev, d) => {
  if (ev === 'step') A.step(d.speed, d.open);
  if (ev === 'push') { A.push(d.alt); S.pushes++; }
  if (ev === 'sun') { A.sun(); S.suns = palace.st.suns; if (S.suns >= 3) unlock('sun'); if (S.phase === 'run' && !done.has('easy') && done.has('sun')) { done.add('easy'); narrate(T.easy); } }
  if (ev === 'stand') { if (S.phase === 'run' || S.phase === 'after') { narrate(T.stand); unlock('standstill'); } }
  if (ev === 'knot' && !done.has('sun')) { done.add('sun'); narrate(T.sun); prompt(touchy() ? 'Tap <b>&#9737; The sun</b> to show the sign of the sun' : 'Press <kbd>E</kbd> or &#9737; to show the sign of the sun'); showControls(true, true); }
  if (ev === 'chamber') onChamber(d.idx, d.data);
  if (ev === 'segment') onSegment(d.type);
});
function onChamber(idx, data) {
  if (S.phase === 'run') {
    S.chambers = idx;
    count('Chambers crossed: ' + idx);
    drawMap(1, idx);
    if (idx === 1) { narrate(T.push); prompt(touchy() ? 'Tap <b>Push</b> on one side, then the other' : '<kbd>A</kbd> / <kbd>D</kbd> or <kbd>&#8592;</kbd> <kbd>&#8594;</kbd>: push with one arm, then the other'); }
    if (idx === 3 && !done.has('sun')) { done.add('sun'); narrate(T.sun); showControls(true, true); }
    if (idx === 4) narrate(T.family).then(() => unlock('dwellings'));
    if (idx === 5) prompt(touchy() ? '<b>Tap here</b> to look out of the window' : 'Press <kbd>F</kbd>, or click here, to look out of the window', lookOut);
    if (idx === 6) narrate(T.child).then(() => unlock('carry'));
    if (idx === 7) { prompt(''); palace.bell(); A.bell(); A.setCrowd(0.15, 1); narrate(T.bell).then(() => { unlock('dead'); A.setCrowd(0.6, 3); }); }
    if (idx === 9) narrate(T.vast);
    if (idx === 10) openField();
  } else if (S.phase === 'after' && idx > S.afterFrom) {
    S.chambers++;
    count('Chambers crossed: ' + S.chambers);
    S.after++;
    narrate(T.still[(S.after - 1) % T.still.length]);
    if (S.after >= 3) unlock('still');
  } else if (S.phase === 'if' && ['start', 'stairs', 'court', 'wall'].includes(S.ifStage) && palace.st.s > S.wallAt) {
    /* through the gate of the second palace: and again, and again */
    S.ifStage = 'again';
    stage.setPost('ifness', 0.6, 0.15);
    narrate(T.again, { cls: 'if' }).then(() => toMillennia());
  }
}
function lookOut() {
  const seg = palace.segAt(palace.st.s);
  if (!seg.data.windowAt || done.has('roofs')) return;
  done.add('roofs'); prompt('');
  palace.lookOutWindow(true);
  narrate(T.roofs).then(() => { unlock('roofs'); setTimeout(() => palace.lookOutWindow(false), 1500); });
}

/* "If open country lay before him, how he would fly" - the first "if" */
async function openField() {
  setPhase('field');
  await queue;
  stage.setPost('white', 1, 2.5);
  await wait(450);
  palace.fieldVision(true);
  stage.setPost('white', 0, 1.2);
  stage.setPost('ifness', 0.14, 0.4);
  A.setMood('open'); A.setCrowd(0, 1); A.setWind(0.5);
  showControls(false);
  await reveal(T.field, { single: true, cls: 'if', onLine: i => { if (i === 1) setTimeout(() => A.knock(3, true), 2600); } });
  unlock('knock');
  await wait(800);
  stage.setPost('fade', 1, 3);
  await wait(400);
  palace.fieldVision(false);
  stage.setPost('ifness', 0, 2);
  stage.setPost('fade', 0, 1.5);
  A.setMood('throng'); A.setCrowd(0.6, 1); A.setWind(0);
  setPhase('run');
  showControls(true, true);
  await reveal(T.instead, { single: true });
  /* "And if he did come to the end of them..." */
  setPhase('if'); S.ifStage = 'start';
  document.body.classList.add('iffy');
  tableau.textContent = 'if…';
  palace.replan(['stairs', 'court', 'wall', 'chamber', 'chamber', 'chamber']);
  S.wallAt = palace.wallAt();
  stage.setPost('ifness', 0.25, 0.1);
  A.setMood('if');
  narrate(T.ifdid, { cls: 'if' });
}
function onSegment(type) {
  if (S.phase !== 'if') return;
  /* each stage also accepts arriving from further back, so nothing depends on
     catching a short segment on exactly the right frame */
  if (type === 'stairs' && S.ifStage === 'start') { S.ifStage = 'stairs'; stage.setPost('ifness', 0.4, 0.1); narrate(T.stairs, { cls: 'if' }); drawMap(2, 0); }
  if (type === 'court' && ['start', 'stairs'].includes(S.ifStage)) {
    S.ifStage = 'court'; stage.setPost('ifness', 0.5, 0.1); A.setWind(0.4); A.setCrowd(0.25);
    narrate(T.courts, { cls: 'if' }).then(() => { A.rise(); return narrate(T.second, { cls: 'if' }); });
    drawMap(3, 0);
  }
  if (type === 'wall' && ['start', 'stairs', 'court'].includes(S.ifStage)) { S.ifStage = 'wall'; drawMap(4, 0); A.setCrowd(0.5); A.setWind(0); }
}

/* ---------------- 4. thousands of years ---------------- */
async function toMillennia() {
  if (S.ifStage !== 'again') return;
  S.ifStage = 'millennia';
  await fadeTo(() => {
    stage.show(rings); rings.reset();
    stage.setPost('ifness', 0.72, 0.2);
    A.setMood('millennia'); A.setCrowd(0, 2);
    tableau.textContent = 'and so on, for thousands of years';
    prompt('');
  }, 1200, true);
  S.years = 0; S.emperors = 0;
  const t0 = performance.now();
  let bells = 0, spoke = 0;
  await new Promise(res => {
    const tick = () => {
      if (S.phase !== 'if') { res(); return; }
      const sec = (performance.now() - t0) / 1000;
      S.years = Math.round(Math.pow(sec, 2.3) * 3.2 + sec * 8);
      const crossed = 4 + rings.crossed();
      count('Years: ' + S.years.toLocaleString('en') + ' · palaces: ' + crossed);
      drawMap(crossed + 2 + Math.floor(sec / 2), 0);
      /* emperors die: a bell, and a shadow spreading from the centre */
      const due = Math.floor(S.years / 45);
      if (due > bells && bells < 40) { bells++; S.emperors = bells; if (bells < 12 || bells % 4 === 0) { A.distantBell(); rings.wave(); } }
      if (sec > 6 && spoke === 0) { spoke = 1; narrate(T.millennia[0], { cls: 'if' }); }
      if (sec > 17 && spoke === 1) { spoke = 2; narrate(T.millennia[1], { cls: 'if' }); }
      if (sec > 30) { res(); return; }
      setTimeout(tick, 120);
    };
    tick();
  });
  await queue;
  toGate();
}

/* ---------------- 5. the outermost gate (drawn) ---------------- */
async function toGate() {
  await fadeTo(() => {
    stage.show(capital); capital.reset();
    stage.setPost('ifness', 0.97, 0.3);
    tableau.textContent = 'the outermost gate';
    count('');
    A.setMood('capital');
  }, 1200, true);
  narrate(T.gate, { cls: 'if' });
}
capital.on(async ev => {
  if (ev === 'burst') { A.boom(); }
  if (ev === 'behold') {
    /* "but never, never can that happen" */
    showControls(false);
    await queue;
    cut();
    A.setMood(null);
    stage.setPost('crack', 1, 4);
    A.crack();
    await reveal(T.never, { cls: 'never' });
    await reveal(T.capital, { cls: 'if' });
    await reveal(T.nobody, { cls: 'if' });
    unsay();
  }
});
/* the drawing tears up and rewinds: he is back in the chambers. He always was. */
async function unsay() {
  A.rewind(2.6);
  stage.setPost('rewind', 1, 0.7);
  await wait(1500);
  stage.setPost('white', 1, 1.5);
  await wait(800);
  stage.snapPost('crack', 0);
  stage.snapPost('ifness', 0);
  document.body.classList.remove('iffy');
  stage.show(palace);
  /* the same chamber he was in when the story said "if": the family is still at supper */
  S.afterFrom = S.chambers + 1;
  palace.reset(S.afterFrom, { [S.afterFrom]: { family: true } });
  palace.setMode('run');
  textEl.innerHTML = '';
  stage.setPost('rewind', 0, 0.8);
  stage.setPost('white', 0, 0.8);
  setPhase('after');
  tableau.textContent = 'The chambers of the innermost palace';
  count('Chambers crossed: ' + S.chambers);
  drawMap(1, S.chambers);
  A.setMood('throng'); A.setCrowd(0.6, 1);
  showControls(true, true);
  unlock('if');
  await wait(900);
  await narrate(T.deadman);
  /* the run goes on as long as you like; leaving him is your choice */
  const c = await offer([{ id: 'leave', label: 'Leave him running' }]);
  if (c === 'leave') leaveHim();
}

/* ---------------- 6. your window ---------------- */
async function leaveHim() {
  setPhase('leaving');
  showControls(false); prompt(''); mapEl.classList.remove('in');
  palace.pullback(); A.whoosh();
  A.setCrowd(0.2, 5);
  await wait(6500);
  await fadeTo(() => {
    stage.show(win); win.place('far'); win.evening(0.7, true); win.showSelf(true);
    win.pose('outside', 8, 'inOut');
    tableau.textContent = '';
    count('');
    textEl.innerHTML = '';
    A.setMood('night'); A.setCrowd(0, 1); A.setWind(0.25); A.setCrickets(0.7);
    document.body.className = 'chrome dusk';
  }, 1500);
  await wait(8500);
  await fadeTo(() => { win.place('seat'); win.showSelf(false); win.evening(0.85); }, 900);
  tableau.textContent = 'Your window';
  setPhase('window');
  await reveal(T.windowOpen);
  windowChoices();
}
async function windowChoices() {
  const c = await offer([
    { id: 'road', label: 'Watch the road' },
    { id: 'listen', label: 'Listen' },
    { id: 'glow', label: 'Look toward the capital' },
    { id: 'dream', label: 'Dream the message', main: true },
  ]);
  if (c === 'dream') { dream(); return; }
  await clearText(500);
  if (c === 'road') { win.pose('road', 2.5); if (!S.road) win.walk(); await reveal(T.road[Math.min(S.road++, 2)]); }
  if (c === 'listen') { if (!S.listen) { A.shutter(); win.bang(); } else win.bang(); await reveal(T.listen[Math.min(S.listen++, 2)]); }
  if (c === 'glow') { win.pose('capital', 3); await reveal(T.glow[Math.min(S.glow++, 1)]); }
  if (S.road && S.listen && S.glow) unlock('waiting');
  win.pose('seat', 2.5);
  windowChoices();
}
async function dream() {
  setPhase('dream');
  await clearText(500);
  win.evening(1);
  win.pose('up', 5);
  await reveal(T.dusk);
  S.seq.forEach((k, i) => { win.glyphStar(glyphs[k].tex, i, S.seq.length); setTimeout(() => A.glyph(k, true), 600 * i + 300); });
  await wait(600 * S.seq.length + 1200);
  const ta = dreamEl.querySelector('textarea'), frags = dreamEl.querySelector('.frags');
  ta.value = '';
  frags.innerHTML = '';
  T._fragments.forEach(f => {
    const b = document.createElement('button'); b.type = 'button'; b.innerHTML = f;
    b.addEventListener('click', () => { ta.value = (ta.value ? ta.value.replace(/\s*$/, ' ') : '') + b.textContent; ta.focus(); });
    frags.appendChild(b);
  });
  dreamEl.classList.add('in');
  setTimeout(() => ta.focus({ preventScroll: true }), 400);
}
async function sealDream(blank) {
  if (S.phase !== 'dream') return;
  S.dream = blank ? '' : dreamEl.querySelector('textarea').value.trim().slice(0, 240);
  dreamEl.classList.remove('in');
  setPhase('ending');
  A.seal();
  if (!S.dream) unlock('blank');
  win.pose('seat', 4);
  await clearText(400);
  await reveal(T.final);
  await wait(2200);
  ending();
}
function ending() {
  setPhase('end');
  textEl.classList.add('out');
  tableau.classList.remove('in');
  A.silence(4);
  black.classList.add('on');
  setTimeout(() => {
    finalEl.innerHTML = (S.dream
      ? `The message never arrived. It was never going to.<span class="dreamt">&#8220;${esc(S.dream)}&#8221;</span>That is the only version there is. Nobody else ever wrote it, not Kafka and not this game. You did.`
      : 'The message never arrived. It was never going to.<span class="dreamt">&#8230;</span>You left it unwritten. Kafka never wrote it either.') +
      `<span class="for">for ${who()}</span>`;
    finalEl.classList.add('in');
    setTimeout(() => { document.querySelectorAll('#after button').forEach(b => b.classList.add('in')); $('thanks').classList.add('in'); $('toReflect').focus({ preventScroll: true }); }, 4000);
  }, 2200);
  window.__ended = true;
}

function record() {
  return {
    name: S.name, chambers: S.chambers, pushes: S.pushes, suns: S.suns, years: S.years, emperors: S.emperors,
    attempts: S.attempts, asked: S.asked, dream: S.dream, minutes: Math.round((Date.now() - S.t0) / 60000), insights: foundThisRun(),
  };
}
/* the home page is told when this is a classroom board: pages opened from a folder do not share storage */
const toHub = () => { window.location.href = 'index.html' + (document.documentElement.classList.contains('board') ? '?board=1' : ''); };

function restart() {
  if (S.phase !== 'end') return;
  cut();
  document.querySelectorAll('#after button').forEach(b => b.classList.remove('in'));
  $('thanks').classList.remove('in');
  finalEl.classList.remove('in');
  const name = S.name;
  reset();
  glyphs = makeGlyphs();
  win.clearStars();
  done.clear();
  $('name').value = name;
  setTimeout(() => {
    black.classList.remove('on');
    textEl.innerHTML = ''; textEl.classList.remove('out');
    intro.hidden = false; intro.classList.remove('gone');
    setPhase('intro');
    document.body.className = '';
    stage.show(win); win.place('seat'); win.evening(0.2, true);
  }, 1200);
}

/* ---------------- settings and journal ---------------- */
function paintSettings() {
  voiceBtn.textContent = 'Voice ' + (A.voiceEnabled() ? 'on' : 'off');
  voiceBtn.hidden = !A.voiceAvailable();
  soundBtn.textContent = 'Sound ' + (A.isOn() ? 'on' : 'off');
}
voiceBtn.addEventListener('click', () => { A.setVoice(!A.voiceEnabled()); paintSettings(); });
soundBtn.addEventListener('click', () => { A.setSound(!A.isOn()); paintSettings(); });
function toggleJournal(open) {
  const on = open === undefined ? journal.hidden : open;
  if (on) { journal.querySelector('.body').innerHTML = journalHTML(); journal.hidden = false; requestAnimationFrame(() => journal.classList.add('in')); }
  else { journal.classList.remove('in'); setTimeout(() => { journal.hidden = true; }, 350); }
}
journalBtn.addEventListener('click', () => toggleJournal());
journal.addEventListener('click', e => { if (e.target === journal || e.target.closest('[data-act=close]')) toggleJournal(false); });
paintSettings();

/* ---------------- input ----------------
   Run: hold W / up / space, or hold the mouse on the scene, or hold the Run
   button. Push: A / D, left / right, or the Push buttons. Sun: E. */
const travelling = () => ['run', 'if', 'after'].includes(S.phase);
function setHeld(on) {
  S.held = on;
  runBtn.classList.toggle('held', on);
  palace.setRun(on && travelling());
  rings.setRun(on);
  capital.setRun(on);
  if (on && travelling() && promptEl.textContent.startsWith('Hold')) prompt('');
}
const onUI = t => t.closest && t.closest('button, textarea, input, a, #reflect, #intro, #journal, #settings, #pad, #dream, #choices, #prompt.tap');
window.addEventListener('pointerdown', e => {
  if (onUI(e.target) && !e.target.closest('#run')) return;
  if (e.target.closest && e.target.closest('#text')) { hurry(); return; }
  A.nudge();
  setHeld(true);
  if (e.pointerType !== 'mouse') drag = { x: e.clientX, y: e.clientY, lx: lookAt.x, ly: lookAt.y };
});
const release = () => { setHeld(false); drag = null; };
window.addEventListener('pointerup', release);
window.addEventListener('pointercancel', release);
window.addEventListener('blur', release);
const lookAt = { x: 0, y: 0 }; let drag = null;
window.addEventListener('pointermove', e => {
  const w = window.innerWidth, h = window.innerHeight;
  if (e.pointerType === 'mouse') { lookAt.x = e.clientX / w * 2 - 1; lookAt.y = e.clientY / h * 2 - 1; }
  else if (drag) { lookAt.x = drag.lx - (e.clientX - drag.x) / w * 2.4; lookAt.y = drag.ly - (e.clientY - drag.y) / h * 2.4; }
  else return;
  stage.setLook(lookAt.x, lookAt.y);
});
pushL.addEventListener('click', () => { if (travelling()) palace.push(-1); });
pushR.addEventListener('click', () => { if (travelling()) palace.push(1); });
sunBtn.addEventListener('click', () => { if (travelling()) palace.showSun(); });
/* A finger held on a touch screen is a right-click to Windows and the start of
   a selection to a phone. Here it means walk, run or lean in, so the menu stays shut. */
window.addEventListener('contextmenu', function (e) {
  if (!(e.target.closest && e.target.closest('textarea, input, #reflect'))) e.preventDefault();
});
const RUN_KEYS = { ArrowUp: 1, w: 1, W: 1, ' ': 1 };
window.addEventListener('keydown', e => {
  if (reflectionOpen() || S.phase === 'intro') return;
  if (e.target.closest && e.target.closest('textarea, input')) return;
  if (e.key === 'Escape' && !journal.hidden) { toggleJournal(false); return; }
  if (e.key === 'j' || e.key === 'J') { toggleJournal(); return; }
  if (e.key === 'v' || e.key === 'V') { voiceBtn.click(); return; }
  if (e.key === 'm' || e.key === 'M') { soundBtn.click(); return; }
  if (e.key === 'Enter' && hurryNow) { hurry(); e.preventDefault(); return; }
  if (RUN_KEYS[e.key]) { e.preventDefault(); if (!e.repeat) setHeld(true); return; }
  if (S.phase === 'prologue' && hurryNow && e.key === 'Enter') { hurry(); return; }
  if (S.phase === 'repeat') { const n = parseInt(e.key, 10); if (n >= 1 && n <= 6) { press(n - 1); e.preventDefault(); } return; }
  if (travelling()) {
    if (e.repeat) return;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') { palace.push(-1); e.preventDefault(); }
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') { palace.push(1); e.preventDefault(); }
    if ((e.key === 'e' || e.key === 'E') && !sunBtn.hidden) palace.showSun();
    if (e.key === 'f' || e.key === 'F') lookOut();
    if ((e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') && S.phase !== 'if') { palace.turnBack(true); S.back = performance.now(); }
    return;
  }
  const n = parseInt(e.key, 10);
  if (n >= 1 && choices.classList.contains('in')) { const bs = choices.querySelectorAll('button'); if (bs[n - 1]) { bs[n - 1].click(); e.preventDefault(); } }
});
window.addEventListener('keyup', e => {
  if (RUN_KEYS[e.key]) setHeld(false);
  if ((e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') && S.back) {
    palace.turnBack(false);
    if (performance.now() - S.back > 500 && !has('closed')) { narrate(T.back); unlock('closed'); }
    S.back = 0;
  }
});
/* the drum under the throng follows his pace; when the world is drawn in
   pencil, the words are written in ink */
let paper = false;
stage.onFrame(() => {
  if (stage.current() === palace) A.setPace(palace.st.v + palace.st.boost);
  const p = stage.postValue('ifness') > 0.55;
  if (p !== paper) { paper = p; document.body.classList.toggle('paper', p); }
});

$('begin').addEventListener('click', begin);
$('name').addEventListener('keydown', e => { if (e.key === 'Enter') begin(); });
try { $('name').value = localStorage.getItem('im:name') || ''; } catch (e) {}
$('proSkip').addEventListener('click', skipPrologue);
$('about').addEventListener('click', () => openReflection(null));
$('toReflect').addEventListener('click', () => openReflection(record(), restart, toHub));
$('again').addEventListener('click', restart);
$('toHub').addEventListener('click', toHub);
dreamEl.querySelector('[data-act=seal]').addEventListener('click', () => sealDream(false));
dreamEl.querySelector('[data-act=blank]').addEventListener('click', () => sealDream(true));

/* the title sits over your window, at the last of the afternoon */
setPhase('intro');
stage.show(win); win.place('seat'); win.evening(0.15, true);
stage.snapPost('fade', 0.35);
A.preload([]);

/* ---------------- test hooks for the headless harness ---------------- */
window.__game = {
  state: () => S, phase: () => S.phase, hurry, begin, skipPrologue,
  hold: on => setHeld(on), push: s => palace.push(s), sun: () => palace.showSun(), lookOut,
  press: k => press(k), seq: () => S.seq.slice(),
  choose: label => { const b = [...choices.querySelectorAll('button')].find(b => b.textContent === label); if (b && choices.classList.contains('in')) { b.click(); return true; } return false; },
  labels: () => [...choices.querySelectorAll('button')].map(b => b.textContent),
  choicesIn: () => choices.classList.contains('in'),
  padIn: () => padEl.classList.contains('in'),
  dreamIn: () => dreamEl.classList.contains('in'),
  seal: (text, blank) => { dreamEl.querySelector('textarea').value = text || ''; sealDream(blank); },
  runButton: () => { const r = runBtn.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), shown: controls.classList.contains('in'), disabled: runBtn.disabled }; },
  text: () => textEl.textContent, record, palace, court, rings, capital, win, stage, geos, THREE,
  post: k => stage.postValue(k),
  low: stage.LOW,
};
