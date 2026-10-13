/* The prologue, in 3D: the village at dawn, the man at his door, the things
   he packs, and the road out. A separate scene drawn by the same renderer
   (scene.js hands it the frame while it runs), so it costs no second WebGL
   context. Everything is built from code - no models to fetch - and leans
   on light, haze and movement for its realism rather than on polygon count. */
import * as THREE from 'three';
import { makeMan } from './figures.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

/* times of day the prologue passes through */
const SKIES = {
  dawn:  { top: 0x26395a, hor: 0xe9a46c, sun: 0xffc690, elev: 0.07, az: -0.35, fog: 0x9a8a7a, dens: 0.0038, sunI: 2.8, hemiS: 0x8494b4, hemiG: 0x3b3122, hemiI: 1.0, exp: 1.0 },
  day:   { top: 0x4a6a98, hor: 0xd9c2a0, sun: 0xfff0d8, elev: 0.30, az: -0.2,  fog: 0xa79c8e, dens: 0.0045, sunI: 3.0, hemiS: 0x9fb2d0, hemiG: 0x4a3f2c, hemiI: 1.2, exp: 1.0 },
  dusk:  { top: 0x1b2440, hor: 0xc0624a, sun: 0xff9a64, elev: 0.02, az: 0.6,   fog: 0x6a5450, dens: 0.0055, sunI: 1.9, hemiS: 0x6a7898, hemiG: 0x2e241c, hemiI: 1.0, exp: 1.15 },
  night: { top: 0x05070d, hor: 0x1e2433, sun: 0x8fa2c8, elev: -0.1, az: 0.6,   fog: 0x10131a, dens: 0.011,  sunI: 0.45, hemiS: 0x2a3550, hemiG: 0x08080a, hemiI: 0.85, exp: 1.0 },
};

export function buildPrologue(LOW) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 900);
  scene.fog = new THREE.FogExp2(0x8f8073, 0.0065);

  const mat = (c, r = 0.9, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: 0 }, extra || {}));
  const add = (parent, geo, m, x, y, z, shadow = true) => {
    const o = new THREE.Mesh(geo, m); o.position.set(x, y, z);
    o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o;
  };

  /* ---------------- sky ---------------- */
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSun: { value: new THREE.Color() },
      uDir: { value: V(0, 0.1, -1) }, uStars: { value: 0 },
    },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }',
    fragmentShader: `
      uniform vec3 uTop, uHor, uSun, uDir; uniform float uStars; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
      void main(){
        vec3 d = normalize(vD);
        float up = max(d.y, 0.0);
        vec3 c = mix(uHor, uTop, pow(up, 0.45));
        float s = max(dot(d, normalize(uDir)), 0.0);
        c += uSun * (pow(s, 1400.0) * 2.2 + pow(s, 40.0) * 0.32 + pow(s, 5.0) * 0.1);
        if (d.y < 0.0) c = mix(uHor, uHor * 0.6, min(1.0, -d.y * 4.0));
        vec3 g = floor(d * 400.0);
        float st = step(0.9975, h(g)) * smoothstep(0.05, 0.4, d.y) * uStars;
        c += vec3(st);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), skyMat));

  /* ---------------- land ----------------
     A shallow valley, the village in its floor, patchwork fields up the sides. */
  const height = (x, z) => {
    const r = Math.hypot(x, z * 0.8);
    const valley = smooth(36, 190, r) * 22;
    const roll = (Math.sin(x * 0.031) * 1.6 + Math.cos(z * 0.027 + 1.3) * 1.4 + Math.sin((x + z) * 0.013) * 2.2) * smooth(18, 60, r);
    return valley + roll;
  };
  const SEG = LOW ? 110 : 190;
  const landGeo = new THREE.PlaneGeometry(700, 700, SEG, SEG);
  landGeo.rotateX(-Math.PI / 2);
  const P = landGeo.attributes.position, cols = new Float32Array(P.count * 3);
  const FIELDS = [0x5c6a38, 0x76703f, 0x8e7b4a, 0x5b4b34, 0x4d5b31, 0x6b6a3a, 0x9a8656].map(c => new THREE.Color(c));
  const GRASS = new THREE.Color(0x4a5630), c = new THREE.Color();
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i);
    P.setY(i, height(x, z));
    const r = Math.hypot(x, z * 0.8);
    /* fields are skewed rectangles; the village floor is rough grass */
    const u = (x * 0.94 + z * 0.34) / 15, v = (z * 0.94 - x * 0.34) / 9;
    c.copy(FIELDS[Math.floor(hash(Math.floor(u), Math.floor(v)) * FIELDS.length)]);
    const furrow = 0.92 + 0.08 * Math.sin(v * Math.PI * 6);
    c.multiplyScalar(furrow);
    c.lerp(GRASS, 1 - smooth(26, 42, r));
    c.multiplyScalar(0.9 + hash(x * 0.3, z * 0.3) * 0.12);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  landGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  landGeo.computeVertexNormals();
  const land = new THREE.Mesh(landGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  land.receiveShadow = true;
  scene.add(land);

  /* the road out of the village, toward the city */
  const roadCurve = new THREE.CatmullRomCurve3([V(-2, 0, -6), V(2, 0, 12), V(9, 0, 40), V(4, 0, 80), V(18, 0, 130), V(30, 0, 200), V(26, 0, 300)]);
  {
    const N = 240, pos = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const p = roadCurve.getPointAt(i / N), t = roadCurve.getTangentAt(i / N);
      const side = V(-t.z, 0, t.x).normalize().multiplyScalar(1.5 + Math.sin(i * 0.7) * 0.08);
      for (const s of [-1, 1]) {
        const q = p.clone().addScaledVector(side, s);
        pos.push(q.x, height(q.x, q.z) + 0.06, q.z);
      }
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    const road = new THREE.Mesh(g, mat(0x8a7a62, 1));
    road.receiveShadow = true;
    scene.add(road);
  }
  const roadPts = roadCurve.getSpacedPoints(120);
  const onRoad = u => { const p = roadCurve.getPointAt(u); p.y = height(p.x, p.z); return p; };

  /* ---------------- the village ---------------- */
  const PLASTER = [0xd9cfbd, 0xe6dccb, 0xcdbf9f, 0xd2c4b0, 0xbfae92].map(x => mat(x, 0.95));
  const ROOF = [0x5a3326, 0x4a3a33, 0x6a3c2a, 0x3d3530].map(x => mat(x, 0.85));
  const TIMBER = mat(0x3a2a1e, 0.9), DOOR = mat(0x3b2a1c, 0.8);
  const WINDOW = new THREE.MeshStandardMaterial({ color: 0x2a2014, emissive: 0xffb45a, emissiveIntensity: 2.2, roughness: 0.6 });
  const DARKWIN = mat(0x1a1612, 0.5);
  const chimneys = [];

  function prism(w, d, h) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 - 0.25, 0); s.lineTo(0, h); s.lineTo(w / 2 + 0.25, 0); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d + 0.5, bevelEnabled: false });
    g.translate(0, 0, -(d + 0.5) / 2);
    return g;
  }
  function house(x, z, rot, w, d, h, k) {
    const g = new THREE.Group();
    g.position.set(x, height(x, z), z); g.rotation.y = rot;
    add(g, new THREE.BoxGeometry(w, h, d), PLASTER[k % PLASTER.length], 0, h / 2, 0);
    const roofH = w * 0.62;
    add(g, prism(w, d, roofH), ROOF[k % ROOF.length], 0, h, 0);
    /* timber sill and corner posts give the walls scale */
    add(g, new THREE.BoxGeometry(w + 0.05, 0.18, d + 0.05), TIMBER, 0, 0.09, 0);
    const ch = add(g, new THREE.BoxGeometry(0.55, 1.6, 0.55), PLASTER[(k + 2) % PLASTER.length], w * 0.22, h + roofH * 0.55, d * 0.2);
    chimneys.push(ch);
    /* door and windows on the long side facing the street (+z) */
    add(g, new THREE.BoxGeometry(0.9, 1.8, 0.08), DOOR, -w * 0.18, 0.9, d / 2 + 0.03, false);
    for (const wx of [w * 0.15, w * 0.36]) {
      const lit = hash(x + wx, z) > 0.35;
      add(g, new THREE.BoxGeometry(0.62, 0.72, 0.06), lit ? WINDOW : DARKWIN, wx, h * 0.55, d / 2 + 0.04, false);
    }
    if (hash(z, x) > 0.4) add(g, new THREE.BoxGeometry(0.06, 0.6, 0.55), WINDOW, w / 2 + 0.04, h * 0.55, 0, false);
    scene.add(g);
    return g;
  }

  const HOUSES = [
    [-14, -4, 0.1, 6, 5, 3.2], [-6, -10, 0.05, 7, 5, 3.4], [7, -9, -0.08, 6.5, 5.5, 3.3], [15, -3, -0.2, 6, 5, 3.1],
    [-17, 7, 0.35, 5.5, 4.5, 3.0], [-8, 4, 0.0, 6, 5, 3.3], [10, 6, -0.3, 6, 4.8, 3.1], [19, 10, -0.5, 5.4, 4.6, 3.0],
    [-23, -12, 0.2, 5.6, 4.4, 2.9], [24, -13, -0.25, 6, 4.5, 3.0], [-2, -19, 0.0, 6.5, 5, 3.4], [-26, 2, 0.6, 5, 4.2, 2.8],
    [27, 2, -0.7, 5.2, 4.4, 2.9], [-12, 16, 0.5, 5.2, 4.4, 2.8],
  ];
  if (LOW) HOUSES.length = 10;
  HOUSES.forEach((h, k) => house(h[0], h[1], h[2], h[3], h[4], h[5], k));

  /* his cottage: at the edge of the village, by the road out */
  const HOME = V(10.5, 0, 17);
  HOME.y = height(HOME.x, HOME.z);
  house(HOME.x, HOME.z - 3.2, -0.12, 6.2, 4.6, 3.0, 1);

  /* the church: nave, tower, spire */
  {
    const g = new THREE.Group(); g.position.set(1, height(1, -32), -32);
    add(g, new THREE.BoxGeometry(8, 6, 14), PLASTER[1], 0, 3, 0);
    add(g, prism(8, 14, 4.6), ROOF[1], 0, 6, 0);
    add(g, new THREE.BoxGeometry(4.2, 14, 4.2), PLASTER[0], 0, 7, 8.4);
    add(g, new THREE.ConeGeometry(2.9, 9, 8), ROOF[1], 0, 18.5, 8.4).rotation.y = Math.PI / 8;
    add(g, new THREE.BoxGeometry(0.16, 1.8, 0.16), TIMBER, 0, 23.8, 8.4);
    add(g, new THREE.BoxGeometry(0.9, 0.16, 0.16), TIMBER, 0, 24.1, 8.4);
    add(g, new THREE.BoxGeometry(1.0, 1.6, 0.1), WINDOW, 0, 10.5, 10.55, false);
    scene.add(g);
  }

  /* trees: rough crowns of a few lumps, so they read as foliage, not lollipops */
  const BARK = mat(0x3a2c20), LEAF = [0x3c4a26, 0x4a5530, 0x34401f].map(x => mat(x, 1, { flatShading: true }));
  const crownGeo = new THREE.IcosahedronGeometry(1, 1);
  function tree(x, z, s) {
    const g = new THREE.Group(); g.position.set(x, height(x, z), z); g.scale.setScalar(s);
    add(g, new THREE.CylinderGeometry(0.16, 0.26, 2.6, 6), BARK, 0, 1.3, 0);
    for (let i = 0; i < 4; i++) {
      const m = add(g, crownGeo, LEAF[(((i + Math.floor(x)) % 3) + 3) % 3], Math.sin(i * 2.1) * 0.8, 3.1 + (i % 2) * 0.8, Math.cos(i * 2.1) * 0.8);
      m.scale.setScalar(1.3 + hash(x + i, z) * 0.6);
    }
    scene.add(g);
  }
  const TREES = LOW ? 34 : 70;
  for (let i = 0; i < TREES; i++) {
    const a = hash(i, 3) * Math.PI * 2, r = 20 + hash(i, 7) * 110;
    const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.9;
    if (roadPts.some(p => Math.hypot(p.x - x, p.z - z) < 7)) continue;
    if (Math.hypot(x - 15, z - 70) < 16) continue; /* keep the camera's hillside clear */
    tree(x, z, 0.8 + hash(i, 9) * 0.7);
  }
  /* orchard by his cottage */
  [[17.5, 10], [18.5, 15.5], [19.5, 30], [-3, 14]].forEach(([x, z], i) => tree(x, z, 0.75 + i * 0.05));

  /* haystacks in the stubble */
  const HAY = mat(0xa58a52, 1);
  for (let i = 0; i < (LOW ? 8 : 18); i++) {
    const a = hash(i, 11) * Math.PI * 2, r = 45 + hash(i, 13) * 70;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const m = add(scene, new THREE.ConeGeometry(1.3, 2.4, 9), HAY, x, height(x, z) + 1.1, z);
    m.scale.y = 0.9 + hash(i, 2) * 0.3;
  }

  /* ---------------- smoke from the chimneys ---------------- */
  const puffTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  })();
  const PUFFS = LOW ? 6 : 12, smoke = [];
  scene.updateMatrixWorld(true);
  chimneys.forEach((ch, k) => {
    if (k % 2 && LOW) return;
    const base = new THREE.Vector3(); ch.getWorldPosition(base); base.y += 0.9;
    for (let i = 0; i < PUFFS; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: 0x8d857c, transparent: true, depthWrite: false, opacity: 0, fog: true }));
      scene.add(s);
      smoke.push({ s, base, ph: i / PUFFS, k });
    }
  });

  /* ---------------- birds, a few, far off ---------------- */
  const birds = [];
  {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0.1, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.1, 0], 3));
    const m = new THREE.LineBasicMaterial({ color: 0x1c1a18 });
    for (let i = 0; i < 9; i++) { const b = new THREE.LineSegments(g, m); scene.add(b); birds.push({ b, ph: i * 0.7, r: 30 + i * 4 }); }
  }

  /* ---------------- the man (shared with the game: figures.js) ---------------- */
  const man = makeMan(LOW);
  scene.add(man.root);

  /* ---------------- packing: the six things, on a cloth on the bench ---------------- */
  const bench = new THREE.Group();
  {
    const wood = mat(0x5a4632, 0.85);
    add(bench, new THREE.BoxGeometry(1.6, 0.07, 0.62), wood, 0, 0.62, 0);
    for (const [x, z] of [[-0.7, -0.24], [0.7, -0.24], [-0.7, 0.24], [0.7, 0.24]]) add(bench, new THREE.BoxGeometry(0.07, 0.62, 0.07), wood, x, 0.31, z);
    add(bench, new THREE.BoxGeometry(1.1, 0.01, 0.56), mat(0x7a6650, 1), 0.05, 0.66, 0);
  }
  bench.position.set(HOME.x + 0.6, HOME.y, HOME.z + 7.5);
  bench.rotation.y = 0.25;
  scene.add(bench);
  const items = {};
  {
    const leather = mat(0x5a3f28, 0.75), gold = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.28, metalness: 1 });
    const paper = mat(0xe3dac4), bread = mat(0x9a6f3e), wool = mat(0x48404e), stickM = mat(0x4a3a28);
    const it = (id, x, z, build) => { const g = new THREE.Group(); build(g); g.position.set(x, 0.665, z); g.visible = false; bench.add(g); items[id] = g; };
    it('purse', -0.38, 0.06, g => { add(g, new THREE.SphereGeometry(0.075, 14, 10), leather, 0, 0.06, 0).scale.set(1, 0.8, 1); add(g, new THREE.CylinderGeometry(0.018, 0.03, 0.05, 8), leather, 0, 0.13, 0); });
    it('coat', -0.08, -0.08, g => { const a = add(g, new THREE.BoxGeometry(0.42, 0.045, 0.3), wool, 0, 0.022, 0); a.rotation.y = 0.2; const b = add(g, new THREE.BoxGeometry(0.4, 0.04, 0.16), wool, 0.01, 0.062, -0.06); b.rotation.y = 0.22; add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.01, 8), mat(0x8a7a5a, 0.4), 0.06, 0.087, -0.04); });
    it('watch', 0.18, 0.12, g => { add(g, new THREE.CylinderGeometry(0.04, 0.04, 0.012, 22), gold, 0, 0.006, 0); add(g, new THREE.TorusGeometry(0.05, 0.004, 6, 20, Math.PI), gold, 0.045, 0.004, 0.01).rotation.x = -Math.PI / 2; });
    it('letters', 0.36, -0.06, g => { for (let i = 0; i < 3; i++) add(g, new THREE.BoxGeometry(0.16, 0.006, 0.11), paper, 0, 0.004 + i * 0.007, 0).rotation.y = i * 0.3 - 0.3; });
    it('bread', 0.22, -0.14, g => { const b = add(g, new THREE.CapsuleGeometry(0.045, 0.12, 4, 10), bread, 0, 0.045, 0); b.rotation.z = Math.PI / 2; b.rotation.y = 0.4; });
    it('stick', 0.0, 0.2, g => { const s = add(g, new THREE.CylinderGeometry(0.012, 0.014, 1.2, 8), stickM, 0, 0.014, 0); s.rotation.set(Math.PI / 2, 0, 1.45); });
  }

  /* ---------------- light ---------------- */
  const hemi = new THREE.HemisphereLight(0x8494b4, 0x3b3122, 1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffc690, 2.6);
  sun.castShadow = !LOW;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -60; sun.shadow.camera.right = 60; sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 400;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
  scene.add(sun); scene.add(sun.target);
  /* the glow from his open door */
  const doorLight = new THREE.PointLight(0xffa54a, 0, 9, 1.8);
  scene.add(doorLight);
  /* soft morning fill on the bench, so the things he packs can be seen */
  const benchLight = new THREE.PointLight(0xffe2b8, 0, 7, 1.2);
  benchLight.position.set(HOME.x, HOME.y + 2.0, HOME.z + 8.9);
  scene.add(benchLight);

  let sky = Object.assign({}, SKIES.dawn), skyTo = SKIES.dawn, skyRate = 0.4;
  /* exposure, bloom and the eyes pass while the prologue has the frame */
  const look = { exposure: () => sky.exp, bloom: 0.42, threshold: 0.82, sat: 1, vig: 0.38 };
  function applySky() {
    skyMat.uniforms.uTop.value.set(sky.top); skyMat.uniforms.uHor.value.set(sky.hor); skyMat.uniforms.uSun.value.set(sky.sun);
    const dir = V(Math.sin(sky.az), sky.elev, -Math.cos(sky.az)).normalize();
    skyMat.uniforms.uDir.value.copy(dir);
    skyMat.uniforms.uStars.value = smooth(0.02, -0.08, sky.elev);
    sun.position.copy(dir).multiplyScalar(200).add(V(0, 20, 0));
    sun.color.set(sky.sun); sun.intensity = sky.sunI;
    hemi.color.set(sky.hemiS); hemi.groundColor.set(sky.hemiG); hemi.intensity = sky.hemiI;
    scene.fog.color.set(sky.fog); scene.fog.density = sky.dens;
  }
  const ca = new THREE.Color(), cb = new THREE.Color();
  function mixSky(dt) {
    const k = 1 - Math.pow(0.01, dt * skyRate);
    for (const key in skyTo) {
      if (typeof skyTo[key] === 'number' && ['top', 'hor', 'sun', 'fog', 'hemiS', 'hemiG'].includes(key)) {
        ca.set(sky[key]); cb.set(skyTo[key]); ca.lerp(cb, k); sky[key] = ca.getHex();
      } else sky[key] = lerp(sky[key], skyTo[key], k);
    }
  }

  /* ---------------- the four shots ---------------- */
  let shot = -1, st = 0, walkU = 0;
  const camPos = V(0, 0, 0), camLook = V(0, 0, 0);
  const SHOTS = [
    /* the village from the hill, the camera drifting in */
    { sky: 'dawn', cam: u => [V(lerp(18, 13, u), 22 - 3 * u, lerp(78, 64, u)), V(0, 3, -8)] },
    /* the man at his door, looking up the road toward the city */
    { sky: 'dawn', cam: u => { const m = man.root.position; return [V(m.x + 2.3 - u * 0.5, m.y + 1.8, m.z - 3.5 + u * 0.4), V(m.x - 1.0, m.y + 1.2, m.z + 7)]; } },
    /* the bench: looking down at what he takes */
    { sky: 'day', cam: u => { const b = bench.position; return [V(b.x - 0.35 + u * 0.15, b.y + 1.45 - u * 0.12, b.z + 1.25), V(b.x + 0.05, b.y + 0.64, b.z)]; } },
    /* the road: behind him, then letting him walk on into the dark */
    { sky: 'dusk', cam: () => { const q = onRoad(Math.max(walkU - 0.014, 0)); const ahead = onRoad(Math.min(walkU + 0.03, 1)); return [V(q.x + 1.1, q.y + 1.85, q.z), V(ahead.x, ahead.y + 1.1, ahead.z)]; } },
  ];

  function show(n) {
    shot = n; st = 0;
    skyTo = SKIES[SHOTS[n].sky]; skyRate = n === 3 ? 0.18 : 0.6;
    man.stick.visible = n === 3;
    if (n === 0) { sky = Object.assign({}, SKIES.dawn); for (const k in items) items[k].visible = false; memory = 0; look.sat = 1; look.vig = 0.38; }
    if (n === 1) {
      man.root.position.set(HOME.x - 3.2, HOME.y, HOME.z + 2.6);
      man.root.rotation.y = -0.22; /* up the road, toward the city */
      doorLight.position.set(HOME.x - 1.3, HOME.y + 1.2, HOME.z - 0.4); doorLight.intensity = 6;
    }
    if (n === 2) { doorLight.intensity = 0; benchLight.intensity = 7; } else benchLight.intensity = 0;
    if (n === 3) { walkU = 0.075; for (const k in items) items[k].visible = false; }
    const [p, l] = SHOTS[n].cam(0); camPos.copy(p); camLook.copy(l);
  }
  /* "Remember home": the opening shot again, a little more lost each time -
     fewer lit windows, thinner smoke, colour draining, haze closing in */
  let memory = 0;
  function remember(k) {
    show(0);
    memory = k;
    sky = Object.assign({}, SKIES.dawn, { dens: SKIES.dawn.dens * (1 + k * 1.6) });
    skyTo = Object.assign({}, SKIES.dawn, { dens: SKIES.dawn.dens * (1 + k * 1.6) });
    look.sat = 1 - k * 0.32; look.vig = 0.4 + k * 0.18;
  }
  function placeItem(id) { if (items[id]) items[id].visible = true; }
  /* night falls during the last card: "and then, in the dark, you see it" */
  function nightfall() { skyTo = SKIES.night; skyRate = 0.35; }

  function update(dt, t) {
    st += dt;
    mixSky(dt); applySky();
    if (shot >= 0) {
      const u = Math.min(1, st / 16);
      if (shot === 3) {
        walkU = Math.min(0.95, walkU + dt * 0.0042);
        const p = onRoad(walkU), q = onRoad(walkU + 0.004);
        man.root.position.copy(p);
        man.root.rotation.y = Math.atan2(q.x - p.x, q.z - p.z);
        sun.target.position.copy(p); sun.position.add(p);
      }
      const [p, l] = SHOTS[shot].cam(u);
      const k = 1 - Math.pow(0.02, dt);
      camPos.lerp(p, k); camLook.lerp(l, k);
      camera.position.copy(camPos);
      camera.lookAt(camLook);
    }
    man.pose(t, shot === 3 ? 1 : 0);
    /* the man is only in the shots that are about him */
    man.root.visible = shot === 1 || shot === 3;
    /* smoke rises and leans with the wind */
    for (const s of smoke) {
      const a = (t * 0.07 + s.ph + s.k * 0.13) % 1;
      s.s.position.set(s.base.x + a * 3.2 + Math.sin(t + s.ph * 9) * 0.3, s.base.y + a * 7, s.base.z - a * 1.2);
      s.s.scale.setScalar(0.35 + a * 2.2);
      s.s.material.opacity = Math.pow(Math.sin(a * Math.PI), 1.5) * 0.16 * (1 - memory * 0.3);
    }
    for (const b of birds) {
      const a = t * 0.08 + b.ph;
      b.b.position.set(Math.cos(a) * b.r - 10, 34 + Math.sin(a * 1.7) * 4, Math.sin(a) * b.r * 0.6 - 20);
      b.b.rotation.y = -a;
      b.b.scale.set(1.2, 1 + Math.sin(t * 9 + b.ph * 5) * 0.8, 1.2);
    }
    WINDOW.emissiveIntensity = (shot === 2 ? 0.6 : 2.2 * (1 + 0.04 * Math.sin(t * 7))) * (1 - memory * 0.33);
  }

  applySky();
  /* exposure and bloom the stage should use while the prologue has the frame */
  return { scene, camera, update, show, placeItem, nightfall, remember, look };
}
