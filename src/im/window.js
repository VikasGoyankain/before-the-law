/* Your window. A small house at the edge of the map, evening coming on.
   The game opens here and comes back here: the camera sits where you sit,
   looking out over the fields to the road and a faint glow on the horizon
   where the capital is said to be. At the end the message's glyphs come out
   among the stars, and you dream it. */
import * as THREE from 'three';
import { V, rng, TEX, paint, makeSky, makeRig, flame, flicker, figureGeometry, makeCrowd, PALETTE } from './kit.js';
import { look, LOW } from './stage.js';

export function buildWindow(models = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.03, 2000);
  const rig = makeRig(camera, look);
  rig.yaw = 0.5; rig.pitch = 0.22;
  const r = rng(1883);

  const CAP_DIR = V(0.35, 0.02, -1).normalize();
  const sky = makeSky({ top: 0x2a3858, mid: 0x7a7a98, low: 0xe0a070, glowDir: V(-0.6, 0.12, -1), glowCol: 0xffb070, glow: 1.0, stars: 0, r: 900 });
  scene.add(sky.mesh);
  scene.fog = new THREE.Fog(0x7a7088, 60, 700);
  const hemi = new THREE.HemisphereLight(0xb0b8d8, 0x4a3a28, 1.3);
  const sun = new THREE.DirectionalLight(0xffb080, 2.4);
  sun.position.set(-60, 25, -100);
  scene.add(hemi, sun);

  /* ---- the land: fields in strips, a road, trees, hills ---- */
  const land = new THREE.PlaneGeometry(1600, 1600, 120, 120);
  const lp = land.attributes.position, lc = new Float32Array(lp.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < lp.count; i++) {
    const x = lp.getX(i), y = lp.getY(i);
    const d = Math.hypot(x, y);
    lp.setZ(i, d < 40 ? 0 : Math.sin(x * 0.012) * 4 + Math.cos(y * 0.009 + 1) * 5 + (d > 500 ? (d - 500) * 0.06 : 0));
    const strip = Math.floor((x + Math.sin(y * 0.01) * 20) / 18) % 3;
    c.setHSL(0.11 + strip * 0.04, 0.35, 0.18 + strip * 0.04 + r() * 0.03);
    lc[i * 3] = c.r; lc[i * 3 + 1] = c.g; lc[i * 3 + 2] = c.b;
  }
  land.setAttribute('color', new THREE.BufferAttribute(lc, 3));
  land.computeVertexNormals();
  const ground = new THREE.Mesh(land, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  /* the road, winding from below your window to the horizon */
  const roadPts = [];
  for (let k = 0; k <= 60; k++) { const z = -4 - k * 10; roadPts.push(V(Math.sin(k * 0.21) * 14 + k * 0.9, 0.05, z)); }
  const roadCurve = new THREE.CatmullRomCurve3(roadPts);
  const RS = 300, rp = new Float32Array((RS + 1) * 2 * 3);
  for (let i = 0; i <= RS; i++) {
    const p = roadCurve.getPointAt(i / RS), tg = roadCurve.getTangentAt(i / RS);
    const n = V(-tg.z, 0, tg.x).normalize().multiplyScalar(1.6);
    rp.set([p.x + n.x, 0.06, p.z + n.z, p.x - n.x, 0.06, p.z - n.z], i * 6);
  }
  const ri = [];
  for (let i = 0; i < RS; i++) { const a = i * 2; ri.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const roadGeo = new THREE.BufferGeometry(); roadGeo.setAttribute('position', new THREE.BufferAttribute(rp, 3)); roadGeo.setIndex(ri); roadGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({ color: 0x8a7a62, roughness: 1, side: THREE.DoubleSide })));

  const treeMat = new THREE.MeshStandardMaterial({ color: 0x2a3424, roughness: 1, flatShading: true });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 1 });
  for (let k = 0; k < (LOW ? 40 : 90); k++) {
    const x = (r() - 0.5) * 500, z = -20 - r() * 450;
    if (Math.abs(x - roadCurve.getPointAt(Math.min(1, -z / 600)).x) < 6) continue;
    const s = 2 + r() * 3;
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, s), trunkMat); tr.position.set(x, s / 2, z); scene.add(tr);
    const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(s * 0.8, 1), treeMat); cr.position.set(x, s * 1.3, z); cr.scale.y = 1.2; scene.add(cr);
  }

  /* ---- your house: you can see it from outside, at the very start of the flight in ---- */
  const house = new THREE.Group();
  const plaster = new THREE.MeshStandardMaterial({ map: TEX.plaster(), color: 0xc8b8a0, roughness: 0.95, side: THREE.DoubleSide });
  const wood = new THREE.MeshStandardMaterial({ map: TEX.wood(), color: 0x8a6a4a, roughness: 0.8 });
  const HW = 5, HD = 4.4, HH = 2.9, WX0 = -0.65, WX1 = 0.65, WY0 = 0.85, WY1 = 1.9;
  /* front wall (z = 0), with the window cut out of it */
  const front = [[-HW / 2, WX0, 0, HH], [WX1, HW / 2, 0, HH], [WX0, WX1, 0, WY0], [WX0, WX1, WY1, HH]];
  for (const [a, b, lo, hi] of front) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(b - a, hi - lo, 0.3), plaster);
    m.position.set((a + b) / 2, (lo + hi) / 2, 0); house.add(m);
  }
  const back = new THREE.Mesh(new THREE.BoxGeometry(HW, HH, 0.3), plaster); back.position.set(0, HH / 2, HD); house.add(back);
  for (const sx of [-1, 1]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.3, HH, HD), plaster); s.position.set(sx * HW / 2, HH / 2, HD / 2); house.add(s); }
  const floor = new THREE.Mesh(new THREE.BoxGeometry(HW, 0.1, HD), wood); floor.position.set(0, 0, HD / 2); house.add(floor);
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(HW, 0.1, HD), wood); ceil.position.set(0, HH, HD / 2); house.add(ceil);
  for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(HW, 0.18, 0.16), wood); b.position.set(0, HH - 0.12, 0.6 + k * 1.1); house.add(b); }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 1.8, 4), new THREE.MeshStandardMaterial({ map: TEX.roof(), color: 0x7a6a5a, roughness: 0.8 }));
  roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.85); roof.position.set(0, HH + 0.9, HD / 2); house.add(roof);
  /* frame, sill, shutters */
  const sill = new THREE.Mesh(new THREE.BoxGeometry(WX1 - WX0 + 0.4, 0.08, 0.5), wood); sill.position.set(0, WY0, 0.05); house.add(sill);
  for (const [x, y, w, h] of [[WX0, (WY0 + WY1) / 2, 0.08, WY1 - WY0], [WX1, (WY0 + WY1) / 2, 0.08, WY1 - WY0], [0, WY1, WX1 - WX0 + 0.08, 0.08]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.36), wood); f.position.set(x, y, 0); house.add(f);
  }
  const shutters = [-1, 1].map(sx => {
    const piv = new THREE.Group(); piv.position.set(sx === -1 ? WX0 : WX1, (WY0 + WY1) / 2, -0.17);
    const p = new THREE.Mesh(new THREE.BoxGeometry(WX1 - WX0 - 0.6 + 0.6, WY1 - WY0, 0.05), wood);
    p.scale.x = 0.5; p.position.x = -sx * (WX1 - WX0) / 4; piv.add(p);
    /* swung open, out and back against the wall */
    piv.rotation.y = -sx * 2.6;
    house.add(piv);
    return piv;
  });
  /* candle and cup on the sill */
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0xe8dcc0 }));
  candle.position.set(0.55, WY0 + 0.1, 0.16); house.add(candle);
  const fl = flame(0.32); fl.position.set(0.55, WY0 + 0.18, 0.16); house.add(fl);
  const candleLight = new THREE.PointLight(0xffa860, 1.4, 5, 1.6); candleLight.position.set(0.55, WY0 + 0.3, 0.35); house.add(candleLight);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.07, 10), new THREE.MeshStandardMaterial({ color: 0x8a6a4a })); cup.position.set(-0.4, WY0 + 0.075, 0.15); house.add(cup);
  /* the figure at the window, seen only from outside */
  const you = new THREE.Mesh(models.villager || figureGeometry('commoner'), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }));
  you.position.set(0, -0.45, 0.55); you.rotation.y = Math.PI; you.visible = false; house.add(you);
  /* the glow of the room through the window, from outside */
  const roomGlow = new THREE.PointLight(0xffa060, 0, 6, 1.5); roomGlow.position.set(0, 1.4, 1.2); house.add(roomGlow);
  scene.add(house);

  /* ---- the miller's boy, on the road ---- */
  const walker = makeCrowd('commoner', 1, { noShadow: true });
  walker.tint(0, PALETTE.commoner[2]); walker.phase(0, 0.3);
  scene.add(walker.mesh);
  let walkT = -1;

  /* ---- fireflies and the capital's glow ---- */
  const FF = LOW ? 40 : 90, fp = new Float32Array(FF * 3), fs = [];
  for (let i = 0; i < FF; i++) { fs.push([(r() - 0.5) * 60, 0.5 + r() * 2, -6 - r() * 50, r() * 10]); }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  const flies = new THREE.Points(fg, new THREE.PointsMaterial({ color: 0xd8ff90, size: 0.12, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(flies);
  const glowTex = paint(128, 64, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h, 2, w / 2, h, w / 2); gr.addColorStop(0, 'rgba(255,220,160,1)'); gr.addColorStop(0.4, 'rgba(255,180,100,.35)'); gr.addColorStop(1, 'rgba(255,160,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const capGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc070, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  capGlow.position.copy(CAP_DIR.clone().multiplyScalar(800)).setY(30);
  capGlow.scale.set(320, 80, 1);
  scene.add(capGlow);

  /* ---- glyph stars, for the dream ---- */
  const stars = [];
  function glyphStar(tex, i, n) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    const a = (i - (n - 1) / 2) * 0.13;
    const dir = V(Math.sin(a) + CAP_DIR.x * 0.4, 0.22 + 0.04 * Math.cos(i * 1.7), -1).normalize();
    s.position.copy(dir.multiplyScalar(120));
    s.scale.setScalar(9);
    s.userData = { t: -i * 0.6 };
    scene.add(s); stars.push(s);
  }
  function clearStars() { for (const s of stars) { scene.remove(s); s.material.dispose(); } stars.length = 0; }

  /* ---------------- poses ---------------- */
  const SEAT = [V(0, 1.28, 1.75), V(0.1, 1.0, -30)];
  const POSE = {
    seat: SEAT,
    outside: [V(-3.5, 3.2, -9), V(0, 1.3, 0)],
    far: [V(40, 60, -260), V(0, 2, 0)],
    capital: [V(0.15, 1.28, 1.2), CAP_DIR.clone().multiplyScalar(100).setY(5)],
    road: [V(0, 1.3, 1.25), V(4, 0, -60)],
    up: [V(0, 1.2, 1.5), V(0, 18, -100)],
  };
  rig.set(SEAT[0], SEAT[1]);

  const st = { evening: 0, goal: 0, listen: -1, t: 0 };
  function setEvening(k) {
    /* 0: late gold afternoon, 1: night */
    const e = k;
    sky.u.top.value.setHex(0x2a3858).lerp(new THREE.Color(0x05070f), e);
    sky.u.mid.value.setHex(0x7a7a98).lerp(new THREE.Color(0x141a2c), e);
    sky.u.low.value.setHex(0xe0a070).lerp(new THREE.Color(0x3a2a38), e);
    sky.u.glow.value = 1 - 0.8 * e;
    sky.u.stars.value = Math.max(0, e - 0.35) * 1.6;
    sun.intensity = 2.4 * (1 - e);
    hemi.intensity = 1.3 - 1.0 * e;
    scene.fog.color.setHex(0x7a7088).lerp(new THREE.Color(0x0a0c16), e);
    flies.material.opacity = Math.max(0, e - 0.4) * 1.2;
    capGlow.material.opacity = 0.12 + 0.35 * e;
    candleLight.intensity = 0.4 + 2.2 * e;
    roomGlow.intensity = 1 + 10 * e;
  }

  return {
    scene, camera, rig, st, POSE,
    pose(name, dur, ease, cb) { rig.to(POSE[name][0], POSE[name][1], dur, ease, cb); },
    place(name) { rig.set(POSE[name][0], POSE[name][1]); },
    evening(k, now) { st.goal = k; if (now) { st.evening = k; setEvening(k); } },
    showSelf(on) { you.visible = on; },
    walk() { walkT = 0; },
    bang() { st.listen = 0; },
    glyphStar, clearStars,
    update(dt, t) {
      st.t += dt;
      if (Math.abs(st.goal - st.evening) > 0.0005) { st.evening += (st.goal - st.evening) * Math.min(1, dt * 0.25); setEvening(st.evening); }
      rig.update(dt);
      flicker(fl, t);
      candleLight.intensity *= 0.95 + 0.05 * Math.sin(t * 11);
      /* a shutter loose in the wind */
      const gust = st.listen >= 0 ? Math.max(0, 1 - st.listen / 3) : 0;
      if (st.listen >= 0) { st.listen += dt; if (st.listen > 3) st.listen = -1; }
      shutters[1].rotation.y = -2.6 + Math.sin(t * 1.3) * 0.03 + gust * Math.abs(Math.sin(st.listen * 6.5)) * 0.5;
      for (let i = 0; i < FF; i++) {
        const f = fs[i];
        fp[i * 3] = f[0] + Math.sin(t * 0.3 + f[3]) * 1.5; fp[i * 3 + 1] = f[1] + Math.sin(t * 0.7 + f[3] * 2) * 0.4; fp[i * 3 + 2] = f[2] + Math.cos(t * 0.25 + f[3]) * 1.5;
      }
      fg.attributes.position.needsUpdate = true;
      if (walkT >= 0) {
        walkT += dt;
        const k = Math.min(1, 0.32 - walkT / 70);
        if (k <= 0.05) { walkT = -1; walker.hide(0); }
        else {
          const p = roadCurve.getPointAt(k), tg = roadCurve.getTangentAt(k);
          walker.place(0, p.x, 0, p.z, Math.atan2(-tg.x, -tg.z), 1);
        }
        walker.flush();
      }
      walker.uTime.value = t;
      for (const s of stars) {
        s.userData.t += dt;
        s.material.opacity = Math.max(0, Math.min(1, s.userData.t / 2)) * (0.75 + 0.25 * Math.sin(t * 2 + s.position.x));
      }
    },
  };
}
