/* The sculpted figures (assets/models/im, reduced by tools/prep-models.mjs im
   and baked into models.gen.js), turned into geometry the crowd can use.
   Any kind that has no sculpt keeps its hand-built figure from kit.js, so the
   game never depends on them.

   The sculpts arrive with no materials the game uses: they are coloured
   here by height - the head and neck in skin, everything below it in the
   per-person tint - which is enough for a crowd seen in lamplight. */
import * as THREE from 'three';

const HEIGHT = { commoner: 1.72, woman: 1.64, official: 1.74, child: 1.12, prince: 1.82, messenger: 1.78, villager: 1.7, emperor: 1.7 };
/* sculpt file name -> crowd kind */
const KIND = { servant: 'commoner', townswoman: 'woman', official: 'official', child: 'child', prince: 'prince', messenger: 'messenger', villager: 'villager', emperor: 'emperor' };

function decode(b64, Type) {
  const bin = atob(b64), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Type(u8.buffer);
}

export function modelGeometries(MODELS) {
  const out = {};
  for (const [file, m] of Object.entries(MODELS || {})) {
    const kind = KIND[file];
    if (!kind || !m.pos) continue;
    const pos = decode(m.pos, Float32Array), idx = decode(m.idx, m.wide ? Uint32Array : Uint16Array);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingBox();
    const b = g.boundingBox, h = b.max.y - b.min.y, s = HEIGHT[kind] / h;
    g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
    g.scale(s, s, s);
    g.computeVertexNormals();
    const n = pos.length / 3, col = new Float32Array(n * 3), mask = new Float32Array(n), H = HEIGHT[kind];
    const skin = new THREE.Color(0xb08a6c), cloth = new THREE.Color(0xffffff);
    const p = g.attributes.position;
    /* painted sculpts keep their own colours (baked as sRGB bytes) and take no tint */
    if (m.col) {
      const c8 = decode(m.col, Uint8Array), c = new THREE.Color();
      for (let i = 0; i < n; i++) { c.setRGB(c8[i * 3] / 255, c8[i * 3 + 1] / 255, c8[i * 3 + 2] / 255, THREE.SRGBColorSpace); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    } else for (let i = 0; i < n; i++) {
      const head = p.getY(i) > H * 0.86;
      const c = head ? skin : cloth;
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      mask[i] = head ? 0 : 1;
    }
    g.userData.painted = !!m.col;
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('tintMask', new THREE.BufferAttribute(mask, 1));
    out[kind] = g;
  }
  return out;
}
