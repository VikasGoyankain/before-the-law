/* The one renderer every scene of "An Imperial Message" borrows.
   Scenes are plain objects { scene, camera, update(dt, t) }; show() swaps
   which one is drawn. On top sits the "if" pass: the story's subjunctive,
   drawn. At ifness 0 the world is in full colour; as the story moves into
   "and if he did...", it drains to pencil on paper. "Rewind" tears the
   drawing up when Kafka says it can never happen. */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const host = document.getElementById('view');
export const LOW = window.matchMedia('(max-width: 760px)').matches ||
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  /[?&]low=1/.test(location.search);   /* ask for it by hand on a slow machine */
export const CALM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: !LOW, powerPreference: 'high-performance' });
} catch (e) {
  host.innerHTML = '<p class="err">This scene needs WebGL, which this browser is not providing. ' +
    'Open imperial-message-text.html instead &#8212; it is the same piece without the 3D.</p>';
  throw e;
}
/* A classroom board can be 3840 pixels wide. Read from across a room, drawing
   more than a 1920-wide picture buys nothing and costs a weak panel its frame rate. */
const BOARD = document.documentElement.classList.contains('board');
renderer.setPixelRatio(Math.min(window.devicePixelRatio, LOW ? 1.5 : 2, BOARD ? 1920 / Math.max(window.innerWidth, 1) : 9));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = !LOW;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
const blank = { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), update() {} };
blank.scene.background = new THREE.Color(0x000000);
const renderPass = new RenderPass(blank.scene, blank.camera);
composer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.35, 0.6, 0.8);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const dream = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null }, res: { value: new THREE.Vector2(1, 1) },
    ifness: { value: 0 }, rewind: { value: 0 }, crack: { value: 0 }, time: { value: 0 },
    fade: { value: 0 }, white: { value: 0 }, vig: { value: 0.35 }, grain: { value: 0.035 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 res;
    uniform float ifness, rewind, crack, time, fade, white, vig, grain;
    varying vec2 vUv;
    float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    float L(vec2 uv){ return lum(texture2D(tDiffuse, uv).rgb); }
    void main(){
      vec2 uv = vUv;
      /* the tear: bands of the picture slide away when it is unsaid */
      if (rewind > 0.0) {
        float band = floor(uv.y * 26.0 + floor(time * 9.0));
        uv.x += (hash(vec2(band, floor(time * 18.0))) - 0.5) * rewind * 0.32;
        uv.y += sin(uv.x * 37.0 + time * 23.0) * 0.006 * rewind;
      }
      /* the crack: one jagged line splits the drawing at "never, never" */
      float cd = 1.0;
      if (crack > 0.0) {
        float cx = 0.5 + 0.05 * sin(uv.y * 9.0) + 0.025 * sin(uv.y * 31.0 + 1.3) + 0.012 * sin(uv.y * 97.0 + 0.4);
        cd = mix(1.0, smoothstep(0.0, 0.0025 + 0.003 * crack, abs(uv.x - cx)), smoothstep(1.0 - crack * 1.2, 1.0 - crack * 1.2 + 0.05, 1.0 - uv.y));
        uv.x += sign(uv.x - cx) * 0.012 * crack;
      }
      vec3 c = texture2D(tDiffuse, uv).rgb;
      float l = lum(c);
      vec3 col = c;
      if (ifness > 0.001) {
        /* pencil: Sobel edges, cross-hatching for the darks, paper for the lights */
        vec2 px = (1.0 + ifness) / res;
        float tl = L(uv + px * vec2(-1, 1)), t = L(uv + px * vec2(0, 1)), tr = L(uv + px * vec2(1, 1));
        float ml = L(uv + px * vec2(-1, 0)), mr = L(uv + px * vec2(1, 0));
        float bl = L(uv + px * vec2(-1, -1)), b = L(uv + px * vec2(0, -1)), br = L(uv + px * vec2(1, -1));
        float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
        float gy = -bl - 2.0 * b - br + tl + 2.0 * t + tr;
        float edge = clamp(length(vec2(gx, gy)) * 3.2 - 0.08, 0.0, 1.0);
        vec2 fc = gl_FragCoord.xy + 1.5 * vec2(sin(gl_FragCoord.y * 0.05), cos(gl_FragCoord.x * 0.05));
        float lift = l * 1.9 + 0.12;
        float h1 = step(fract((fc.x + fc.y) / 7.0), 0.22) * smoothstep(0.62, 0.22, lift);
        float h2 = step(fract((fc.x - fc.y) / 7.0), 0.2) * smoothstep(0.34, 0.08, lift);
        vec3 paper = vec3(0.925, 0.9, 0.84) * (0.94 + 0.06 * hash(floor(gl_FragCoord.xy / 3.0)));
        vec3 ink = vec3(0.24, 0.22, 0.21);
        vec3 pencil = mix(paper, ink, clamp(edge * 0.95 + h1 * 0.45 + h2 * 0.55, 0.0, 1.0));
        /* gold keeps a little of its colour: the sun on his chest is the last thing to fade */
        float gold = smoothstep(0.25, 0.55, c.r - c.b) * smoothstep(0.35, 0.8, l);
        pencil = mix(pencil, mix(pencil, vec3(0.86, 0.62, 0.25), 0.7), gold * (1.0 - 0.6 * ifness));
        vec3 drained = mix(c, vec3(l) * vec3(1.02, 0.99, 0.94), 0.75);
        col = mix(c, drained, smoothstep(0.0, 0.35, ifness));
        col = mix(col, pencil, smoothstep(0.2, 0.85, ifness));
      }
      col = mix(col, vec3(0.93, 0.9, 0.84), rewind * rewind * 0.75);
      col *= cd;
      vec2 q = vUv - 0.5;
      col *= 1.0 - vig * smoothstep(0.25, 0.85, length(q * vec2(1.15, 1.0)));
      col += (hash(gl_FragCoord.xy + fract(time) * 91.0) - 0.5) * grain;
      col = mix(col, vec3(1.0, 0.97, 0.9), white);
      col *= 1.0 - fade;
      gl_FragColor = vec4(col, 1.0);
    }`,
});
composer.addPass(dream);

/* ---------------- post values: everything eases toward a target ---------------- */
const post = { ifness: 0, rewind: 0, crack: 0, fade: 1, white: 0, bloom: 0.35, vig: 0.35, exposure: 1.15 };
const goal = Object.assign({}, post);
const speed = { ifness: 0.6, rewind: 2, crack: 3, fade: 1.2, white: 2, bloom: 0.8, vig: 0.8, exposure: 0.8 };
export function setPost(k, v, perSec) { goal[k] = v; if (perSec) speed[k] = perSec; }
export function snapPost(k, v) { goal[k] = post[k] = v; }
export const postValue = k => post[k];

/* ---------------- the camera's head: the pointer turns it a little ---------------- */
export const look = { x: 0, y: 0, sx: 0, sy: 0, amount: 1 };
export function setLook(nx, ny) { look.x = Math.max(-1, Math.min(1, nx)); look.y = Math.max(-1, Math.min(1, ny)); }

/* ---------------- scenes ---------------- */
let cur = blank;
export function show(s) {
  cur = s || blank;
  renderPass.scene = cur.scene;
  renderPass.camera = cur.camera;
  resize();
}
export const current = () => cur;

function resize() {
  const w = host.clientWidth || window.innerWidth, h = host.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  const pr = renderer.getPixelRatio();
  dream.uniforms.res.value.set(w * pr, h * pr);
  if (cur.camera.isPerspectiveCamera) { cur.camera.aspect = w / h; cur.camera.updateProjectionMatrix(); }
  if (cur.resize) cur.resize(w, h);
}
window.addEventListener('resize', resize);
resize();

/* ---------------- the loop ----------------
   window.__freeze / __advance let the headless harness step time by hand:
   SwiftShader renders at about one frame a second, so wall-clock timing
   would make every screenshot land somewhere different. */
const clock = new THREE.Clock();
let time = 0;
window.__frames = 0;
const frameHooks = [];
export function onFrame(fn) { frameHooks.push(fn); }
function tick() {
  requestAnimationFrame(tick);
  let dt = Math.min(clock.getDelta(), 0.1);
  if (window.__freeze) { dt = Math.min(0.1, window.__advance || 0); window.__advance = (window.__advance || 0) - dt; }
  time += dt;
  for (const k in post) {
    const d = goal[k] - post[k], step = speed[k] * dt;
    post[k] = Math.abs(d) <= step ? goal[k] : post[k] + Math.sign(d) * step;
  }
  look.sx += (look.x * look.amount - look.sx) * Math.min(1, dt * 3);
  look.sy += (look.y * look.amount - look.sy) * Math.min(1, dt * 3);
  for (const fn of frameHooks) fn(dt, time);
  if (cur.update) cur.update(dt, time);
  const u = dream.uniforms;
  u.ifness.value = post.ifness; u.rewind.value = post.rewind; u.crack.value = post.crack;
  u.fade.value = post.fade; u.white.value = post.white; u.time.value = time; u.vig.value = post.vig;
  u.grain.value = LOW ? 0 : 0.03 + 0.03 * post.ifness;
  bloom.strength = post.bloom;
  renderer.toneMappingExposure = post.exposure;
  composer.render();
  window.__frames++;
}
requestAnimationFrame(tick);
export const now = () => time;
