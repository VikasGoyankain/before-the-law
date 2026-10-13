/* "And again stairs and courtyards; and again a palace; and so on, for
   thousands of years." Seen from above: palace inside palace, ring outside
   ring, each one larger than the last by the same proportion - so however
   far the camera pulls back, there are always more. The messenger is a gold
   spark. He keeps moving, steadily; the view widens exponentially; and so
   his progress shrinks toward nothing while you watch. */
import * as THREE from 'three';
import { V, rng, TEX, makeRig } from './kit.js';
import { look, LOW } from './stage.js';

const R0 = 24, G = 1.3, K = LOW ? 30 : 38;

export function buildRings() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 1, 1e6);
  const r = rng(1919);
  const bg = new THREE.Color(0x1a1612);
  scene.background = bg;
  scene.fog = new THREE.Fog(bg, 100, 1000);

  const hemi = new THREE.HemisphereLight(0xb8b0a0, 0x3a3028, 1.0);
  const sun = new THREE.DirectionalLight(0xffe0b0, 1.4);
  sun.position.set(1, 2, 0.5);
  scene.add(hemi, sun);

  const Rk = k => R0 * Math.pow(G, k);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(Rk(K + 4), 96), new THREE.MeshStandardMaterial({ color: 0x6a5a48, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02;
  scene.add(ground);

  /* walls: one ring per palace, an open cylinder scaled to its radius */
  const wallGeo = new THREE.CylinderGeometry(1, 1, 1, 96, 1, true);
  const walls = new THREE.InstancedMesh(wallGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide }), K * 2);
  /* buildings: hipped roofs on boxes, sizes scaled to their ring */
  const houseGeo = new THREE.BoxGeometry(1, 1, 1); houseGeo.translate(0, 0.5, 0);
  const PER = LOW ? 60 : 110;
  const houses = new THREE.InstancedMesh(houseGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }), K * PER);
  const roofGeo = new THREE.ConeGeometry(0.8, 0.5, 4); roofGeo.rotateY(Math.PI / 4); roofGeo.translate(0, 1.25, 0);
  const roofs = new THREE.InstancedMesh(roofGeo, new THREE.MeshStandardMaterial({ map: TEX.roof(), color: 0x8a8a90, roughness: 0.7 }), K * PER);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
  let w = 0, h = 0;
  for (let k = 0; k < K; k++) {
    const R = Rk(k), R1 = Rk(k + 1);
    /* "sediment": the further out, the newer, the paler; the old core is dark */
    const age = k / K;
    col.setHSL(0.03 + 0.04 * r(), 0.45 - 0.2 * age, 0.28 + 0.25 * age);
    for (const [rr, hh] of [[R, R * 0.07], [R1 * 0.97, R * 0.045]]) {
      m4.compose(V(0, hh / 2, 0), q.identity(), V(rr, hh, rr));
      walls.setMatrixAt(w, m4); walls.setColorAt(w, col); w++;
    }
    for (let i = 0; i < PER; i++) {
      const a = r() * Math.PI * 2;
      /* a ring of halls with open courtyards between them */
      const band = r() < 0.6 ? 0.15 + r() * 0.25 : 0.62 + r() * 0.3;
      const rr = R + (R1 - R) * band;
      const s = (R1 - R) * (0.05 + r() * 0.07);
      e.set(0, -a + (r() < 0.5 ? 0 : Math.PI / 2), 0); q.setFromEuler(e);
      m4.compose(V(Math.sin(a) * rr, 0, Math.cos(a) * rr), q, V(s * (1 + r()), s * (0.6 + r() * 0.8), s));
      houses.setMatrixAt(h, m4);
      roofs.setMatrixAt(h, m4);
      col.setHSL(0.02 + 0.05 * r(), 0.5, 0.3 + 0.2 * age + r() * 0.1);
      houses.setColorAt(h, col);
      h++;
    }
  }
  walls.count = w; houses.count = roofs.count = h;
  scene.add(walls, houses, roofs);

  /* the deathbed, at the centre: a point of gold that goes out when the bell tolls */
  const heart = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffc060 }));
  heart.position.y = 3; scene.add(heart);

  /* the messenger: a spark that keeps its size on screen */
  const spark = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffd27a, sizeAttenuation: false, depthTest: false, transparent: true }));
  spark.scale.set(0.022, 0.022, 1);
  spark.renderOrder = 10;
  scene.add(spark);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffb040, sizeAttenuation: false, depthTest: false, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending }));
  halo.scale.set(0.06, 0.06, 1); halo.renderOrder = 9;
  scene.add(halo);
  /* his path so far */
  const TRAIL = 400, trailPos = new Float32Array(TRAIL * 3);
  const trailGeo = new THREE.BufferGeometry(); trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0xffc060, transparent: true, opacity: 0.6 }));
  trail.frustumCulled = false;
  scene.add(trail);

  /* a bell: a ring of shadow spreads out from the centre */
  const wave = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 128), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  wave.rotation.x = -Math.PI / 2; wave.position.y = 0.5;
  scene.add(wave);
  let waveT = -1;

  const rig = makeRig(camera, look);
  const st = { zoom: 0, zoomV: 0.11, a: 0.4, rm: 6, run: false, t: 0, day: 0, dayV: 0.4, path: [] };

  function reset() {
    st.zoom = 0; st.rm = 6; st.a = 0.4; st.day = 0; st.dayV = 0.4; st.path = [];
    heart.visible = true;
  }
  reset();

  return {
    scene, camera, st, reset,
    setRun(on) { st.run = on; },
    wave() { waveT = 0; heart.visible = false; },
    /* how many palaces he has crossed and how many are in view */
    crossed: () => { let k = 0; while (Rk(k + 1) < st.rm) k++; return k; },
    update(dt, t) {
      st.t += dt;
      /* he goes on at a steady pace, faster while you hold Run */
      const pace = (st.run ? 1 : 0.35) * (8 + st.rm * 0.05);
      st.rm += pace * dt;
      st.a += dt * 0.05;
      /* the view widens exponentially, whatever he does */
      st.zoom += dt * st.zoomV;
      const H = 70 * Math.pow(G, st.zoom * 2.2);
      const ang = t * 0.03;
      const sp = V(Math.sin(st.a) * st.rm, 0.6, Math.cos(st.a) * st.rm);
      spark.position.copy(sp); halo.position.copy(sp);
      halo.material.opacity = 0.25 + 0.15 * Math.sin(t * 5);
      if (!st.path.length || st.path[st.path.length - 1].distanceTo(sp) > H * 0.004) st.path.push(sp.clone());
      if (st.path.length > TRAIL) st.path.shift();
      for (let i = 0; i < TRAIL; i++) { const p = st.path[Math.min(i, st.path.length - 1)] || sp; trailPos[i * 3] = p.x; trailPos[i * 3 + 1] = 0.5; trailPos[i * 3 + 2] = p.z; }
      trailGeo.attributes.position.needsUpdate = true;
      rig.set(V(Math.sin(ang) * H * 0.55, H, Math.cos(ang) * H * 0.55), V(sp.x * 0.3, 0, sp.z * 0.3));
      rig.update(dt);
      camera.near = H * 0.02; camera.far = H * 30; camera.updateProjectionMatrix();
      scene.fog.near = H * 1.2; scene.fog.far = H * 6;
      /* the days go by faster and faster: light and dark flicker */
      st.dayV = Math.min(14, st.dayV + dt * 0.5);
      st.day += dt * st.dayV;
      const d = 0.5 + 0.5 * Math.sin(st.day);
      sun.intensity = 0.3 + 1.4 * d;
      hemi.intensity = 0.35 + 0.8 * d;
      sun.position.set(Math.cos(st.day), 1.2, Math.sin(st.day));
      if (waveT >= 0) {
        waveT += dt;
        const R = Rk(K) * Math.min(1, waveT / 6);
        wave.scale.set(R, R, R);
        wave.material.opacity = 0.5 * (1 - waveT / 6);
        if (waveT > 6) waveT = -1;
      }
    },
  };
}
