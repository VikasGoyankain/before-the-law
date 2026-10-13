/* "And if at last he burst out through the outermost gate - but never,
   never can that happen - then the capital would lie before him: the
   centre of the world, heaped high with its own sediment."
   This scene only ever exists in the subjunctive: it is drawn, never lit
   in colour. He runs at the gate, it bursts open, and beyond it is a
   mountain of city. Then Kafka takes it all back. */
import * as THREE from 'three';
import { V, rng, makeSky, makeRig, paint } from './kit.js';
import { look, LOW } from './stage.js';

export function buildCapital() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 6000);
  const rig = makeRig(camera, look);
  const r = rng(24);
  const sky = makeSky({ top: 0x9aa8b8, mid: 0xd8d8d0, low: 0xe8d8b8, glowDir: V(0, 0.2, -1), glowCol: 0xffffff, glow: 0.6, r: 4000 });
  scene.add(sky.mesh);
  scene.fog = new THREE.Fog(0xd8d0c0, 200, 2600);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8070, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-300, 500, 200); scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({ color: 0xb8ab98, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);

  /* the outermost wall, running out of sight both ways, and its gate */
  /* coursed stone, so the pencil has something to draw on an otherwise blank wall */
  const stones = paint(256, 256, (g, w, h) => { g.fillStyle = '#9a8a78'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7a6c5e'; g.lineWidth = 2; for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = (y / 32) % 2 * 32; x < w; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } } });
  stones.wrapS = stones.wrapT = THREE.RepeatWrapping; stones.repeat.set(6, 2);
  const wallMat = new THREE.MeshStandardMaterial({ map: stones, color: 0xffffff, roughness: 0.9 });
  const longMat = new THREE.MeshStandardMaterial({ map: stones.clone(), color: 0xffffff, roughness: 0.9 });
  longMat.map.repeat.set(70, 1.5); longMat.map.needsUpdate = true;
  const WH = 46, DW = 14, DH = 26, GZ = -90;
  for (const sx of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(3000, WH, 12), longMat);
    b.position.set(sx * (DW / 2 + 1500), WH / 2, GZ); scene.add(b);
    for (let k = 0; k < 60; k++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 13), wallMat);
      m.position.set(sx * (DW / 2 + 8 + k * 12), WH + 2.5, GZ); scene.add(m);
    }
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(DW, WH - DH, 12), wallMat);
  lintel.position.set(0, DH + (WH - DH) / 2, GZ); scene.add(lintel);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(40, 18, 18), wallMat);
  tower.position.set(0, WH + 9, GZ); scene.add(tower);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(34, 12, 4), new THREE.MeshStandardMaterial({ color: 0x5a5250, roughness: 0.8 }));
  roof.rotation.y = Math.PI / 4; roof.scale.set(1.3, 1, 0.6); roof.position.set(0, WH + 24, GZ); scene.add(roof);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x6a5040, roughness: 0.8 });
  const leaves = [-1, 1].map(sx => {
    const piv = new THREE.Group(); piv.position.set(sx * DW / 2, 0, GZ + 6.2);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(DW / 2, DH, 1), leafMat);
    leaf.position.set(-sx * DW / 4, DH / 2, 0); piv.add(leaf);
    for (let k = 0; k < 5; k++) for (let j = 0; j < 3; j++) {
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 4), leafMat);
      stud.position.set(-sx * (1.2 + j * 2), 4 + k * 4.5, 0.6); piv.add(stud);
    }
    scene.add(piv);
    return piv;
  });

  /* the capital: a mountain of houses, heaped up on itself */
  const N = LOW ? 2200 : 5200;
  const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
  const city = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  const CZ = -900, CR = 700, CH = 330;
  for (let i = 0; i < N; i++) {
    const a = r() * Math.PI * 2, d = Math.pow(r(), 0.75);
    const x = Math.sin(a) * d * CR, z = CZ + Math.cos(a) * d * CR * 0.8;
    /* height of the heap here, roughly a cone with a ragged skin */
    const y = CH * Math.pow(1 - d, 1.4) + (r() - 0.5) * 10;
    const s = 6 + r() * 14 * (0.5 + d);
    q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.3, r() * 3, (r() - 0.5) * 0.3));
    m4.compose(V(x, Math.max(0, y - s * 0.5), z), q, V(s, s * (0.6 + r() * 1.4), s * (0.7 + r() * 0.6)));
    city.setMatrixAt(i, m4);
    col.setHSL(0.08, 0.15, 0.45 + r() * 0.35);
    city.setColorAt(i, col);
  }
  scene.add(city);
  /* towers sticking out of the heap */
  for (let k = 0; k < 24; k++) {
    const a = r() * Math.PI * 2, d = r() * 0.7, hh = 40 + r() * 90;
    const t = new THREE.Mesh(new THREE.CylinderGeometry(4, 7, hh, 6), wallMat);
    t.position.set(Math.sin(a) * d * CR, CH * Math.pow(1 - d, 1.4) + hh / 2 - 10, CZ + Math.cos(a) * d * CR * 0.8);
    scene.add(t);
  }
  /* the crowd at its foot: dots, too many to be people */
  const DOTS = LOW ? 3000 : 9000, dp = new Float32Array(DOTS * 3);
  for (let i = 0; i < DOTS; i++) { dp[i * 3] = (r() - 0.5) * 900; dp[i * 3 + 1] = 1; dp[i * 3 + 2] = GZ - 20 - r() * 300; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  scene.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: 0x3a3430, size: 1.4 })));

  const st = { mode: 'approach', s: 0, run: false, burst: 0, t: 0 };
  function reset() {
    st.mode = 'approach'; st.s = 0; st.burst = 0;
    for (const l of leaves) l.rotation.y = 0;
    rig.set(V(0, 1.7, 40), V(0, 14, GZ));
  }
  reset();
  const events = [];
  return {
    scene, camera, st, reset,
    on: fn => events.push(fn),
    setRun(on) { st.run = on; },
    update(dt, t) {
      st.t += dt;
      if (st.mode === 'approach') {
        /* Run always takes him on; the gate is only a little way off */
        st.s += dt * (st.run ? 14 : 3.5);
        const z = 40 - st.s;
        rig.set(V(0, 1.7 + Math.abs(Math.sin(st.s * 0.9)) * 0.08, z), V(0, 22 - Math.min(10, st.s * 0.1), GZ - 30));
        if (z < GZ + 18) { st.mode = 'burst'; events.forEach(f => f('burst')); }
      } else if (st.mode === 'burst') {
        st.burst = Math.min(1, st.burst + dt / 1.6);
        const e = 1 - Math.pow(1 - st.burst, 3);
        leaves[0].rotation.y = -e * 1.9; leaves[1].rotation.y = e * 1.9;
        rig.shake = Math.max(rig.shake, 1 - st.burst);
        const z = GZ + 18 - e * 50;
        rig.set(V(0, 1.7 + e * 30, z), V(0, CH * 0.5, CZ));
        if (st.burst >= 1) { st.mode = 'behold'; events.forEach(f => f('behold')); }
      } else if (st.mode === 'behold') {
        /* he stands at the edge of it, and the camera slowly rises over the heap */
        rig.pos.y += dt * 1.2;
        rig.tgt.y += dt * 2;
      }
      rig.update(dt);
    },
  };
}
