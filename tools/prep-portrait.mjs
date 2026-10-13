/* Crops and shrinks a portrait into assets/professor.jpg, which hub.mjs inlines
   into the medallion on the hub page.
   Usage: node prep-portrait.mjs <image> [x0 y0 size]
   x0, y0 and size are fractions of the image's width: the top-left corner and
   side of the square to keep (default: the whole image, 0 0 1). */
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [src, x0 = '0', y0 = '0', size = '1'] = process.argv.slice(2);
if (!src) { console.error('usage: node prep-portrait.mjs <image> [x0 y0 size]'); process.exit(1); }
const OUT = 640;
const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[path.extname(src).toLowerCase()];
if (!mime) { console.error('unsupported image type: ' + src); process.exit(1); }
const data = 'data:' + mime + ';base64,' + fs.readFileSync(src).toString('base64');

const b = await puppeteer.launch({ headless: true });
const page = await b.newPage();
const jpg = await page.evaluate(async (data, x0, y0, size, OUT) => {
  const img = new Image();
  img.src = data;
  await img.decode();
  const s = size * img.naturalWidth;
  const c = document.createElement('canvas');
  c.width = c.height = OUT;
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, x0 * img.naturalWidth, y0 * img.naturalWidth, s, s, 0, 0, OUT, OUT);
  return c.toDataURL('image/jpeg', 0.9);
}, data, +x0, +y0, +size, OUT);
await b.close();

const out = path.join(here, '../assets/professor.jpg');
fs.writeFileSync(out, Buffer.from(jpg.split(',')[1], 'base64'));
console.log('assets/professor.jpg', OUT + 'x' + OUT, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
