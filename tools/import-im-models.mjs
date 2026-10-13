/* Collects the sculpts for "An Imperial Message" from wherever they were
   downloaded (assets/models: Meshy and Tripo exports, GLB or zipped FBX) and
   writes one clean file per character to assets/models/im/<name>.glb, ready
   for prep-models.mjs im.

   Painted models have their colour texture baked into vertex colours here,
   because the game ships geometry only (no textures to fetch over file://).
   Plain sculpts are copied as they are; the game colours those itself.
   Usage: node import-im-models.mjs */
globalThis.self = globalThis;
globalThis.window = globalThis;
globalThis.document = { createElementNS: () => ({ addEventListener() {}, removeEventListener() {}, style: {}, setAttribute() {} }) };
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import sharp from 'sharp';
import { NodeIO, Document } from '@gltf-transform/core';

const SRC = '../assets/models', OUT = '../assets/models/im', TMP = '../assets/_source/im-models';
/* what each download is, by a piece of its file name */
const NAMES = [
  [/ordinary_wo|townswoman/i, 'townswoman'], [/palace_offi|official/i, 'official'], [/solemn_grea|prince/i, 'prince'],
  [/servant|working_man/i, 'servant'], [/child/i, 'child'], [/courier|messenger/i, 'messenger'],
  [/villager/i, 'villager'], [/emperor/i, 'emperor'], [/deathbed/i, 'deathbed'], [/bell/i, 'bell'],
];
const nameOf = f => (NAMES.find(([re]) => re.test(f)) || [])[1];
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });
const io = new NodeIO();

/* sample an image at each (u, v): RGB floats 0..1, sRGB as painted */
async function bake(imageBytes, uv, flipV) {
  const { data, info } = await sharp(Buffer.from(imageBytes)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const n = uv.length / 2, out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    let u = uv[i * 2] % 1, v = uv[i * 2 + 1] % 1;
    if (u < 0) u += 1; if (v < 0) v += 1;
    if (flipV) v = 1 - v;
    const x = Math.min(info.width - 1, Math.floor(u * info.width)), y = Math.min(info.height - 1, Math.floor(v * info.height));
    const k = (y * info.width + x) * 3;
    out[i * 3] = data[k] / 255; out[i * 3 + 1] = data[k + 1] / 255; out[i * 3 + 2] = data[k + 2] / 255;
  }
  return out;
}

async function write(name, pos, col, idx) {
  const doc = new Document(), buf = doc.createBuffer();
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(pos).setBuffer(buf));
  if (col) prim.setAttribute('COLOR_0', doc.createAccessor().setType('VEC3').setArray(col).setBuffer(buf));
  if (idx) prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(idx).setBuffer(buf));
  doc.createScene().addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)));
  await io.write(path.join(OUT, name + '.glb'), doc);
  console.log(name.padEnd(11) + (col ? 'painted ' : 'plain   ') + String(Math.round((idx ? idx.length : pos.length / 3) / 3)).padStart(8) + ' tris');
}

async function fromGLB(file, name) {
  const doc = await io.read(file);
  const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
  const node = doc.getRoot().listNodes().find(n => n.getMesh());
  const pos = new Float32Array(prim.getAttribute('POSITION').getArray());
  /* apply the node's own transform, if it has one */
  const m = node.getWorldMatrix();
  for (let i = 0; i < pos.length; i += 3) {
    const [x, y, z] = [pos[i], pos[i + 1], pos[i + 2]];
    pos[i] = m[0] * x + m[4] * y + m[8] * z + m[12];
    pos[i + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    pos[i + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
  }
  const tex = prim.getMaterial() && prim.getMaterial().getBaseColorTexture();
  const uv = prim.getAttribute('TEXCOORD_0');
  const col = tex && uv ? await bake(tex.getImage(), uv.getArray(), false) : null;
  const idx = prim.getIndices() ? new Uint32Array(prim.getIndices().getArray()) : null;
  await write(name, pos, col, idx);
}

async function fromFBX(file, name) {
  const THREE = await import('three');
  const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
  const b = fs.readFileSync(file);
  const warn = console.warn; console.warn = () => {};
  const group = new FBXLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), path.dirname(file) + '/');
  console.warn = warn;
  group.updateMatrixWorld(true);
  let mesh = null;
  group.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
  const g = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
  const pos = new Float32Array(g.attributes.position.array);
  const fbm = fs.readdirSync(path.dirname(file), { withFileTypes: true }).find(d => d.isDirectory() && d.name.endsWith('.fbm'));
  let col = null;
  if (fbm && g.attributes.uv) {
    const img = fs.readdirSync(path.join(path.dirname(file), fbm.name)).find(f => /basecolor|diffuse|albedo/i.test(f));
    /* three's FBX loader gives UVs with v up; image rows run down */
    if (img) col = await bake(fs.readFileSync(path.join(path.dirname(file), fbm.name, img)), g.attributes.uv.array, true);
  }
  await write(name, pos, col, g.index ? new Uint32Array(g.index.array) : null);
}

function unzip(zip, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  try { execSync(`unzip -o -q "${zip}" -d "${dest}"`); }
  catch (e) { execSync(`powershell -NoProfile -Command "Expand-Archive -Force -LiteralPath '${path.resolve(zip)}' -DestinationPath '${path.resolve(dest)}'"`); }
}

/* a GLB beats a zip of the same character */
const done = new Set();
const files = fs.readdirSync(SRC).filter(f => /\.(glb|zip)$/i.test(f)).sort((a, b) => (a.endsWith('.zip') ? 1 : 0) - (b.endsWith('.zip') ? 1 : 0));
for (const f of files) {
  const name = nameOf(f);
  if (!name) continue;
  if (done.has(name)) { console.log(name.padEnd(11) + 'already imported from another file, skipping ' + f); continue; }
  const full = path.join(SRC, f);
  if (f.toLowerCase().endsWith('.glb')) await fromGLB(full, name);
  else {
    const dest = path.join(TMP, name);
    unzip(full, dest);
    const inner = fs.readdirSync(dest).find(x => /\.glb$/i.test(x)) || fs.readdirSync(dest).find(x => /\.fbx$/i.test(x));
    if (!inner) { console.log('nothing usable in ' + f); continue; }
    if (/\.glb$/i.test(inner)) await fromGLB(path.join(dest, inner), name); else await fromFBX(path.join(dest, inner), name);
  }
  done.add(name);
}
const want = ['servant', 'townswoman', 'official', 'prince', 'child', 'messenger', 'villager', 'emperor'];
const missing = want.filter(n => !done.has(n));
console.log(missing.length ? 'still hand-built: ' + missing.join(', ') : 'every character has a sculpt');
