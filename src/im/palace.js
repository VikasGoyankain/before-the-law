/* The palace, seen through the messenger's eyes. A world that is built just
   ahead of him and taken down just behind: chamber after chamber of the
   innermost palace, full of people who live there - and, once the story
   turns to "if", the stairs, the courtyards and the second palace.

   He always moves when you hold Run (that is a promise the game keeps), but
   the crowd decides how fast. Pushing - one arm, then the other - shoves
   people aside; the sign of the sun parts them and makes them bow. Nobody
   is an enemy. There are simply too many of them. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { V, rng, TEX, makeSky, makeCrowd, PALETTE, part, M, flame, flicker, figureGeometry } from './kit.js';
import { look, LOW, CALM } from './stage.js';

const W = 10, H = 6.2, CH_LEN = 14, EYE = 1.62;
const KINDS = ['commoner', 'woman', 'official', 'child'];
const KIND_P = [0.38, 0.34, 0.22, 0.06];

export function buildPalace(models = {}) {
  const scene = new THREE.Scene();
  const fogCol = new THREE.Color(0x140c0a);
  scene.fog = new THREE.FogExp2(fogCol, 0.045);
  scene.background = fogCol.clone();
  const camera = new THREE.PerspectiveCamera(62, 1, 0.03, 900);
  scene.add(camera);
  /* the warm light of the crowd's own lamps, around him wherever he is */
  const near = new THREE.PointLight(0xffb070, 5, 9, 1.4);
  near.position.set(0, 0.6, -1.6);
  camera.add(near);

  const sky = makeSky({ top: 0x0e1022, mid: 0x3a3048, low: 0x9a5a3a, glowDir: V(0.4, 0.08, -1), glowCol: 0xff9050, glow: 0.7, stars: 0.2 });
  scene.add(sky.mesh);
  sky.mesh.visible = false;

  const hemi = new THREE.HemisphereLight(0x6a5a60, 0x2a1810, 0.8);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffa070, 0);
  sun.position.set(20, 30, -10);
  scene.add(sun, sun.target);
  /* three lamps that follow the lanterns nearest ahead of him */
  const lamps = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xff9a50, 0, 11, 1.5); scene.add(l); return l; });

  /* ---------------- materials ---------------- */
  const tex = (t, rx, ry) => { const c = t.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; return c; };
  const MAT = {
    floor: new THREE.MeshStandardMaterial({ map: tex(TEX.floor(), 3, 4), color: 0xa09080, roughness: 0.7 }),
    wall: new THREE.MeshStandardMaterial({ map: tex(TEX.lacquer(), 3, 1), color: 0xffffff, roughness: 0.75 }),
    wood: new THREE.MeshStandardMaterial({ map: TEX.wood(), color: 0x6a3a26, roughness: 0.6 }),
    beam: new THREE.MeshStandardMaterial({ color: 0x24140c, roughness: 0.8 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xc8963a, metalness: 0.8, roughness: 0.35 }),
    props: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }),
    stone: new THREE.MeshStandardMaterial({ map: tex(TEX.paving(), 6, 6), color: 0xb0a898, roughness: 0.9 }),
    step: new THREE.MeshStandardMaterial({ color: 0x8a8070, roughness: 0.9 }),
    outer: new THREE.MeshStandardMaterial({ map: tex(TEX.plaster(), 20, 4), color: 0x9a3a28, roughness: 0.85 }),
    roof: new THREE.MeshStandardMaterial({ map: TEX.roof(), color: 0x606068, roughness: 0.7 }),
    lantern: new THREE.MeshBasicMaterial({ color: 0xff8a3a }),
    fire: new THREE.MeshBasicMaterial({ color: 0xffa040 }),
    cloth: new THREE.MeshStandardMaterial({ color: 0x8a6a50, roughness: 0.95, side: THREE.DoubleSide }),
  };

  /* ---------------- the crowd ----------------
   One instanced mesh per kind of person; a pool of slots in each. */
  const CAP = LOW ? 260 : 520;
  const crowds = {};
  for (const k of KINDS) {
    crowds[k] = makeCrowd(k, k === 'child' ? 60 : CAP, { geometry: models[k], noShadow: true });
    scene.add(crowds[k].mesh);
  }
  const free = {};
  for (const k of KINDS) free[k] = Array.from({ length: crowds[k].capacity }, (_, i) => crowds[k].capacity - 1 - i);
  const people = new Set();

  function spawn(seg, r, x, u, opts = {}) {
    let kind = opts.kind;
    if (!kind) { let p = r(), i = 0; while (i < KIND_P.length - 1 && p > KIND_P[i]) { p -= KIND_P[i]; i++; } kind = KINDS[i]; }
    const slot = free[kind].pop();
    if (slot === undefined) return null;
    const c = crowds[kind];
    const pal = PALETTE[kind];
    c.tint(slot, pal[Math.floor(r() * pal.length)], 0.75 + r() * 0.5);
    c.phase(slot, r());
    const p = {
      kind, slot, seg, baseX: x, x, u, vx: 0, ry: opts.ry ?? (r() * Math.PI * 2), ry0: 0, bow: opts.bow || 0, bowGoal: opts.bow || 0,
      sit: opts.sit || 0, face: 0, aside: 0, still: !!opts.still, sc: opts.sc || (0.94 + r() * 0.1),
    };
    p.ry0 = p.ry;
    people.add(p); seg.people.push(p);
    return p;
  }
  function despawn(p) {
    crowds[p.kind].hide(p.slot);
    free[p.kind].push(p.slot);
    people.delete(p);
  }

  /* ---------------- props: merged into one mesh per chamber ---------------- */
  function props(r, s0, y, list) {
    const P = [];
    const add = (geo, col, m) => P.push(part(geo, col, false, m));
    for (const it of list) {
      const z = -(s0 + it.u), x = it.x;
      if (it.t === 'bed') add(new THREE.BoxGeometry(0.9, 0.18, 1.9), [0x8a7a60, 0x6a5a48, 0x7a4a3a][Math.floor(r() * 3)], M(x, y + 0.09, z, 0, it.ry || 0));
      if (it.t === 'pot') { add(new THREE.CylinderGeometry(0.16, 0.2, 0.36, 10), 0x4a3426, M(x, y + 0.18, z)); }
      if (it.t === 'table') {
        add(new THREE.BoxGeometry(1.2, 0.08, 0.7), 0x3a2014, M(x, y + 0.36, z));
        for (const [a, b] of [[-0.5, -0.28], [0.5, -0.28], [-0.5, 0.28], [0.5, 0.28]]) add(new THREE.BoxGeometry(0.07, 0.34, 0.07), 0x2a160e, M(x + a, y + 0.17, z + b));
        for (let k = 0; k < 4; k++) add(new THREE.CylinderGeometry(0.07, 0.05, 0.06, 8), 0xd8d0c0, M(x + (k - 1.5) * 0.25, y + 0.43, z + (k % 2 ? 0.12 : -0.12)));
      }
      if (it.t === 'chest') add(new THREE.BoxGeometry(0.9, 0.55, 0.5), 0x5a2a18, M(x, y + 0.275, z, 0, it.ry || 0));
      if (it.t === 'screen') for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.6, 1.7, 0.04), k % 2 ? 0x8a7050 : 0x9a8060, M(x + (k - 1) * 0.56, y + 0.85, z, 0, (k - 1) * 0.4));
      if (it.t === 'mat') add(new THREE.BoxGeometry(1.6, 0.02, 1.0), 0x6a5a3a, M(x, y + 0.01, z));
      if (it.t === 'shelf') { add(new THREE.BoxGeometry(1.4, 1.9, 0.4), 0x3a2014, M(x, y + 0.95, z)); for (let k = 0; k < 5; k++) add(new THREE.BoxGeometry(0.2, 0.25, 0.25), 0x8a6a4a, M(x - 0.5 + k * 0.25, y + 0.3 + (k % 3) * 0.6, z)); }
    }
    if (!P.length) return null;
    const m = new THREE.Mesh(mergeGeometries(P), MAT.props);
    m.receiveShadow = true;
    return m;
  }

  /* ---------------- segments ---------------- */
  const segs = [];
  let sEnd = 0, yEnd = 0, chamberNo = 0;
  let plan = [];

  function wallWithDoor(g, z, y, w, h, thick, doorW, doorH, mat) {
    const side = (w - doorW) / 2;
    for (const sx of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(side, h, thick), mat);
      b.position.set(sx * (doorW / 2 + side / 2), y + h / 2, z); g.add(b);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorW, h - doorH, thick), mat);
    lintel.position.set(0, y + doorH + (h - doorH) / 2, z); g.add(lintel);
    for (const sx of [-1, 1]) {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.16, doorH, thick + 0.08), MAT.gold);
      jamb.position.set(sx * doorW / 2, y + doorH / 2, z); g.add(jamb);
    }
    const head = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.3, 0.18, thick + 0.1), MAT.gold);
    head.position.set(0, y + doorH, z); g.add(head);
  }

  function makeChamber(seg, idx) {
    const r = rng(1000 + idx * 7919);
    const g = seg.group, y = seg.y0, s0 = seg.s0, L = seg.len, zc = -(s0 + L / 2);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, L), MAT.floor);
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, y, zc); floor.receiveShadow = true; g.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, L), MAT.beam);
    ceil.rotation.x = Math.PI / 2; ceil.position.set(0, y + H, zc); g.add(ceil);
    for (let k = 1; k < 4; k++) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(W, 0.35, 0.3), MAT.wood);
      beam.position.set(0, y + H - 0.2, -(s0 + k * L / 4)); g.add(beam);
    }
    /* side walls: the left one may have a window onto the roofs */
    for (const sx of [-1, 1]) {
      if (sx < 0 && seg.data.window) {
        const wu = L / 2, ww = 2.4, wh = 2.2, wy = 1.3;
        const parts = [[0, wu - ww / 2, 0, H], [wu + ww / 2, L, 0, H], [wu - ww / 2, wu + ww / 2, 0, wy], [wu - ww / 2, wu + ww / 2, wy + wh, H]];
        for (const [a, b, lo, hi] of parts) {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(b - a, hi - lo), MAT.wall);
          m.rotation.y = Math.PI / 2; m.position.set(-W / 2, y + (lo + hi) / 2, -(s0 + (a + b) / 2)); g.add(m);
        }
        const sill = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, ww + 0.3), MAT.wood);
        sill.position.set(-W / 2 + 0.1, y + wy, -(s0 + wu)); g.add(sill);
        seg.data.windowAt = { u: wu, y: y + wy + wh / 2 };
        g.add(roofscape(r, y, -(s0 + wu)));
      } else {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(L, H), MAT.wall);
        m.rotation.y = -sx * Math.PI / 2; m.position.set(sx * W / 2, y + H / 2, zc); g.add(m);
      }
      for (let k = 0; k <= 4; k++) {
        const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, H, 10), MAT.wood);
        pil.position.set(sx * (W / 2 - 0.25), y + H / 2, -(s0 + k * L / 4)); g.add(pil);
      }
    }
    if (seg.data.entryWall) wallWithDoor(g, -s0, y, W, H, 0.6, 3.2, 4.4, MAT.wall);
    wallWithDoor(g, -(s0 + L), y, W, H, 0.6, 3.2, 4.4, MAT.wall);

    /* lanterns */
    seg.lights = [];
    for (const u of [L * 0.3, L * 0.72]) {
      const x = (r() - 0.5) * 3;
      const lant = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), MAT.lantern);
      lant.scale.set(1, 1.25, 1); lant.position.set(x, y + H - 1.3, -(s0 + u)); g.add(lant);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.0), MAT.beam);
      cord.position.set(x, y + H - 0.6, -(s0 + u)); g.add(cord);
      seg.lights.push(V(x, y + H - 1.6, -(s0 + u)));
    }

    /* the dwellings: people live here, all along the walls and in between */
    const items = [];
    const kinds = ['bed', 'pot', 'table', 'chest', 'screen', 'mat', 'shelf'];
    for (let k = 0; k < 9; k++) {
      const sx = r() < 0.5 ? -1 : 1;
      items.push({ t: kinds[Math.floor(r() * kinds.length)], x: sx * (W / 2 - 0.9 - r() * 1.3), u: 1 + r() * (L - 2), ry: r() < 0.5 ? 0 : Math.PI / 2 });
    }
    const fires = [];
    if (r() < 0.6) {
      const fx = (r() < 0.5 ? -1 : 1) * (1.6 + r() * 1.5), fu = 2 + r() * (L - 4);
      items.push({ t: 'pot', x: fx, u: fu });
      const f = flame(3); f.position.set(fx, y + 0.45, -(s0 + fu)); g.add(f); fires.push(f);
    }
    if (seg.data.family) items.push({ t: 'mat', x: 1.7, u: L / 2 }, { t: 'table', x: 1.7, u: L / 2 });
    const pm = props(r, s0, y, items);
    if (pm) g.add(pm);
    /* a washing line across the room */
    if (r() < 0.5) {
      const lu = 2 + r() * (L - 4);
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, W - 0.6), MAT.beam);
      line.rotation.z = Math.PI / 2; line.position.set(0, y + 2.9, -(s0 + lu)); g.add(line);
      for (let k = 0; k < 4; k++) {
        const cl = new THREE.Mesh(new THREE.PlaneGeometry(0.5 + r() * 0.4, 0.6 + r() * 0.5), MAT.cloth);
        cl.position.set(-3.5 + k * 2 + r(), y + 2.55, -(s0 + lu)); g.add(cl);
      }
    }
    seg.fires = fires;

    /* the people */
    const n = seg.data.sparse ? 10 : Math.min(LOW ? 30 : 58, 22 + idx * 3);
    for (let k = 0; k < n; k++) {
      const x = (r() - 0.5) * (W - 1.4), u = 0.8 + r() * (L - 1.6);
      const sitting = r() < 0.12 && Math.abs(x) > 1.5;
      spawn(seg, r, x, s0 + u, sitting ? { sit: 1, bow: 0.25 } : {});
    }
    if (seg.data.knot) {
      /* a knot of people that will not move for anyone */
      for (let k = 0; k < 13; k++) spawn(seg, r, -3.6 + k * 0.6 + (r() - 0.5) * 0.2, s0 + L / 2 + (r() - 0.5) * 0.8, { ry: Math.PI + (r() - 0.5) });
      seg.data.knotU = s0 + L / 2 - 1.2;
    }
    if (seg.data.family) {
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * Math.PI * 2;
        spawn(seg, r, 1.7 + Math.sin(a) * 0.95, s0 + L / 2 + Math.cos(a) * 0.75, { kind: k === 4 ? 'child' : k % 2 ? 'woman' : 'commoner', sit: 1, bow: 0.15, ry: a + Math.PI, still: true });
      }
      seg.data.familyU = s0 + L / 2;
    }
    if (seg.data.child) {
      const c = spawn(seg, r, 0.25, s0 + L / 2, { kind: 'child', ry: 0, still: true });
      seg.data.childU = s0 + L / 2;
      seg.data.childP = c;
    }
  }

  /* roofs to the edge of the sky, seen through the one window */
  function roofscape(r, y, z) {
    const g = new THREE.Group();
    const geo = new THREE.ConeGeometry(1, 1, 4, 1);
    geo.rotateY(Math.PI / 4);
    const N = LOW ? 240 : 600;
    const im = new THREE.InstancedMesh(geo, MAT.roof, N);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < N; i++) {
      const dx = 8 + Math.pow(r(), 0.7) * 260, dz = (r() - 0.5) * (40 + dx * 2.2);
      const s = 2.5 + r() * 3;
      m4.compose(V(-W / 2 - dx, y - 2 + r() * 1.5 - dx * 0.02, z + dz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() < 0.5 ? 0 : Math.PI / 2, 0)), V(s * 1.6, s * 0.55, s));
      im.setMatrixAt(i, m4);
    }
    g.add(im);
    /* lit windows among them */
    const dots = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) { const dx = 10 + r() * 250; dots[i * 3] = -W / 2 - dx; dots[i * 3 + 1] = y - 2.5 - dx * 0.02 + r(); dots[i * 3 + 2] = z + (r() - 0.5) * (40 + dx * 2); }
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dots, 3));
    g.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffb060, size: 0.35, sizeAttenuation: true })));
    const backdrop = makeSky({ top: 0x0e1022, mid: 0x3a3048, low: 0x9a5a3a, glowDir: V(-1, 0.05, -0.2), glowCol: 0xff9050, glow: 0.8, r: 380 });
    backdrop.mesh.position.set(0, y, z);
    g.add(backdrop.mesh);
    return g;
  }

  function makeStairs(seg) {
    const r = rng(77 + seg.s0);
    const g = seg.group, y0 = seg.y0, s0 = seg.s0, L = seg.len, drop = seg.y0 - seg.y1, SW = 14;
    const n = 26, run = (L - 4) / n, rise = drop / n;
    for (let k = 0; k < n; k++) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(SW, rise + 0.02, run + 0.02), MAT.step);
      st.position.set(0, y0 - (k + 1) * rise + rise / 2 - 0.0, -(s0 + 2 + k * run + run / 2));
      st.receiveShadow = true; g.add(st);
    }
    const top = new THREE.Mesh(new THREE.PlaneGeometry(SW, 2.2), MAT.stone); top.rotation.x = -Math.PI / 2; top.position.set(0, y0, -(s0 + 1)); g.add(top);
    const bot = new THREE.Mesh(new THREE.PlaneGeometry(SW, 2.2), MAT.stone); bot.rotation.x = -Math.PI / 2; bot.position.set(0, seg.y1, -(s0 + L - 1)); g.add(bot);
    for (const sx of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.2, drop + 8, L), MAT.outer);
      wall.position.set(sx * (SW / 2 + 0.6), seg.y1 + (drop + 8) / 2 - 1, -(s0 + L / 2)); g.add(wall);
      for (let k = 0; k < 5; k++) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1), MAT.gold);
        const u = 2 + k * (L - 4) / 4;
        post.position.set(sx * (SW / 2 - 0.3), seg.floorAt(s0 + u) + 0.55, -(s0 + u)); g.add(post);
      }
    }
    for (let k = 0; k < (LOW ? 18 : 34); k++) {
      const u = 2 + r() * (L - 4), x = (r() - 0.5) * (SW - 2);
      spawn(seg, r, x, s0 + u);
    }
  }

  function makeCourt(seg) {
    const r = rng(5 + seg.s0);
    const g = seg.group, y = seg.y0, s0 = seg.s0, L = seg.len, CW = 90;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(CW, L), MAT.stone);
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, y, -(s0 + L / 2)); ground.receiveShadow = true; g.add(ground);
    for (const sx of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4, L), MAT.outer);
      wall.position.set(sx * CW / 2, y + 2, -(s0 + L / 2)); g.add(wall);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, L), MAT.roof);
      cap.position.set(sx * CW / 2, y + 4.2, -(s0 + L / 2)); g.add(cap);
    }
    /* a few trees and incense burners: open space at last */
    for (let k = 0; k < 8; k++) {
      const x = (r() < 0.5 ? -1 : 1) * (8 + r() * 30), u = 4 + r() * (L - 8);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 2.4), MAT.wood);
      trunk.position.set(x, y + 1.2, -(s0 + u)); g.add(trunk);
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 0), new THREE.MeshStandardMaterial({ color: 0x2a3a24, roughness: 1, flatShading: true }));
      crown.position.set(x, y + 3.2, -(s0 + u)); crown.scale.set(1.2, 0.9, 1.2); g.add(crown);
    }
    for (let k = 0; k < (LOW ? 14 : 26); k++) spawn(seg, r, (r() - 0.5) * 40, s0 + 3 + r() * (L - 6));
  }

  /* the second palace: a wall that rises across the whole width of the world */
  function makeWall(seg) {
    const g = seg.group, y = seg.y0, s0 = seg.s0;
    const inner = new THREE.Group();
    const WW = 260, WH = 26, DW = 7, DH = 12;
    const side = (WW - DW) / 2;
    for (const sx of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(side, WH, 4), MAT.outer);
      b.position.set(sx * (DW / 2 + side / 2), y + WH / 2, -(s0 + 2)); inner.add(b);
      const eave = new THREE.Mesh(new THREE.BoxGeometry(side, 1.2, 7), MAT.roof);
      eave.position.set(sx * (DW / 2 + side / 2), y + WH + 0.6, -(s0 + 2)); inner.add(eave);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(DW, WH - DH, 4), MAT.outer);
    lintel.position.set(0, y + DH + (WH - DH) / 2, -(s0 + 2)); inner.add(lintel);
    /* the gate tower */
    const tower = new THREE.Mesh(new THREE.BoxGeometry(22, 8, 9), MAT.outer);
    tower.position.set(0, y + WH + 4, -(s0 + 2)); inner.add(tower);
    for (let k = 0; k < 2; k++) {
      const roof = new THREE.Mesh(new THREE.ConeGeometry(17 - k * 4, 4, 4), MAT.roof);
      roof.rotation.y = Math.PI / 4; roof.scale.set(1.3, 1, 0.55);
      roof.position.set(0, y + WH + 9 + k * 4.5, -(s0 + 2)); inner.add(roof);
    }
    for (const sx of [-1, 1]) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(DW / 2, DH, 0.3), MAT.wood);
      leaf.position.set(sx * DW * 0.75, y + DH / 2, -(s0 + 0.2)); leaf.rotation.y = sx * 1.2; inner.add(leaf);
    }
    inner.position.y = seg.data.risen ? 0 : -(WH + 14);
    g.add(inner);
    seg.data.inner = inner;
  }

  const LEN = { chamber: CH_LEN, stairs: 22, court: 64, wall: 4 };
  function addSegment(type, data = {}) {
    const seg = { type, s0: sEnd, len: LEN[type], y0: yEnd, y1: yEnd, group: new THREE.Group(), people: [], data, lights: [], fires: [] };
    if (type === 'stairs') seg.y1 = yEnd - 7;
    seg.floorAt = s => {
      if (seg.type !== 'stairs') return seg.y0;
      const k = Math.min(1, Math.max(0, (s - seg.s0 - 2) / (seg.len - 4)));
      return seg.y0 + (seg.y1 - seg.y0) * k;
    };
    if (type === 'chamber') {
      seg.idx = chamberNo++;
      if (!segs.length || segs[segs.length - 1].type !== 'chamber') data.entryWall = true;
      const b = beats[seg.idx];
      if (b) Object.assign(data, b);
      makeChamber(seg, seg.idx);
    }
    if (type === 'stairs') makeStairs(seg);
    if (type === 'court') makeCourt(seg);
    if (type === 'wall') makeWall(seg);
    scene.add(seg.group);
    segs.push(seg);
    sEnd += seg.len; yEnd = seg.y1;
    return seg;
  }
  function removeSegment(seg) {
    for (const p of seg.people) despawn(p);
    seg.people = [];
    scene.remove(seg.group);
    seg.group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    segs.splice(segs.indexOf(seg), 1);
  }

  /* which chamber has what in it (by chamber number, set by the game) */
  let beats = {};

  /* ---------------- the messenger ---------------- */
  const st = {
    s: 0, v: 0, boost: 0, run: false, lastPush: 0, lastSide: 0, pushes: 0, suns: 0, sunT: 0,
    idle: 0, mode: 'run', yaw: 0, yawGoal: 0, pitch: 0, bob: 0, stepPhase: 0, bellT: 0,
    field: null, pull: null, chamber: -1, seg: null, t: 0, lookOut: 0, autoRun: 0,
  };
  const listeners = [];
  const emit = (ev, d) => listeners.forEach(fn => fn(ev, d));
  function segAt(s) { for (const g of segs) if (s >= g.s0 && s < g.s0 + g.len) return g; return segs[segs.length - 1]; }
  const floorAt = s => segAt(s).floorAt(s);

  /* ---------------- first-person arms ---------------- */
  const arms = new THREE.Group();
  camera.add(arms);
  const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.9 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xa07a5a, roughness: 0.8 });
  const arm = [-1, 1].map(sx => {
    const g = new THREE.Group();
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.5, 8), sleeveMat);
    sleeve.rotation.x = Math.PI / 2; sleeve.position.z = 0.22; g.add(sleeve);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), skinMat);
    hand.scale.set(0.9, 0.6, 1.3); hand.position.z = -0.04; g.add(hand);
    g.userData = { sx, t: 1, rest: V(sx * 0.3, -0.42, -0.42) };
    g.position.copy(g.userData.rest);
    arms.add(g);
    return g;
  });
  /* the sign of the sun, on his chest: seen when he points to it */
  const emblem = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0 }));
  emblem.position.set(0, -0.36, -0.32); emblem.rotation.x = -0.9;
  arms.add(emblem);
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 48), new THREE.MeshBasicMaterial({ color: 0xffc860, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  ripple.rotation.x = -Math.PI / 2;
  scene.add(ripple);
  let rippleT = -1, sunGestT = -1;

  /* the messenger as others see him, for the pull-back at the end */
  const body = new THREE.Mesh(models.messenger || figureGeometry('commoner'), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }));
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
  disc.position.set(0, 1.28, 0.25);
  if (!models.messenger) body.add(disc);   /* a sculpted messenger wears his own */
  body.visible = false;
  scene.add(body);

  /* ---------------- the open country (the first "if") ---------------- */
  const field = new THREE.Group();
  {
    const gg = new THREE.PlaneGeometry(800, 800, 80, 80);
    const p = gg.attributes.position, r = rng(42);
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 0.03) * 2 + Math.cos(p.getY(i) * 0.021) * 3 + r() * 0.3);
    gg.computeVertexNormals();
    const grass = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ color: 0x8a9a3a, roughness: 1, flatShading: true }));
    grass.rotation.x = -Math.PI / 2; grass.position.y = -3;
    field.add(grass);
    const fsky = makeSky({ top: 0x2a5aa8, mid: 0x7aa4d8, low: 0xf0d8a0, glowDir: V(0.2, 0.18, -1), glowCol: 0xffe0a0, glow: 0.45, r: 500 });
    field.add(fsky.mesh);
    field.add(new THREE.HemisphereLight(0xc8d8f0, 0x4a5a2a, 0.9));
    const fsun = new THREE.DirectionalLight(0xfff0d0, 1.6); fsun.position.set(-40, 60, -80); field.add(fsun);
  }
  field.visible = false;
  scene.add(field);

  /* ---------------- control ---------------- */
  function reset(startChamber = 0, startBeats = {}) {
    for (const s of segs.slice()) removeSegment(s);
    sEnd = 0; yEnd = 0; chamberNo = startChamber; plan = [];
    beats = startBeats;
    Object.assign(st, { s: 1.5, v: 0, boost: 0, pushes: 0, suns: 0, sunT: 0, idle: 0, mode: 'run', yaw: 0, yawGoal: 0, bellT: 0, field: null, pull: null, chamber: -1, seg: null, lookOut: 0, autoRun: 0 });
    body.visible = false; arms.visible = true;
    for (let k = 0; k < 6; k++) addSegment('chamber');
  }
  /* replace what lies ahead, beyond the next doorway, with a new route */
  function replan(types) {
    const cur = segAt(st.s);
    const keep = segs.indexOf(cur) + 1;
    for (const s of segs.slice(keep + 1)) removeSegment(s);
    const last = segs[segs.length - 1];
    sEnd = last.s0 + last.len; yEnd = last.y1;
    plan = types.slice();
  }
  function ensure() {
    while (sEnd < st.s + (LOW ? 60 : 90)) {
      const t = plan.length ? plan.shift() : 'chamber';
      addSegment(typeof t === 'string' ? t : t.type, typeof t === 'string' ? {} : Object.assign({}, t.data));
    }
    while (segs.length && segs[0].s0 + segs[0].len < st.s - 22) removeSegment(segs[0]);
  }

  function push(side) {
    if (st.mode !== 'run') return;
    const now = st.t, gap = now - st.lastPush;
    const alt = side !== st.lastSide && gap > 0.12 && gap < 0.95;
    st.boost = Math.min(3.4, st.boost + (alt ? 2.1 : 1.1));
    st.lastPush = now; st.lastSide = side; st.pushes++; st.idle = 0;
    const a = arm[side < 0 ? 0 : 1];
    a.userData.t = 0;
    for (const p of people) {
      const ahead = p.u - st.s;
      if (ahead < -0.4 || ahead > 2.4 || p.still) continue;
      const lat = p.x;
      if (Math.abs(lat) > 1.9) continue;
      const dir = lat > 0.1 ? 1 : lat < -0.1 ? -1 : side;
      p.vx += dir * (2.2 - Math.abs(lat)) * (alt ? 2.4 : 1.6) * (1.3 - ahead / 3);
      p.stagger = 1;
    }
    emit('push', { alt });
  }
  function showSun() {
    if (st.mode !== 'run') return;
    st.suns++; st.sunT = 4.5; st.idle = 0;
    sunGestT = 0; rippleT = 0;
    const segNow = segAt(st.s);
    for (const p of people) {
      const ahead = p.u - st.s;
      if (ahead < -1 || ahead > 18 || p.still) continue;
      /* they make way: out of his path, and they bow to the sign */
      const dir = p.x > 0.05 ? 1 : p.x < -0.05 ? -1 : (Math.random() < 0.5 ? -1 : 1);
      const room = segNow.type === 'court' ? 8 : W / 2 - 0.6;
      p.aside = dir * Math.min(room, Math.max(Math.abs(p.x), 1.4 + Math.random() * 1.6));
      p.bowGoal = 0.85; p.face = 1;
    }
    emit('sun', { n: st.suns });
  }
  /* the bell: the Emperor is dead. Everyone turns back toward the inner rooms and bows. */
  function bell() {
    st.bellT = 8;
    for (const p of people) if (!p.still) { p.bowGoal = 0.7; p.face = -1; }
  }
  function turnBack(on) { st.yawGoal = on ? Math.PI : 0; }
  function lookOutWindow(on) {
    st.lookOut = on ? 1 : 0;
  }
  function fieldVision(on) {
    if (on) {
      st.field = { s: 0, y: floorAt(st.s) };
      field.visible = true; field.position.set(0, st.field.y, -st.s);
      for (const s of segs) s.group.visible = false;
      for (const k of KINDS) crowds[k].mesh.visible = false;
      scene.fog.density = 0.002;
    } else {
      st.field = null;
      field.visible = false;
      for (const s of segs) s.group.visible = true;
      for (const k of KINDS) crowds[k].mesh.visible = true;
    }
  }
  /* the camera leaves him: up and back, until he is one more figure in the crowd */
  function pullback() {
    st.pull = { t: 0 };
    body.visible = true; arms.visible = false;
  }

  /* ---------------- per frame ---------------- */
  const tmp = V(0, 0, 0);
  function update(dt, t) {
    st.t = t;
    for (const k of KINDS) crowds[k].uTime.value = t;
    ensure();
    const seg = segAt(st.s);
    if (seg !== st.seg) {
      st.seg = seg;
      emit('segment', { type: seg.type, idx: seg.idx, data: seg.data });
      if (seg.type === 'chamber' && seg.idx !== st.chamber) { st.chamber = seg.idx; emit('chamber', { idx: seg.idx, data: seg.data }); }
      if (seg.type === 'court') {
        const next = segs[segs.indexOf(seg) + 1];
        if (next && next.type === 'wall') next.data.raise = 0.0001;
      }
    }
    const open = seg.type !== 'chamber';

    /* ---- movement ---- */
    let ahead = 0;
    if (st.field) {
      st.field.s += dt * 11;
      ahead = 0;
    } else if (st.mode === 'run' && !st.pull) {
      let blockers = 0;
      for (const p of people) {
        const a = p.u - st.s;
        if (a > 0.15 && a < 1.5 && Math.abs(p.x) < 0.62 && p.sit < 0.5) blockers += 1.3 - a * 0.6;
      }
      const knot = seg.data.knotU && st.s > seg.data.knotU - 0.5 && st.s < seg.data.knotU + 1.4 && st.sunT <= 0 && !seg.data.knotOpen;
      if (knot) { blockers += 6; if (!seg.data.knotSeen) { seg.data.knotSeen = true; emit('knot'); } }
      if (seg.data.knotU && st.sunT > 0) seg.data.knotOpen = true;
      const free = open ? 6.4 : 5.0;
      let limit = st.sunT > 0 ? free : free / (1 + blockers * 2.6);
      if (st.run) limit = Math.max(limit, knot ? 0.18 : 0.42);     /* Run always takes him on */
      if (st.bellT > 0) limit = Math.min(limit, 1.2);
      if (st.lookOut > 0) limit = 0;
      const target = (st.run || st.autoRun) ? limit : 0;
      st.v += (target - st.v) * Math.min(1, dt * (target > st.v ? 3 : 5));
      st.boost = Math.max(0, st.boost - dt * 2.6);
      const move = (st.v + (st.boost * (st.sunT > 0 ? 0.6 : 1)) / (1 + blockers * 0.5)) * dt;
      st.s += move;
      if (move < 0.004 && !st.run) st.idle += dt; else st.idle = 0;
      if (st.idle > 12) { st.idle = -999; emit('stand'); }
      ahead = move / Math.max(dt, 1e-4);
    }
    st.sunT = Math.max(0, st.sunT - dt);
    st.bellT = Math.max(0, st.bellT - dt);
    if (st.bellT === 0 && st.bellWas) { for (const p of people) if (!p.still) { p.bowGoal = 0; p.face = 0; } }
    st.bellWas = st.bellT > 0;

    /* ---- crowd ---- */
    const cx = 0, cz = -st.s;
    for (const p of people) {
      const a = p.u - st.s;
      if (p.aside) {
        p.x += (p.aside - p.x) * Math.min(1, dt * 4);
        if (st.sunT <= 0 && a < -2) p.aside = 0;
        if (st.sunT <= 0 && p.face === 1) { p.face = 0; p.bowGoal = 0; }
      } else if (!p.still) {
        /* yielding a little to whoever is right in front of him */
        if (st.run && a > 0 && a < 0.9 && Math.abs(p.x) < 0.55) p.vx += (p.x >= 0 ? 1 : -1) * 1.4 * dt;
        p.x += p.vx * dt;
        p.vx *= Math.exp(-dt * 3.5);
        /* behind him the crowd closes again like water */
        const k = a < -1.2 ? 0.9 : 0.06;
        p.x += (p.baseX - p.x) * Math.min(1, dt * k);
      }
      const segP = p.seg, lim = segP.type === 'court' ? 40 : segP.type === 'stairs' ? 6.4 : W / 2 - 0.45;
      p.x = Math.max(-lim, Math.min(lim, p.x));
      p.bow += (p.bowGoal + (p.stagger || 0) * 0.35 - p.bow) * Math.min(1, dt * 3);
      if (p.stagger) p.stagger = Math.max(0, p.stagger - dt * 2.5);
      let ry = p.ry0;
      if (p.face === 1) ry = Math.atan2(cx - p.x, cz - (-p.u));
      if (p.face === -1) ry = 0;
      let d = ry - p.ry; d = Math.atan2(Math.sin(d), Math.cos(d));
      p.ry += d * Math.min(1, dt * 3);
      const y = segP.floorAt(p.u) - p.sit * 0.48;
      const c = crowds[p.kind];
      c.place(p.slot, p.x, y, -p.u, p.ry, p.sc);
      c.bow(p.slot, p.bow);
    }
    for (const k of KINDS) crowds[k].flush();
    /* the child holds on to his sleeve for a moment */
    if (seg.data.childP && Math.abs(seg.data.childU - st.s) < 1.2) seg.data.childP.ry = seg.data.childP.ry0 = Math.atan2(-seg.data.childP.x, -seg.data.childU + st.s + 1);

    /* ---- the wall of the second palace rises out of the ground ---- */
    for (const sg of segs) if (sg.type === 'wall' && sg.data.raise) {
      sg.data.raise = Math.min(1, sg.data.raise + dt / 9);
      const e = 1 - Math.pow(1 - sg.data.raise, 3);
      sg.data.inner.position.y = -40 * (1 - e);
    }

    /* ---- light: warm lamps inside, dusk sky outside ---- */
    const lightsAhead = [];
    for (const sg of segs) for (const l of sg.lights) { const a = -l.z - st.s; if (a > -3 && a < 30) lightsAhead.push(l); }
    for (let i = 0; i < lamps.length; i++) {
      const l = lightsAhead[i];
      if (!l) { lamps[i].intensity = 0; continue; }
      lamps[i].position.copy(l);
      lamps[i].intensity = (open ? 0 : 18) * (0.9 + 0.1 * Math.sin(t * 7 + i));
    }
    for (const sg of segs) for (const f of sg.fires) flicker(f, t);
    const outside = open || !!st.field ? 1 : 0;
    st.out = (st.out || 0) + (outside - (st.out || 0)) * Math.min(1, dt * 1.2);
    sky.mesh.visible = st.out > 0.02 && !st.field;
    sun.intensity = 1.6 * st.out;
    hemi.intensity = 0.8 + 0.5 * st.out;
    near.intensity = 5 * (1 - st.out);
    hemi.color.setHex(0x6a5a60).lerp(new THREE.Color(0x8a8aa8), st.out);
    if (!st.field) scene.fog.density = (0.045 - 0.037 * st.out) * (1 - 0.85 * (st.lookOutK || 0));
    scene.fog.color.setHex(0x140c0a).lerp(new THREE.Color(0x3a3040), st.out);
    scene.background.copy(scene.fog.color);

    /* ---- the camera: his head ---- */
    const speed = st.field ? 11 : ahead;
    st.stepPhase += dt * (1.6 + Math.min(speed, 7) * 0.9);
    const bobAmt = CALM ? 0 : Math.min(1, speed / 3);
    const bobY = Math.abs(Math.sin(st.stepPhase)) * 0.06 * bobAmt;
    if (Math.floor(st.stepPhase / Math.PI) !== st.lastStep) { st.lastStep = Math.floor(st.stepPhase / Math.PI); if (speed > 0.3) emit('step', { speed, open }); }
    st.yaw += (st.yawGoal - st.yaw) * Math.min(1, dt * 2.2);
    st.lookOutK = (st.lookOutK || 0) + (st.lookOut - (st.lookOutK || 0)) * Math.min(1, dt * 2);
    const camS = st.field ? st.s + st.field.s : st.s;
    const baseY = st.field ? st.field.y + EYE : floorAt(st.s) + EYE;
    camera.position.set(Math.sin(t * 0.7) * 0.03 * bobAmt - 3.7 * (st.lookOutK || 0), baseY + bobY, -camS);
    let yaw = st.yaw + look.sx * 0.7 + st.lookOutK * (-Math.PI / 2 - look.sx * 0.4);
    let pitch = -look.sy * 0.35 + (seg.type === 'stairs' ? -0.12 : 0) - st.lookOutK * 0.02;
    if (st.pull) {
      st.pull.t += dt;
      const k = Math.min(1, st.pull.t / 7), e = 1 - Math.pow(1 - k, 2);
      body.position.set(0, floorAt(st.s), -st.s);
      body.rotation.y = Math.PI;
      st.s += dt * 0.6;
      camera.position.set(0.5 * e, floorAt(st.s) + EYE + e * (H - EYE - 0.4), -st.s + 0.6 + e * 6);
      yaw = 0; pitch = -0.25 - e * 0.55;
    }
    camera.rotation.set(0, 0, 0);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = -yaw;
    camera.rotation.x = pitch;

    /* ---- arms ---- */
    for (const a of arm) {
      const u = a.userData;
      u.t = Math.min(1, u.t + dt / 0.42);
      const k = u.t < 1 ? Math.sin(u.t * Math.PI) : 0;
      /* a swimmer's stroke: forward, then out to the side */
      const out = u.t < 1 ? Math.max(0, (u.t - 0.25) / 0.75) : 0;
      a.position.set(u.rest.x - u.sx * 0.18 * k + u.sx * 0.35 * out * k, u.rest.y + 0.24 * k + Math.sin(st.stepPhase + (u.sx > 0 ? Math.PI : 0)) * 0.025 * bobAmt, u.rest.z - 0.38 * k);
      a.rotation.set(0.4 * k, u.sx * 0.7 * out * k, 0);
    }
    if (sunGestT >= 0) {
      sunGestT += dt;
      const k = Math.sin(Math.min(1, sunGestT / 1.6) * Math.PI);
      const a = arm[1];
      a.position.set(0.3 - 0.24 * k, -0.42 + 0.02 * k, -0.42 + 0.12 * k);
      a.rotation.set(0.2 * k, -0.9 * k, 0);
      emblem.material.opacity = k;
      emblem.scale.setScalar(1 + 0.25 * k);
      if (sunGestT > 1.6) sunGestT = -1;
    }
    if (rippleT >= 0) {
      rippleT += dt;
      ripple.position.set(0, floorAt(st.s) + 0.05, -st.s - 1);
      ripple.scale.setScalar(1 + rippleT * 9);
      ripple.material.opacity = Math.max(0, 0.7 * (1 - rippleT / 1.8));
      if (rippleT > 1.8) rippleT = -1;
    }
  }

  return {
    scene, camera, st, update, reset, push, showSun, bell, turnBack, lookOutWindow, fieldVision, pullback, replan,
    on: fn => listeners.push(fn),
    setBeats: b => { beats = b; },
    setRun: on => { st.run = on; if (on) st.idle = 0; },
    setAutoRun: on => { st.autoRun = on; },
    setMode: m => { st.mode = m; },
    segAt, people: () => people.size,
    /* where a planned wall will stand: the end of what is built, plus what is planned before it */
    wallAt: () => { let s = sEnd; for (const t of plan) { if (t === 'wall') return s; s += LEN[typeof t === 'string' ? t : t.type]; } return Infinity; },
  };
}
