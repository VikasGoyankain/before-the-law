/* The 3D stage for "Before the Law".
   Exports a stage() API; the game logic and the dev harness both drive it. */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GROUND } from './textures.gen.js';

const BG = 0x0a0908, RAD = 0xffc46b;
const host = document.getElementById('view');

/* Mobile needs a lighter scene: shadows and bloom are the two costs that
   actually move the frame budget on a phone GPU. */
export const LOW = window.matchMedia('(max-width: 760px)').matches ||
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: !LOW, powerPreference: 'high-performance' });
} catch (e) {
  host.innerHTML = '<p class="err">This scene needs WebGL, which this browser is not providing.</p>';
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, LOW ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = !LOW;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.FogExp2(BG, 0.028);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);

/* ---------------- ground ---------------- */
const tl = new THREE.TextureLoader();
const tex = (uri, srgb) => {
  const t = tl.load(uri);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(45, 45);
  t.anisotropy = LOW ? 1 : renderer.capabilities.getMaxAnisotropy();
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
const groundMat = new THREE.MeshStandardMaterial({
  map: tex(GROUND.color, true), color: 0x8c8478, roughness: 1, metalness: 0,
});
if (!LOW) {
  groundMat.normalMap = tex(GROUND.normal);
  groundMat.roughnessMap = tex(GROUND.rough);
  groundMat.normalScale = new THREE.Vector2(1.4, 1.4);
}
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* ---------------- the gate ----------------
   Same profile as the SVG silhouette, extruded: the 2D and 3D assets share
   one outline. Procedural by decision, not by default - see LICENSES.md. */
const OW = 4.4, IW = 2.6, SPRING = 6.0;
const gateShape = new THREE.Shape();
gateShape.moveTo(-OW, 0);
gateShape.lineTo(-OW, SPRING);
gateShape.absarc(0, SPRING, OW, Math.PI, 0, true);
gateShape.lineTo(OW, 0);
gateShape.lineTo(IW, 0);
gateShape.lineTo(IW, SPRING);
gateShape.absarc(0, SPRING, IW, 0, Math.PI, false);
gateShape.lineTo(-IW, 0);
gateShape.closePath();

const gateGeo = new THREE.ExtrudeGeometry(gateShape, {
  depth: 1.9, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07,
  bevelSegments: 2, curveSegments: LOW ? 28 : 64,
});
gateGeo.translate(0, 0, -0.95);
const stone = new THREE.MeshStandardMaterial({ color: 0x5d564c, roughness: 0.94, metalness: 0.02 });
const gate = new THREE.Mesh(gateGeo, stone);
gate.castShadow = gate.receiveShadow = true;
scene.add(gate);

const plinth = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.35, 2.6), stone);
plinth.position.set(0, -0.17, 0);
plinth.receiveShadow = plinth.castShadow = true;
scene.add(plinth);

/* the opening, as its own shape - this is what the radiance fills */
const openShape = new THREE.Shape();
openShape.moveTo(-IW, 0);
openShape.lineTo(-IW, SPRING);
openShape.absarc(0, SPRING, IW, Math.PI, 0, true);
openShape.lineTo(IW, 0);
openShape.closePath();
const glowMat = new THREE.ShaderMaterial({
  transparent: true, fog: false, side: THREE.DoubleSide, depthWrite: false,
  uniforms: { uColor: { value: new THREE.Color(RAD) }, uOpacity: { value: 0 } },
  vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 uColor; uniform float uOpacity; varying vec2 vP; void main(){ float r = length(vec2(vP.x / 2.6, (vP.y - 2.4) / 5.4)); float a = smoothstep(1.25, 0.05, r); vec3 c = uColor * (0.55 + 1.15 * a); gl_FragColor = vec4(c, uOpacity * (0.30 + 0.70 * a)); }',
});
const glow = new THREE.Mesh(new THREE.ShapeGeometry(openShape, LOW ? 28 : 64), glowMat);
glow.position.z = -1.15;
scene.add(glow);

/* the gate leaves, for the closing beat only */
const leaves = new THREE.Group();
{
  const bar = new THREE.MeshStandardMaterial({ color: 0x24211d, roughness: 0.7, metalness: 0.6 });
  for (let i = 0; i < 11; i++) {
    const x = -2.45 + (4.9 * i) / 10;
    const h = SPRING + Math.sqrt(Math.max(0, IW * IW - x * x)) - 0.05;
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.09, h, 0.09), bar);
    b.position.set(x, h / 2, 0); b.castShadow = true; leaves.add(b);
  }
  for (const y of [1.2, 4.2, 5.9]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(5.05, 0.13, 0.13), bar);
    r.position.set(0, y, 0); r.castShadow = true; leaves.add(r);
  }
}
leaves.position.z = -0.55;
leaves.visible = false;
scene.add(leaves);

/* beyond it you can see nothing at all */
const voidWall = new THREE.Mesh(new THREE.PlaneGeometry(120, 60),
  new THREE.MeshBasicMaterial({ color: 0x000000, fog: false }));
voidWall.position.set(0, 20, -26);
scene.add(voidWall);

/* ---------------- figures ----------------
   Primitives only, no rig. Posture is expressed through pivots, because a
   silhouette reads as human through stance rather than through detail. */
const cloth = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, metalness: 0 });
const add = (parent, geo, mat, x, y, z) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
};
const seg = LOW ? 14 : 24;

function makeDoorkeeper() {
  const g = new THREE.Group(), m = cloth(0x2e2a26);
  add(g, new THREE.CylinderGeometry(0.36, 0.70, 1.66, seg), m, 0, 0.83, 0);
  const collar = add(g, new THREE.SphereGeometry(0.46, seg, 16), m, 0, 1.64, 0);
  collar.scale.set(1, 0.5, 0.82);
  add(g, new THREE.SphereGeometry(0.175, seg, 16), cloth(0x3a352f), 0, 1.88, 0);
  add(g, new THREE.CylinderGeometry(0.19, 0.205, 0.26, seg), m, 0, 2.06, 0);
  const beard = add(g, new THREE.ConeGeometry(0.145, 0.44, seg), m, 0, 1.66, 0.11);
  beard.rotation.x = Math.PI;
  return g;
}

/* hips -> spine (pivot) -> torso -> neck (pivot) -> head.
   Two pivots are all it takes for "stooped" to read at any distance. */
function makeMan() {
  const g = new THREE.Group(), m = cloth(0x3b352d);
  const hips = add(g, new THREE.CylinderGeometry(0.30, 0.42, 0.44, seg), m, 0, 0.22, 0);
  const spine = new THREE.Group(); spine.position.y = 0.40; g.add(spine);
  add(spine, new THREE.CylinderGeometry(0.235, 0.325, 0.82, seg), m, 0, 0.41, 0);
  const neck = new THREE.Group(); neck.position.y = 0.82; spine.add(neck);
  add(neck, new THREE.SphereGeometry(0.147, seg, 16), cloth(0x464036), 0, 0.115, 0);
  add(neck, new THREE.CylinderGeometry(0.30, 0.30, 0.032, seg), m, 0, 0.205, 0);
  add(neck, new THREE.CylinderGeometry(0.16, 0.185, 0.185, seg), m, 0, 0.30, 0);
  const bundle = add(g, new THREE.SphereGeometry(0.16, 16, 12), m, 0.40, 0.56, 0.08);
  return { g, hips, spine, neck, bundle };
}

const keeper = makeDoorkeeper();
keeper.position.set(0, 0, 0.55);
scene.add(keeper);
const man = makeMan();
scene.add(man.g);

/* ---------------- light ---------------- */
const hemi = new THREE.HemisphereLight(0x151a26, 0x000000, 1.4);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0x9fb0d4, 3.2);
moon.position.set(-9, 14, 10);
moon.castShadow = !LOW;
moon.shadow.mapSize.set(LOW ? 512 : 2048, LOW ? 512 : 2048);
moon.shadow.camera.near = 1; moon.shadow.camera.far = 60;
moon.shadow.camera.left = -16; moon.shadow.camera.right = 16;
moon.shadow.camera.top = 16; moon.shadow.camera.bottom = -16;
moon.shadow.bias = -0.0009;
scene.add(moon);
const radiance = new THREE.PointLight(RAD, 0, 40, 1.6);
radiance.position.set(0, 3.2, -2.6);
scene.add(radiance);

/* ---------------- dust ---------------- */
const N = LOW ? 180 : 500, pos = new Float32Array(N * 3), drift = new Float32Array(N);
for (let i = 0; i < N; i++) {
  pos[i * 3] = (Math.random() - 0.5) * 36;
  pos[i * 3 + 1] = Math.random() * 11;
  pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4;
  drift[i] = 0.1 + Math.random() * 0.28;
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({
  color: 0xb9ad99, size: 0.022, transparent: true, opacity: 0.17,
  sizeAttenuation: true, depthWrite: false,
})));

/* ---------------- post ---------------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.2, 0.75, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------------- stages ----------------
   Every field is numeric so the whole stage change - light, fog, camera and
   the man's posture - lerps on one clock. There is no second transition
   system; the game just calls stage(n). */
const STAGES = {
  1: {
    rad: 0, glow: 0, bloom: 0.14, thr: 0.90, fog: 0.028, moon: 3.20, hemi: 1.40, exp: 1.05,
    fov: 42, cx: 0.8, cy: 2.00, cz: 16.5, lx: 0.00, ly: 4.2, lz: 0.0,
    mx: 3.5, mz: 5.0, mry: -0.52, ms: 1.00, spy: 0.40, spx: 0.03, nkx: 0.00,
    hy: 0.22, hsx: 1.00, hsy: 1.00, bx: 0.40, by: 0.56, bz: 0.08,
  },
  2: {
    rad: 0, glow: 0, bloom: 0.16, thr: 0.90, fog: 0.034, moon: 2.40, hemi: 1.10, exp: 0.98,
    fov: 42, cx: 0.9, cy: 1.90, cz: 15.0, lx: 0.20, ly: 4.0, lz: 0.0,
    mx: 3.7, mz: 3.0, mry: -1.10, ms: 1.00, spy: 0.28, spx: 0.30, nkx: 0.16,
    hy: 0.17, hsx: 1.15, hsy: 0.72, bx: 0.46, by: 0.15, bz: -0.34,
  },
  3: {
    rad: 16, glow: 0.92, bloom: 0.60, thr: 0.60, fog: 0.040, moon: 0.50, hemi: 0.35, exp: 0.76,
    /* push in: at 16.5m he was a distant prop, and this is the payoff beat */
    fov: 50, cx: 0.9, cy: 1.70, cz: 13.0, lx: 0.35, ly: 3.6, lz: 0.8,
    /* shrunken AND stooped - the text says he has grown small */
    mx: 1.45, mz: 1.9, mry: -1.35, ms: 0.62, spy: 0.36, spx: 0.48, nkx: 0.30,
    hy: 0.20, hsx: 1.06, hsy: 0.90, bx: 0.52, by: 0.14, bz: -0.40,
  },
};

let cur = Object.assign({}, STAGES[1]), tgt = STAGES[1], current = 1;
export const stageOf = () => current;

export function stage(n) { current = n; tgt = STAGES[n]; }
export function snap(n) { stage(n); cur = Object.assign({}, STAGES[n]); apply(); }
export function closeGate() { leaves.visible = true; }
export function openGate() { leaves.visible = false; }

function apply() {
  radiance.intensity = cur.rad;
  glowMat.uniforms.uOpacity.value = cur.glow;
  bloom.strength = cur.bloom;
  bloom.threshold = cur.thr;
  scene.fog.density = cur.fog;
  moon.intensity = cur.moon;
  hemi.intensity = cur.hemi;
  renderer.toneMappingExposure = cur.exp;
  if (Math.abs(camera.fov - cur.fov) > 0.01) { camera.fov = cur.fov; camera.updateProjectionMatrix(); }
  camera.position.set(cur.cx, cur.cy, cur.cz);
  camera.lookAt(cur.lx, cur.ly, cur.lz);
  man.g.position.set(cur.mx, 0, cur.mz);
  man.g.rotation.y = cur.mry;
  man.g.scale.setScalar(cur.ms);
  man.spine.position.y = cur.spy;
  man.spine.rotation.x = cur.spx;
  man.neck.rotation.x = cur.nkx;
  man.hips.position.y = cur.hy;
  man.hips.scale.set(cur.hsx, cur.hsy, cur.hsx);
  man.bundle.position.set(cur.bx, cur.by, cur.bz);
}

/* ---------------- loop ---------------- */
function resize() {
  const w = host.clientWidth || window.innerWidth, h = host.clientHeight || window.innerHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h); composer.setSize(w, h);
}
window.addEventListener('resize', resize);
resize();

const lerp = (a, b, t) => a + (b - a) * t;
const clock = new THREE.Clock();
let fCount = 0, lastSample = (typeof performance !== 'undefined' ? performance.now() : Date.now());

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  /* ~2.6s to settle: long enough to feel like time rather than a page load */
  const k = 1 - Math.pow(0.001, dt / 2.6);
  for (const key in tgt) cur[key] = lerp(cur[key], tgt[key], k);
  apply();

  /* he is never quite still, and never moves */
  keeper.rotation.y = Math.sin(t * 0.21) * 0.022;
  keeper.position.y = Math.sin(t * 0.33) * 0.007;

  const p = dustGeo.attributes.position.array;
  for (let i = 0; i < N; i++) {
    p[i * 3 + 1] += drift[i] * dt * 0.12;
    p[i * 3] += Math.sin(t * 0.1 + i) * dt * 0.02;
    if (p[i * 3 + 1] > 11) p[i * 3 + 1] = 0;
  }
  dustGeo.attributes.position.needsUpdate = true;

  composer.render();

  fCount++;
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  if (now - lastSample >= 1000) {
    const raw = (fCount * 1000) / (now - lastSample);
    window.__fpsRaw = raw;
    window.__fps = raw < 10 ? Math.round(raw * 10) / 10 : Math.round(raw);
    fCount = 0; lastSample = now;
  }
  window.__frames = (window.__frames || 0) + 1;
}
snap(1);
tick();

/* ---------------- ?debug=fps ----------------
   Off unless asked for. The headless harness runs SwiftShader, so its numbers
   say nothing about a real phone; this exists so a device screenshot can. */
if (/[?&]debug=fps/i.test(location.search)) {
  const box = document.createElement('div');
  box.id = 'fpsdbg';
  box.style.cssText = 'position:fixed;top:0;left:0;z-index:99;margin:.5rem;padding:.5rem .65rem;' +
    'background:rgba(0,0,0,.74);color:#a8d8a8;font:11px/1.55 ui-monospace,Menlo,Consolas,monospace;' +
    'border:1px solid #2d3a2d;border-radius:3px;white-space:pre;pointer-events:none;' +
    'letter-spacing:.02em;text-align:left';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(box));
  if (document.body) document.body.appendChild(box);

  let lo = Infinity, hi = 0, started = 0;
  setInterval(() => {
    const f = window.__fps || 0;
    started++;
    /* ignore the first 3s: shader compile and texture upload skew it */
    if (started > 3 && f > 0) { if (f < lo) lo = f; if (f > hi) hi = f; }
    const c = renderer.domElement;
    box.textContent = `fps  ${String(f).padStart(3)}   min ${lo === Infinity ? '--' : lo}  max ${hi || '--'}
res  ${c.width}x${c.height}  dpr ${window.devicePixelRatio}
mode ${LOW ? 'LOW (mobile)' : 'FULL'}   stage ${stageOf()}
shdw ${renderer.shadowMap.enabled ? 'on' : 'off'}  dust ${N}  seg ${seg}`;
  }, 1000);
}
