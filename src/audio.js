/* Audio for "Before the Law", played through Howler.
   Files are inlined as data URIs: audio fetched over file:// is blocked by the
   same CORS rule that forced the textures inline, and the double-click
   property is non-negotiable for this project.

   To swap in externally sourced files, replace the three entries in
   tools/build-3d.mjs's AUDIO map. Nothing in this file changes. */
import { Howl, Howler } from 'howler';
import { AUDIO } from './audio.gen.js';

const DRONE_VOL = 0.20;
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
  } catch (e) { mark('init:failed', { err: String(e) }); }
}

/* Howler unlocks the context on the first gesture by itself, but the drone's
   play() may have been refused before that, so re-assert it. */
export function nudgeAudio() {
  if (!drone) return;
  if (!drone.playing()) { drone.play(); drone.fade(0, DRONE_VOL, 5000); }
}

export function playBell() { if (bell) { bell.play(); } }

/* the ending wants real silence around the gate, so pull the drone down
   under the black fade rather than letting it run through the beat */
export function duckForEnding(ms) {
  if (!drone) return;
  mark('drone:duck');
  drone.fade(drone.volume(), 0, ms);
  setTimeout(() => { try { drone.stop(); } catch (e) {} }, ms + 120);
}

export function playGate() { if (gate) { gate.play(); } }

export function audioState() {
  return { built, log: log.slice(), muted: Howler._muted };
}
window.__audioState = audioState;
