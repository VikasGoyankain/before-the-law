/* Generates the three cues as real MP3 files.
   ORIGINAL WORK (CC0) - not sourced from Freesound/Pixabay, whose APIs both
   require account credentials (401/400/403, verified). Swapping in sourced
   files is a one-line change in AUDIO below; nothing else needs to move.

   lamejs is LGPL and is a devDependency only: the encoder never ships, only
   its MP3 output, which is not a derivative work of the encoder. */
import fs from 'fs';
import vm from 'vm';
/* lamejs 1.2.1's modular entry throws (missing MPEGMode global). The prebuilt
   bundle declares itself at global scope, which CommonJS module scope would
   swallow, so evaluate it in the real global context. */
vm.runInThisContext(fs.readFileSync('node_modules/lamejs/lame.min.js', 'utf8'));
const lamejs = globalThis.lamejs;

const SR = 44100;
const OUT = '../assets/audio';
fs.mkdirSync(OUT, { recursive: true });

const clamp = v => v < -1 ? -1 : v > 1 ? 1 : v;
const TAU = Math.PI * 2;

/* two cascaded one-pole lowpasses - gentler than a biquad, and enough for wind */
function lp2(buf, cutoffAt) {
  const out = new Float32Array(buf.length);
  let a = 0, b = 0;
  for (let i = 0; i < buf.length; i++) {
    const fc = typeof cutoffAt === 'function' ? cutoffAt(i / SR) : cutoffAt;
    const k = 1 - Math.exp(-TAU * fc / SR);
    a += k * (buf[i] - a);
    b += k * (a - b);
    out[i] = b;
  }
  return out;
}

function writeMp3(name, float, kbps) {
  const n = float.length;
  const pcm = new Int16Array(n);
  for (let i = 0; i < n; i++) pcm[i] = clamp(float[i]) * 32767;
  const enc = new lamejs.Mp3Encoder(1, SR, kbps);
  const parts = [];
  for (let i = 0; i < n; i += 1152) {
    const b = enc.encodeBuffer(pcm.subarray(i, Math.min(i + 1152, n)));
    if (b.length) parts.push(Buffer.from(b));
  }
  const tail = enc.flush();
  if (tail.length) parts.push(Buffer.from(tail));
  const buf = Buffer.concat(parts);
  fs.writeFileSync(`${OUT}/${name}.mp3`, buf);
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(float[i]));
  console.log(`${name.padEnd(12)} ${(n / SR).toFixed(2)}s  ${kbps}kbps  ` +
    `${(buf.length / 1024).toFixed(0)} KB  peak ${peak.toFixed(2)}`);
  return buf.length;
}

/* ---------------- 1. ambient drone ----------------
   16s loop. Every partial and LFO frequency is an exact integer multiple of
   1/16 Hz, so the waveform is continuous across the loop point; the master
   envelope also dips there, which hides the ~25ms of encoder padding MP3
   unavoidably adds. */
function drone() {
  const LOOP = 16, n = SR * LOOP, out = new Float32Array(n);
  const partials = [
    [41.25, 0.30], [55.0, 0.20], [55.125, 0.13], [82.5, 0.075], [110.0, 0.030],
  ];
  const noise = new Float32Array(n);
  for (let i = 0; i < n; i++) noise[i] = Math.random() * 2 - 1;
  const wind = lp2(noise, t => 150 + 90 * Math.sin(TAU * 0.0625 * t));

  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    for (const [f, a] of partials) v += a * Math.sin(TAU * f * t);
    v += wind[i] * 0.55;
    /* one full cycle over the loop, dipping at both ends */
    const swell = 0.55 + 0.45 * (0.5 - 0.5 * Math.cos(TAU * 0.0625 * t));
    const seam = 0.62 + 0.38 * Math.sin(Math.PI * (i / n));
    out[i] = v * 0.42 * swell * seam;
  }
  /* the noise itself is not periodic, so blend its tail back over its head */
  const xf = SR * 1.5;
  for (let i = 0; i < xf; i++) {
    const g = i / xf;
    out[i] = out[i] * g + out[n - xf + i] * (1 - g);
  }
  return out.subarray(0, n - xf);
}

/* ---------------- 2. the gate closing ----------------
   Same design as the Web Audio placeholder it replaces: stone travelling
   under a falling lowpass, then the shut. */
function gate() {
  const DUR = 3.6, n = Math.floor(SR * DUR), out = new Float32Array(n);
  const noise = new Float32Array(n);
  for (let i = 0; i < n; i++) noise[i] = Math.random() * 2 - 1;
  const travel = lp2(noise, t => 760 * Math.pow(85 / 760, Math.min(1, t / 1.9)));
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = t < 0.35 ? t / 0.35 : Math.exp(-(t - 0.35) * 2.1);
    let v = travel[i] * 0.62 * env;
    if (t >= 1.58) {
      const u = t - 1.58;
      const f = 84 * Math.pow(34 / 84, Math.min(1, u / 1.0));
      const shut = u < 0.09 ? u / 0.09 : Math.exp(-(u - 0.09) * 2.6);
      v += Math.sin(TAU * f * u) * 0.85 * shut;
    }
    out[i] = v;
  }
  /* never let it clip into distortion at the impact */
  for (let i = 0; i < n; i++) out[i] = Math.tanh(out[i] * 1.1) * 0.9;
  return out;
}

/* ---------------- 3. the stage-3 bell ----------------
   Inharmonic partials, struck once, left to decay. */
function bell() {
  const DUR = 3.4, n = Math.floor(SR * DUR), out = new Float32Array(n);
  const f0 = 110;
  const ratio = [1, 2.0, 2.4, 3.0, 4.5, 5.33];
  const amp = [1.0, 0.48, 0.34, 0.22, 0.11, 0.07];
  const dec = [2.9, 2.3, 1.9, 1.5, 0.95, 0.75];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    for (let k = 0; k < ratio.length; k++) {
      v += amp[k] * Math.sin(TAU * f0 * ratio[k] * t) * Math.exp(-t / dec[k]);
    }
    /* a little air on the strike itself */
    if (t < 0.05) v += (Math.random() * 2 - 1) * 0.18 * (1 - t / 0.05);
    out[i] = v * 0.30;
  }
  return out;
}

let total = 0;
total += writeMp3('ambient-drone', drone(), 48);
total += writeMp3('gate-close', gate(), 64);
total += writeMp3('bell-oldage', bell(), 64);
console.log(`\ntotal ${(total / 1024).toFixed(0)} KB raw  ->  ~${(total * 1.37 / 1024).toFixed(0)} KB inlined as base64`);
