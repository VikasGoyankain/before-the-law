/* The deathbed. "Every wall that stood in the way has been broken down, and
   on the staircases that sweep up wide and high on every side, the great
   princes of the realm stand in a ring." The camera is the messenger: he
   walks in, kneels, leans in to hear, and rises to go. */
import * as THREE from 'three';
import { V, rng, TEX, makeSky, makeCrowd, PALETTE, makeRig, flame, flicker } from './kit.js';
import { look, LOW } from './stage.js';

export function buildCourt(models = {}) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x1a1420, 0.022);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.03, 900);
  const rig = makeRig(camera, look);
  const r = rng(1917);

  const sky = makeSky({ top: 0x0c0d1c, mid: 0x2b2440, low: 0x7a3e2a, glowDir: V(0.3, 0.06, -1), glowCol: 0xff8a4a, glow: 0.8, stars: 0.35 });
  scene.add(sky.mesh);
  scene.add(new THREE.HemisphereLight(0x8a7a98, 0x3a2418, 1.0));
  const dusk = new THREE.DirectionalLight(0xffa070, 1.8);
  dusk.position.set(12, 9, -16);
  dusk.castShadow = !LOW;
  dusk.shadow.mapSize.set(1024, 1024);
  Object.assign(dusk.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 });
  scene.add(dusk);

  /* ---- the floor: a great disc, a sun inlaid in gold under the bed ---- */
  const floorMat = new THREE.MeshStandardMaterial({ map: TEX.floor(), color: 0xb0a090, roughness: 0.55, metalness: 0.1 });
  floorMat.map = floorMat.map.clone(); floorMat.map.repeat.set(10, 10); floorMat.map.needsUpdate = true;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 64), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor);
  const inlay = new THREE.Mesh(new THREE.RingGeometry(2.6, 2.75, 64), new THREE.MeshStandardMaterial({ color: 0xc8963a, metalness: 0.8, roughness: 0.35 }));
  inlay.rotation.x = -Math.PI / 2; inlay.position.y = 0.005; scene.add(inlay);
  for (let i = 0; i < 24; i++) {
    const ray = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 1.1), inlay.material);
    const a = i / 24 * Math.PI * 2;
    ray.rotation.set(-Math.PI / 2, 0, -a); ray.position.set(Math.sin(a) * 3.45, 0.006, Math.cos(a) * 3.45);
    scene.add(ray);
  }

  /* ---- the staircases: tiers rising in a ring, with four aisles ---- */
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x9a8f80, roughness: 0.85 });
  const riserMat = new THREE.MeshStandardMaterial({ color: 0x6d6255, roughness: 0.9 });
  const TIERS = 11, R0 = 7.5, STEP = 1.05, RISE = 0.55;
  const arcs = [];
  for (let a = 0; a < 4; a++) arcs.push([a * Math.PI / 2 + 0.16, Math.PI / 2 - 0.32]);
  for (let k = 0; k < TIERS; k++) {
    const rIn = R0 + k * STEP;
    for (const [t0, tl] of arcs) {
      const riser = new THREE.Mesh(new THREE.CylinderGeometry(rIn, rIn, RISE, 48, 1, true, t0, tl), riserMat);
      riser.position.y = k * RISE + RISE / 2; riser.material.side = THREE.DoubleSide;
      const tread = new THREE.Mesh(new THREE.RingGeometry(rIn, rIn + STEP, 48, 1, t0 - Math.PI / 2, tl), stoneMat);
      tread.rotation.x = -Math.PI / 2; tread.position.y = (k + 1) * RISE;
      /* (RingGeometry measures its angle from +x; the cylinder's from +z) */
      riser.receiveShadow = tread.receiveShadow = true;
      scene.add(riser, tread);
    }
  }
  /* a solid mass under the tiers so they read as stone, not shells */
  const mass = new THREE.Mesh(new THREE.CylinderGeometry(R0 + TIERS * STEP + 1.5, R0 + TIERS * STEP + 1.5, TIERS * RISE, 48, 1, true), riserMat);
  mass.position.y = TIERS * RISE / 2; scene.add(mass);

  /* ---- the walls that were in the way, broken down ---- */
  const wallR = R0 + TIERS * STEP + 1.2, wallMat = new THREE.MeshStandardMaterial({ map: TEX.lacquer(), color: 0x9a7a70, roughness: 0.8 });
  for (let i = 0; i < 46; i++) {
    const a = i / 46 * Math.PI * 2 + r() * 0.05;
    const h = 0.6 + Math.pow(r(), 2.2) * 9;
    const w = new THREE.Mesh(new THREE.BoxGeometry(2.6, h, 0.7), wallMat);
    w.position.set(Math.sin(a) * wallR, TIERS * RISE + h / 2, Math.cos(a) * wallR);
    w.rotation.set((r() - 0.5) * 0.08, a, (r() - 0.5) * 0.12);
    w.castShadow = !LOW; scene.add(w);
    /* rubble at its foot */
    for (let k = 0; k < 4; k++) {
      const s = 0.2 + r() * 0.5, rb = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.7, s), riserMat);
      const rr = wallR - 1 - r() * 1.4, aa = a + (r() - 0.5) * 0.12;
      rb.position.set(Math.sin(aa) * rr, TIERS * RISE + s * 0.3, Math.cos(aa) * rr);
      rb.rotation.set(r() * 3, r() * 3, r() * 3); scene.add(rb);
    }
  }

  /* ---- the great of the empire, standing on the stairs, facing the bed ---- */
  const princes = makeCrowd('prince', LOW ? 260 : 520, { noShadow: true, geometry: models.prince });
  let n = 0;
  for (let k = 1; k < TIERS; k++) {
    const rr = R0 + k * STEP + STEP * 0.45, y = (k + 1) * RISE;
    const count = Math.floor(rr * Math.PI * 2 / (LOW ? 1.9 : 1.15));
    for (let i = 0; i < count && n < princes.capacity; i++) {
      const a = i / count * Math.PI * 2 + k * 0.37;
      const inAisle = arcs.every(([t0, tl]) => { const d = ((a - t0) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2); return d > tl; });
      if (inAisle) continue;
      princes.place(n, Math.sin(a) * rr, y, Math.cos(a) * rr, a + Math.PI, 0.95 + r() * 0.12);
      princes.tint(n, PALETTE.prince[Math.floor(r() * PALETTE.prince.length)], 0.9 + r() * 0.3);
      princes.phase(n, r());
      n++;
    }
  }
  princes.flush();
  scene.add(princes.mesh);

  /* ---- the bed ---- */
  const bed = new THREE.Group();
  const lacquerDark = new THREE.MeshStandardMaterial({ map: TEX.wood(), color: 0x5a2a1a, roughness: 0.5, metalness: 0.1 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc8963a, metalness: 0.85, roughness: 0.3 });
  const plat = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.42, 1.9), lacquerDark);
  plat.position.y = 0.21; bed.add(plat);
  const step = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.5), lacquerDark);
  step.position.set(0, 0.08, 1.2); bed.add(step);
  const silk = new THREE.MeshStandardMaterial({ map: TEX.silk(), color: 0xffffff, roughness: 0.55, metalness: 0.15 });
  const quilt = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.22, 1.45), silk);
  quilt.position.set(0.25, 0.53, 0); bed.add(quilt);
  /* the body under the quilt */
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.2, 4, 10), silk);
  body.rotation.z = Math.PI / 2; body.scale.set(1, 1, 0.8); body.position.set(0.2, 0.52, 0); bed.add(body);
  const pillow = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.9, 14), new THREE.MeshStandardMaterial({ color: 0x6a3a1c, roughness: 0.6 }));
  pillow.rotation.x = Math.PI / 2; pillow.position.set(-1.0, 0.6, 0); bed.add(pillow);
  for (const [x, z] of [[-1.42, -0.88], [1.42, -0.88], [-1.42, 0.88], [1.42, 0.88]]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.6, 8), lacquerDark);
    post.position.set(x, 1.5, z); bed.add(post);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), gold); cap.position.set(x, 2.82, z); bed.add(cap);
  }
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.12, 1.95), lacquerDark);
  canopy.position.y = 2.82; bed.add(canopy);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 0.6, 4, 1), lacquerDark);
  roof.rotation.y = Math.PI / 4; roof.scale.set(1.15, 1, 0.72); roof.position.y = 3.18; bed.add(roof);
  const curtainMat = new THREE.MeshStandardMaterial({ color: 0x7a1a14, roughness: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0.88 });
  for (const [x, z, ry] of [[-1.42, -0.6, 0], [1.42, -0.6, 0], [-1.42, 0.6, 0], [1.42, 0.6, 0]]) {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 2.3, 1, 6), curtainMat);
    c.position.set(x, 1.62, z); c.rotation.y = ry + Math.PI / 2;
    const p = c.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getY(i) * 3) * 0.05);
    bed.add(c);
  }
  bed.traverse(o => { if (o.isMesh) { o.castShadow = !LOW; o.receiveShadow = true; } });
  scene.add(bed);

  /* ---- the Emperor: lying, head on the pillow, face up ---- */
  const SKIN = new THREE.MeshStandardMaterial({ color: 0xa08470, roughness: 0.8 });
  const WHITE = new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.9 });
  const neck = new THREE.Group();          /* pivot at the neck */
  neck.position.set(-0.78, 0.74, 0);
  const head = new THREE.Group();
  neck.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), SKIN);
  skull.scale.set(1.05, 0.95, 0.9); skull.position.set(-0.13, 0.03, 0); head.add(skull);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 6), SKIN);
  nose.position.set(-0.11, 0.15, 0); head.add(nose);
  for (const s of [-1, 1]) {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.035), WHITE);
    brow.position.set(-0.17, 0.12, s * 0.045); head.add(brow);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshStandardMaterial({ color: 0x8a6a58, roughness: 0.8 }));
    lid.position.set(-0.155, 0.118, s * 0.045); lid.scale.set(1, 0.4, 1); head.add(lid);
  }
  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.42, 10), WHITE);
  beard.rotation.z = -(Math.PI / 2 + 0.12); beard.scale.set(0.9, 1, 0.55); beard.position.set(0.16, 0.0, 0); head.add(beard);
  const topknot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), WHITE);
  topknot.position.set(-0.27, 0.05, 0); head.add(topknot);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.135, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), WHITE);
  hair.rotation.z = Math.PI / 2; hair.position.set(-0.15, 0.02, 0); head.add(hair);
  head.traverse(o => { if (o.isMesh) o.castShadow = !LOW; });
  bed.add(neck);
  /* hands on the quilt */
  for (const s of [-1, 1]) {
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), SKIN);
    hand.scale.set(1.4, 0.6, 1); hand.position.set(-0.15, 0.66, s * 0.22); bed.add(hand);
  }
  /* a closed mouth and the lines of shut eyes, so it reads as a face from the bedside */
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.006, 0.05), new THREE.MeshStandardMaterial({ color: 0x4a2a20 }));
  mouth.position.set(-0.03, 0.13, 0); head.add(mouth);
  let headTurn = 0.3, headTurnGoal = 0.3, nodT = -1, sculpted = false;

  /* The sculpted Emperor, when there is one: laid on his back with his head on
     the pillow, under a heavy silk coverlet. The head is cut free at the neck
     so that it can still turn toward the messenger and nod. */
  if (models.emperor) {
    const g = models.emperor, NECK = 1.7 * 0.84;
    /* standing (up +y, facing +z) -> lying (head toward -x, face up +y) */
    const lie = new THREE.Matrix4().makeBasis(V(0, 0, -1), V(-1, 0, 0), V(0, 1, 0));
    const toNeck = new THREE.Matrix4().makeTranslation(0, -NECK, 0);
    const pos = g.attributes.position, idx = g.index.array, up = [], down = [];
    for (let i = 0; i < idx.length; i += 3) {
      const above = pos.getY(idx[i]) > NECK && pos.getY(idx[i + 1]) > NECK && pos.getY(idx[i + 2]) > NECK;
      (above ? up : down).push(idx[i], idx[i + 1], idx[i + 2]);
    }
    const piece = list => { const p = g.clone(); p.setIndex(list); p.applyMatrix4(toNeck).applyMatrix4(lie); return p; };
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 });
    const sculptHead = new THREE.Mesh(piece(up), mat), sculptBody = new THREE.Mesh(piece(down), mat);
    sculptHead.castShadow = sculptBody.castShadow = !LOW;
    head.visible = false;
    bed.children.filter(o => o.isMesh && o.geometry.type === 'SphereGeometry' && o.material === SKIN).forEach(o => { o.visible = false; });
    neck.position.y = 0.8;
    neck.add(sculptHead);
    sculptBody.position.copy(neck.position);
    bed.add(sculptBody);
    /* the coverlet, drawn up to his waist; his hands and robes lie on top of it */
    body.geometry.dispose();
    body.geometry = new THREE.CapsuleGeometry(0.26, 0.85, 6, 16);
    body.scale.set(1, 1, 2.3);
    body.position.set(0.72, 0.7, 0);
    sculpted = true;
  }

  /* ---- lamps around the bed ---- */
  const flames = [];
  const bronze = new THREE.MeshStandardMaterial({ color: 0x6a4a28, metalness: 0.7, roughness: 0.45 });
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2 + Math.PI / 6, rr = 3.6;
    const stand = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.07, 1.7, 8), bronze); pole.position.y = 0.85; stand.add(pole);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.08, 0.14, 12), bronze); bowl.position.y = 1.75; stand.add(bowl);
    const f = flame(2.2); f.position.y = 1.92; stand.add(f); flames.push(f);
    stand.position.set(Math.sin(a) * rr, 0, Math.cos(a) * rr);
    scene.add(stand);
  }
  const lampL = new THREE.PointLight(0xffa860, 30, 16, 1.5); lampL.position.set(-1.2, 2.6, 3.2); scene.add(lampL);
  const lampR = new THREE.PointLight(0xffa860, 24, 16, 1.5); lampR.position.set(2.8, 2.2, -1.6); scene.add(lampR);
  /* the light that falls on his face when you lean in */
  const faceLight = new THREE.PointLight(0xffd0a0, 0, 2.5, 2); faceLight.position.set(-0.7, 1.2, 0.6); scene.add(faceLight);

  /* ---- dust in the lamplight ---- */
  const DUST = LOW ? 120 : 300, dpos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) { dpos[i * 3] = (r() - 0.5) * 10; dpos[i * 3 + 1] = r() * 4; dpos[i * 3 + 2] = (r() - 0.5) * 10; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffd8a0, size: 0.02, transparent: true, opacity: 0.5, depthWrite: false }));
  scene.add(dust);

  /* ---- whispered glyphs: drift from his lips toward you and go out ---- */
  const sprites = [];
  function whisperGlyph(tex) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    s.scale.setScalar(0.11);
    const from = V(-0.93, 0.92, 0.08);
    s.position.copy(from);
    s.userData = { t: 0, from, to: V(-0.82 + (Math.random() - 0.5) * 0.06, 0.98 + (Math.random() - 0.5) * 0.05, 0.3) };
    scene.add(s); sprites.push(s);
  }

  /* ---------------- poses ---------------- */
  const BED_HEAD = V(-0.95, 0.8, 0);
  const POSE = {
    door: [V(0.4, 1.66, 13), V(0, 1.2, 0)],
    near: [V(-0.55, 1.66, 2.1), BED_HEAD],
    kneel: [V(-0.62, 1.0, 1.08), V(-0.95, 0.76, 0)],
    lean: [V(-0.84, 0.94, 0.42), V(-0.97, 0.8, 0.02)],
    rise: [V(-0.55, 1.66, 1.5), V(-0.2, 1.4, 6)],
    away: [V(-0.3, 1.66, 3.2), V(0, 1.6, 14)],
  };
  /* a sculpted head is bigger and fuller than the hand-built one: lean in less far */
  if (sculpted) POSE.lean = [V(-0.72, 1.12, 0.78), V(-0.98, 0.86, 0)];
  function pose(name, dur, ease, cb) { rig.to(POSE[name][0], POSE[name][1], dur, ease, cb); }
  rig.set(POSE.door[0], POSE.door[1]);

  return {
    scene, camera, rig, princes,
    reset() { rig.set(POSE.door[0], POSE.door[1]); headTurn = headTurnGoal = 0.3; nodT = -1; },
    pose,
    /* he turns his face to the messenger */
    turnHead(on) { headTurnGoal = on ? (sculpted ? 0.55 : 1) : 0.3; },
    nod() { nodT = 0; },
    lean(on) { faceLight.intensity = on ? (sculpted ? 0.12 : 0.45) : 0; },
    whisperGlyph,
    update(dt, t) {
      rig.update(dt);
      princes.uTime.value = t;
      for (const f of flames) flicker(f, t);
      lampL.intensity = 30 + Math.sin(t * 9) * 1.6 + Math.sin(t * 23) * 1;
      headTurn += (headTurnGoal - headTurn) * Math.min(1, dt * 1.6);
      let nodA = 0;
      if (nodT >= 0) { nodT += dt; nodA = Math.sin(Math.min(1, nodT / 1.4) * Math.PI) * 0.32; if (nodT > 1.4) nodT = -1; }
      /* face up, turned toward +z by headTurn; the nod brings the chin down */
      neck.rotation.set(headTurn * 0.75, 0, -nodA);
      /* breathing: the quilt rises, slowly and not quite evenly */
      const br = Math.max(0, Math.sin(t * 1.1)) * (0.6 + 0.4 * Math.sin(t * 0.37));
      body.scale.y = 1 + br * 0.06; quilt.scale.y = 1 + br * 0.08;
      const p = dg.attributes.position;
      for (let i = 0; i < DUST; i++) { let y = p.getY(i) + dt * 0.05; if (y > 4) y = 0; p.setY(i, y); }
      p.needsUpdate = true;
      for (let i = sprites.length - 1; i >= 0; i--) {
        const s = sprites[i], u = s.userData;
        u.t += dt;
        const k = Math.min(1, u.t / 1.8);
        s.position.lerpVectors(u.from, u.to, 1 - Math.pow(1 - k, 2));
        s.material.opacity = Math.min(1, u.t * 3) * (1 - Math.max(0, (u.t - 1.2) / 0.8));
        if (u.t > 2) { scene.remove(s); s.material.dispose(); sprites.splice(i, 1); }
      }
    },
  };
}
