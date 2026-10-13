/* Voices every line of the text with Kokoro-82M (Apache-2.0), at build time.
   Nothing here ships: the game gets MP3s, inlined by build-3d.mjs.

   Each line is split at its quotation marks. Outside the quotes is the
   narrator; inside is the doorkeeper, except where "you say" marks the man's
   own words. Each voice gets its own treatment: the doorkeeper is pitched
   down and put in a stone hall, the old man trembles a little.

   Output: ../assets/voice/<hash>.mp3 plus index.json. Lines are hashed with
   the same FNV-1a the game uses, so an edited line simply gets a new file.
   Rerunning only voices what changed.  Usage: node make-voice.mjs [im] [--force]

   With 'im' it voices An Imperial Message instead: src/im/text.gen.js ->
   ../assets/voice-im. There the speaker is chosen by block, not by quotes:
   the 'if' passages get a dreamier room, and 'never, never' a second voice. */
import fs from 'fs';
import vm from 'vm';
import { KokoroTTS } from 'kokoro-js';
const IM = process.argv.includes('im');
const { T } = await import(IM ? '../src/im/text.gen.js' : '../src/text.gen.js');

vm.runInThisContext(fs.readFileSync('node_modules/lamejs/lame.min.js', 'utf8'));
const lamejs = globalThis.lamejs;

/* the cast. To recast, change a voice here and rerun - the config is part of
   each line's cache key, so only that speaker's lines are regenerated. */
const CAST = {
  narrator:   { voice: 'bm_george', speed: 0.94, pitch: 1.00, wet: 0.10, size: 0.55 },
  doorkeeper: { voice: 'am_fenrir', speed: 0.98, pitch: 0.86, wet: 0.30, size: 0.88 },
  man:        { voice: 'bm_lewis',  speed: 0.86, pitch: 1.03, wet: 0.14, size: 0.60, tremolo: 0.08 },
};
if (IM) Object.assign(CAST, {
  iffy:  { voice: 'bm_george', speed: 0.92, pitch: 1.00, wet: 0.34, size: 0.85 },
  never: { voice: 'bf_emma',   speed: 0.88, pitch: 1.00, wet: 0.06, size: 0.4 },
});
const IM_BLOCK = { field: 'iffy', ifdid: 'iffy', stairs: 'iffy', courts: 'iffy', second: 'iffy', again: 'iffy', millennia: 'iffy', gate: 'iffy', capital: 'iffy', nobody: 'iffy', never: 'never' };
const OUT = IM ? '../assets/voice-im' : '../assets/voice';
const KBPS = 48;
const FORCE = process.argv.includes('--force');

/* must match hashLine() in src/audio.js */
export function hashLine(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

const decode = s => s.replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&');

const blockOf = new Map();
function segments(raw) {
  const s = decode(raw);
  if (IM) return [[IM_BLOCK[blockOf.get(raw)] || 'narrator', s.replace(/—/g, ', ').replace(/\s+/g, ' ').trim()]].filter(([, t]) => /[A-Za-z]/.test(t));
  const manLine = /\byou say\b/.test(s);
  const out = [];
  const re = /“([^”]*)”/g;
  let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(['narrator', s.slice(last, m.index)]);
    out.push([manLine ? 'man' : 'doorkeeper', m[1]]);
    last = re.lastIndex;
  }
  if (last < s.length) out.push(['narrator', s.slice(last)]);
  return out
    .map(([who, t]) => [who, t.replace(/^[\s,;:.]+/, '').replace(/—/g, ', ').replace(/\s+/g, ' ').trim()])
    .filter(([, t]) => /[A-Za-z]/.test(t));
}

/* every string in T that is read aloud (gift labels are buttons, not speech) */
function allLines(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach(x => allLines(x, out));
  else if (v && typeof v === 'object') { if (v.line) out.push(v.line); else Object.values(v).forEach(x => allLines(x, out)); }
  return out;
}

/* ---------------- dsp ---------------- */
function repitch(x, p) {
  if (p === 1) return x;
  const n = Math.floor(x.length / p), y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const f = i * p, k = Math.floor(f), a = f - k;
    y[i] = (x[k] || 0) * (1 - a) + (x[k + 1] || 0) * a;
  }
  return y;
}

/* Freeverb, mono: eight damped combs into four allpasses */
function reverb(x, sr, wet, size, tail) {
  const scale = sr / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map(l => Math.round(l * scale));
  const alls = [556, 441, 341, 225].map(l => Math.round(l * scale));
  const fb = 0.70 + 0.28 * size, damp = 0.3;
  const n = x.length + Math.round(tail * sr), y = new Float32Array(n);
  const cb = combs.map(l => ({ b: new Float32Array(l), i: 0, s: 0 }));
  const ab = alls.map(l => ({ b: new Float32Array(l), i: 0 }));
  for (let t = 0; t < n; t++) {
    const inp = (t < x.length ? x[t] : 0) * 0.015;
    let o = 0;
    for (const c of cb) {
      const v = c.b[c.i];
      c.s = v * (1 - damp) + c.s * damp;
      c.b[c.i] = inp + c.s * fb;
      c.i = (c.i + 1) % c.b.length;
      o += v;
    }
    for (const a of ab) {
      const v = a.b[a.i];
      a.b[a.i] = o + v * 0.5;
      a.i = (a.i + 1) % a.b.length;
      o = v - o;
    }
    y[t] = (t < x.length ? x[t] : 0) * (1 - wet * 0.5) + o * wet * 3;
  }
  return y;
}

function tremble(x, sr, depth) {
  if (!depth) return x;
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const t = i / sr;
    y[i] = x[i] * (1 - depth * (0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 5.3 + Math.sin(t * 1.7))));
  }
  return y;
}

function normalise(x) {
  let peak = 0, sum = 0;
  for (const v of x) { peak = Math.max(peak, Math.abs(v)); sum += v * v; }
  const rms = Math.sqrt(sum / x.length) || 1;
  const g = Math.min(0.1 / rms, 0.92 / (peak || 1));
  return x.map(v => v * g);
}

function mp3(x, sr) {
  const enc = new lamejs.Mp3Encoder(1, sr, KBPS);
  const pcm = new Int16Array(x.length);
  for (let i = 0; i < x.length; i++) pcm[i] = Math.max(-1, Math.min(1, x[i])) * 32767;
  const parts = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const b = enc.encodeBuffer(pcm.subarray(i, i + 1152));
    if (b.length) parts.push(Buffer.from(b));
  }
  const e = enc.flush(); if (e.length) parts.push(Buffer.from(e));
  return Buffer.concat(parts);
}

/* ---------------- run ---------------- */
fs.mkdirSync(OUT, { recursive: true });
const idxPath = OUT + '/index.json';
const index = fs.existsSync(idxPath) ? JSON.parse(fs.readFileSync(idxPath, 'utf8')) : {};
const lines = [];
for (const [k, v] of Object.entries(T)) {
  if (k[0] === '_') continue;
  for (const l of allLines(v)) { if (!blockOf.has(l)) blockOf.set(l, k); lines.push(l); }
}
lines.splice(0, lines.length, ...new Set(lines));
const todo = lines.filter(l => {
  const key = hashLine(l), segs = segments(l);
  const sig = JSON.stringify(segs.map(([w]) => CAST[w]));
  return FORCE || !index[key] || index[key].sig !== sig || !fs.existsSync(OUT + '/' + key + '.mp3');
});
console.log(`${lines.length} lines, ${todo.length} to voice`);
if (process.argv.includes('--dry')) { for (const l of lines) console.log(segments(l).map(([w, t]) => w[0].toUpperCase() + ': ' + t).join('  |  ')); process.exit(0); }
if (!todo.length) process.exit(0);

const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
let done = 0;
for (const line of todo) {
  const key = hashLine(line), segs = segments(line);
  let sr = 24000;
  const pieces = [new Float32Array(Math.round(0.12 * sr))];
  for (const [who, text] of segs) {
    const c = CAST[who];
    const a = await tts.generate(text, { voice: c.voice, speed: c.speed });
    sr = a.sampling_rate;
    let x = repitch(a.audio, c.pitch);
    x = tremble(x, sr, c.tremolo);
    x = reverb(x, sr, c.wet, c.size, who === 'doorkeeper' || who === 'iffy' ? 1.4 : 0.5);
    pieces.push(normalise(x), new Float32Array(Math.round(0.16 * sr)));
  }
  const total = pieces.reduce((n, p) => n + p.length, 0), all = new Float32Array(total);
  let o = 0; for (const p of pieces) { all.set(p, o); o += p.length; }
  fs.writeFileSync(OUT + '/' + key + '.mp3', mp3(all, sr));
  index[key] = { sig: JSON.stringify(segs.map(([w]) => CAST[w])), dur: +(total / sr).toFixed(2), text: decode(line).slice(0, 80) };
  fs.writeFileSync(idxPath, JSON.stringify(index, null, 1));
  done++;
  console.log(`${String(done).padStart(3)}/${todo.length}  ${index[key].dur.toFixed(1).padStart(5)}s  ${segs.map(s => s[0][0]).join('')}  ${index[key].text.slice(0, 60)}`);
}
