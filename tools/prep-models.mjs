/* Prepares the generated character sculpts (assets/models/*.glb).
   For each one it writes:
     assets/models/for-mixamo/<name>.obj  - welded and reduced, for Mixamo's auto-rigger
     assets/models/game/<name>.glb        - reduced much further, for the game
   Mixamo takes OBJ but not GLB; the game wants as few triangles as it can get
   away with on a school laptop.   Usage: node prep-models.mjs [im]

   With 'im' it prepares An Imperial Message's sculpts instead
   (assets/models/im/<name>.glb -> assets/models/im/game/<name>.glb). No
   Mixamo there: the crowd is drawn as thousands of instances, so the crowd
   figures are cut down hardest of all. */
import fs from 'fs';
import path from 'path';
import { NodeIO } from '@gltf-transform/core';
import { weld, simplify, dedup, prune } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

const DIR = '../assets/models';
/* target triangle counts */
const RIG = { keeper: 45000, man: 35000 };
const GAME = { keeper: 24000, man: 14000 };
const kind = f => /warlord|keeper/i.test(f) ? 'keeper' : 'man';

const io = new NodeIO();
await MeshoptSimplifier.ready;
fs.mkdirSync(DIR + '/for-mixamo', { recursive: true });
fs.mkdirSync(DIR + '/game', { recursive: true });

function tris(doc) {
  let n = 0;
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) {
    const i = p.getIndices(); n += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3;
  }
  return Math.round(n);
}
async function reduced(file, target) {
  const doc = await io.read(path.join(DIR, file));
  await doc.transform(weld(), dedup());
  const before = tris(doc);
  const ratio = Math.min(1, target / before);
  await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.002, lockBorder: false }), prune());
  return { doc, before, after: tris(doc) };
}

function toOBJ(doc) {
  const out = ['# prepared by tools/prep-models.mjs for Mixamo auto-rigging'];
  let base = 1;
  for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) {
    const P = p.getAttribute('POSITION'), N = p.getAttribute('NORMAL'), I = p.getIndices();
    const v = [0, 0, 0];
    for (let i = 0; i < P.getCount(); i++) { P.getElement(i, v); out.push(`v ${v[0].toFixed(5)} ${v[1].toFixed(5)} ${v[2].toFixed(5)}`); }
    if (N) for (let i = 0; i < N.getCount(); i++) { N.getElement(i, v); out.push(`vn ${v[0].toFixed(4)} ${v[1].toFixed(4)} ${v[2].toFixed(4)}`); }
    const n = I ? I.getCount() : P.getCount();
    for (let i = 0; i < n; i += 3) {
      const a = (I ? I.getScalar(i) : i) + base, b = (I ? I.getScalar(i + 1) : i + 1) + base, c = (I ? I.getScalar(i + 2) : i + 2) + base;
      out.push(N ? `f ${a}//${a} ${b}//${b} ${c}//${c}` : `f ${a} ${b} ${c}`);
    }
    base += P.getCount();
  }
  return out.join('\n') + '\n';
}

if (process.argv.includes('im')) {
  const IMDIR = DIR + '/im';
  const TARGET = { servant: 1800, townswoman: 1800, official: 1800, child: 1400, prince: 1400, messenger: 6000, emperor: 16000, villager: 5000, deathbed: 4000, bell: 3000, window: 3000 };
  fs.mkdirSync(IMDIR + '/game', { recursive: true });
  for (const f of fs.readdirSync(IMDIR).filter(f => f.endsWith('.glb'))) {
    const name = f.replace('.glb', '').toLowerCase();
    if (!TARGET[name]) { console.log('skipping ' + f + ' (not a name the game knows; see docs/meshy-prompts.md)'); continue; }
    const doc = await io.read(path.join(IMDIR, f));
    const meshes = doc.getRoot().listMeshes();
    if (meshes.length > 1 || meshes[0].listPrimitives().length > 1) console.log('  note: ' + f + ' has several parts; only the first is used');
    await doc.transform(weld(), dedup());
    const before = tris(doc);
    await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: Math.min(1, TARGET[name] / before), error: 0.01, lockBorder: false }), prune());
    await io.write(IMDIR + '/game/' + name + '.glb', doc);
    console.log(name.padEnd(11) + String(before).padStart(8) + ' tris -> ' + String(tris(doc)).padStart(6) + '  (' + (fs.statSync(IMDIR + '/game/' + name + '.glb').size / 1024).toFixed(0) + ' KB)');
  }
  process.exit(0);
}

for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.glb'))) {
  const k = kind(f), name = k === 'keeper' ? 'doorkeeper' : 'man';
  const rig = await reduced(f, RIG[k]);
  fs.writeFileSync(`${DIR}/for-mixamo/${name}.obj`, toOBJ(rig.doc));
  const game = await reduced(f, GAME[k]);
  await io.write(`${DIR}/game/${name}.glb`, game.doc);
  const kb = p => (fs.statSync(p).size / 1024).toFixed(0) + ' KB';
  console.log(`${name.padEnd(11)} ${String(rig.before).padStart(7)} tris -> mixamo ${String(rig.after).padStart(6)} (${kb(`${DIR}/for-mixamo/${name}.obj`)}), game ${String(game.after).padStart(6)} (${kb(`${DIR}/game/${name}.glb`)})`);
}
