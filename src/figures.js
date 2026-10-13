/* The two people in the parable, built from code and shared by every scene.

   The doorkeeper follows Kafka's description: a big man in a fur coat, with a
   large pointed nose and a long, thin, black Tartar beard. He stands with his
   arms folded, which is most of what he does.

   The man can be any age and either standing, walking or sitting: setAge(0..1)
   grows and whitens his beard, greys his hair, fades his coat, bends his back
   and makes him smaller ("you have grown small"). */
import * as THREE from 'three';
import { hasModels, makeRealKeeper, makeRealMan } from './realfigures.js';

/* the sculpted figures when they have been supplied, the hand-built ones otherwise */
export function makeKeeper(LOW) { return hasModels() ? makeRealKeeper() : makeHandKeeper(LOW); }
export function makeMan(LOW) { return hasModels() ? makeRealMan() : makeHandMan(LOW); }

const mat = (c, r = 0.92, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: 0 }, extra || {}));
function add(parent, geo, m, x, y, z) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z);
  o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
}
const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

/* shaggy fur: many small cones scattered over a surface, one draw call */
function fur(parent, m, count, place, size) {
  const g = new THREE.ConeGeometry(size * 0.7, size, 5);
  const inst = new THREE.InstancedMesh(g, m, count);
  const d = new THREE.Object3D(), n = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    place(i / count, d.position, n, i);
    d.lookAt(d.position.clone().add(n));
    d.rotateX(Math.PI / 2 + (Math.sin(i * 12.7) * 0.6));
    d.scale.setScalar(0.7 + ((Math.sin(i * 91.3) + 1) / 2) * 0.7);
    d.updateMatrix();
    inst.setMatrixAt(i, d.matrix);
  }
  inst.castShadow = true;
  parent.add(inst);
  return inst;
}

function makeHandKeeper(LOW) {
  const seg = LOW ? 14 : 22, tufts = LOW ? 0.45 : 1;
  const root = new THREE.Group();
  const coat = mat(0x3b3027, 0.96), furM = mat(0x6a5844, 1), furDark = mat(0x463a2d, 1);
  const skin = mat(0x8d6a52, 0.78), black = mat(0x0c0b0a, 0.85), boot = mat(0x16120e, 0.6), belt = mat(0x22190f, 0.7);

  /* the coat's skirt, to the ankle, with a fur hem */
  add(root, lathe([[0.64, 0.05], [0.6, 0.3], [0.52, 0.7], [0.46, 1.0], [0.45, 1.02]], seg), coat, 0, 0, 0).scale.set(1, 1, 0.8);
  fur(root, furDark, Math.round(140 * tufts), (u, p, n) => { const a = u * Math.PI * 2; p.set(Math.sin(a) * 0.63, 0.07, Math.cos(a) * 0.5); n.set(Math.sin(a), -0.4, Math.cos(a)); }, 0.07);
  for (const s of [-1, 1]) add(root, new THREE.BoxGeometry(0.17, 0.11, 0.3), boot, s * 0.17, 0.05, 0.2);

  const hips = new THREE.Group(); hips.position.y = 0.95; root.add(hips);
  /* broad chest and shoulders */
  add(hips, lathe([[0.45, 0.0], [0.47, 0.25], [0.52, 0.52], [0.54, 0.7], [0.34, 0.86], [0.0, 0.9]], seg), coat, 0, 0, 0).scale.set(1, 1, 0.72);
  add(hips, new THREE.CylinderGeometry(0.47, 0.47, 0.09, seg), belt, 0, 0.06, 0).scale.set(1, 1, 0.75);
  for (const s of [-1, 1]) add(hips, new THREE.SphereGeometry(0.19, 12, 10), coat, s * 0.5, 0.72, 0).scale.set(1, 0.85, 0.9);
  /* the fur collar - where the fleas live */
  const collar = new THREE.Group(); collar.position.y = 0.78; hips.add(collar);
  add(collar, new THREE.TorusGeometry(0.33, 0.1, 8, seg), furM, 0, 0, 0).rotation.x = Math.PI / 2;
  fur(collar, furM, Math.round(300 * tufts), (u, p, n, i) => {
    const a = u * Math.PI * 2 * 5 % (Math.PI * 2), r = 0.33 + Math.sin(i * 7.1) * 0.05, v = Math.sin(i * 3.3);
    p.set(Math.sin(a) * (r + 0.07 * Math.cos(v)), v * 0.08, Math.cos(a) * (r + 0.07 * Math.cos(v)) * 0.88);
    n.set(Math.sin(a) * Math.cos(v), Math.sin(v) + 0.3, Math.cos(a) * Math.cos(v));
  }, 0.06);

  /* arms folded across the chest */
  const arms = [-1, 1].map(s => {
    const up = new THREE.Group(); up.position.set(s * 0.52, 0.7, 0); hips.add(up);
    add(up, new THREE.CylinderGeometry(0.12, 0.11, 0.44, 10), coat, 0, -0.22, 0);
    const fore = new THREE.Group(); fore.position.y = -0.42; up.add(fore);
    add(fore, new THREE.CylinderGeometry(0.11, 0.1, 0.4, 10), coat, 0, -0.2, 0);
    fur(fore, furDark, Math.round(24 * tufts), (u, p, n) => { const a = u * Math.PI * 2; p.set(Math.sin(a) * 0.12, -0.38, Math.cos(a) * 0.12); n.set(Math.sin(a), -0.3, Math.cos(a)); }, 0.08);
    add(fore, new THREE.SphereGeometry(0.075, 10, 8), skin, 0, -0.45, 0).scale.set(1, 1.2, 0.8);
    return { up, fore, s };
  });
  function fold(k) {
    for (const a of arms) {
      a.up.rotation.set(-0.42 * k, 0, a.s * (0.12 + 0.16 * k));
      a.fore.rotation.set(-1.55 * k, 0, -a.s * 1.25 * k);
    }
  }
  fold(1);

  const neck = new THREE.Group(); neck.position.y = 0.96; hips.add(neck);
  add(neck, new THREE.CylinderGeometry(0.09, 0.1, 0.16, 10), skin, 0, -0.01, 0);
  add(neck, new THREE.SphereGeometry(0.165, seg, 14), skin, 0, 0.17, 0).scale.set(0.9, 1.06, 0.96);
  /* heavy brow, deep-set eyes */
  add(neck, new THREE.BoxGeometry(0.25, 0.045, 0.08), black, 0, 0.235, 0.12).rotation.x = -0.15;
  for (const s of [-1, 1]) add(neck, new THREE.SphereGeometry(0.018, 8, 6), black, s * 0.058, 0.2, 0.145);
  /* "his big pointed nose" */
  add(neck, new THREE.ConeGeometry(0.048, 0.2, 8), skin, 0, 0.15, 0.2).rotation.x = Math.PI / 2 + 0.38;
  /* drooping moustache, and "his long, thin, black Tartar beard" */
  for (const s of [-1, 1]) {
    const m = add(neck, new THREE.CylinderGeometry(0.013, 0.006, 0.2, 6), black, s * 0.06, 0.06, 0.15);
    m.rotation.z = s * 0.45;
  }
  const beard = add(neck, new THREE.ConeGeometry(0.042, 0.7, 8), black, 0, -0.29, 0.13);
  beard.rotation.x = Math.PI - 0.08;
  /* tall fur hat */
  add(neck, new THREE.CylinderGeometry(0.19, 0.2, 0.26, seg), furM, 0, 0.38, 0);
  fur(neck, furM, Math.round(150 * tufts), (u, p, n, i) => { const a = u * Math.PI * 2 * 2 % (Math.PI * 2); const y = 0.26 + ((Math.sin(i * 5.7) + 1) / 2) * 0.25; p.set(Math.sin(a) * 0.2, y, Math.cos(a) * 0.2); n.set(Math.sin(a), 0.2, Math.cos(a)); }, 0.05);

  const mats = [coat, furM, furDark, skin, black, boot, belt].map(m => ({ m, base: m.color.clone() }));
  /* collar position in hips space, for anything that lives in it */
  return { root, hips, neck, arms, fold, mats, collar: { y: 0.78, rx: 0.42, rz: 0.36 } };
}

function makeHandMan(LOW) {
  const seg = LOW ? 12 : 18;
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const coatC = new THREE.Color(0x5a4a3b), coatOld = new THREE.Color(0x5e5850);
  const hairC = new THREE.Color(0x2a221c), hairOld = new THREE.Color(0xd8d4cc);
  const coat = mat(0x5a4a3b, 0.95), trousers = mat(0x34312d), boot = mat(0x1d1712, 0.7), skin = mat(0xb08a6e, 0.8), hair = mat(0x2a221c), felt = mat(0x2a2420, 0.9);
  const hips = new THREE.Group(); hips.position.y = 0.95; body.add(hips);
  const legs = [-1, 1].map(s => {
    const thigh = new THREE.Group(); thigh.position.set(s * 0.11, 0, 0); hips.add(thigh);
    add(thigh, new THREE.CylinderGeometry(0.075, 0.065, 0.46, 10), trousers, 0, -0.23, 0);
    const shin = new THREE.Group(); shin.position.y = -0.46; thigh.add(shin);
    add(shin, new THREE.CylinderGeometry(0.06, 0.05, 0.44, 10), trousers, 0, -0.22, 0);
    add(shin, new THREE.BoxGeometry(0.11, 0.08, 0.26), boot, 0, -0.45, 0.05);
    return { thigh, shin };
  });
  const spine = new THREE.Group(); hips.add(spine);
  add(spine, lathe([[0.0, 0.62], [0.17, 0.6], [0.2, 0.52], [0.19, 0.3], [0.18, 0.1], [0.21, -0.12], [0.25, -0.38], [0.27, -0.46]], seg), coat, 0, 0, 0).scale.set(1, 1, 0.78);
  for (const s of [-1, 1]) add(spine, new THREE.SphereGeometry(0.085, 10, 8), coat, s * 0.18, 0.56, 0).scale.set(1, 0.8, 0.9);
  add(spine, new THREE.CylinderGeometry(0.06, 0.07, 0.1, 10), skin, 0, 0.65, 0);
  const head = new THREE.Group(); head.position.y = 0.78; spine.add(head);
  add(head, new THREE.SphereGeometry(0.105, 16, 12), skin, 0, 0, 0).scale.set(0.92, 1.08, 1);
  add(head, new THREE.SphereGeometry(0.108, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), hair, 0, 0.004, -0.008).rotation.x = -0.5;
  add(head, new THREE.ConeGeometry(0.02, 0.05, 6), skin, 0, 0.0, 0.11).rotation.x = Math.PI / 2;
  /* the beard is the clock: it grows the whole time he waits */
  const beard = add(head, new THREE.ConeGeometry(0.07, 0.12, 10), hair, 0, -0.08, 0.05);
  beard.rotation.x = Math.PI - 0.25;
  const hat = new THREE.Group(); head.add(hat);
  add(hat, new THREE.CylinderGeometry(0.155, 0.155, 0.014, 20), felt, 0, 0.085, 0);
  add(hat, new THREE.CylinderGeometry(0.1, 0.115, 0.12, 16), felt, 0, 0.15, 0);
  const arms = [-1, 1].map(s => {
    const up = new THREE.Group(); up.position.set(s * 0.21, 0.56, 0); spine.add(up);
    add(up, new THREE.CylinderGeometry(0.058, 0.052, 0.32, 8), coat, 0, -0.16, 0);
    const fore = new THREE.Group(); fore.position.y = -0.32; up.add(fore);
    add(fore, new THREE.CylinderGeometry(0.05, 0.045, 0.28, 8), coat, 0, -0.14, 0);
    add(fore, new THREE.SphereGeometry(0.04, 8, 6), skin, 0, -0.31, 0);
    up.rotation.z = s * 0.06;
    return { up, fore, s };
  });
  const stick = new THREE.Group(); stick.position.set(0.19, 0.6, 0.02); spine.add(stick);
  add(stick, new THREE.CylinderGeometry(0.014, 0.014, 1.2, 6), mat(0x4a3a28), 0, 0.06, -0.3).rotation.x = -1.37;
  add(stick, new THREE.SphereGeometry(0.13, 12, 10), mat(0x6e5a44, 1), 0, -0.02, -0.8).scale.set(1, 1.15, 0.9);
  stick.visible = false;

  let age = 0, sit = 0;
  function setAge(a) {
    age = Math.max(0, Math.min(1, a));
    beard.scale.set(1 + age * 0.5, 1 + age * 5.5, 1 + age * 0.3);
    beard.position.y = -0.08 - age * 0.3;
    hair.color.copy(hairC).lerp(hairOld, Math.min(1, age * 1.3));
    coat.color.copy(coatC).lerp(coatOld, age);
    root.scale.setScalar(1 - age * 0.14);
  }
  function setSit(s) { sit = Math.max(0, Math.min(1, s)); }
  /* walk: 0..1 how much he is walking; t: time */
  function pose(t, walk) {
    const w = (walk || 0) * (1 - sit), ph = t * 5.2;
    legs.forEach((l, i) => {
      const s = Math.sin(ph + i * Math.PI);
      l.thigh.rotation.x = w * s * 0.42 - sit * 1.5;
      l.shin.rotation.x = w * Math.max(0, -Math.cos(ph + i * Math.PI)) * 0.7 + sit * 1.5;
    });
    arms.forEach((a, i) => {
      if (i === 1 && stick.visible) { a.up.rotation.x = -0.45; a.fore.rotation.x = -1.35; return; }
      const s = Math.sin(ph + i * Math.PI + Math.PI);
      /* seated, the hands rest on the knees */
      a.up.rotation.x = w * s * 0.35 + (1 - w) * 0.05 - sit * 0.55;
      a.fore.rotation.x = -0.25 - w * Math.max(0, s) * 0.3 - sit * 0.75;
    });
    const breath = Math.sin(t * (1.1 + age * 0.6)) * (0.004 + age * 0.004);
    hips.position.y = lerp(0.95 + w * Math.abs(Math.cos(ph)) * 0.035, 0.5, sit) + breath;
    /* the back bends with the years */
    spine.rotation.x = w * 0.08 + age * 0.5 + sit * 0.1;
    head.rotation.x = -age * 0.25 + sit * 0.05;
  }
  setAge(0);
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { root, hips, spine, head, legs, arms, stick, hat, setAge, setSit, pose, get age() { return age; } };
}
const lerp = (a, b, t) => a + (b - a) * t;
