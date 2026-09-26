import fs from 'fs'; import path from 'path'; import { execSync } from 'child_process';
import sharp from 'sharp';

const SRC = '../assets/_source/textures', OUT = '../assets/textures';
const TMP = process.env.TMPDIR || '.tmp-tex';
fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });

/* Only the maps a WebGL material actually samples. AO folds into the colour map
   at this scale, and displacement needs geometry we are not going to subdivide. */
const JOBS = [
  { zip: 'Ground108_8K-JPG.zip',  slug: 'ground-stone', maps: ['Color','NormalGL','Roughness'] },
  { zip: 'Metal055C_8K-JPG.zip',  slug: 'iron',         maps: ['Color','NormalGL','Roughness','Metalness'] },
];
const SIZES = [1024, 2048];
const kb = b => (b / 1024).toFixed(0) + ' KB';

let before = 0, after = 0;
for (const job of JOBS) {
  const base = job.zip.replace('.zip','');
  for (const map of job.maps) {
    const member = `${base}_${map}.jpg`;
    execSync(`unzip -o -j "${SRC}/${job.zip}" "${member}" -d "${TMP}"`, { stdio: 'ignore' });
    const src = path.join(TMP, member);
    before += fs.statSync(src).size;
    const meta = await sharp(src).metadata();
    for (const size of SIZES) {
      const dest = `${OUT}/${job.slug}_${map.toLowerCase()}_${size}.webp`;
      /* normal/roughness/metalness are data, not pictures - lossy artefacts show up
         as shading noise, so they get a much higher quality floor than albedo */
      const q = map === 'Color' ? 82 : 94;
      await sharp(src).resize(size, size, { fit: 'fill' }).webp({ quality: q, effort: 5 }).toFile(dest);
      const s = fs.statSync(dest).size; if (size === 1024) after += s;
      console.log(`${job.slug}/${map.padEnd(10)} ${meta.width}x${meta.height} -> ${size}px  ${kb(s)}`);
    }
    fs.unlinkSync(src);
  }
}
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\nsource maps : ${(before/1048576).toFixed(0)} MB`);
console.log(`1K web set  : ${(after/1024).toFixed(0)} KB`);
console.log(`reduction   : ${(before/after).toFixed(0)}x`);
