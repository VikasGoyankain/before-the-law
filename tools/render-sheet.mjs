import fs from 'fs';
import sharp from 'sharp';

const BG = '#0a0908', INK = '#cdc3b2', DIM = '#6b6459', RAD = '#ffc46b';
const read = n => fs.readFileSync(`../assets/svg/${n}.svg`, 'utf8')
  .replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const place = (n, x, y, s = 1, color = INK) =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="${color}">${read(n).replace(/currentColor/g, color)}</g>`;
const label = (t, x, y) =>
  `<text x="${x}" y="${y}" fill="${DIM}" font-family="system-ui,sans-serif" font-size="13" letter-spacing="1.6" text-anchor="middle">${t.toUpperCase()}</text>`;

const W = 1080, H = 800;
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${BG}"/>
${place('man-arrival', 60, 30)}  ${label('man / arrival', 120, 265)}
${place('man-waiting', 250, 30)} ${label('man / waiting', 310, 265)}
${place('man-aged',    440, 30)} ${label('man / aged',    500, 265)}
${place('doorkeeper',  630, 30)} ${label('doorkeeper',    690, 265)}
${place('gate-arch',   40, 310)}  ${label('gate / arch',   140, 580)}
${place('gate-open',   270, 310)} ${label('gate / open',   370, 580)}
${place('gate-closed', 500, 310)} ${label('gate / closed', 600, 580)}
${place('village',     790, 400)} ${label('village',       910, 580)}
<!-- composed scale relationship -->
${place('gate-arch',   60, 620, 0.62)} ${place('doorkeeper', 118, 706, 0.42)} ${place('man-arrival', 196, 716, 0.36)}
${label('scale / arrival', 175, 790)}
${place('gate-arch',   330, 620, 0.62, RAD)} ${place('doorkeeper', 388, 706, 0.42)} ${place('man-waiting', 452, 716, 0.36)}
${label('scale / waiting', 445, 790)}
${place('gate-closed', 600, 620, 0.62)} ${place('man-aged', 700, 716, 0.36)}
${label('scale / closed', 700, 790)}
</svg>`;
fs.writeFileSync('sheet.svg', sheet);
await sharp(Buffer.from(sheet)).png().toFile('sheet.png');
console.log('rendered tools/sheet.png');
