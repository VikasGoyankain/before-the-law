import fs from 'fs';
const SVG = '../assets/svg';
let uid = 0;
/* inlined copies collide on mask ids, so namespace every placement */
const inline = n => { const p = `f${uid++}-`;
  return fs.readFileSync(`${SVG}/${n}.svg`, 'utf8')
    .replace(/\swidth="\d+"\sheight="\d+"/, '')
    .replace(/id="([^"]+)"/g, `id="${p}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${p}$1)`); };

const tile = (n, note) => `<figure class="tile"><div class="art">${inline(n)}</div>
  <figcaption><b>${n}.svg</b><span>${note}</span></figcaption></figure>`;

const tex = [
  ['ground-stone','Color','Ground108 · albedo'], ['ground-stone','NormalGL','Ground108 · normal'],
  ['ground-stone','Roughness','Ground108 · roughness'], ['iron','Color','Metal055C · albedo'],
  ['iron','NormalGL','Metal055C · normal'], ['iron','Metalness','Metal055C · metalness'],
].map(([s,m,l]) => {
  const f = `textures/${s}_${m.toLowerCase()}_1024.webp`;
  const kb = (fs.statSync('../assets/' + f).size / 1024).toFixed(0);
  return `<figure class="tile"><div class="art tex"><img src="${f}" alt="${l}" loading="lazy"></div>
    <figcaption><b>${l}</b><span>1024px · ${kb} KB</span></figcaption></figure>`;
}).join('');

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark">
<title>Asset Sheet — Before the Law</title><style>
:root{--bg:#0a0908;--ink:#cdc3b2;--dim:#6b6459;--faint:#332f2a;--rad:#ffc46b;--tile:#100e0c}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);
 font:16px/1.7 Georgia,"Palatino Linotype",serif;padding:clamp(1.5rem,5vw,4rem)}
.wrap{max-width:1180px;margin:0 auto}
h1{font-size:1.6rem;font-weight:normal;margin:0 0 .3rem;letter-spacing:.01em}
.sub{color:var(--dim);font-size:.95rem;margin:0 0 3.5rem}
h2{font:600 .72rem/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;
 color:var(--dim);margin:3.5rem 0 1.25rem;padding-bottom:.7rem;border-bottom:1px solid var(--faint)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:1rem}
.tile{margin:0;background:var(--tile);border:1px solid var(--faint);border-radius:2px;overflow:hidden}
.art{display:grid;place-items:center;padding:1.6rem;min-height:230px}
.art svg{max-height:190px;width:auto;color:var(--ink)}
.art.tex{padding:0;min-height:0}.art.tex img{display:block;width:100%;aspect-ratio:1;object-fit:cover}
figcaption{border-top:1px solid var(--faint);padding:.6rem .8rem;display:flex;flex-direction:column;gap:.15rem}
figcaption b{font:600 .68rem/1.4 ui-sans-serif,system-ui,sans-serif;letter-spacing:.11em;
 text-transform:uppercase;font-weight:500;color:var(--ink)}
figcaption span{font-size:.78rem;color:var(--dim)}
.stage{position:relative;background:var(--tile);border:1px solid var(--faint);border-radius:2px;
 padding:2.5rem 1rem 1rem;overflow:hidden}
.stage svg{display:block;width:100%;height:auto;color:var(--ink);position:relative;z-index:1;
 transition:color 900ms ease}
.glow{position:absolute;left:50%;top:-8%;width:66%;height:88%;transform:translateX(-50%);z-index:0;
 background:radial-gradient(ellipse 48% 60% at 50% 0,rgba(255,196,107,.42),rgba(255,190,100,.11) 45%,transparent 72%);
 opacity:0;transition:opacity 900ms ease;pointer-events:none}
body.old .glow{opacity:1}body.old .stage svg{color:#8d8a84}
.ctl{position:absolute;top:.7rem;right:.8rem;z-index:2;background:none;border:1px solid var(--faint);
 color:var(--dim);font:.64rem/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;
 padding:.55rem .85rem;cursor:pointer;border-radius:2px}
.ctl:hover{color:var(--ink);border-color:var(--dim)}
.sw{display:flex;flex-wrap:wrap;gap:.8rem}
.sw div{flex:1 1 130px;border:1px solid var(--faint);border-radius:2px;padding:.7rem .8rem;
 font:.68rem/1.5 ui-monospace,monospace;color:var(--dim)}
.sw i{display:block;height:38px;margin:-.7rem -.8rem .6rem;border-bottom:1px solid var(--faint)}
p.note{color:var(--dim);font-size:.9rem;max-width:62ch}
code{font:.86em ui-monospace,monospace;color:var(--ink)}
</style></head><body><div class="wrap">
<h1>Asset sheet — <i>Before the Law</i></h1>
<p class="sub">Generated silhouettes and web-ready textures. All CC0 or original.</p>

<h2>The figures</h2>
<div class="grid">
${tile('man-arrival','Stage 1 · staff-free, bundle in hand')}
${tile('man-waiting','Stage 2 · seated, bundle set down')}
${tile('man-aged','Stage 3 · grown small')}
${tile('doorkeeper','Unchanging across all three stages')}
</div>
<p class="note">The man has three states, one per stage. The doorkeeper has one — he does not
change, which is the point. Every figure is a flat silhouette filled with <code>currentColor</code>,
so it inherits the stage palette without a second asset.</p>

<h2>The structures</h2>
<div class="grid">
${tile('gate-arch','Primary · bare opening')}
${tile('gate-open','Leaves folded to the piers')}
${tile('gate-closed','Final beat only')}
${tile('village','The country he came from')}
</div>

<h2>Composed scene — canonical scale</h2>
<div class="stage"><div class="glow"></div>
<button class="ctl" id="t" type="button">Stage 3</button>
${inline('scene')}</div>
<p class="note">The doorkeeper stands at roughly 60% of the opening height; the man is smaller
still and stands outside it. Toggle to stage 3 to check the assets survive the colour drain
and read against the radiance.</p>

<h2>Textures — 1K WebP</h2>
<div class="grid">${tex}</div>
<p class="note">Converted from 8K sources totalling 456 MB. The full 1K set is 1.9 MB — a 240×
reduction. Normal, roughness, and metalness are encoded at quality 94 rather than 82: they are
data, not pictures, and lossy artefacts in them show up as visible shading noise.</p>

<h2>Palette</h2>
<div class="sw">
<div><i style="background:#0a0908"></i>--bg #0a0908</div>
<div><i style="background:#cdc3b2"></i>--ink #cdc3b2</div>
<div><i style="background:#6b6459"></i>--dim #6b6459</div>
<div><i style="background:#332f2a"></i>--faint #332f2a</div>
<div><i style="background:#ffc46b"></i>--rad #ffc46b</div>
</div>
<p class="note">The radiance is the only saturated colour in the piece and appears nowhere before
stage 3. Regenerate every SVG with <code>cd tools &amp;&amp; node build-svg.mjs</code>.</p>
</div>
<script>
var b=document.body,t=document.getElementById('t');
t.addEventListener('click',function(){var o=b.classList.toggle('old');t.textContent=o?'Stage 1':'Stage 3';});
</script></body></html>`;

fs.writeFileSync('../assets/foundry.html', html);
console.log('wrote assets/foundry.html', (html.length/1024).toFixed(0)+' KB');
