/* The 3D stage for "Before the Law" - seen through the man's own eyes.
   The camera is the player. Lighting, fog and the failing of the eyes lerp
   on one clock per stage; the body's movements (walking, rising, sitting,
   the last look) are tweens on top of that. The game calls the exports. */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GROUND } from './textures.gen.js';
import { makeKeeper, makeMan } from './figures.js';

const BG = 0x0a0908, RAD = 0xffc46b;
const host = document.getElementById('view');
let guest = null; /* a scene borrowing the renderer - see lend() */
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* Mobile needs a lighter scene: shadows and bloom are the two costs that
   actually move the frame budget on a phone GPU. */
export const LOW = window.matchMedia('(max-width: 760px)').matches ||
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  /[?&]low=1/.test(location.search);   /* ask for it by hand on a slow machine */
const CALM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: !LOW, powerPreference: 'high-performance' });
} catch (e) {
  host.innerHTML = '<p class="err">This scene needs WebGL, which this browser is not providing. ' +
    'Open before-the-law-text.html instead &#8212; it is the same piece without the 3D.</p>';
  throw e;
}
/* A classroom board can be 3840 pixels wide. Read from across a room, drawing
   more than a 1920-wide picture buys nothing and costs a weak panel its frame rate. */
const BOARD = document.documentElement.classList.contains('board');
renderer.setPixelRatio(Math.min(window.devicePixelRatio, LOW ? 1.5 : 2, BOARD ? 1920 / Math.max(window.innerWidth, 1) : 9));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = !LOW;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.FogExp2(BG, 0.028);

const camera = new THREE.PerspectiveCamera(58, 1, 0.05, 400);

/* ---------------- ground ---------------- */
const tl = new THREE.TextureLoader();
const tex = (uri, srgb, rep) => {
  const t = tl.load(uri);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  t.anisotropy = LOW ? 1 : renderer.capabilities.getMaxAnisotropy();
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
const groundMat = new THREE.MeshStandardMaterial({
  map: tex(GROUND.color, true, 45), color: 0x8c8478, roughness: 1, metalness: 0,
});
if (!LOW) {
  groundMat.normalMap = tex(GROUND.normal, false, 45);
  groundMat.roughnessMap = tex(GROUND.rough, false, 45);
  groundMat.normalScale = new THREE.Vector2(1.4, 1.4);
}
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* the road he came by - darker, worn, and the only thing that tells you how far */
const roadMat = new THREE.MeshStandardMaterial({
  map: tex(GROUND.color, true, 1), color: 0x5a544b, roughness: 1, metalness: 0,
  transparent: true, opacity: 0.85, depthWrite: false,
});
roadMat.map.repeat.set(1.2, 24);
const road = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 70), roadMat);
road.rotation.x = -Math.PI / 2;
road.position.set(0.3, 0.004, 38);
road.receiveShadow = true;
scene.add(road);

const stone = new THREE.MeshStandardMaterial({ color: 0x5d564c, roughness: 0.94, metalness: 0.02 });
{
  /* waymarkers: parallax is what makes walking read as walking */
  const geo = new THREE.BoxGeometry(0.28, 0.62, 0.22);
  for (let z = 9; z < 66; z += 5.5) {
    for (const side of [-1, 1]) {
      const m = new THREE.Mesh(geo, stone);
      const jitter = Math.sin(z * 12.9 + side) * 0.25;
      m.position.set(0.3 + side * (1.9 + jitter), 0.28, z + jitter);
      m.rotation.set(Math.sin(z) * 0.08, z * 0.7, Math.cos(z * 3) * 0.06);
      m.castShadow = m.receiveShadow = true;
      scene.add(m);
    }
  }
}

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

/* the two leaves of the gate. They hang open, swung back into the dark where
   no one can see them, and are only shown when they close. */
const leafMat = new THREE.MeshStandardMaterial({ color: 0x24211d, roughness: 0.7, metalness: 0.6 });
function makeLeaf(side) {
  /* side -1: hinged on the left post, bars run toward +x; side 1 mirrors */
  const g = new THREE.Group();
  g.position.set(side * IW, 0, -0.55);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const lx = 0.06 + (IW - 0.1) * i / (n - 1);
    const wx = IW - lx; /* distance from the centre line, for the arch height */
    const x = -side * lx;
    const h = SPRING + Math.sqrt(Math.max(0, IW * IW - wx * wx)) - 0.05;
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.09, h, 0.09), leafMat);
    b.position.set(x, h / 2, 0); b.castShadow = true; g.add(b);
  }
  for (const y of [1.2, 4.2, 5.9]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(IW - 0.02, 0.13, 0.13), leafMat);
    r.position.set(-side * (IW / 2), y, 0); r.castShadow = true; g.add(r);
  }
  g.visible = false;
  scene.add(g);
  return g;
}
const leafL = makeLeaf(-1), leafR = makeLeaf(1);
const LEAF_OPEN = Math.PI / 2 + 0.25;

/* beyond it you can see nothing at all: the hall is a black box that takes
   no light, so even the radiance shows only as the glow in the doorway */
const hall = new THREE.Mesh(new THREE.BoxGeometry(IW * 2 + 0.3, 9, 30),
  new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide, fog: false }));
hall.position.set(0, 4.505, -1.0 - 15);
scene.add(hall);
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

/* the two figures come from figures.js, shared with the prologue */
const keeper = makeKeeper(LOW);
const KS = 1.08; /* he is powerful - a head taller than the man */
keeper.root.scale.setScalar(KS);
keeper.root.position.set(0, 0, 0.55);
scene.add(keeper.root);

const SEAT = V(3.35, 0, 2.35);
/* "the fleas in his fur collar": tiny, and only visible up close */
const FLEAS = 30, fleaPos = new Float32Array(FLEAS * 3), fleaSeed = [];
for (let i = 0; i < FLEAS; i++) fleaSeed.push([Math.random() * Math.PI * 2, 0.15 + Math.random() * 0.5, Math.random() * 10]);
const fleaGeo = new THREE.BufferGeometry();
fleaGeo.setAttribute('position', new THREE.BufferAttribute(fleaPos, 3));
const fleas = new THREE.Points(fleaGeo, new THREE.PointsMaterial({ color: 0x0b0a08, size: 0.012, sizeAttenuation: true }));
keeper.hips.add(fleas);
function crawl(t) {
  const c = keeper.collar;
  for (let i = 0; i < FLEAS; i++) {
    const [a0, sp, ph] = fleaSeed[i];
    const a = a0 + Math.sin(t * sp + ph) * 0.5 + t * sp * 0.08;
    fleaPos[i * 3] = Math.sin(a) * c.rx;
    fleaPos[i * 3 + 1] = c.y + 0.1 + Math.sin(t * 0.7 * sp + ph) * 0.05;
    fleaPos[i * 3 + 2] = Math.cos(a) * c.rx * 0.85;
  }
  fleaGeo.attributes.position.needsUpdate = true;
}

/* the man, as others would see him: only when the camera leaves his eyes */
const man = makeMan(LOW);
man.root.visible = false;
scene.add(man.root);
const MAN_SEAT_YAW = Math.atan2(-SEAT.x, 0.55 - SEAT.z);
let manSeated = false;
export function setSeated(on) { manSeated = on; }
function placeMan() {
  if (manSeated) { man.root.position.copy(SEAT); man.root.rotation.y = MAN_SEAT_YAW; man.setSit(1); }
  else { man.root.position.set(0.55, 0, 4.7); man.root.rotation.y = Math.PI; man.setSit(0); }
}

/* "the doorkeeper gives him a stool" */
const stool = new THREE.Group();
{
  const wood = cloth(0x3a2e22);
  add(stool, new THREE.CylinderGeometry(0.24, 0.24, 0.05, seg), wood, 0, 0.44, 0);
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3;
    const leg = add(stool, new THREE.CylinderGeometry(0.025, 0.03, 0.44, 8), wood, Math.cos(a) * 0.16, 0.22, Math.sin(a) * 0.16);
    leg.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
  }
}
/* it stands by the gate from the start: he has had it all along */
const STOOL_HOME = V(-1.75, 0, 1.3);
stool.position.copy(STOOL_HOME);
stool.rotation.y = 0.6;
scene.add(stool);

/* ---------------- what you gave him ----------------
   Each gift lands in a pile at his feet and stays there. */
const PILE = V(1.25, 0, 1.45);
const gifts = {};
{
  const leather = new THREE.MeshStandardMaterial({ color: 0x5a3f28, roughness: 0.8 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xb8963e, roughness: 0.3, metalness: 0.9 });
  const paper = cloth(0xcfc6b0), bread = cloth(0x8a6a3e), wool = cloth(0x2b2a33), wood = cloth(0x4a3a28);
  const g = (id, x, z, build) => { const o = new THREE.Group(); build(o); o.position.set(PILE.x + x, 0, PILE.z + z); o.visible = false; scene.add(o); gifts[id] = o; };
  g('purse', -0.25, 0.1, o => {
    const s = add(o, new THREE.SphereGeometry(0.13, 14, 10), leather, 0, 0.11, 0); s.scale.set(1, 0.85, 1);
    add(o, new THREE.CylinderGeometry(0.03, 0.05, 0.08, 8), leather, 0, 0.23, 0);
  });
  g('coat', 0.05, -0.15, o => { const c = add(o, new THREE.BoxGeometry(0.62, 0.12, 0.46), wool, 0, 0.06, 0); c.rotation.y = 0.4; });
  g('watch', 0.28, 0.2, o => {
    const w = add(o, new THREE.CylinderGeometry(0.065, 0.065, 0.02, 20), gold, 0, 0.01, 0);
    const chain = add(o, new THREE.TorusGeometry(0.09, 0.008, 6, 20, Math.PI), gold, 0.08, 0.005, 0.02);
    chain.rotation.x = -Math.PI / 2; w.rotation.z = 0.05;
  });
  g('letters', -0.05, 0.3, o => {
    for (let i = 0; i < 3; i++) { const l = add(o, new THREE.BoxGeometry(0.24, 0.012, 0.17), paper, 0, 0.006 + i * 0.013, 0); l.rotation.y = i * 0.35 - 0.3; }
  });
  g('bread', 0.42, -0.08, o => { const b = add(o, new THREE.CapsuleGeometry(0.075, 0.18, 4, 10), bread, 0, 0.07, 0); b.rotation.z = Math.PI / 2; b.rotation.y = 0.9; });
  g('stick', 0.0, 0.05, o => { const s = add(o, new THREE.CylinderGeometry(0.022, 0.026, 1.35, 8), wood, 0, 0.025, 0); s.rotation.set(Math.PI / 2, 0, 0.7); });
}

/* ---------------- the marks he scratches, one a year ----------------
   Groups of five on the face of the right-hand pillar, by his stool. */
const MARKS = 60;
const marks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.15, 0.006), new THREE.MeshBasicMaterial({ color: 0x8a8274, fog: true }), MARKS);
{
  const d = new THREE.Object3D();
  for (let i = 0; i < MARKS; i++) {
    const g = Math.floor(i / 5), j = i % 5, row = Math.floor(g / 5), col = g % 5;
    const x0 = 2.95 + col * 0.24, y0 = 1.45 - row * 0.24;
    if (j < 4) { d.position.set(x0 + j * 0.035, y0, 1.03); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1); }
    else { d.position.set(x0 + 0.053, y0, 1.035); d.rotation.set(0, 0, 1.15); d.scale.set(1, 1.35, 1); }
    d.updateMatrix(); marks.setMatrixAt(i, d.matrix);
  }
  marks.count = 0;
  /* the count grows from zero, so a bounding sphere measured at the start
     would cull them for good */
  marks.frustumCulled = false;
  scene.add(marks);
}
let markFrom = null;

/* ---------------- moss: the years, settling ---------------- */
const MOSS = LOW ? 40 : 90;
const mossGeo = new THREE.IcosahedronGeometry(0.075, 0);
mossGeo.scale(1.4, 0.38, 1.1);
const moss = new THREE.InstancedMesh(mossGeo, cloth(0x2c3622), MOSS);
{
  const d = new THREE.Object3D();
  for (let i = 0; i < MOSS; i++) {
    const a = Math.sin(i * 91.7) * 0.5 + 0.5, b = Math.sin(i * 47.3) * 0.5 + 0.5;
    /* clustered at the foot of the gate and around where he sits */
    if (i % 3 === 0) d.position.set(SEAT.x + (a - 0.5) * 1.6, 0.02, SEAT.z + (b - 0.5) * 1.4);
    else d.position.set((a - 0.5) * 9.6, 0.02, 1.15 + b * 0.5);
    d.rotation.set((a - 0.5) * 0.15, a * 6, (b - 0.5) * 0.15);
    d.scale.setScalar(0.6 + a * 1.1);
    d.updateMatrix();
    moss.setMatrixAt(i, d.matrix);
  }
  moss.count = 0;
  moss.frustumCulled = false;
  scene.add(moss);
}

/* ---------------- light ---------------- */
const hemi = new THREE.HemisphereLight(0x151a26, 0x000000, 1.4);
scene.add(hemi);
const HEMI_NIGHT = new THREE.Color(0x151a26), HEMI_DAY = new THREE.Color(0x3a3630), HEMI_SNOW = new THREE.Color(0x4a5466);
const MOON_HOME = V(-9, 14, 10);
const moon = new THREE.DirectionalLight(0x9fb0d4, 3.2);
moon.position.copy(MOON_HOME);
moon.castShadow = !LOW;
moon.shadow.mapSize.set(LOW ? 512 : 2048, LOW ? 512 : 2048);
moon.shadow.camera.near = 1; moon.shadow.camera.far = 60;
moon.shadow.camera.left = -16; moon.shadow.camera.right = 16;
moon.shadow.camera.top = 16; moon.shadow.camera.bottom = -16;
moon.shadow.bias = -0.0009;
scene.add(moon);
/* a faint fill from where you stand, so the doorkeeper reads on a classroom
   projector; it has no source in the scene and casts no shadow */
const fill = new THREE.PointLight(0x8a96b4, 1, 20, 1.2);
scene.add(fill);
const radiance = new THREE.PointLight(RAD, 0, 40, 1.6);
radiance.position.set(0, 3.2, -2.6);
scene.add(radiance);

/* ---------------- dust, which becomes snow when the years run ---------------- */
const N = LOW ? 260 : 700, pos = new Float32Array(N * 3), drift = new Float32Array(N);
for (let i = 0; i < N; i++) {
  pos[i * 3] = (Math.random() - 0.5) * 30;
  pos[i * 3 + 1] = Math.random() * 11;
  pos[i * 3 + 2] = 0.6 + Math.random() * 24;
  drift[i] = 0.1 + Math.random() * 0.28;
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const dustMat = new THREE.PointsMaterial({
  color: 0xb9ad99, size: 0.022, transparent: true, opacity: 0.17,
  sizeAttenuation: true, depthWrite: false,
});
scene.add(new THREE.Points(dustGeo, dustMat));

/* ---------------- post: the eyes ----------------
   Vignette, desaturation and peripheral blur rise with age. Bright warm light
   keeps its colour - at the end, the radiance is the only colour left. */
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.2, 0.75, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const eyes = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1, 1) },
    uVig: { value: 0.3 }, uSat: { value: 1 }, uBlur: { value: 0 }, uGrain: { value: 0.02 },
    uTime: { value: 0 }, uFade: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 uRes;
    uniform float uVig, uSat, uBlur, uGrain, uTime, uFade;
    varying vec2 vUv;
    void main(){
      vec2 c = vUv - 0.5;
      float d = length(c * vec2(uRes.x / uRes.y, 1.0));
      vec4 col = texture2D(tDiffuse, vUv);
      if (uBlur > 0.002) {
        float r = uBlur * (0.0025 + 0.014 * smoothstep(0.08, 0.75, d));
        vec3 acc = col.rgb;
        for (int i = 0; i < 8; i++) {
          float a = float(i) * 0.785398;
          acc += texture2D(tDiffuse, vUv + vec2(cos(a), sin(a) * uRes.x / uRes.y) * r).rgb;
        }
        col.rgb = acc / 9.0;
      }
      float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114));
      float warm = smoothstep(0.02, 0.12, col.r - col.b) * smoothstep(0.25, 0.7, lum);
      col.rgb = mix(vec3(lum), col.rgb, mix(uSat, 1.0, warm));
      col.rgb *= 1.0 - uVig * smoothstep(0.22, 0.9, d);
      float n = fract(sin(dot(vUv * uRes + uTime, vec2(12.9898, 78.233))) * 43758.5453);
      col.rgb += (n - 0.5) * uGrain;
      col.rgb *= 1.0 - uFade;
      gl_FragColor = vec4(col.rgb, 1.0);
    }`,
});
composer.addPass(eyes);

/* ---------------- stages ----------------
   Every field is numeric so the whole stage change lerps on one clock.
   look = how far the player can turn their head; old age narrows it. */
const STAGES = {
  1: { rad: 0, glow: 0, bloom: 0.14, thr: 0.90, fog: 0.026, moon: 3.4, hemi: 1.70, exp: 1.28, fill: 2.2,
       vig: 0.30, sat: 1.00, blur: 0.0, grain: 0.022, look: 1.0, fov: 58 },
  2: { rad: 0, glow: 0, bloom: 0.16, thr: 0.90, fog: 0.032, moon: 2.8, hemi: 1.40, exp: 1.16, fill: 1.8,
       vig: 0.46, sat: 0.78, blur: 0.0, grain: 0.03, look: 0.8, fov: 56 },
  3: { rad: 9, glow: 0.62, bloom: 0.42, thr: 0.68, fog: 0.040, moon: 0.6, hemi: 0.40, exp: 0.74, fill: 0.5,
       vig: 0.80, sat: 0.22, blur: 0.75, grain: 0.05, look: 0.35, fov: 52 },
  /* the gate shut: no radiance, nothing left to see by */
  4: { rad: 0, glow: 0, bloom: 0.12, thr: 0.90, fog: 0.018, moon: 3.6, hemi: 2.2, exp: 1.5, fill: 0,
       vig: 0.50, sat: 0.0, blur: 0.0, grain: 0.04, look: 0, fov: 46 },
};
let cur = Object.assign({}, STAGES[1]), tgt = STAGES[1], current = 1;
export const stageOf = () => current;
export function stage(n) { current = n; tgt = STAGES[n]; }
export function snap(n) { stage(n); cur = Object.assign({}, STAGES[n]); }

/* ---------------- the body ----------------
   Poses are [eye position, point looked at]. */
const POSES = {
  road:  [V(0.35, 1.62, 31.0), V(0.0, 2.4, 0.0)],
  stand: [V(0.55, 1.62, 4.7),  V(0.0, 1.55, 0.55)],
  near:  [V(1.30, 1.60, 1.55), V(0.75, 1.45, -9.0)],
  face:  [V(1.30, 1.60, 1.55), V(0.0, 1.75, 0.6)],
  rise:  [V(3.25, 1.60, 2.45), V(0.6, 1.9, 0.5)],
  seat:  [V(3.35, 1.10, 2.40), V(-0.15, 1.5, 0.75)],
  pile:  [V(3.30, 1.02, 2.30), V(1.25, 0.05, 1.45)],
  marksLook: [V(3.05, 1.12, 2.55), V(3.45, 1.18, 1.0)],
  aged:  [V(3.20, 0.92, 2.30), V(0.1, 1.75, 0.05)],
  strain:[V(3.15, 1.02, 2.25), V(0.0, 2.35, 0.0)],
  bend:  [V(3.20, 0.90, 2.30), V(0.75, 1.05, 1.35)],
  out:   [V(9.4, 3.4, 12.8),   V(0.9, 3.6, 0.6)],
  /* leaning past him to look into the hall */
  peer:  [V(1.55, 1.52, 1.75), V(0.35, 1.3, -14)],
  /* close enough to see the fur move */
  study: [V(0.78, 1.82, 1.7),  V(0.0, 1.86, 0.6)],
};
const eye = { p: POSES.road[0].clone(), l: POSES.road[1].clone() };
const ease = {
  inOut: u => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
  /* decelerating hard: the walk toward the gate loses its nerve */
  falter: u => 1 - Math.pow(1 - u, 4),
  out: u => 1 - Math.pow(1 - u, 2),
};
let tw = null, queue = [];
let stepAcc = 0, onStep = null, lastP = eye.p.clone();

function moveTo(name, dur, e, cb) {
  const [p, l] = POSES[name];
  tw = { fp: eye.p.clone(), fl: eye.l.clone(), tp: p, tl: l, t: 0, dur, e: ease[e || 'inOut'], cb };
}
/* run a list of moves back to back: [[pose, seconds, ease], ...] */
function chain(steps, done) {
  queue = steps.slice();
  (function next() {
    if (!queue.length) { if (done) done(); return; }
    const [n, d, e] = queue.shift();
    moveTo(n, CALM ? d * 0.6 : d, e, next);
  })();
}
export function setStepHandler(fn) { onStep = fn; }
export function placeAt(name) { tw = null; queue = []; eye.p.copy(POSES[name][0]); eye.l.copy(POSES[name][1]); lastP.copy(eye.p); }

/* -- the walk in. The player holds; the body moves. -- */
let walk = null;
export function startWalk(onArrive) { placeAt('road'); walk = { hold: false, v: 0, onArrive }; }
export function holdWalk(on) { if (walk) walk.hold = on; }
export function walkProgress() {
  const z0 = POSES.road[0].z, z1 = POSES.stand[0].z;
  return walk ? (z0 - eye.p.z) / (z0 - z1) : 1;
}
export function finishWalk() {
  if (!walk) return;
  const cb = walk.onArrive; walk = null;
  moveTo('stand', 1.4, 'out', cb);
}

/* -- trying the gate -- */
/* reach: how much of the way he gets before his nerve goes (1 = the threshold) */
export function approach(fromSeat, reach, done) {
  const from = POSES[fromSeat ? 'rise' : 'stand'], near = POSES.near;
  const p = from[0].clone().lerp(near[0], reach);
  POSES.reach = [p, from[1].clone().lerp(near[1], Math.min(1, reach * 1.2))];
  POSES.reachFace = [p, POSES.face[1]];
  const steps = fromSeat ? [['rise', 1.3, 'inOut']] : [];
  steps.push(['reach', 1.2 + 2.6 * reach, 'falter'], ['reachFace', 1.8, 'inOut']);
  chain(steps, done);
}
export function sitDown(done) { chain([['rise', 1.6, 'inOut'], ['seat', 1.3, 'inOut']], done); }
export function goSeat(done) { chain([['rise', 1.4, 'inOut'], ['seat', 1.3, 'inOut']], done); }
/* look down at his feet, set the thing there, look up again */
export function glance(id, done) {
  chain([['pile', 1.1, 'inOut']], () => {
    addGift(id);
    setTimeout(() => chain([['seat', 1.4, 'inOut']], done), 700);
  });
}
export function peer(done) { chain([['peer', 3.2, 'falter']], done); }
export function study(done) { chain([['rise', 1.2, 'inOut'], ['study', 2.6, 'inOut']], done); }
/* back to wherever the body belongs now */
export function home(seated, done) {
  if (seated) chain([['rise', 1.8, 'inOut'], ['seat', 1.3, 'inOut']], done);
  else chain([['stand', 2.2, 'inOut']], done);
}
let shake = 0;
export function shout() { shake = 0.9; }
export function glanceMarks(done) { chain([['marksLook', 1.4, 'inOut']], () => setTimeout(() => chain([[manSeated ? 'seat' : 'stand', 1.6, 'inOut']], done), 1600)); }
export function startMarks() { if (markFrom === null) markFrom = years; setYears(years); }
export function goAged(done) { chain([['aged', 3.2, 'inOut']], done); }
/* "You cannot stand." */
export function cannotStand(done) { chain([['strain', 1.1, 'out'], ['aged', 1.6, 'inOut']], done); }

/* -- keeper -- */
const K = { yaw: 0, bend: 0, z: 0.55, x: 0, watch: 1, fold: 1 };
let kT = { yaw: 0, bend: 0, z: 0.55, x: 0, watch: 1, fold: 1 };
const KEEP_HOME = { yaw: 0, bend: 0, z: 0.55, x: 0, watch: 1, fold: 1 };
/* he leans to your ear, not your face: seen from the stool the bend is half in
   profile against the glow, which is what makes it read as "very far down" */
const KEEP_BEND = { yaw: Math.atan2(SEAT.x, SEAT.z - 0.55) - 0.7, bend: 1.05, z: 0.55, watch: 0.6 };
export function bendDown() { kT = KEEP_BEND; tgt = Object.assign({}, STAGES[3], { glow: 0.5, bloom: 0.3, blur: 0.4, fill: 2.6 }); chain([['bend', 3.4, 'inOut']]); }

/* -- "the doorkeeper gives him a little stool" --
   He turns, stoops for the stool beside the gate, carries it over, sets it
   down at your side and goes back to his post. Then you sit. */
let cut = null;
export function giveStool(fromSeated, done) {
  cut = { t: 0, done, phase: 0 };
  chain([['rise', fromSeated ? 1.6 : 2.2, 'inOut']]);
}
const DROP = V(SEAT.x - 0.95, 0, SEAT.z - 0.55);
function runCut(dt) {
  const c = cut; c.t += dt;
  const T = c.t, kp = new THREE.Vector3(K.x, 0, K.z);
  if (T < 1.2) kT = { yaw: Math.atan2(STOOL_HOME.x - 0, STOOL_HOME.z - 0.55), bend: 0, z: 0.55, x: 0, watch: 0, fold: 0.4 };
  else if (T < 2.1) kT = Object.assign({}, kT, { bend: 0.85, fold: 0 });
  else if (T < 2.8) { c.carry = true; kT = Object.assign({}, kT, { bend: 0.15, yaw: Math.atan2(DROP.x, DROP.z - 0.55) }); }
  else if (T < 5.0) kT = { yaw: Math.atan2(DROP.x - K.x, DROP.z - K.z), bend: 0.15, x: DROP.x * 0.62, z: 0.55 + (DROP.z - 0.55) * 0.62, watch: 0.4, fold: 0 };
  else if (T < 5.9) kT = Object.assign({}, kT, { bend: 0.8 });
  else if (!c.placed) { c.placed = true; c.carry = false; }
  if (T > 6.2 && T < 8.6) kT = { yaw: Math.atan2(-K.x, 0.55 - K.z), bend: 0, x: 0, z: 0.55, watch: 0, fold: 1 };
  if (T >= 8.6 && c.phase === 0) { c.phase = 1; kT = KEEP_HOME; }
  /* the stool: in his hands while he carries it, then at your side */
  if (c.carry) {
    const fwd = V(Math.sin(K.yaw), 0, Math.cos(K.yaw));
    const target = kp.clone().addScaledVector(fwd, 0.55 + K.bend * 0.3); target.y = 0.95 - K.bend * 0.75;
    stool.position.lerp(target, 1 - Math.pow(0.001, dt));
  } else if (c.placed) {
    stool.position.lerp(SEAT, 1 - Math.pow(0.001, dt)); stool.position.y = Math.max(0, stool.position.y);
  }
  /* your eyes follow it */
  const look = stool.position.clone(); look.y += 0.6;
  if (!c.placed || T < 6.4) eye.l.lerp(look, 1 - Math.pow(0.05, dt));
  if (T > 7.0 && !c.sat) { c.sat = true; manSeated = true; chain([['seat', 1.8, 'inOut']], () => { const d = c.done; cut = null; if (d) d(); }); }
}

/* -- "In each hall beyond this one stands another" --
   While he says it, the dark of the doorway opens into what you imagine:
   gate behind gate, each keeper larger than the last, fading into fog. */
const vision = new THREE.Group();
vision.visible = false;
scene.add(vision);
const visMats = [];
{
  const N = LOW ? 5 : 8;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 140), new THREE.MeshBasicMaterial({ color: 0x07080a, fog: true }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.012, -71);
  vision.add(floor);
  for (let i = 0; i < N; i++) {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3a3d48).multiplyScalar(1 - i * 0.06), fog: true, transparent: true, opacity: 0, depthWrite: false });
    visMats.push(m);
    const z = -6 - i * 8 - i * i * 0.9;
    const g = new THREE.Mesh(gateGeo, m);
    g.position.set(0, 0, z);
    const sc = 1 + i * 0.18;
    g.scale.set(sc, sc, 1);
    vision.add(g);
    const k = makeKeeper(true);
    k.root.traverse(o => { if (o.isMesh) { o.material = m; o.castShadow = false; } });
    k.root.scale.setScalar(KS * (1 + 0.42 * (i + 1)));
    k.root.position.set(0, 0, z + 1.6);
    vision.add(k.root);
  }
}
let vis = null;
export function imagine(on) { vis = { t: vis ? vis.t : 0, on }; if (on) { vision.visible = true; hall.visible = voidWall.visible = false; } }
function runVision(dt) {
  vis.t = Math.max(0, vis.t + dt * (vis.on ? 1 : -2.2));
  let any = false;
  visMats.forEach((m, i) => { m.opacity = Math.max(0, Math.min(0.9, (vis.t - 0.6 - i * 0.9) / 1.6)); if (m.opacity > 0) any = true; });
  if (!vis.on && !any) { vision.visible = false; hall.visible = voidWall.visible = true; vis = null; }
}
export function lookIntoHall(done) { chain([['near', 2.4, 'inOut']], done); }
export function lookAtKeeper(done) { chain([['face', 2.0, 'inOut']], done); }

/* -- the end: you leave the body, he leaves the gate, the gate closes -- */
let ending = null;
export function endSequence() {
  ending = { t: 0 };
  /* the world comes back into view, but the doorway keeps its light until the leaves meet */
  tgt = Object.assign({}, STAGES[4], { rad: 9, glow: 0.62, bloom: 0.35, thr: 0.7 });
}
function runEnding(dt) {
  const e = ending; e.t += dt;
  if (e.t > 0 && !e.out) { e.out = true; moveTo('out', 6.5, 'inOut'); }
  if (e.t > 1.1) { placeMan(); man.root.visible = true; }
  if (e.t > 0.6 && !e.straight) { e.straight = true; kT = { yaw: Math.PI, bend: 0, z: 0.55, watch: 0 }; }
  if (e.t > 2.0) kT = { yaw: Math.PI, bend: 0, z: Math.max(-6, 0.55 - (e.t - 2.0) * 1.3), watch: 0 };
  if (e.t > 3.2) {
    leafL.visible = leafR.visible = true;
    const u = Math.min(1, (e.t - 3.2) / 2.6);
    const a = LEAF_OPEN * (1 - ease.inOut(u));
    leafL.rotation.y = a; leafR.rotation.y = -a;
    if (u > 0.55 && current !== 4) stage(4);
  }
}

export function closeGate() { leafL.visible = leafR.visible = true; leafL.rotation.y = leafR.rotation.y = 0; }
export function openGate() {
  leafL.visible = leafR.visible = false;
  leafL.rotation.y = LEAF_OPEN; leafR.rotation.y = -LEAF_OPEN;
}

/* -- time -- */
let lapse = null, years = 0;
/* outside=true: watch the years from outside the body - the only way he can be
   seen growing old. Each lapse takes the next of a few fixed set-ups. */
const TIME_SHOTS = [
  [V(7.2, 2.1, 8.6), V(1.4, 1.1, 1.2)],
  [V(5.4, 0.85, 4.6), V(2.6, 0.75, 1.9)],
  [V(-3.8, 2.4, 7.0), V(2.0, 1.0, 1.7)],
  [V(3.6, 4.2, 6.4), V(2.4, 0.4, 1.6)],
];
let shotN = 0;
export function timelapse(n, outside) {
  lapse = { t: 0, dur: CALM ? 1.2 : Math.min(2.2 + n * 0.55, 4.8), n, shot: outside ? TIME_SHOTS[shotN++ % TIME_SHOTS.length] : null };
  return lapse.dur * 1000;
}
export function setYears(y) {
  years = y;
  moss.count = Math.min(MOSS, Math.round(MOSS * Math.min(1, y / 44)));
  man.setAge(Math.min(1, y / 44));
  marks.count = markFrom === null ? 0 : Math.min(MARKS, Math.max(0, y - markFrom + 1));
}
export function addGift(id) { if (gifts[id]) gifts[id].visible = true; }
export function showStool(on) { stool.visible = on; if (on) { stool.position.copy(SEAT); stool.rotation.set(0, 0, 0); manSeated = true; } }

/* for the harness: the scene graph, to inspect what is visible */
export const debugScene = () => scene;
export function reset() {
  ending = null; lapse = null; walk = null;
  K.yaw = 0; K.bend = 0; K.z = 0.55; kT = KEEP_HOME;
  for (const o of keeper.mats) o.m.color.copy(o.base);
  for (const k in gifts) gifts[k].visible = false;
  stool.visible = true; stool.position.copy(STOOL_HOME); stool.rotation.set(0, 0.6, 0);
  man.root.visible = false; manSeated = false; man.setAge(0);
  markFrom = null; marks.count = 0; cut = null; vis = null; vision.visible = false; hall.visible = voidWall.visible = true; K.x = 0;
  setYears(0); openGate(); snap(1); placeAt('road');
}

/* -- looking around: the head turns a little, the body does not -- */
let lookX = 0, lookY = 0, lkX = 0, lkY = 0;
export function look(nx, ny) { lookX = Math.max(-1, Math.min(1, nx)); lookY = Math.max(-1, Math.min(1, ny)); }

/* ---------------- loop ---------------- */
function resize() {
  const w = host.clientWidth || window.innerWidth, h = host.clientHeight || window.innerHeight;
  camera.aspect = w / h;
  /* portrait phones: widen so the doorkeeper and the gate both fit */
  camera.userData.portrait = w < h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h); composer.setSize(w, h);
  if (guest) { guest.camera.aspect = w / h; guest.camera.updateProjectionMatrix(); }
  eyes.uniforms.uRes.value.set(w, h);
}
window.addEventListener('resize', resize);
resize();

const lerp = (a, b, t) => a + (b - a) * t;
const clock = new THREE.Clock();
let fCount = 0, lastSample = performance.now(), walked = 0;
const tmp = V(0, 0, 0), Y = V(0, 1, 0), X = V(1, 0, 0);

/* another scene (the prologue) can borrow the renderer and the eyes pass;
   while it has the frame, nothing here moves */
export function lend(g) {
  guest = g;
  renderPass.scene = g.scene; renderPass.camera = g.camera;
  resize();
}
export function reclaim() { guest = null; renderPass.scene = scene; renderPass.camera = camera; clock.getDelta(); }

function tick() {
  requestAnimationFrame(tick);
  if (guest) {
    let gdt = Math.min(clock.getDelta(), 0.1);
    if (window.__freeze) { gdt = Math.min(0.5, window.__advance || 0); window.__advance = (window.__advance || 0) - gdt; }
    guest.update(gdt, clock.elapsedTime);
    bloom.strength = guest.look.bloom; bloom.threshold = guest.look.threshold;
    renderer.toneMappingExposure = guest.look.exposure();
    eyes.uniforms.uVig.value = guest.look.vig; eyes.uniforms.uSat.value = guest.look.sat; eyes.uniforms.uBlur.value = 0;
    eyes.uniforms.uGrain.value = 0.025; eyes.uniforms.uTime.value = clock.elapsedTime % 100;
    composer.render();
    window.__frames = (window.__frames || 0) + 1;
    return;
  }
  let dt = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;
  /* the harness can stop the scene clock and step it, because software
     rendering is too slow to photograph a timed sequence in real time */
  if (window.__freeze) { dt = Math.min(0.5, window.__advance || 0); window.__advance = (window.__advance || 0) - dt; }
  /* ~2.6s to settle: long enough to feel like time rather than a page load */
  const k = 1 - Math.pow(0.001, dt / 2.6);
  for (const key in tgt) cur[key] = lerp(cur[key], tgt[key], k);

  /* --- years running --- */
  let day = 0, snow = 0, env = 0, swing = 0;
  if (lapse) {
    lapse.t += dt;
    const u = Math.min(1, lapse.t / lapse.dur);
    env = Math.sin(u * Math.PI);
    const ph = u * lapse.n * Math.PI * 2;
    day = (0.5 - 0.5 * Math.cos(ph * 3)) * env;   /* days flicker past */
    snow = Math.max(0, Math.cos(ph)) * env;        /* one winter per year */
    swing = Math.sin(ph * 3) * env;
    if (u >= 1) { lapse = null; }
  }
  const outside = lapse && lapse.shot;

  radiance.intensity = cur.rad;
  glowMat.uniforms.uOpacity.value = cur.glow;
  bloom.strength = cur.bloom;
  bloom.threshold = cur.thr;
  scene.fog.density = cur.fog;
  moon.intensity = cur.moon * (1 + day * 0.9 + snow * 0.4);
  moon.position.set(MOON_HOME.x * Math.cos(swing * 1.2) + 12 * Math.sin(swing * 1.2), MOON_HOME.y, MOON_HOME.z);
  hemi.intensity = cur.hemi * (1 + day * 1.2);
  fill.intensity = cur.fill;
  hemi.color.copy(HEMI_NIGHT).lerp(HEMI_DAY, day).lerp(HEMI_SNOW, snow * 0.7);
  renderer.toneMappingExposure = cur.exp * (1 + day * 0.25);
  eyes.uniforms.uVig.value = cur.vig;
  eyes.uniforms.uSat.value = cur.sat;
  eyes.uniforms.uBlur.value = LOW ? cur.blur * 0.6 : cur.blur;
  eyes.uniforms.uGrain.value = cur.grain;
  eyes.uniforms.uTime.value = t % 100;
  const fov = cur.fov + (camera.userData.portrait ? 16 : 0);
  if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }

  /* --- the body --- */
  if (walk) {
    const target = walk.hold ? (CALM ? 1.8 : 2.4) : 0;
    walk.v = lerp(walk.v, target, 1 - Math.pow(0.02, dt));
    const z0 = POSES.road[0].z, z1 = POSES.stand[0].z;
    eye.p.z = Math.max(z1, eye.p.z - walk.v * dt);
    const u = (z0 - eye.p.z) / (z0 - z1);
    eye.p.x = lerp(POSES.road[0].x, POSES.stand[0].x, u);
    eye.l.lerpVectors(POSES.road[1], POSES.stand[1], u * u);
    if (eye.p.z <= z1 + 0.01) finishWalk();
  } else if (tw) {
    tw.t += dt;
    const u = Math.min(1, tw.t / tw.dur), e = tw.e(u);
    eye.p.lerpVectors(tw.fp, tw.tp, e);
    eye.l.lerpVectors(tw.fl, tw.tl, e);
    if (u >= 1) { const cb = tw.cb; tw = null; if (cb) cb(); }
  }

  /* footsteps: by distance covered on the ground, not by time */
  const moved = Math.hypot(eye.p.x - lastP.x, eye.p.z - lastP.z);
  lastP.copy(eye.p);
  const onFoot = eye.p.y > 1.4 && !ending;
  if (onFoot && moved > 0) {
    walked += moved; stepAcc += moved;
    if (stepAcc > 0.72) { stepAcc = 0; if (onStep) onStep(Math.min(1, moved / dt / 2.4)); }
  }
  const speed = moved / Math.max(dt, 1e-4);
  const bob = (CALM || !onFoot) ? 0 : Math.sin(walked * 4.4) * 0.03 * Math.min(1, speed / 1.5);
  /* breathing; shallower and less steady when old */
  const breath = Math.sin(t * (current === 3 ? 1.5 : 0.9)) * (current === 3 ? 0.012 : 0.007);

  camera.position.set(eye.p.x, eye.p.y + bob + breath, eye.p.z);
  camera.lookAt(eye.l);
  if (shake > 0) { shake = Math.max(0, shake - dt); camera.position.x += (Math.random() - 0.5) * shake * 0.05; camera.position.y += (Math.random() - 0.5) * shake * 0.05; }
  if (outside) {
    const u = lapse.t / lapse.dur;
    camera.position.copy(outside[0]).lerp(outside[1], 0.06 * u);
    camera.lookAt(outside[1]);
  }
  lkX = lerp(lkX, lookX, 1 - Math.pow(0.05, dt));
  lkY = lerp(lkY, lookY, 1 - Math.pow(0.05, dt));
  const range = ending || outside ? 0 : cur.look;
  camera.rotateOnWorldAxis(Y, -lkX * 0.42 * range);
  camera.rotateX(-lkY * 0.2 * range);

  /* --- the doorkeeper: never quite still, and he watches you --- */
  const kk = 1 - Math.pow(0.02, dt / 2.2);
  K.yaw = lerp(K.yaw, kT.yaw, kk); K.bend = lerp(K.bend, kT.bend, kk);
  K.z = lerp(K.z, kT.z, 1 - Math.pow(0.02, dt)); K.watch = lerp(K.watch, kT.watch, kk);
  K.x = lerp(K.x, kT.x || 0, 1 - Math.pow(0.04, dt)); K.fold = lerp(K.fold, kT.fold === undefined ? 1 : kT.fold, 1 - Math.pow(0.02, dt));
  keeper.fold(K.fold);
  keeper.root.rotation.y = K.yaw + Math.sin(t * 0.21) * 0.022;
  /* when he walks, he bobs a little */
  const kWalk = Math.min(1, Math.hypot((kT.x || 0) - K.x, kT.z - K.z) * 2);
  keeper.root.position.set(K.x, Math.sin(t * 0.33) * 0.007 + Math.abs(Math.sin(t * 4.5)) * 0.03 * kWalk, K.z);
  keeper.hips.rotation.x = K.bend;
  keeper.root.getWorldPosition(tmp);
  const toEye = Math.atan2(camera.position.x - tmp.x, camera.position.z - tmp.z) - K.yaw;
  const want = Math.max(-1.0, Math.min(1.0, Math.atan2(Math.sin(toEye), Math.cos(toEye)))) * K.watch;
  keeper.neck.rotation.y = lerp(keeper.neck.rotation.y, want, 1 - Math.pow(0.05, dt / 1.8));
  keeper.neck.rotation.x = K.bend * 0.35;
  /* walking away into the hall, he simply goes dark */
  const lit = Math.max(0, Math.min(1, 1 + (K.z + 0.6) / 2.4));
  for (const o of keeper.mats) o.m.color.copy(o.base).multiplyScalar(lit);
  keeper.root.visible = lit > 0.01;
  /* above and behind the eyes, so it lights at a distance and never glares up close */
  fill.position.copy(camera.position).add(tmp.set(0, 0, 2.4).applyQuaternion(camera.quaternion)).add(tmp.set(0, 1.4, 0));

  if (ending) runEnding(dt);
  crawl(t);
  if (cut) runCut(dt);
  if (vis) runVision(dt);
  /* he is seen only from outside: in a time shot, or once he has left his body */
  /* strictly boolean: three.js skips an object only when visible === false */
  const seen = !!outside || !!(ending && ending.t > 1.1);
  if (seen && !man.root.visible) placeMan();
  man.root.visible = seen;
  if (seen) man.pose(t, 0);

  /* --- dust / snow --- */
  dustMat.size = lerp(0.022, 0.06, snow);
  dustMat.opacity = lerp(0.17, 0.65, snow);
  dustMat.color.setRGB(lerp(0.73, 0.92, snow), lerp(0.68, 0.94, snow), lerp(0.6, 1.0, snow));
  const p = dustGeo.attributes.position.array;
  for (let i = 0; i < N; i++) {
    p[i * 3 + 1] += lerp(drift[i] * 0.12, -1.6 - drift[i] * 2, snow) * dt;
    p[i * 3] += Math.sin(t * 0.1 + i) * dt * (0.02 + snow * 0.3);
    if (p[i * 3 + 1] > 11) p[i * 3 + 1] = 0;
    if (p[i * 3 + 1] < 0) p[i * 3 + 1] = 11;
  }
  dustGeo.attributes.position.needsUpdate = true;

  composer.render();

  fCount++;
  const now = performance.now();
  if (now - lastSample >= 1000) {
    const raw = (fCount * 1000) / (now - lastSample);
    window.__fpsRaw = raw;
    window.__fps = raw < 10 ? Math.round(raw * 10) / 10 : Math.round(raw);
    fCount = 0; lastSample = now;
  }
  window.__frames = (window.__frames || 0) + 1;
}
reset();
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
mode ${LOW ? 'LOW (mobile)' : 'FULL'}   stage ${stageOf()}   years ${years}
shdw ${renderer.shadowMap.enabled ? 'on' : 'off'}  dust ${N}  seg ${seg}`;
  }, 1000);
}
