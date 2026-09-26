import fs from 'fs';
import { cut, manArrival, manWaiting, manAged, doorkeeper } from './figures.mjs';
const OUT = '../assets/svg';
fs.mkdirSync(OUT, { recursive: true });

const svg = (name, vb, label, body) => {
  const [,,w,h] = vb.split(' ');
  fs.writeFileSync(`${OUT}/${name}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}" fill="currentColor" role="img" aria-label="${label}">\n${body.trim()}\n</svg>\n`);
};

/* ---------- THE GATE ---------- */
const arch = `M12 232 L12 100 A88 88 0 0 1 188 100 L188 232 L152 232 L152 100 A52 52 0 0 0 48 100 L48 232 Z`;
const voidPath = `M48 232 L48 100 A52 52 0 0 1 152 100 L152 232 Z`;
const stone = `<path d="${arch}"/><rect x="2" y="224" width="196" height="11"/>`;

const bars = (x0, x1, n, y0, y1, w = 2.6) => {
  let s = '';
  for (let i = 0; i < n; i++)
    s += `<rect x="${(x0 + (x1 - x0) * (i / (n - 1)) - w / 2).toFixed(2)}" y="${y0}" width="${w}" height="${y1 - y0}"/>`;
  return s;
};
/* leaves folded flat against the inner faces of the piers */
const leaf = x0 => `${bars(x0, x0 + 9, 3, 104, 226, 2.2)}
  <rect x="${x0 - 1.5}" y="104" width="12" height="2.2"/><rect x="${x0 - 1.5}" y="165" width="12" height="2.2"/><rect x="${x0 - 1.5}" y="223.8" width="12" height="2.2"/>`;

svg('gate-open',  '0 0 200 240', 'The gate, standing open',
  `<g class="gate-void" fill="none"><path d="${voidPath}"/></g>${stone}<g class="gate-leaves">${leaf(50)}${leaf(141)}</g>`);
svg('gate-arch',  '0 0 200 240', 'The gateway, bare',
  `<g class="gate-void" fill="none"><path d="${voidPath}"/></g>${stone}`);
svg('gate-closed','0 0 200 240', 'The gate, closed',
  `${stone}<g class="gate-leaves">${bars(56, 144, 11, 104, 228)}
   <rect x="49" y="104" width="102" height="3.2"/><rect x="49" y="162" width="102" height="3.2"/><rect x="49" y="224.8" width="102" height="3.2"/></g>`);

/* ---------- THE VILLAGE HE CAME FROM ---------- */
const house = (x, y, w, h, roof) =>
  `<path d="M${x} ${y} L${x} ${y - h} L${x + w / 2} ${y - h - roof} L${x + w} ${y - h} L${x + w} ${y} Z"/>`;
svg('village', '0 0 240 100', 'The village he travelled from', `<g>
  ${house(18, 88, 22, 12, 8)}${house(44, 88, 17, 9, 6)}${house(66, 88, 26, 15, 10)}
  <path d="M99 88 L99 46 L105 30 L111 46 L111 88 Z"/>
  <rect x="104.1" y="22" width="1.8" height="9"/><rect x="101.5" y="24.6" width="7" height="1.8"/>
  ${house(116, 88, 20, 11, 7)}${house(140, 88, 28, 14, 9)}${house(172, 88, 16, 8, 6)}${house(192, 88, 24, 12, 8)}
  <rect x="0" y="88" width="240" height="2.4"/></g>`);

svg('man-arrival', '0 0 120 200', 'The man from the country, newly arrived', manArrival);
svg('man-waiting', '0 0 120 200', 'The man seated at the side of the gate',   manWaiting);
svg('man-aged',    '0 0 120 200', 'The man grown small in his old age',       manAged);
svg('doorkeeper',  '0 0 120 200', 'The doorkeeper before the law',            doorkeeper);

console.log('wrote', fs.readdirSync(OUT).length, 'svg files');

/* ---------- COMPOSED SCENE (canonical scale relationships) ---------- */
const inner = n => fs.readFileSync(`${OUT}/${n}.svg`, 'utf8')
  .replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  .replace(/id="([^"]+)"/g, 'id="sc-$1"').replace(/url\(#([^)]+)\)/g, 'url(#sc-$1)');
const at = (n, x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${inner(n)}</g>`;

svg('scene', '0 0 800 500', 'The man, the doorkeeper, and the gate', `
<g class="scene-far" opacity="0.45">${at('village', 20, 411, 0.5)}</g>
${at('gate-arch', 245, 106, 1.55)}
${at('doorkeeper', 343, 293, 0.95)}
${at('man-arrival', 514, 310, 0.85)}
<rect x="0" y="468" width="800" height="2.6"/>`);
console.log('wrote scene.svg');
