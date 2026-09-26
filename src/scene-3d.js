import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GROUND } from './textures.gen.js';

const BG = 0x0a0908, RAD = 0xffc46b;
const host = document.getElementById('view');

/* ---------------- renderer ---------------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  host.innerHTML = '<p class="err">This scene needs WebGL, which this browser is not providing.</p>';
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.FogExp2(BG, 0.036);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
camera.position.set(0.8, 2.0, 16.5);

/* ---------------- ground ---------------- */
const tl = new THREE.TextureLoader();
const tex = (uri, srgb) => {
  const t = tl.load(uri);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(45, 45);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({
    map: tex(GROUND.color, true),
    normalMap: tex(GROUND.normal),
    roughnessMap: tex(GROUND.rough),
    color: 0x8c8478, roughness: 1, metalness: 0,
    normalScale: new THREE.Vector2(1.4, 1.4),
  }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* ---------------- the gate ----------------
   Same profile as the SVG silhouette, extruded: the 2D and 3D assets
   share one outline, so the piece reads identically in either build. */
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
  bevelSegments: 2, curveSegments: 64,
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

/* the opening, as its own shape - this is what the radiance fills in stage 3 */
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
const glow = new THREE.Mesh(new THREE.ShapeGeometry(openShape, 64), glowMat);
glow.position.z = -1.15;
scene.add(glow);

/* beyond it you can see nothing at all */
const voidWall = new THREE.Mesh(new THREE.PlaneGeometry(120, 60),
  new THREE.MeshBasicMaterial({ color: 0x000000, fog: false }));
voidWall.position.set(0, 20, -26);
scene.add(voidWall);

/* ---------------- figures ----------------
   Primitives only, no rig, per the asset spec: the doorkeeper is a
   silhouette, not a character model. */
const cloth = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, metalness: 0 });
const add = (parent, geo, mat, x, y, z) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
};

function makeDoorkeeper() {
  const g = new THREE.Group(), m = cloth(0x2e2a26);
  add(g, new THREE.CylinderGeometry(0.36, 0.70, 1.66, 28), m, 0, 0.83, 0);
  const collar = add(g, new THREE.SphereGeometry(0.46, 24, 16), m, 0, 1.64, 0);
  collar.scale.set(1, 0.5, 0.82);
  add(g, new THREE.SphereGeometry(0.175, 24, 18), cloth(0x3a352f), 0, 1.88, 0);
  add(g, new THREE.CylinderGeometry(0.19, 0.205, 0.26, 22), m, 0, 2.06, 0);
  const beard = add(g, new THREE.ConeGeometry(0.145, 0.44, 18), m, 0, 1.66, 0.11);
  beard.rotation.x = Math.PI;
  return g;
}

function makeMan() {
  const g = new THREE.Group(), m = cloth(0x3b352d);
  const body = add(g, new THREE.CylinderGeometry(0.25, 0.45, 1.18, 22), m, 0, 0.59, 0);
  const head = add(g, new THREE.SphereGeometry(0.15, 22, 16), cloth(0x464036), 0, 1.32, 0);
  const brim = add(g, new THREE.CylinderGeometry(0.31, 0.31, 0.035, 24), m, 0, 1.42, 0);
  const crown = add(g, new THREE.CylinderGeometry(0.165, 0.19, 0.19, 22), m, 0, 1.52, 0);
  const bundle = add(g, new THREE.SphereGeometry(0.17, 16, 12), m, 0.42, 0.72, 0.1);
  return { g, parts: { body, head, brim, crown, bundle } };
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
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.near = 1; moon.shadow.camera.far = 60;
moon.shadow.camera.left = -16; moon.shadow.camera.right = 16;
moon.shadow.camera.top = 16; moon.shadow.camera.bottom = -16;
moon.shadow.bias = -0.0009;
scene.add(moon);
/* the radiance, dark until the end */
const radiance = new THREE.PointLight(RAD, 0, 40, 1.6);
radiance.position.set(0, 3.2, -2.6);
scene.add(radiance);

/* ---------------- dust ---------------- */
const N = 500, pos = new Float32Array(N * 3), drift = new Float32Array(N);
for (let i = 0; i < N; i++) {
  pos[i * 3] = (Math.random() - 0.5) * 36;
  pos[i * 3 + 1] = Math.random() * 11;
  pos[i * 3 + 2] = (Math.random() - 0.5) * 26 + 2;
  drift[i] = 0.1 + Math.random() * 0.28;
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
  color: 0xb9ad99, size: 0.022, transparent: true, opacity: 0.17,
  sizeAttenuation: true, depthWrite: false,
}));
scene.add(dust);

/* ---------------- post ---------------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.2, 0.75, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------------- stages ---------------- */
const STAGES = {
  1: { rad: 0, glow: 0, bloom: 0.14, thr: 0.90, fog: 0.028, moon: 3.20, hemi: 1.40, exp: 1.05, pose: 'stand' },
  2: { rad: 0, glow: 0, bloom: 0.16, thr: 0.90, fog: 0.034, moon: 2.40, hemi: 1.10, exp: 0.98, pose: 'sit' },
  3: { rad: 16, glow: 1, bloom: 0.85, thr: 0.52, fog: 0.040, moon: 0.50, hemi: 0.35, exp: 0.80, pose: 'aged' },
};
let cur = Object.assign({}, STAGES[1]), tgt = STAGES[1];

function pose(name) {
  const p = man.parts, g = man.g;
  if (name === 'stand') {
    g.position.set(3.5, 0, 5.0); g.scale.setScalar(1); g.rotation.set(0, -0.52, 0);
    p.body.scale.set(1, 1, 1); p.body.position.y = 0.59;
    p.head.position.y = 1.32; p.brim.position.y = 1.42; p.crown.position.y = 1.52;
    p.bundle.position.set(0.42, 0.72, 0.1);
  } else if (name === 'sit') {
    g.position.set(3.6, 0, 2.4); g.scale.setScalar(1); g.rotation.set(0, -1.15, 0);
    p.body.scale.set(1.1, 0.52, 1.1); p.body.position.y = 0.31;
    p.head.position.y = 0.74; p.brim.position.y = 0.84; p.crown.position.y = 0.94;
    p.bundle.position.set(0.5, 0.17, -0.3);
  } else {
    g.position.set(2.0, 0, 3.0); g.scale.setScalar(0.72); g.rotation.set(0, -1.3, 0);
    p.body.scale.set(1.15, 0.46, 1.15); p.body.position.y = 0.27;
    p.head.position.y = 0.64; p.brim.position.y = 0.73; p.crown.position.y = 0.82;
    p.bundle.position.set(0.55, 0.16, -0.34);
  }
}
pose('stand');

function setStage(n) {
  tgt = STAGES[n];
  pose(tgt.pose);
  const bs = document.querySelectorAll('#ctl button');
  for (let i = 0; i < bs.length; i++) bs[i].classList.toggle('on', +bs[i].dataset.s === n);
}
window.setStage = setStage;
window.snapStage = function (n) { setStage(n); cur = Object.assign({}, STAGES[n]); };
const btns = document.querySelectorAll('#ctl button');
for (let i = 0; i < btns.length; i++)
  btns[i].addEventListener('click', function () { setStage(+this.dataset.s); });

/* ---------------- loop ---------------- */
function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h); composer.setSize(w, h);
  camera.lookAt(0, 4.2, 0);
}
window.addEventListener('resize', resize); resize();

const lerp = (a, b, t) => a + (b - a) * t;
const clock = new THREE.Clock();

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  /* ~2.6s to settle: long enough to feel like time rather than a page load */
  const k = 1 - Math.pow(0.001, dt / 2.6);
  for (const key in tgt) if (typeof tgt[key] === 'number') cur[key] = lerp(cur[key], tgt[key], k);

  radiance.intensity = cur.rad;
  glowMat.uniforms.uOpacity.value = cur.glow;
  bloom.strength = cur.bloom;
  bloom.threshold = cur.thr;
  scene.fog.density = cur.fog;
  moon.intensity = cur.moon;
  hemi.intensity = cur.hemi;
  renderer.toneMappingExposure = cur.exp;

  /* idle sway - he is never quite still, and never moves */
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
  window.__frames = (window.__frames || 0) + 1;
}
tick();
