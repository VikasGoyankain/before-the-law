/* Builds dist/, the published site and the hand-in folder in one.
   GitHub Pages serves it as it is, and zipping it gives the version to email
   or carry on a USB stick. That works because each game page has every asset
   inlined, so there are no paths to break.

   What it adds to the built pages on the way:
     - each page's title, description, canonical address, share-preview tags,
       icon and structured data (tools/site.mjs);
     - classroom-board mode for the two hand-written text-only pages
       (tools/board.mjs; the other pages are built with it);
     - README.md, llms.txt, robots.txt, sitemap.xml and 404.html (tools/docs.mjs).
   Usage: node package.mjs */
import fs from 'fs';
import path from 'path';
import { withHead } from './site.mjs';
import { withBoard } from './board.mjs';
import { README, LLMS, ROBOTS, NOT_FOUND, sitemap } from './docs.mjs';

const DIST = '../dist';
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const sizes = {};
const put = (name, data) => {
  fs.writeFileSync(path.join(DIST, name), data);
  sizes[name] = fs.statSync(path.join(DIST, name)).size;
};
const copy = (from, name) => put(name, fs.readFileSync(from));

/* the site's own pages, built here with their head tags already in place */
const { HUB } = await import('./hub.mjs');
const { TEACHERS } = await import('./teachers.mjs');
put('index.html', HUB);
put('for-teachers.html', TEACHERS);

/* the games: two built 3D pages, and the two hand-written text-only pages */
const game = (from, name, text) => {
  let html = withHead(fs.readFileSync(from, 'utf8'), name);
  if (text) html = withBoard(html);
  put(name, html);
};
game('../before-the-law-3d.html', 'before-the-law.html');
game('../before-the-law.html', 'before-the-law-text.html', true);
game('../imperial-message-3d.html', 'imperial-message.html');
game('../imperial-message.html', 'imperial-message-text.html', true);

/* share-preview pictures and icon files, made by make-social.mjs */
const SOCIAL = '../assets/social';
for (const f of ['og-image.jpg', 'og-before-the-law.jpg', 'og-imperial-message.jpg', 'favicon.png', 'apple-touch-icon.png']) {
  if (!fs.existsSync(path.join(SOCIAL, f))) throw new Error('missing ' + SOCIAL + '/' + f + ': run node make-social.mjs first');
  copy(path.join(SOCIAL, f), f);
}

copy('../assets/LICENSES.md', 'LICENSES.md');
put('llms.txt', LLMS);
put('robots.txt', ROBOTS);
put('sitemap.xml', sitemap());
put('404.html', NOT_FOUND);
put('.nojekyll', '');
put('README.md', README(sizes));

const total = Object.values(sizes).reduce((a, b) => a + b, 0);
console.log('dist/');
for (const [f, s] of Object.entries(sizes)) {
  console.log('  ' + f.padEnd(28) + (s / 1024).toFixed(0).padStart(6) + ' KB');
}
console.log('  ' + '-'.repeat(34));
console.log('  ' + 'total'.padEnd(28) + (total / 1048576).toFixed(2).padStart(6) + ' MB');
