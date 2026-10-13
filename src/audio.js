/* Audio for "Before the Law".
   Three sampled cues (drone, gate, bell) play through Howler, inlined as data
   URIs because audio fetched over file:// is blocked by CORS. Everything else
   - the score, the wind, footsteps, the heartbeat, the sounds from inside the
   hall - is synthesised here with WebAudio, so it costs no bytes. The voiced
   lines come from voice.gen.js (built by tools/make-voice.mjs); if that is
   empty, the game falls back to timed text and nothing else changes. */
import { Howl, Howler } from 'howler';
import { AUDIO } from './audio.gen.js';
import { VOICE } from './voice.gen.js';

const DRONE_VOL = 0.12;
let drone = null, gate = null, bell = null, built = false;

/* the harness needs to prove cues fire on the right beat, not just that
   the functions exist */
const log = [];
const t0 = Date.now();
function mark(name, extra) {
  log.push({ cue: name, at: Date.now() - t0, ...extra });
  window.__audio = { log, ready: () => ({ drone: !!drone && drone.state(), gate: gate && gate.state(), bell: bell && bell.state() }) };
}

const mk = (uri, opts) => new Howl(Object.assign({ src: [uri], format: ['mp3'] }, opts));
const store = {
  get(k, d) { try { const v = localStorage.getItem('btl:' + k); return v === null ? d : v === '1'; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('btl:' + k, v ? '1' : '0'); } catch (e) {} },
};

export function initAudio() {
  if (built) return;
  built = true;
  try {
    drone = mk(AUDIO.drone, { loop: true, volume: 0 });
    gate = mk(AUDIO.gate, { volume: 0.85 });
    bell = mk(AUDIO.bell, { volume: 0.45 });
    drone.once('load', () => mark('drone:loaded'));
    gate.once('load', () => mark('gate:loaded'));
    bell.once('load', () => mark('bell:loaded'));
    gate.on('play', () => mark('gate:play'));
    bell.on('play', () => mark('bell:play'));
    drone.on('play', () => mark('drone:play'));
    drone.play();
    drone.fade(0, DRONE_VOL, 7000);
    Howler.mute(!store.get('sound', true));
  } catch (e) { mark('init:failed', { err: String(e) }); }
  graph();
}

/* Howler unlocks the context on the first gesture by itself, but the drone's
   play() may have been refused before that, so re-assert it. */
export function nudgeAudio() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
  if (!drone || ending) return;
  if (!drone.playing()) { drone.play(); drone.fade(0, DRONE_VOL, 5000); }
}

export function playBell() { if (bell) bell.play(); }
export function playGate() { if (gate) gate.play(); }

/* ---------------- the graph ----------------
   master <- music (ducks under speech), sfx, voice; plus a shared stone-hall
   reverb that anything can send to. */
let ctx = null, musicBus, sfxBus, voiceBus, verbIn, noise = null;
function graph() {
  if (ctx) return true;
  ctx = Howler.ctx;
  if (!ctx) return false;
  const out = Howler.masterGain || ctx.destination;
  musicBus = ctx.createGain(); musicBus.gain.value = 0.9; musicBus.connect(out);
  sfxBus = ctx.createGain(); sfxBus.connect(out);
  voiceBus = ctx.createGain(); voiceBus.connect(out);
  const verb = ctx.createConvolver();
  verb.buffer = impulse(3.6, 2.6);
  verbIn = ctx.createGain();
  const verbOut = ctx.createGain(); verbOut.gain.value = 0.55;
  verbIn.connect(verb); verb.connect(verbOut); verbOut.connect(out);
  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return true;
}
const live = () => graph() && ctx.state === 'running';

/* a stone room: decaying noise, darker as it fades */
function impulse(sec, decay) {
  const n = Math.round(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      lp += (Math.random() * 2 - 1 - lp) * (0.5 - 0.42 * t);
      d[i] = lp * Math.pow(1 - t, decay);
    }
  }
  return b;
}

function env(g, t, peak, a, r, hold) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  if (hold) g.gain.setValueAtTime(peak, t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + (hold || 0) + r);
}

function burst(freq, q, peak, attack, release, opts) {
  if (!live()) return;
  const o = opts || {};
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = noise;
  f.type = o.type || 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const t = ctx.currentTime + (o.delay || 0);
  env(g, t, peak, attack, release);
  src.connect(f); f.connect(g); g.connect(o.dry === 0 ? verbIn : sfxBus);
  if (o.wet) { const w = ctx.createGain(); w.gain.value = o.wet; g.connect(w); w.connect(verbIn); }
  src.start(t, Math.random() * 1.5);
  src.stop(t + attack + release + 0.05);
}

function tone(freq, peak, attack, release, opts) {
  if (!live()) return;
  const o = opts || {};
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = o.type || 'sine';
  const t = ctx.currentTime + (o.delay || 0);
  osc.frequency.setValueAtTime(freq, t);
  if (o.drop) osc.frequency.exponentialRampToValueAtTime(freq * o.drop, t + attack + release);
  env(g, t, peak, attack, release, o.hold);
  osc.connect(g); g.connect(o.bus || sfxBus);
  if (o.wet) { const w = ctx.createGain(); w.gain.value = o.wet; g.connect(w); w.connect(verbIn); }
  osc.start(t); osc.stop(t + attack + (o.hold || 0) + release + 0.05);
}

/* ---------------- effects ---------------- */
/* scuff on stone; each one a little different */
export function playStep(strength) {
  const s = 0.35 + 0.65 * (strength || 1);
  burst(260 + Math.random() * 120, 1.1, 0.16 * s, 0.006, 0.11, { wet: 0.15 });
  burst(1800 + Math.random() * 600, 0.8, 0.035 * s, 0.002, 0.05);
  mark('step');
}

/* years going by: a long, low exhalation of wind under the drone */
export function playYears(ms) {
  const sec = Math.max(0.8, ms / 1000);
  burst(420, 0.6, 0.07, sec * 0.45, sec * 0.7);
  mark('years', { ms });
}

/* one year: a soft wooden tick, each a shade lower than the last */
let yearTicks = 0;
export function playYearTick() {
  const f = Math.max(380, 1050 - yearTicks * 12);
  yearTicks++;
  tone(f, 0.05, 0.002, 0.16, { wet: 0.3 });
  burst(f * 2, 4, 0.03, 0.001, 0.04);
}
export function resetYearTicks() { yearTicks = 0; }

/* a soft knock: something set down at his feet */
export function playGive() {
  burst(160, 2.2, 0.22, 0.004, 0.18, { wet: 0.2 });
  burst(700, 1.5, 0.05, 0.003, 0.09);
}

/* packing in the prologue: cloth and a buckle */
export function playPack(i) {
  burst(220 + i * 30, 1.4, 0.12, 0.01, 0.2);
  tone(1400 + i * 90, 0.02, 0.002, 0.12, { delay: 0.05, wet: 0.2 });
}

/* "It is still running." */
export function playWatch(sec) {
  for (let i = 0; i < sec * 2; i++) burst(i % 2 ? 3200 : 2600, 9, 0.025, 0.001, 0.03, { delay: 0.6 + i * 0.5 });
}

/* buttons: barely there, but the hand feels it */
export function playHover() { tone(1250, 0.012, 0.003, 0.05); }
export function playChoose() { tone(140, 0.09, 0.004, 0.22, { drop: 0.7, wet: 0.2 }); burst(900, 2, 0.02, 0.002, 0.06); }

/* a discovery: two quiet bells */
export function playInsight() {
  tone(880, 0.06, 0.004, 2.2, { wet: 0.6 });
  tone(1320, 0.04, 0.004, 2.6, { delay: 0.18, wet: 0.6 });
  tone(2420, 0.012, 0.004, 1.4, { delay: 0.18, wet: 0.6 });
}

/* looking through the gate: the hall is unlit, but it is not empty of sound.
   Footsteps far off, a door somewhere very deep, then nothing. */
export function playHallDepth() {
  if (!live()) return;
  for (let i = 0; i < 6; i++) burst(300 + Math.random() * 60, 2, 0.05, 0.004, 0.09, { delay: 1.2 + i * 0.62, dry: 0 });
  tone(46, 0.22, 0.01, 2.8, { delay: 5.6, drop: 0.8, wet: 1.2 });
  burst(120, 1, 0.12, 0.01, 1.4, { delay: 5.6, dry: 0 });
  mark('hall');
}

/* the imagined halls: one deep, far-off boom for each gate, each lower */
export function playVision() {
  for (let i = 0; i < 6; i++) {
    tone(52 - i * 4, 0.18 + i * 0.02, 0.4, 3.2, { delay: 0.8 + i * 0.9, drop: 0.85, wet: 1.4 });
    burst(90 - i * 8, 1.2, 0.05, 0.3, 2.2, { delay: 0.8 + i * 0.9, dry: 0 });
  }
  mark('vision');
}

/* a curse thrown at the hall comes back out of it */
export function playEcho() {
  for (let i = 0; i < 4; i++) burst(420 - i * 40, 0.9, 0.07 / (i + 1), 0.05, 0.6, { delay: 0.35 + i * 0.42, dry: 0 });
  mark('echo');
}

/* a mark scratched into stone */
export function playScratch() {
  for (let i = 0; i < 3; i++) burst(2600 + Math.random() * 800, 3, 0.05, 0.01, 0.16, { delay: 0.4 + i * 0.28 });
}

/* ---------------- suspense: the heartbeat ----------------
   Runs while you walk at the gate, quickening as you near it. */
let beat = null;
export function heartbeat(on, from, to, sec) {
  if (beat) { clearTimeout(beat.t); beat = null; }
  if (!on || !live()) return;
  beat = { start: performance.now(), from, to, sec };
  duckMusic(0.25, 1.5);
  (function thump() {
    if (!beat) return;
    const u = Math.min(1, (performance.now() - beat.start) / (beat.sec * 1000));
    const bpm = beat.from + (beat.to - beat.from) * u;
    tone(58, 0.32, 0.006, 0.16, { drop: 0.6 });
    tone(52, 0.22, 0.006, 0.18, { delay: 0.24, drop: 0.6 });
    beat.t = setTimeout(thump, 60000 / bpm);
  })();
  mark('heartbeat');
}
export function heartbeatOff() { heartbeat(false); duckMusic(1, 3); }

/* ---------------- the score ----------------
   A slow pad under a cello that plays a note now and then. Each stage has
   its own chord and its own patience; the radiance gets the only major
   chord in the piece. All of it ducks under the voice. */
const N = n => 440 * Math.pow(2, (n - 69) / 12);
const MOODS = {
  prologue: { pad: [38, 45, 53], gain: 0.05, notes: [62, 65, 64, 57, 60, 62, 69], every: [7, 11], cello: 0.05 },
  arrive:   { pad: [38, 45, 50], gain: 0.05, notes: [50, 53, 52, 45, 48, 50], every: [9, 15], cello: 0.05 },
  wait:     { pad: [33, 40, 45], gain: 0.04, notes: [45, 44, 41, 40, 45, 38], every: [15, 26], cello: 0.04 },
  radiance: { pad: [38, 45, 54, 57, 62], gain: 0.05, notes: [69, 74, 78, 76, 81], every: [5, 9], bell: true },
};
let pad = [], mood = null, noteT = null, musicDuck = 1, musicGain = null;
function padVoice(m, f, peak) {
  const g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 420 + f; lp.Q.value = 0.4;
  const oscs = [-6, 5].map(cents => {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = cents;
    o.connect(lp); o.start(); return o;
  });
  const lfo = ctx.createOscillator(), lg = ctx.createGain();
  lfo.frequency.value = 0.05 + Math.random() * 0.06; lg.gain.value = 140;
  lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
  lp.connect(g); g.connect(musicGain);
  const w = ctx.createGain(); w.gain.value = 0.5; g.connect(w); w.connect(verbIn);
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 6);
  return { g, stop: when => { g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setValueAtTime(g.gain.value, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + when); setTimeout(() => { oscs.forEach(o => o.stop()); lfo.stop(); }, when * 1000 + 200); } };
}
function cello(f, peak) {
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(), t = ctx.currentTime;
  lp.type = 'lowpass'; lp.Q.value = 1.2;
  lp.frequency.setValueAtTime(300, t); lp.frequency.linearRampToValueAtTime(900 + f, t + 1.6); lp.frequency.linearRampToValueAtTime(400, t + 6);
  const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
  const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.006, t + 2);
  vib.connect(vg); vg.connect(o.frequency);
  o.connect(lp); lp.connect(g); g.connect(musicGain);
  const w = ctx.createGain(); w.gain.value = 0.8; g.connect(w); w.connect(verbIn);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 1.4);
  g.gain.setValueAtTime(peak, t + 2.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 7);
  o.start(t); vib.start(t); o.stop(t + 7.2); vib.stop(t + 7.2);
}
export function setMood(name) {
  if (!live() || name === mood) return;
  if (!musicGain) { musicGain = ctx.createGain(); musicGain.connect(musicBus); }
  mood = name;
  pad.forEach(p => p.stop(5));
  pad = [];
  clearTimeout(noteT);
  if (!MOODS[name]) return;
  const m = MOODS[name];
  pad = m.pad.map(n => padVoice(m, N(n), m.gain / m.pad.length * 2));
  if (m.bell) { tone(N(81), 0.05, 0.01, 5, { bus: musicGain, wet: 1 }); tone(N(86), 0.03, 0.01, 6, { bus: musicGain, wet: 1, delay: 0.4 }); }
  (function next() {
    const wait = (m.every[0] + Math.random() * (m.every[1] - m.every[0])) * 1000;
    noteT = setTimeout(() => {
      if (mood !== name) return;
      const n = m.notes[Math.floor(Math.random() * m.notes.length)];
      if (m.bell) { tone(N(n), 0.03, 0.005, 4.5, { bus: musicGain, wet: 1 }); tone(N(n) * 2.76, 0.006, 0.005, 2, { bus: musicGain, wet: 1 }); }
      else cello(N(n), m.cello);
      next();
    }, wait);
  })();
  mark('mood:' + name);
}
function duckMusic(to, sec) {
  if (!musicBus) return;
  musicDuck = to;
  const t = ctx.currentTime;
  musicBus.gain.cancelScheduledValues(t);
  musicBus.gain.setValueAtTime(musicBus.gain.value, t);
  musicBus.gain.linearRampToValueAtTime(0.9 * to, t + sec);
}

/* wind across open country: always there, quieter once you are sat by the wall */
let wind = null;
export function setWind(level) {
  if (!live()) return;
  if (!wind) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    src.buffer = noise; src.loop = true;
    f.type = 'bandpass'; f.frequency.value = 380; f.Q.value = 0.7;
    lfo.frequency.value = 0.07; lg.gain.value = 160; lfo.connect(lg); lg.connect(f.frequency);
    src.connect(f); f.connect(g); g.connect(sfxBus);
    g.gain.value = 0.0001;
    src.start(); lfo.start();
    wind = { g, src, lfo };
  }
  const t = ctx.currentTime;
  wind.g.gain.cancelScheduledValues(t);
  wind.g.gain.setValueAtTime(Math.max(0.0001, wind.g.gain.value), t);
  wind.g.gain.linearRampToValueAtTime(Math.max(0.0001, level), t + 3);
}

/* the ending wants real silence around the gate: drone, score and wind all
   go down under the black fade rather than running through the beat */
let ending = false;
export function duckForEnding(ms) {
  ending = true;
  mark('drone:duck');
  if (drone) {
    drone.fade(drone.volume(), 0, ms);
    setTimeout(() => { try { drone.stop(); } catch (e) {} }, ms + 120);
  }
  heartbeat(false);
  if (live()) { setMood(null); setWind(0.0001); }
}
export function resumeAfterEnding() { ending = false; mood = null; resetYearTicks(); nudgeAudio(); }

/* ---------------- the voice ---------------- */
/* must match hashLine() in tools/make-voice.mjs */
export function hashLine(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
let voiceOn = store.get('voice', true), speaking = null;
const decoded = new Map();
export const voiceAvailable = () => Object.keys(VOICE).length > 0;
export const voiceEnabled = () => voiceOn && voiceAvailable();
export function setVoice(on) { voiceOn = on; store.set('voice', on); if (!on) hush(); }
export function soundOn() { return !Howler._muted; }
export function setSound(on) { Howler.mute(!on); store.set('sound', on); }

function buffer(h) {
  if (!decoded.has(h)) {
    const bin = atob(VOICE[h].slice(VOICE[h].indexOf(',') + 1));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    decoded.set(h, ctx.decodeAudioData(bytes.buffer));
  }
  return decoded.get(h);
}
/* decode the next lines ahead of time, so a line never waits on its audio */
export function preload(lines) {
  if (!voiceEnabled() || !graph()) return;
  for (const l of lines) { const h = hashLine(l); if (VOICE[h]) buffer(h).catch(() => {}); }
}
/* resolves true when the line has been spoken, false at once if it cannot be
   (voice off, no file, audio locked) - the caller then times the line itself */
export function speak(line) {
  hush();
  const h = hashLine(line);
  if (!voiceEnabled() || !VOICE[h] || !live() || Howler._muted) return Promise.resolve(false);
  return buffer(h).then(buf => new Promise(res => {
    const src = ctx.createBufferSource();
    src.buffer = buf; src.connect(voiceBus);
    duckMusic(Math.min(musicDuck, 0.45), 0.6);
    const me = { src, res, done: false };
    src.onended = () => { if (me.done) return; me.done = true; if (speaking === me) { speaking = null; duckMusic(beat ? 0.25 : 1, 2); } res(true); };
    speaking = me;
    src.start();
    mark('voice', { h });
  }), () => false);
}
/* stop the current line now; whoever is waiting on it carries on */
export function hush() {
  if (!speaking) return;
  const me = speaking; speaking = null;
  me.done = true;
  try { me.src.stop(); } catch (e) {}
  me.res(true);
}

export function audioState() {
  return { built, log: log.slice(), muted: Howler._muted, voice: voiceEnabled(), lines: Object.keys(VOICE).length };
}
window.__audioState = audioState;
