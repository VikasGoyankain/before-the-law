/* The sculpted characters (assets/models, reduced by tools/prep-models.mjs),
   rigged here at start-up.

   The sculpts arrive with no skeleton, so one is fitted to them: joints are
   placed where the body measures them to be, and every vertex is bound to the
   nearest bones by distance ("envelope" skinning), arms counted as thinner
   than the trunk so the coat's sides stay with the body. It is cruder than a
   hand-weighted rig, but the coat hides most of it, and it means the game
   needs nothing but the mesh. They are coloured the same way - by region.

   Both figures expose the same handles as the hand-built ones in figures.js,
   so nothing else in the game needs to know which it got. */
import * as THREE from 'three';
import { MODELS } from './models.gen.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const hasModels = () => !!(MODELS.doorkeeper && MODELS.man);

function decode(b64, Type) {
  const bin = atob(b64), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Type(u8.buffer);
}

/* model space: the sculpts are 1.9 high, centred on y = 0, facing +z.
   Game space: feet on the ground, scaled to the figure's height. */
function build(m, scale) {
  const raw = decode(m.pos, Float32Array);
  const idx = decode(m.idx, m.wide ? Uint32Array : Uint16Array);
  const pos = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i += 3) { pos[i] = raw[i] * scale; pos[i + 1] = (raw[i + 1] + 0.95) * scale; pos[i + 2] = raw[i + 2] * scale; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return { g, raw };
}

/* Each sculpt is decoded, measured and weighted once; every figure made from
   it shares those arrays and only gets its own skeleton and colours. (The
   halls vision alone needs eight doorkeepers.) */
const cache = {};
function shared(key, model, scale, defs, regionOf) {
  if (!cache[key]) {
    const { g, raw } = build(model, scale);
    rig(g, defs, scale);
    const n = raw.length / 3, region = new Uint8Array(n);
    for (let i = 0; i < n; i++) region[i] = regionOf(raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2]);
    cache[key] = { g, region };
  }
  const c = cache[key], g = new THREE.BufferGeometry();
  for (const a of ['position', 'normal', 'skinIndex', 'skinWeight']) g.setAttribute(a, c.g.attributes[a]);
  g.setIndex(c.g.index);
  return { g, region: c.region, bones: bonesFor(defs, scale) };
}
function bonesFor(defs, scale) {
  const S = p => V(p[0] * scale, (p[1] + 0.95) * scale, p[2] * scale);
  const bones = {}, list = [];
  defs.forEach(([name, parent, head]) => {
    const b = new THREE.Bone(); b.name = name;
    const h = S(head);
    if (parent) { b.position.copy(h).sub(bones[parent].userData.head); bones[parent].add(b); }
    else b.position.copy(h);
    b.userData.head = h;
    bones[name] = b; list.push(b);
  });
  return { bones, list };
}

/* defs: [name, parent, head, tail, thickness] in model space */
function rig(g, defs, scale) {
  const S = p => V(p[0] * scale, (p[1] + 0.95) * scale, p[2] * scale);
  const bones = {}, list = [], segs = [];
  defs.forEach(([name, parent, head, tail, thick]) => {
    const b = new THREE.Bone(); b.name = name;
    const h = S(head), t = S(tail);
    if (parent) { b.position.copy(h).sub(bones[parent].userData.head); bones[parent].add(b); }
    else b.position.copy(h);
    b.userData.head = h;
    bones[name] = b; list.push(b);
    segs.push({ a: h, ab: t.clone().sub(h), k: thick || 1 });
  });
  const P = g.attributes.position, n = P.count;
  const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), p = V(0, 0, 0), q = V(0, 0, 0);
  const w = new Float32Array(list.length);
  for (let i = 0; i < n; i++) {
    p.fromBufferAttribute(P, i);
    for (let b = 0; b < segs.length; b++) {
      const s = segs[b];
      const t = Math.max(0, Math.min(1, q.copy(p).sub(s.a).dot(s.ab) / s.ab.lengthSq()));
      const d = q.copy(s.a).addScaledVector(s.ab, t).distanceTo(p) * s.k + 1e-4;
      w[b] = 1 / Math.pow(d, 6);
    }
    /* keep the four strongest */
    const order = [...w.keys()].sort((a, b) => w[b] - w[a]).slice(0, 4);
    let sum = 0; for (const o of order) sum += w[o];
    order.forEach((o, k) => { si[i * 4 + k] = o; sw[i * 4 + k] = w[o] / sum; });
  }
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  return { bones, list };
}

/* colour each vertex by the region it falls in, tested in model space */
function paint(g, region, palette) {
  const n = region.length, col = new Float32Array(n * 3);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const repaint = pal => {
    for (let i = 0; i < n; i++) { const c = pal[region[i]]; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.attributes.color.needsUpdate = true;
  };
  repaint(palette);
  return repaint;
}

function skinned(g, list, rootBone) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });
  const mesh = new THREE.SkinnedMesh(g, mat);
  mesh.add(rootBone);
  mesh.bind(new THREE.Skeleton(list));
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return { mesh, mat };
}

/* ---------------- the doorkeeper ---------------- */
const KC = { coat: 0, fur: 1, skin: 2, beard: 3, belt: 4, boot: 5, hat: 6 };
const KEEPER_PAL = [0x352a22, 0x6a5844, 0x8c6a52, 0x121010, 0x24190f, 0x19140f, 0x5e4c3a].map(c => new THREE.Color(c));
function keeperRegion(x, y, z) {
  const ax = Math.abs(x);
  if (y > 0.8) return KC.hat;
  if (ax > 0.84) return KC.skin;                                   /* hands */
  if (ax > 0.62) return KC.fur;                                    /* cuffs */
  if (y < -0.64) return KC.boot;
  if (y > 0.38 && y < 0.71 && ax < 0.058 && z > 0.06) return KC.beard; /* long and thin */
  if (y > 0.64 && y < 0.71 && ax < 0.11 && z > 0.07) return KC.beard;  /* moustache */
  if (y >= 0.64) return z > -0.02 ? KC.skin : KC.hat;
  if (y > 0.13 && y < 0.21 && ax < 0.3) return KC.belt;
  if (y > 0.2 && y < 0.64 && ax < 0.24 && z > 0.06) return KC.fur;  /* the great collar, down the front */
  if (y > 0.5 && ax < 0.3) return KC.fur;                           /* and round the neck */
  if (y < -0.52) return KC.fur;                                     /* fur at the hem */
  return KC.coat;
}

const KEEPER_BONES = [
    ['base', null, [0, -0.9, 0], [0, -0.05, 0], 0.8],
    ['hips', 'base', [0, 0.0, 0], [0, 0.3, 0], 0.9],
    ['chest', 'hips', [0, 0.3, 0], [0, 0.6, 0], 0.9],
    ['neck', 'chest', [0, 0.6, 0], [0, 0.95, 0], 1.1],
    ['upL', 'chest', [0.2, 0.46, 0], [0.5, 0.46, 0], 1.8],
    ['foreL', 'upL', [0.5, 0.46, 0], [0.93, 0.46, 0], 1.6],
    ['upR', 'chest', [-0.2, 0.46, 0], [-0.5, 0.46, 0], 1.8],
    ['foreR', 'upR', [-0.5, 0.46, 0], [-0.93, 0.46, 0], 1.6],
  ];

export function makeRealKeeper() {
  const SC = 1.1;
  const { g, region, bones: B } = shared('keeper', MODELS.doorkeeper, SC, KEEPER_BONES, keeperRegion);
  paint(g, region, KEEPER_PAL);
  const { bones, list } = B;
  const { mesh, mat } = skinned(g, list, bones.base);
  const root = new THREE.Group(); root.add(mesh);

  /* arm poses as directions in the chest's frame: hanging, and folded */
  const X = V(1, 0, 0), NX = V(-1, 0, 0);
  const pose = (rest, d1, d2) => {
    const q1 = new THREE.Quaternion().setFromUnitVectors(rest, d1.normalize());
    const q2 = q1.clone().invert().multiply(new THREE.Quaternion().setFromUnitVectors(rest, d2.normalize()));
    return [q1, q2];
  };
  const ARMS = {
    L: { up: bones.upL, fore: bones.foreL, hang: pose(X, V(0.12, -1, 0.06), V(0.08, -1, 0.15)), fold: pose(X, V(0.22, -0.75, 0.5), V(-0.95, 0.18, 0.3)) },
    R: { up: bones.upR, fore: bones.foreR, hang: pose(NX, V(-0.12, -1, 0.06), V(-0.08, -1, 0.15)), fold: pose(NX, V(-0.22, -0.8, 0.45), V(0.95, 0.08, 0.38)) },
  };
  /* 'folded' for this figure is hands clasped at the belt: a fur coat this
     thick does not fold its sleeves across the chest without ballooning */
  function fold(k) {
    k *= 0.55;
    for (const a of Object.values(ARMS)) {
      a.up.quaternion.slerpQuaternions(a.hang[0], a.fold[0], k);
      a.fore.quaternion.slerpQuaternions(a.hang[1], a.fold[1], k);
    }
  }
  fold(1);
  return {
    root, hips: bones.hips, neck: bones.neck, fold,
    arms: [{ up: bones.upR, fore: bones.foreR, s: -1 }, { up: bones.upL, fore: bones.foreL, s: 1 }],
    mats: [{ m: mat, base: mat.color.clone() }],
    collar: { y: 0.6, rx: 0.24, rz: 0.2 },
    real: true,
  };
}

/* ---------------- the man ---------------- */
const MC = { jacket: 0, trousers: 1, boot: 2, skin: 3, hair: 4, hat: 5 };
const MAN_PAL = [0x5a4a3b, 0x3a3631, 0x1d1712, 0xb08a6e, 0x2a221c, 0x2d2721].map(c => new THREE.Color(c));
function manRegion(x, y, z) {
  const ax = Math.abs(x);
  if (y > 0.79) return MC.hat;
  if (y > 0.74 && (ax > 0.1 || z > 0.11 || z < -0.1)) return MC.hat;       /* brim */
  if (y > 0.56 && y < 0.7 && ax < 0.085 && z > 0.06) return MC.hair;       /* beard */
  if (y > 0.66) return z > 0 ? MC.skin : MC.hair;
  if (y > 0.6) return z > 0.02 ? MC.skin : MC.jacket;
  if (y < -0.76) return MC.boot;
  if (y < -0.12) return MC.trousers;
  return MC.jacket;
}

const MAN_BONES = [
    ['hips', null, [0, -0.06, 0], [0, 0.15, 0], 1],
    ['spine', 'hips', [0, 0.15, 0], [0, 0.4, 0], 1],
    ['chest', 'spine', [0, 0.4, 0], [0, 0.6, 0], 1],
    ['head', 'chest', [0, 0.6, 0], [0, 0.95, 0], 1],
    ['upL', 'chest', [0.19, 0.5, -0.02], [0.3, 0.24, -0.02], 1.7],
    ['foreL', 'upL', [0.3, 0.24, -0.02], [0.27, 0.02, 0.05], 1.6],
    ['upR', 'chest', [-0.19, 0.5, -0.02], [-0.3, 0.24, -0.02], 1.7],
    ['foreR', 'upR', [-0.3, 0.24, -0.02], [-0.27, 0.02, 0.05], 1.6],
    ['thighL', 'hips', [0.1, -0.1, 0], [0.1, -0.42, 0], 1.05],
    ['shinL', 'thighL', [0.1, -0.42, 0], [0.1, -0.84, -0.02], 1],
    ['footL', 'shinL', [0.1, -0.84, -0.02], [0.1, -0.94, 0.12], 1],
    ['thighR', 'hips', [-0.1, -0.1, 0], [-0.1, -0.42, 0], 1.05],
    ['shinR', 'thighR', [-0.1, -0.42, 0], [-0.1, -0.84, -0.02], 1],
    ['footR', 'shinR', [-0.1, -0.84, -0.02], [-0.1, -0.94, 0.12], 1],
  ];

export function makeRealMan() {
  const SC = 0.9;
  const { g, region, bones: B } = shared('man', MODELS.man, SC, MAN_BONES, manRegion);
  const pal = MAN_PAL.map(c => c.clone());
  const repaint = paint(g, region, pal);
  const { bones, list } = B;
  const { mesh } = skinned(g, list, bones.hips);
  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body); body.add(mesh);
  const HIP_Y = bones.hips.position.y;

  /* the bundle on its stick, over the shoulder (for the road) */
  const stick = new THREE.Group(); stick.position.set(-0.17, 0.14, 0); bones.chest.add(stick);
  const stickM = new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.9 });
  const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 1.15, 6), stickM); s1.position.set(0, 0.06, -0.3); s1.rotation.x = -1.37; stick.add(s1);
  const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), new THREE.MeshStandardMaterial({ color: 0x6e5a44, roughness: 1 }));
  s2.position.set(0, -0.02, -0.78); s2.scale.set(1, 1.15, 0.9); stick.add(s2);
  stick.traverse(o => { if (o.isMesh) o.castShadow = true; });
  stick.visible = false;

  const hairYoung = new THREE.Color(0x2a221c), hairOld = new THREE.Color(0xd8d4cc);
  const coatYoung = new THREE.Color(0x5a4a3b), coatOld = new THREE.Color(0x5f5a52);
  let age = 0, sit = 0;
  function setAge(a) {
    age = Math.max(0, Math.min(1, a));
    pal[MC.hair].copy(hairYoung).lerp(hairOld, Math.min(1, age * 1.3));
    pal[MC.jacket].copy(coatYoung).lerp(coatOld, age);
    repaint(pal);
    root.scale.setScalar(1 - age * 0.1);
  }
  function setSit(s) { sit = Math.max(0, Math.min(1, s)); }
  const legs = [{ thigh: bones.thighR, shin: bones.shinR }, { thigh: bones.thighL, shin: bones.shinL }];
  function pose(t, walk) {
    const w = (walk || 0) * (1 - sit), ph = t * 5.2;
    legs.forEach((l, i) => {
      l.thigh.rotation.x = w * Math.sin(ph + i * Math.PI) * 0.4 - sit * 1.5;
      l.shin.rotation.x = w * Math.max(0, -Math.cos(ph + i * Math.PI)) * 0.65 + sit * 1.5;
    });
    const breath = Math.sin(t * (1.1 + age * 0.6)) * (0.004 + age * 0.004);
    /* seated: hips come down to the stool */
    bones.hips.position.y = HIP_Y + (0.5 - HIP_Y) * sit + w * Math.abs(Math.cos(ph)) * 0.03 + breath;
    bones.hips.position.z = -0.06 * sit;
    /* the back bends with the years */
    bones.spine.rotation.x = age * 0.32 + sit * 0.06 + w * 0.05;
    bones.chest.rotation.x = age * 0.22;
    bones.head.rotation.x = -age * 0.3;
  }
  setAge(0);
  return { root, hips: bones.hips, spine: bones.spine, head: bones.head, legs, arms: [], stick, setAge, setSit, pose, real: true, get age() { return age; } };
}
