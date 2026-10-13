/* Shared pieces for the scenes of "An Imperial Message": a seeded random,
   canvas-painted textures (nothing is fetched), the sky, the glyphs of the
   message, and the crowd: faceless robed figures drawn as instances, which
   sway on their own and can bow when the sun is shown. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- painted textures ---------------- */
export function paint(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = 4;
  return t;
}
function speckle(g, w, h, n, alpha, r = rng(7)) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,240,220'},${alpha * r()})`;
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}
let cache = {};
export const TEX = {
  /* old vermilion lacquer, gold trim along the bottom, smoke-dark toward the top */
  lacquer() {
    return cache.lacquer || (cache.lacquer = paint(256, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#2a0f0a'); gr.addColorStop(0.35, '#6e1d12'); gr.addColorStop(1, '#8a2716');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      speckle(g, w, h, 2200, 0.18);
      g.fillStyle = '#b8873a'; g.fillRect(0, h - 22, w, 5); g.fillRect(0, h - 12, w, 2);
      g.strokeStyle = 'rgba(200,150,70,.35)'; g.lineWidth = 2;
      for (let x = 16; x < w; x += 64) { g.strokeRect(x, h * 0.42, 40, 70); }
    }, [1, 1]));
  },
  floor() {
    return cache.floor || (cache.floor = paint(256, 256, (g, w, h) => {
      g.fillStyle = '#2b2420'; g.fillRect(0, 0, w, h);
      const r = rng(3);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        const v = 36 + r() * 16;
        g.fillStyle = `rgb(${v + 6},${v},${v - 6})`;
        g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
      }
      speckle(g, w, h, 3000, 0.25);
    }, [1, 1]));
  },
  wood() {
    return cache.wood || (cache.wood = paint(128, 256, (g, w, h) => {
      g.fillStyle = '#3a2416'; g.fillRect(0, 0, w, h);
      const r = rng(11);
      for (let i = 0; i < 70; i++) {
        g.strokeStyle = `rgba(${r() < 0.5 ? '20,10,5' : '90,60,35'},${0.25 + r() * 0.3})`;
        g.beginPath(); const x = r() * w; g.moveTo(x, 0);
        g.bezierCurveTo(x + r() * 8 - 4, h * 0.3, x + r() * 8 - 4, h * 0.6, x + r() * 6 - 3, h); g.stroke();
      }
    }, [1, 1]));
  },
  plaster() {
    return cache.plaster || (cache.plaster = paint(256, 256, (g, w, h) => {
      g.fillStyle = '#8b8170'; g.fillRect(0, 0, w, h);
      speckle(g, w, h, 5000, 0.22);
      const r = rng(5);
      g.strokeStyle = 'rgba(60,50,40,.25)';
      for (let i = 0; i < 8; i++) { g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += r() * 20 - 10; y += r() * 20 - 10; g.lineTo(x, y); } g.stroke(); }
    }, [2, 2]));
  },
  silk() {
    return cache.silk || (cache.silk = paint(256, 256, (g, w, h) => {
      g.fillStyle = '#b8902e'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,230,160,.35)'; g.lineWidth = 2;
      for (let y = 0; y < h; y += 64) for (let x = (y / 64) % 2 * 32; x < w; x += 64) {
        g.beginPath(); g.arc(x + 16, y + 16, 10, 0, Math.PI * 2); g.stroke();
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(x + 16 + Math.cos(a) * 13, y + 16 + Math.sin(a) * 13); g.lineTo(x + 16 + Math.cos(a) * 18, y + 16 + Math.sin(a) * 18); g.stroke(); }
      }
      speckle(g, w, h, 1500, 0.12);
    }, [2, 2]));
  },
  paving() {
    return cache.paving || (cache.paving = paint(256, 256, (g, w, h) => {
      g.fillStyle = '#5b554c'; g.fillRect(0, 0, w, h);
      const r = rng(9);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) {
        const v = 80 + r() * 25, o = (y % 2) * 32;
        g.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
        g.fillRect(x * 64 + o + 1, y * 32 + 1, 62, 30);
      }
      speckle(g, w, h, 3000, 0.2);
    }, [1, 1]));
  },
  roof() {
    return cache.roof || (cache.roof = paint(64, 128, (g, w, h) => {
      g.fillStyle = '#2d2b2c'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 8) { g.fillStyle = x % 16 ? '#3b393a' : '#232122'; g.fillRect(x, 0, 6, h); }
    }, [1, 1]));
  },
};

/* ---------------- the sky ----------------
   A dome with a three-stop gradient, a glow toward one direction (the sun,
   or the capital's light on the horizon) and stars that come out with night. */
export function makeSky(opts = {}) {
  const u = {
    top: { value: new THREE.Color(opts.top || 0x0b1020) },
    mid: { value: new THREE.Color(opts.mid || 0x2a3048) },
    low: { value: new THREE.Color(opts.low || 0x8a5a3a) },
    glowDir: { value: (opts.glowDir || V(0, 0.05, -1)).normalize() },
    glowCol: { value: new THREE.Color(opts.glowCol || 0xffb060) },
    glow: { value: opts.glow ?? 0.6 },
    stars: { value: opts.stars ?? 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform vec3 top, mid, low, glowCol, glowDir; uniform float glow, stars; varying vec3 vDir;
      float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      void main(){
        float y = vDir.y;
        vec3 c = y > 0.12 ? mix(mid, top, smoothstep(0.12, 0.7, y)) : mix(low, mid, smoothstep(-0.05, 0.12, y));
        float g = max(0.0, dot(vDir, glowDir));
        c += glowCol * (pow(g, 18.0) * 0.9 + pow(g, 4.0) * 0.25) * glow;
        vec3 q = floor(vDir * 420.0);
        float s = step(0.9975, hash(q)) * smoothstep(0.05, 0.35, y) * stars;
        c += vec3(s) * (0.6 + 0.4 * hash(q + 1.0));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(opts.r || 600, 32, 16), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return { mesh, u };
}

/* ---------------- the glyphs ----------------
   The message is never in words. Each run draws six fresh sun-sigils at
   random, whispers five of them, and nothing anywhere decodes them. */
export function makeGlyphs(n = 6) {
  const r = Math.random;
  const out = [];
  for (let k = 0; k < n; k++) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.translate(64, 64);
    g.strokeStyle = '#ffd98a'; g.fillStyle = '#ffd98a';
    g.lineCap = 'round'; g.lineWidth = 5;
    g.shadowColor = 'rgba(255,200,110,.9)'; g.shadowBlur = 10;
    const ring = 18 + r() * 14;
    if (r() < 0.75) { g.beginPath(); g.arc(0, 0, ring, r() * 0.8, Math.PI * 2 - r() * 1.6); g.stroke(); }
    const rays = 3 + Math.floor(r() * 6), off = r() * Math.PI;
    for (let i = 0; i < rays; i++) {
      const a = off + i * Math.PI * 2 / rays + (r() - 0.5) * 0.3, l = 10 + r() * 22;
      g.beginPath(); g.moveTo(Math.cos(a) * (ring + 6), Math.sin(a) * (ring + 6));
      g.lineTo(Math.cos(a) * (ring + 6 + l), Math.sin(a) * (ring + 6 + l)); g.stroke();
      if (r() < 0.3) { g.beginPath(); g.arc(Math.cos(a) * (ring + 12 + l), Math.sin(a) * (ring + 12 + l), 3.5, 0, 7); g.fill(); }
    }
    const inner = Math.floor(r() * 4);
    g.lineWidth = 4;
    if (inner === 0) { g.beginPath(); g.arc(0, 0, 5, 0, 7); g.fill(); }
    if (inner === 1) { g.beginPath(); g.moveTo(-10, -6); g.lineTo(0, 9); g.lineTo(10, -6); g.stroke(); }
    if (inner === 2) { g.beginPath(); g.moveTo(-9, 0); g.lineTo(9, 0); g.moveTo(0, -9); g.lineTo(0, 9); g.stroke(); }
    if (inner === 3) { g.beginPath(); g.arc(0, 0, 9, Math.PI * 0.2, Math.PI * 1.3); g.stroke(); }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    out.push({ canvas: c, tex, url: c.toDataURL() });
  }
  return out;
}

/* the seal pressed with the reader's name */
export function sealTexture(name) {
  return paint(256, 256, (g, w) => {
    const gr = g.createRadialGradient(100, 90, 10, 128, 128, 120);
    gr.addColorStop(0, '#c4553a'); gr.addColorStop(0.6, '#7d2216'); gr.addColorStop(1, '#4a120a');
    g.fillStyle = gr; g.beginPath();
    for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, rr = 112 + Math.sin(i * 7.3) * 6; g.lineTo(128 + Math.cos(a) * rr, 128 + Math.sin(a) * rr); }
    g.fill();
    g.strokeStyle = 'rgba(255,215,160,.55)'; g.lineWidth = 3; g.beginPath(); g.arc(128, 128, 84, 0, 7); g.stroke();
    g.fillStyle = '#f3d7a6'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'italic 26px Georgia, serif'; g.fillText('for', 128, 100);
    const n = name || 'you';
    g.font = `italic ${n.length > 10 ? 26 : 36}px Georgia, serif`; g.fillText(n, 128, 140, 150);
  });
}

/* ---------------- the crowd ---------------- */
/* each figure is one merged mesh of simple solids, about 1.7 tall, facing +z,
   coloured per vertex; a mask marks which parts take the per-person tint */
export function part(geo, color, tint, m) {
  if (m) geo.applyMatrix4(m);
  const n = geo.attributes.position.count, c = new Float32Array(n * 3), t = new Float32Array(n);
  const col = new THREE.Color(color);
  for (let i = 0; i < n; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; t[i] = tint ? 1 : 0; }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  geo.setAttribute('tintMask', new THREE.BufferAttribute(t, 1));
  if (geo.index) geo = geo.toNonIndexed();
  for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'color', 'tintMask'].includes(k)) geo.deleteAttribute(k);
  return geo;
}
export const M = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(sx, sy, sz));
const SKIN = 0xb08a6c, HAIR = 0x1c1714;

export function figureGeometry(kind) {
  const P = [];
  const robeProfile = kind === 'commoner'
    ? [[0, 0.5], [0.2, 0.5], [0.24, 0.9], [0.22, 1.15], [0.25, 1.36], [0.12, 1.46], [0, 1.47]]
    : [[0, 0], [0.34, 0], [0.3, 0.35], [0.22, 0.92], [0.24, 1.15], [0.25, 1.36], [0.12, 1.46], [0, 1.47]];
  const lathe = new THREE.LatheGeometry(robeProfile.map(p => new THREE.Vector2(p[0], p[1])), 12);
  P.push(part(lathe, 0xffffff, true));
  if (kind === 'commoner') {
    /* jacket over trousers: legs below */
    for (const s of [-1, 1]) P.push(part(new THREE.CylinderGeometry(0.075, 0.065, 0.52, 6), 0x3a342d, false, M(s * 0.1, 0.26, 0)));
    P.push(part(new THREE.SphereGeometry(0.16, 8, 6), 0x7a6a50, false, M(0.16, 1.3, -0.14, 0, 0, 0, 1, 0.8, 1.1))); /* the bundle */
  }
  /* sleeves hang from the shoulders, a little forward */
  const wide = kind === 'prince' ? 0.16 : kind === 'official' ? 0.12 : 0.09;
  for (const s of [-1, 1]) {
    P.push(part(new THREE.CylinderGeometry(0.07, wide, 0.55, 7), 0xffffff, true, M(s * 0.27, 1.08, 0.04, 0.12, 0, s * 0.18)));
    if (kind !== 'prince') P.push(part(new THREE.SphereGeometry(0.045, 6, 5), SKIN, false, M(s * 0.33, 0.79, 0.08)));
  }
  if (kind === 'prince') P.push(part(new THREE.BoxGeometry(0.3, 0.16, 0.16), 0xffffff, true, M(0, 0.92, 0.2)));
  P.push(part(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 6), SKIN, false, M(0, 1.5, 0)));
  P.push(part(new THREE.SphereGeometry(0.11, 10, 8), SKIN, false, M(0, 1.6, 0.01, 0, 0, 0, 0.92, 1.08, 1)));
  /* the sash, darker than the robe */
  P.push(part(new THREE.CylinderGeometry(0.235, 0.235, 0.09, 12), 0x2a1d14, false, M(0, 1.0, 0)));
  if (kind === 'prince') {
    P.push(part(new THREE.CylinderGeometry(0.08, 0.1, 0.34, 8), 0x141010, false, M(0, 1.83, -0.02)));
    P.push(part(new THREE.BoxGeometry(0.42, 0.025, 0.2), 0x141010, false, M(0, 1.98, -0.02)));
  } else if (kind === 'official') {
    P.push(part(new THREE.BoxGeometry(0.22, 0.1, 0.22), 0x111111, false, M(0, 1.71, -0.01)));
    P.push(part(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 6), 0xd8cfb8, false, M(0, 1.2, 0.2, 0, 0, Math.PI / 2))); /* scroll */
  } else if (kind === 'woman') {
    P.push(part(new THREE.ConeGeometry(0.3, 0.75, 10, 1, true), 0xffffff, true, M(0, 1.42, -0.02)));
    P.push(part(new THREE.TorusGeometry(0.13, 0.025, 4, 10), 0x6a5434, false, M(0.3, 0.95, 0.12, Math.PI / 2))); /* basket */
  } else {
    P.push(part(new THREE.SphereGeometry(0.115, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), HAIR, false, M(0, 1.62, -0.005)));
    if (kind === 'commoner') P.push(part(new THREE.TorusGeometry(0.11, 0.02, 4, 12), 0x8a2a1a, false, M(0, 1.64, 0, Math.PI / 2)));
  }
  const g = mergeGeometries(P);
  if (kind === 'child') g.scale(0.66, 0.66, 0.66);
  return g;
}

/* palettes the tint draws from, per kind */
export const PALETTE = {
  commoner: [0x5a4a3a, 0x4a4438, 0x6b5440, 0x3f4a4a, 0x5c3a2a],
  woman: [0x6a3a34, 0x5a5a48, 0x4a3f5a, 0x7a6a50, 0x3a4a3a],
  official: [0x1f2a3a, 0x2a2a2a, 0x3a2420, 0x24382e],
  prince: [0x7a5a1a, 0x5a1a14, 0x3a1a3a, 0x1a3a3a, 0x6a6a5a],
  child: [0x7a5a3a, 0x5a6a4a, 0x6a3a2a],
};

/* One InstancedMesh per kind. Every person has a matrix (place, facing),
   a tint, a phase for the idle sway, and a bow from 0 to 1. */
export function makeCrowd(kind, capacity, opts = {}) {
  const geo = (opts.geometry || figureGeometry(kind)).clone();
  const tint = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3).fill(1), 3);
  const phase = new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1);
  const bow = new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1);
  tint.setUsage(THREE.DynamicDrawUsage); bow.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aTint', tint);
  geo.setAttribute('aPhase', phase);
  geo.setAttribute('aBow', bow);
  if (!geo.attributes.tintMask) geo.setAttribute('tintMask', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count).fill(1), 1));
  if (!geo.attributes.color) geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3).fill(1), 3));
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
  const uTime = { value: 0 };
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime; attribute vec3 aTint; attribute float aPhase; attribute float aBow; attribute float tintMask; varying vec3 vTint;`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        float bowA = aBow * 0.9 * smoothstep(0.85, 1.25, position.y);
        objectNormal = vec3(objectNormal.x, objectNormal.y * cos(bowA) - objectNormal.z * sin(bowA), objectNormal.z * cos(bowA) + objectNormal.y * sin(bowA));`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float hy = position.y;
        transformed.x += sin(uTime * (0.8 + 0.5 * fract(aPhase * 3.1)) + aPhase * 6.283) * 0.03 * smoothstep(0.5, 1.7, hy);
        float py = hy - 0.9;
        if (py > 0.0) {
          float zz = transformed.z;
          transformed.y = 0.9 + py * cos(bowA) - zz * sin(bowA);
          transformed.z = zz * cos(bowA) + py * sin(bowA);
        }
        vTint = mix(vec3(1.0), aTint, tintMask);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTint;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vTint;');
  };
  const mesh = new THREE.InstancedMesh(geo, mat, capacity);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.castShadow = !opts.noShadow;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  mesh.count = 0;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = V(1, 1, 1), p = V(0, 0, 0);
  const hide = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < capacity; i++) mesh.setMatrixAt(i, hide);
  return {
    mesh, uTime, capacity,
    place(i, x, y, z, ry, sc = 1) {
      p.set(x, y, z); e.set(0, ry, 0); q.setFromEuler(e); s.set(sc, sc, sc);
      mesh.setMatrixAt(i, m4.compose(p, q, s));
      if (i + 1 > mesh.count) mesh.count = i + 1;
    },
    hide(i) { mesh.setMatrixAt(i, hide); },
    tint(i, hex, k = 1) { const c = new THREE.Color(hex).multiplyScalar(k); tint.setXYZ(i, c.r, c.g, c.b); tint.needsUpdate = true; },
    phase(i, v) { phase.setX(i, v); phase.needsUpdate = true; },
    bow(i, v) { bow.setX(i, v); },
    flush() { mesh.instanceMatrix.needsUpdate = true; bow.needsUpdate = true; },
  };
}

/* ---------------- a camera on a rig ----------------
   Position and target tween between poses; the pointer turns the head a
   little on top (look from stage.js), and a shake can be added. */
const EASE = {
  inOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  lin: t => t,
};
export function makeRig(camera, look) {
  const rig = {
    pos: camera.position.clone(), tgt: V(0, 0, -1), tw: null, shake: 0, yaw: 0.35, pitch: 0.2, bob: V(0, 0, 0),
    set(p, t) { rig.tw = null; rig.pos.copy(p); rig.tgt.copy(t); },
    to(p, t, dur, ease = 'inOut', cb) {
      rig.tw = { p0: rig.pos.clone(), t0: rig.tgt.clone(), p1: p.clone(), t1: t.clone(), d: Math.max(0.001, dur), k: 0, e: EASE[ease], cb };
    },
    busy: () => !!rig.tw,
    update(dt) {
      if (rig.tw) {
        const w = rig.tw;
        w.k = Math.min(1, w.k + dt / w.d);
        const e = w.e(w.k);
        rig.pos.lerpVectors(w.p0, w.p1, e);
        rig.tgt.lerpVectors(w.t0, w.t1, e);
        if (w.k >= 1) { rig.tw = null; if (w.cb) w.cb(); }
      }
      camera.position.copy(rig.pos).add(rig.bob);
      const dir = rig.tgt.clone().sub(rig.pos), d = dir.length();
      const yaw = Math.atan2(dir.x, -dir.z) + (look ? look.sx * rig.yaw : 0);
      const pitch = Math.asin(dir.y / (d || 1)) - (look ? look.sy * rig.pitch : 0);
      const look3 = V(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
      camera.lookAt(camera.position.clone().add(look3));
      if (rig.shake > 0) {
        camera.rotation.z += (Math.random() - 0.5) * rig.shake * 0.02;
        camera.position.x += (Math.random() - 0.5) * rig.shake * 0.03;
        rig.shake = Math.max(0, rig.shake - dt * 1.5);
      }
    },
  };
  return rig;
}

/* a flame: an emissive teardrop that flickers, bright enough to bloom */
export function flame(scale = 1) {
  const g = new THREE.SphereGeometry(0.05 * scale, 8, 6);
  g.scale(1, 1.9, 1);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffc070 }));
  m.userData.flicker = Math.random() * 10;
  return m;
}
export function flicker(m, t) {
  const k = 0.85 + 0.15 * Math.sin(t * 13 + m.userData.flicker) * Math.sin(t * 7.3 + m.userData.flicker * 2);
  m.scale.set(k, 0.9 + 0.2 * k, k);
}
