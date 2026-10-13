/* Sound for "An Imperial Message". All of it is synthesised here with
   WebAudio - nothing is sampled, so it costs no bytes and owes no one an
   attribution. The voiced narration comes from voice.gen.js (made by
   tools/make-voice.mjs im); if that is empty the text is simply timed.

   Some sounds return on purpose: the knocking the messenger would make on
   your door is the same knock the shutter makes at your window, and the
   whisper's glyph tones come back as stars when you dream the message. */
import { VOICE } from './voice.gen.js';

let ctx = null, master, musicBus, sfxBus, voiceBus, verbIn, noise = null, pink = null;
const log = [];
const mark = (cue, extra) => { log.push({ cue, at: Math.round(performance.now()), ...extra }); };
window.__imAudio = { log };

const store = {
  get(k, d) { try { const v = localStorage.getItem('im:' + k); return v === null ? d : v === '1'; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('im:' + k, v ? '1' : '0'); } catch (e) {} },
};
let soundOn = store.get('sound', true), voiceOn = store.get('voice', true);

export function init() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  master = ctx.createGain(); master.gain.value = soundOn ? 1 : 0; master.connect(ctx.destination);
  musicBus = ctx.createGain(); musicBus.gain.value = 0.8; musicBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.connect(master);
  voiceBus = ctx.createGain(); voiceBus.gain.value = 1.1; voiceBus.connect(master);
  const verb = ctx.createConvolver(); verb.buffer = impulse(3.2, 2.4);
  verbIn = ctx.createGain(); const verbOut = ctx.createGain(); verbOut.gain.value = 0.5;
  verbIn.connect(verb); verb.connect(verbOut); verbOut.connect(master);
  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  /* pink-ish noise for wind and crowds */
  pink = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const p = pink.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < p.length; i++) { const w = Math.random() * 2 - 1; b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048; p[i] = (b0 + b1 + b2) * 2.2; }
  mark('init');
}
export const nudge = () => { if (ctx && ctx.state === 'suspended') ctx.resume(); };
const live = () => ctx && ctx.state === 'running';
export const isOn = () => soundOn;
export function setSound(on) { soundOn = on; store.set('sound', on); if (master) master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.1); if (!on) hush(); }

function impulse(sec, decay) {
  const n = Math.round(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c); let lp = 0;
    for (let i = 0; i < n; i++) { const t = i / n; lp += (Math.random() * 2 - 1 - lp) * (0.55 - 0.45 * t); d[i] = lp * Math.pow(1 - t, decay); }
  }
  return b;
}
function env(g, t, peak, a, r, hold) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  if (hold) g.gain.setValueAtTime(Math.max(0.0002, peak), t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + (hold || 0) + r);
}
function burst(freq, q, peak, a, r, o = {}) {
  if (!live()) return;
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = o.pink ? pink : noise;
  f.type = o.type || 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const t = ctx.currentTime + (o.delay || 0);
  if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t + a + r);
  env(g, t, peak, a, r, o.hold);
  src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
  if (o.wet) { const w = ctx.createGain(); w.gain.value = o.wet; g.connect(w); w.connect(verbIn); }
  if (o.rate) src.playbackRate.value = o.rate;
  src.start(t, Math.random() * 1.5); src.stop(t + a + (o.hold || 0) + r + 0.05);
}
function tone(freq, peak, a, r, o = {}) {
  if (!live()) return;
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = o.type || 'sine';
  const t = ctx.currentTime + (o.delay || 0);
  osc.frequency.setValueAtTime(freq, t);
  if (o.drop) osc.frequency.exponentialRampToValueAtTime(freq * o.drop, t + a + (o.hold || 0) + r);
  if (o.detune) osc.detune.value = o.detune;
  env(g, t, peak, a, r, o.hold);
  let node = osc;
  if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
  node.connect(g); g.connect(o.bus || sfxBus);
  if (o.wet) { const w = ctx.createGain(); w.gain.value = o.wet; g.connect(w); w.connect(verbIn); }
  osc.start(t); osc.stop(t + a + (o.hold || 0) + r + 0.05);
}
const N = n => 440 * Math.pow(2, (n - 69) / 12);

/* ---------------- loops: wind, crickets, the crowd ---------------- */
function loop(buf, type, freq, q, bus) {
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = buf; src.loop = true;
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.value = 0.0001;
  src.connect(f); f.connect(g); g.connect(bus || sfxBus);
  src.start(0, Math.random() * 2);
  return { src, f, g };
}
const beds = {};
function level(node, v, sec = 2) {
  const t = ctx.currentTime;
  node.g.gain.cancelScheduledValues(t);
  node.g.gain.setValueAtTime(Math.max(0.0001, node.g.gain.value), t);
  node.g.gain.linearRampToValueAtTime(Math.max(0.0001, v), t + sec);
}
function ensureBeds() {
  if (beds.wind || !live()) return !!beds.wind;
  beds.wind = loop(pink, 'bandpass', 420, 0.6);
  const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.08; lg.gain.value = 180;
  lfo.connect(lg); lg.connect(beds.wind.f.frequency); lfo.start();
  /* crickets: a high band, gated by a fast pulse */
  beds.crickets = loop(noise, 'bandpass', 4600, 14);
  const gate = ctx.createGain(); gate.gain.value = 0;
  beds.crickets.g.disconnect(); beds.crickets.g.connect(gate); gate.connect(sfxBus);
  const chirp = ctx.createOscillator(); chirp.type = 'square'; chirp.frequency.value = 22;
  const cg = ctx.createGain(); cg.gain.value = 0.5; chirp.connect(cg); cg.connect(gate.gain); chirp.start();
  const slow = ctx.createOscillator(); slow.type = 'square'; slow.frequency.value = 0.9;
  const sg = ctx.createGain(); sg.gain.value = 0.5; slow.connect(sg); sg.connect(gate.gain); slow.start();
  /* the crowd: low murmuring bands, each breathing at its own pace */
  beds.crowd = [380, 620, 900, 1500].map((f, i) => {
    const n = loop(pink, 'bandpass', f, 3.5);
    const l = ctx.createOscillator(), g = ctx.createGain(); l.frequency.value = 0.3 + i * 0.17; g.gain.value = f * 0.15;
    l.connect(g); g.connect(n.f.frequency); l.start();
    return n;
  });
  return true;
}
export function setWind(v) { if (ensureBeds()) level(beds.wind, v * 0.5); }
export function setCrickets(v) { if (ensureBeds()) level(beds.crickets, v * 0.05); }
let crowdLevel = 0, babbleT = null;
export function setCrowd(v, sec = 2) {
  if (!ensureBeds()) return;
  crowdLevel = v;
  beds.crowd.forEach((n, i) => level(n, v * [0.5, 0.35, 0.2, 0.06][i], sec));
  if (v > 0 && !babbleT) babble();
}
/* single voices rising out of the murmur: short vowel sounds, nobody's words */
function babble() {
  babbleT = setTimeout(() => {
    babbleT = null;
    if (crowdLevel <= 0.01 || !live()) return;
    const f0 = 110 + Math.random() * 140, t = ctx.currentTime;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(f0, t); osc.frequency.linearRampToValueAtTime(f0 * (0.85 + Math.random() * 0.3), t + 0.3);
    const vow = [[700, 1200], [400, 2000], [300, 800], [500, 1700]][Math.floor(Math.random() * 4)];
    const out = ctx.createGain(); out.gain.value = 0;
    for (const fr of vow) { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fr; f.Q.value = 8; osc.connect(f); f.connect(out); }
    out.connect(g); g.connect(sfxBus);
    const w = ctx.createGain(); w.gain.value = 0.6; g.connect(w); w.connect(verbIn);
    env(g, t, 0.05 * crowdLevel * (0.4 + Math.random()), 0.04, 0.25 + Math.random() * 0.3);
    out.gain.value = 1;
    osc.start(t); osc.stop(t + 0.7);
    babble();
  }, 120 + Math.random() * 600 / Math.max(0.2, crowdLevel));
}

/* ---------------- effects ---------------- */
export function step(speed, open) {
  const s = Math.min(1, 0.4 + speed / 6);
  burst(open ? 380 : 240, 1.2, 0.14 * s, 0.005, 0.1, { wet: open ? 0.05 : 0.2 });
  burst(2000, 0.9, 0.03 * s, 0.002, 0.04);
}
export function push(alt) {
  /* a shove: cloth, a body, a grunt that is nobody's */
  burst(170, 1.6, 0.28, 0.008, 0.16, { wet: 0.15 });
  burst(900 + Math.random() * 400, 1.2, 0.07, 0.01, 0.18);
  if (alt) tone(120 + Math.random() * 30, 0.03, 0.02, 0.15, { type: 'sawtooth', lp: 600 });
  mark('push');
}
export function sun() {
  /* the sign of the sun: a bright swell, and the crowd's breath going out */
  [0, 4, 7, 12, 16].forEach((n, i) => tone(N(64 + n), 0.05, 0.25, 2.6, { delay: i * 0.05, wet: 0.9 }));
  tone(N(88), 0.015, 0.01, 1.8, { delay: 0.2, wet: 1 });
  burst(800, 0.7, 0.12, 0.6, 1.4, { pink: true, wet: 0.5, sweep: 300 });
  mark('sun');
}
export function bell() {
  /* a great bronze bell, slightly out of tune with itself */
  const f = 73;
  [[1, 0.3, 9], [2.02, 0.16, 7], [2.74, 0.12, 6], [4.15, 0.07, 4], [5.43, 0.05, 3], [0.5, 0.18, 10]].forEach(([k, p, r]) =>
    tone(f * k, p, 0.008, r, { wet: 1.2 }));
  burst(220, 2, 0.12, 0.004, 0.4, { wet: 0.8 });
  mark('bell');
}
export function distantBell() { [1, 2.02, 2.74].forEach((k, i) => tone(98 * k, 0.05 / (i + 1), 0.01, 4, { wet: 1.5 })); }
/* the knock: three blows on a wooden door. "Glorious" when it is his fists. */
export function knock(n = 3, glorious) {
  for (let i = 0; i < n; i++) {
    const d = i * (glorious ? 0.36 : 0.42) + (i === n - 1 && !glorious ? 0.12 : 0);
    burst(150, 2.5, glorious ? 0.6 : 0.4, 0.002, 0.18, { delay: d, wet: glorious ? 0.8 : 0.3 });
    tone(95, glorious ? 0.35 : 0.2, 0.002, 0.2, { delay: d, drop: 0.7 });
    burst(1100, 3, 0.06, 0.001, 0.05, { delay: d });
  }
  if (glorious) [0, 7, 12].forEach((n2, i) => tone(N(60 + n2), 0.03, 0.4, 3, { delay: n * 0.36 + i * 0.1, wet: 1 }));
  mark('knock', { glorious: !!glorious });
}
export function shutter() { knock(2); burst(500, 1, 0.05, 0.3, 0.6, { delay: 0.9, pink: true }); }
/* the whisper: breath shaped into syllables that never become words */
export function whisper(sec, glyphTimes = []) {
  if (!live()) return;
  const t0 = ctx.currentTime;
  for (let i = 0; i < sec * 3; i++) {
    const d = i / 3 + Math.random() * 0.1;
    const fr = [[2400, 1.4], [3200, 2], [1800, 1.2], [5200, 3]][Math.floor(Math.random() * 4)];
    burst(fr[0], fr[1], 0.05 + Math.random() * 0.04, 0.04, 0.14 + Math.random() * 0.12, { delay: d, sweep: fr[0] * (0.7 + Math.random() * 0.6) });
  }
  burst(1200, 0.7, 0.03, 0.4, sec, { pink: true, delay: 0 });
  mark('whisper', { at: t0 });
}
/* each glyph has its own note, from a pentatonic scale */
const PENTA = [67, 69, 72, 74, 76, 79];
export function glyph(k, soft) {
  tone(N(PENTA[k]), soft ? 0.03 : 0.07, 0.006, 2.2, { wet: 0.8 });
  tone(N(PENTA[k] + 12) * 1.003, soft ? 0.008 : 0.02, 0.006, 1.2, { wet: 0.8 });
}
export function wrong() { tone(N(55), 0.05, 0.01, 0.8, { drop: 0.94, wet: 0.5 }); }
export function nod() { burst(400, 0.8, 0.08, 0.2, 0.5, { pink: true }); tone(N(60), 0.04, 0.3, 3, { wet: 1 }); tone(N(67), 0.03, 0.3, 3, { wet: 1, delay: 0.15 }); }
export function breath(i) { burst(900, 0.9, 0.04, 0.9, 1.4, { pink: true, delay: i || 0 }); }
export function seal() { tone(70, 0.3, 0.004, 0.3, { drop: 0.6 }); burst(300, 1, 0.15, 0.004, 0.2); }
export function hover() { tone(1250, 0.01, 0.003, 0.05); }
export function choose() { tone(150, 0.08, 0.004, 0.2, { drop: 0.7, wet: 0.2 }); burst(900, 2, 0.02, 0.002, 0.06); }
export function insight() { tone(880, 0.05, 0.004, 2.2, { wet: 0.6 }); tone(1320, 0.035, 0.004, 2.6, { delay: 0.18, wet: 0.6 }); }
export function tick(k) { tone(Math.max(300, 1100 - k * 6), 0.03, 0.002, 0.1, { wet: 0.2 }); }
export function rise() { burst(300, 0.6, 0.18, 2.5, 1.5, { pink: true, sweep: 2500, wet: 0.6 }); tone(40, 0.25, 2, 2, { drop: 1.5 }); }
export function boom() {
  tone(42, 0.6, 0.01, 3, { drop: 0.6, wet: 1 });
  burst(120, 0.8, 0.5, 0.01, 2.2, { pink: true, wet: 1, sweep: 40 });
  burst(2400, 0.5, 0.06, 0.01, 1.4, { wet: 1 });
  mark('boom');
}
/* "but never, never": a crack, then the drawing tears and rewinds */
export function crack() { burst(3000, 0.8, 0.3, 0.001, 0.25); burst(600, 1.5, 0.2, 0.001, 0.4, { wet: 0.6 }); mark('crack'); }
export function rewind(sec = 2.4) {
  burst(400, 0.7, 0.25, sec * 0.9, 0.3, { pink: true, sweep: 6000 });
  for (let i = 0; i < 18; i++) burst(1500 + Math.random() * 3000, 4, 0.05, 0.002, 0.05, { delay: i * sec / 18 * (1 - i / 40) });
  tone(300, 0.08, 0.05, sec, { drop: 0.2, type: 'sawtooth', lp: 900 });
  mark('rewind');
}
export function whoosh() { burst(600, 0.6, 0.2, 0.8, 1.2, { pink: true, sweep: 150, wet: 0.4 }); }

/* ---------------- the score ----------------
   Moods: a pad and a voice that plays a note now and then. The thousand
   years get a Shepard tone: a pitch that rises for ever and never arrives. */
const MOODS = {
  window: { pad: [50, 57, 62, 66], gain: 0.04, notes: [74, 76, 78, 81, 83], every: [4, 9], pluck: true },
  court: { pad: [38, 45, 50, 53], gain: 0.05, notes: [62, 65, 69, 67, 60], every: [6, 11], bell: true },
  throng: { pad: [36, 43, 48, 51], gain: 0.045, notes: [55, 58, 60, 63], every: [5, 9], pulse: true },
  open: { pad: [43, 50, 55, 59, 62], gain: 0.05, notes: [67, 71, 74, 79], every: [2.5, 5], pluck: true },
  if: { pad: [55, 62, 67, 71], gain: 0.03, notes: [79, 83, 86, 88], every: [3, 6], pluck: true, glass: true },
  millennia: { pad: [], gain: 0, notes: [], every: [99, 99], shepard: true },
  capital: { pad: [41, 48, 53, 57, 60], gain: 0.05, notes: [], every: [99, 99] },
  night: { pad: [45, 52, 57, 61], gain: 0.03, notes: [69, 73, 76, 81], every: [5, 11], pluck: true },
};
let musicGain = null, pad = [], mood = null, noteT = null, pulseT = null, shep = null, pace = 0;
function padVoice(f, peak, glass) {
  const g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = glass ? 2400 : 500 + f; lp.Q.value = 0.5;
  const oscs = [-7, 6].map(c => { const o = ctx.createOscillator(); o.type = glass ? 'triangle' : 'sawtooth'; o.frequency.value = f; o.detune.value = c; o.connect(lp); o.start(); return o; });
  const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.05 + Math.random() * 0.07; lg.gain.value = 160;
  lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
  lp.connect(g); g.connect(musicGain);
  const w = ctx.createGain(); w.gain.value = 0.6; g.connect(w); w.connect(verbIn);
  g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 5);
  return { stop(sec) { const t = ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t); g.gain.exponentialRampToValueAtTime(0.0001, t + sec); setTimeout(() => { oscs.forEach(o => o.stop()); lfo.stop(); }, sec * 1000 + 200); } };
}
function pluck(f, peak) {
  tone(f, peak, 0.004, 3.5, { bus: musicGain, wet: 0.9, type: 'triangle', lp: 2200 });
  tone(f * 2, peak * 0.2, 0.004, 1.2, { bus: musicGain, wet: 0.9 });
}
function cello(f, peak) {
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(), t = ctx.currentTime;
  lp.type = 'lowpass'; lp.Q.value = 1.1;
  lp.frequency.setValueAtTime(300, t); lp.frequency.linearRampToValueAtTime(900 + f, t + 1.6); lp.frequency.linearRampToValueAtTime(400, t + 6);
  const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
  o.connect(lp); lp.connect(g); g.connect(musicGain);
  const w = ctx.createGain(); w.gain.value = 0.8; g.connect(w); w.connect(verbIn);
  env(g, t, peak, 1.4, 4.5, 1.2);
  o.start(t); o.stop(t + 7.2);
}
export function setMood(name) {
  if (!live() || name === mood) return;
  if (!musicGain) { musicGain = ctx.createGain(); musicGain.connect(musicBus); }
  mood = name;
  pad.forEach(p => p.stop(4)); pad = [];
  clearTimeout(noteT); clearTimeout(pulseT); pulseT = null;
  if (shep) { shep.stop(); shep = null; }
  const m = MOODS[name];
  if (!m) return;
  pad = m.pad.map(n => padVoice(N(n), m.gain / Math.max(1, m.pad.length) * 2, m.glass));
  if (m.shepard) shep = shepard();
  if (m.pulse) pulse();
  (function next() {
    const wait = (m.every[0] + Math.random() * (m.every[1] - m.every[0])) * 1000;
    noteT = setTimeout(() => {
      if (mood !== name) return;
      const n = m.notes[Math.floor(Math.random() * m.notes.length)];
      if (n) { if (m.pluck) pluck(N(n), 0.035); else if (m.bell) { tone(N(n), 0.025, 0.005, 4, { bus: musicGain, wet: 1 }); tone(N(n) * 2.76, 0.006, 0.005, 2, { bus: musicGain, wet: 1 }); } else cello(N(n), 0.04); }
      next();
    }, wait);
  })();
  mark('mood:' + name);
}
/* the drum under the throng follows his pace */
export function setPace(v) { pace = v; }
function pulse() {
  const beat = () => {
    if (mood !== 'throng') return;
    const k = Math.min(1, pace / 5);
    tone(58, 0.12 + 0.18 * k, 0.005, 0.25, { drop: 0.5, bus: musicGain });
    if (k > 0.4) burst(2500, 1.5, 0.015 * k, 0.002, 0.05, { delay: 0.25, bus: musicGain });
    pulseT = setTimeout(beat, 60000 / (52 + 70 * k));
  };
  beat();
}
function shepard() {
  const voices = [], g = ctx.createGain(); g.gain.value = 0.0001; g.connect(musicGain);
  g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 4);
  const w = ctx.createGain(); w.gain.value = 0.5; g.connect(w); w.connect(verbIn);
  for (let i = 0; i < 7; i++) {
    const o = ctx.createOscillator(), vg = ctx.createGain();
    o.type = 'sine'; o.connect(vg); vg.connect(g); o.start();
    voices.push({ o, vg, k: i / 7 });
  }
  let rate = 0.035, alive = true;
  const step = () => {
    if (!alive) return;
    for (const v of voices) {
      v.k = (v.k + rate * 0.05) % 1;
      const f = 40 * Math.pow(2, v.k * 7);
      const a = Math.exp(-Math.pow((v.k - 0.5) * 3.2, 2));
      v.o.frequency.setTargetAtTime(f, ctx.currentTime, 0.03);
      v.vg.gain.setTargetAtTime(a * 0.4, ctx.currentTime, 0.05);
    }
    rate = Math.min(0.12, rate + 0.0002);
    setTimeout(step, 50);
  };
  step();
  return { stop() { alive = false; const t = ctx.currentTime; g.gain.setTargetAtTime(0.0001, t, 0.8); setTimeout(() => voices.forEach(v => v.o.stop()), 4000); } };
}
export function duck(to, sec = 1) {
  if (!musicBus) return;
  const t = ctx.currentTime;
  musicBus.gain.cancelScheduledValues(t);
  musicBus.gain.setValueAtTime(musicBus.gain.value, t);
  musicBus.gain.linearRampToValueAtTime(0.8 * to, t + sec);
}
export function silence(sec = 3) {
  if (!live()) return;
  setMood(null); setCrowd(0, sec); setWind(0); setCrickets(0);
}

/* ---------------- the voice ---------------- */
/* must match hashLine() in tools/make-voice.mjs */
export function hashLine(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
const decoded = new Map();
let speaking = null;
export const voiceAvailable = () => Object.keys(VOICE).length > 0;
export const voiceEnabled = () => voiceOn && voiceAvailable();
export function setVoice(on) { voiceOn = on; store.set('voice', on); if (!on) hush(); }
function buffer(h) {
  if (!decoded.has(h)) {
    const s = VOICE[h], bin = atob(s.slice(s.indexOf(',') + 1)), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    decoded.set(h, ctx.decodeAudioData(bytes.buffer));
  }
  return decoded.get(h);
}
export function preload(lines) {
  if (!voiceEnabled() || !ctx) return;
  for (const l of lines) { const h = hashLine(l); if (VOICE[h]) buffer(h).catch(() => {}); }
}
export function speak(line) {
  hush();
  const h = hashLine(line);
  if (!voiceEnabled() || !VOICE[h] || !live() || !soundOn) return Promise.resolve(false);
  return buffer(h).then(buf => new Promise(res => {
    const src = ctx.createBufferSource();
    src.buffer = buf; src.connect(voiceBus);
    duck(0.45, 0.5);
    const me = { src, res, done: false };
    src.onended = () => { if (me.done) return; me.done = true; if (speaking === me) { speaking = null; duck(1, 1.5); } res(true); };
    speaking = me; src.start();
    mark('voice', { h });
  }), () => false);
}
export function hush() {
  if (!speaking) return;
  const me = speaking; speaking = null; me.done = true;
  try { me.src.stop(); } catch (e) {}
  me.res(true);
}
