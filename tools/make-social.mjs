/* Renders the pictures the published site needs, into assets/social/:
     og-image.jpg, og-before-the-law.jpg, og-imperial-message.jpg
       the 1200x630 cards shown when a link is shared
     favicon.png (96), apple-touch-icon.png (180)
       the tab icon as files, for search engines and phones
   package.mjs copies them into dist/. Rerun after changing the portrait or the
   wording below.   Usage: node make-social.mjs */
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ICON_SVG, TAGLINE, PROFESSOR } from './site.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '../assets/social');
fs.mkdirSync(out, { recursive: true });
const photo = path.join(here, '../assets/professor.jpg');
const PHOTO = fs.existsSync(photo) ? 'data:image/jpeg;base64,' + fs.readFileSync(photo).toString('base64') : '';

const GATE = `<svg viewBox="0 0 300 150"><defs><radialGradient id="g" cx="50%" cy="60%" r="50%"><stop offset="0" stop-color="#ffd27a" stop-opacity=".9"/><stop offset=".5" stop-color="#ffb050" stop-opacity=".25"/><stop offset="1" stop-color="#ffb050" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="150" cy="96" rx="96" ry="64" fill="url(#g)"/>
  <path d="M118 140V70a32 32 0 0 1 64 0v70" fill="none" stroke="#c8a060" stroke-width="3"/>
  <path d="M126 140V74a24 24 0 0 1 48 0v66z" fill="#ffd690" opacity=".6"/>
  <rect x="190" y="88" width="10" height="52" fill="#3a332c"/><circle cx="195" cy="82" r="7" fill="#3a332c"/>
  <rect x="84" y="112" width="8" height="28" fill="#2a2520"/><circle cx="88" cy="107" r="5" fill="#2a2520"/>
  <line x1="20" y1="140" x2="280" y2="140" stroke="#3a332c"/></svg>`;
const RINGS = `<svg viewBox="0 0 300 150"><g fill="none" stroke="#c8a060" stroke-opacity=".6">
  <circle cx="110" cy="75" r="8"/><circle cx="110" cy="75" r="15"/><circle cx="110" cy="75" r="25"/>
  <circle cx="110" cy="75" r="38" stroke-opacity=".45"/><circle cx="110" cy="75" r="55" stroke-opacity=".32"/><circle cx="110" cy="75" r="78" stroke-opacity=".22"/><circle cx="110" cy="75" r="108" stroke-opacity=".14"/></g>
  <line x1="118" y1="75" x2="270" y2="75" stroke="#9aa2b8" stroke-dasharray="3 4" stroke-opacity=".6"/>
  <circle cx="176" cy="75" r="3.4" fill="#ffd27a"/>
  <rect x="266" y="68" width="14" height="14" fill="#1a1e2c" stroke="#9aa2b8" stroke-opacity=".7"/><rect x="270" y="72" width="6" height="6" fill="#ffc070"/></svg>`;

const BASE = `*{box-sizing:border-box}html,body{margin:0}
body{width:1200px;height:630px;overflow:hidden;background:#0a090b;color:#d8cfbf;font-family:Georgia,"Palatino Linotype",serif;position:relative}
.glow{position:absolute;inset:0;background:radial-gradient(ellipse 70% 90% at var(--x,72%) 46%,rgba(232,189,106,.22),transparent 70%)}
.frame{position:absolute;inset:22px;border:1px solid rgba(232,189,106,.4)}
.k{font:600 19px/1 "Segoe UI",system-ui,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#e8bd6a}
h1{margin:0;font-weight:normal;color:#f1e7d3;line-height:1.06}
.gold{color:#e8bd6a}
.s{font-size:29px;line-height:1.4;color:#cfc5b4}
.f{font:500 19px/1.5 "Segoe UI",system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#9c917f}`;

const hub = `<style>${BASE}
.t{position:absolute;left:78px;top:96px;width:700px}
h1{font-size:74px;margin:34px 0 34px;white-space:nowrap}
.f{position:absolute;left:78px;bottom:66px;width:700px}
.m{position:absolute;right:84px;top:118px;width:340px;height:340px;border-radius:50%;border:2px solid rgba(232,189,106,.8);
 box-shadow:0 0 0 10px #0a090b,0 0 0 12px rgba(232,189,106,.35),0 0 120px rgba(255,210,122,.55);object-fit:cover;background:#1a140c}
.n{position:absolute;right:54px;top:492px;width:400px;text-align:center;font-size:25px;color:#f1e7d3}
.n small{display:block;margin-top:6px;font:500 16px/1.4 "Segoe UI",system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#e8bd6a}
</style><div class="glow"></div><div class="frame"></div>
<div class="t"><div class="k">Playable Readings</div><h1>Feel Kafka.<br><span class="gold">Don&#8217;t just read him.</span></h1>
<div class="s"><i>Before the Law</i> and <i>An Imperial Message</i>,<br>as games you can play in one class.</div></div>
<div class="f">Free &#183; offline &#183; for any classroom</div>
${PHOTO ? `<img class="m" src="${PHOTO}" alt=""><div class="n">${PROFESSOR}<small>Made in his honour</small></div>` : ''}`;

const gameCard = (art, title, line, mins) => `<style>${BASE}
body{--x:74%}
.t{position:absolute;left:78px;top:112px;width:620px}
h1{font-size:82px;margin:30px 0 28px}
.f{position:absolute;left:78px;bottom:66px}
.a{position:absolute;right:40px;top:120px;width:500px}.a svg{width:100%;height:auto;display:block}
</style><div class="glow"></div><div class="frame"></div>
<div class="t"><div class="k">Franz Kafka &#183; playable</div><h1>${title}</h1><div class="s">${line}</div></div>
<div class="f">Free &#183; offline &#183; about ${mins} minutes</div><div class="a">${art}</div>`;

const b = await puppeteer.launch({ headless: true });
const page = await b.newPage();
const shot = async (html, file, w, h, opts) => {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.setContent('<!doctype html><meta charset="utf-8">' + html, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(out, file), ...opts });
  console.log('assets/social/' + file.padEnd(26), (fs.statSync(path.join(out, file)).size / 1024).toFixed(0) + ' KB');
};
const jpg = { type: 'jpeg', quality: 88 };
await shot(hub, 'og-image.jpg', 1200, 630, jpg);
await shot(gameCard(GATE, 'Before<br>the Law', 'You are the man from the country.<br>The gate stands open. Every choice costs years.', 'fifteen'), 'og-before-the-law.jpg', 1200, 630, jpg);
await shot(gameCard(RINGS, 'An Imperial<br>Message', 'Carry a dying Emperor&#8217;s message through<br>a palace that never ends.', 'twelve'), 'og-imperial-message.jpg', 1200, 630, jpg);
const icon = s => `<style>html,body{margin:0;background:transparent}svg{display:block;width:${s}px;height:${s}px}</style>${ICON_SVG}`;
await shot(icon(96), 'favicon.png', 96, 96, { type: 'png', omitBackground: true });
await shot(icon(180), 'apple-touch-icon.png', 180, 180, { type: 'png' });
await b.close();
void TAGLINE;
