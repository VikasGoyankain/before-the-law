/* dist/acknowledgements.html: the tribute to Prof. (Dr.) Prasannanshu, the
   teacher these games were made for. It used to be the home page; at his
   request it now has a page of its own, so that the games come first.
   Plain HTML, inline SVG and one small inline script. No network requests.

   To show his portrait, save it as assets/professor.jpg (or .png / .webp)
   and rebuild; it is inlined. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { head } from './site.mjs';
import { BOARD_CSS, BOARD_JS } from './board.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

/* who signs the dedication */
const SIGNED = 'Vikas Goyanka';

const PHOTO = (() => {
  for (const [ext, mime] of [['jpg', 'image/jpeg'], ['jpeg', 'image/jpeg'], ['png', 'image/png'], ['webp', 'image/webp']]) {
    const f = path.join(here, '../assets/professor.' + ext);
    if (fs.existsSync(f)) return 'data:' + mime + ';base64,' + fs.readFileSync(f).toString('base64');
  }
  return '';
})();

const DEGREES = [
  'Ph.D. Linguistics &#183; Delhi', 'M.Phil. Linguistics &#183; Delhi', 'M.A. Linguistics &#183; Delhi',
  'M.A. General Linguistics &#183; Groningen', 'M.Sc. Clinical Linguistics &#183; Potsdam', 'M.A. English Literature',
  'LL.B.', 'B.Sc. (Hons.) Zoology &#183; Delhi',
];

/* the five elements, after the page on his own site called "Beyond" */
const ELEMENTS = [
  { sa: 'पृथ्वी', en: 'Earth', of: 'Science', line: 'What can be weighed and examined.',
    icon: '<rect x="11" y="11" width="26" height="26"/>',
    items: ['B.Sc. (Hons.) Zoology, University of Delhi', 'Forensic Science: shared first position in the University', 'Clinical and neurolinguistic research'] },
  { sa: 'जल', en: 'Water', of: 'Language', line: 'What flows between people.',
    icon: '<path d="M33 9a17 17 0 1 0 0 30 13 13 0 0 1 0-30z"/>',
    items: ['Linguistics', 'Neurolinguistics and Psycholinguistics', 'Clinical and Anthropological Linguistics', 'Forensic Linguistics', 'Endangered Languages', 'Name Studies'] },
  { sa: 'अग्नि', en: 'Fire', of: 'Law', line: 'What tests, and tempers.',
    icon: '<path d="M24 9l15 28H9z"/>',
    items: ['Law and Jurisprudence', 'Law and Language', 'Law and Literature', 'Law and Culture', 'Law and Poetry', 'Linguistic Justice'] },
  { sa: 'वायु', en: 'Air', of: 'Poetry', line: 'What is carried on the breath.',
    icon: '<circle cx="24" cy="24" r="14"/>',
    items: ['Thousands of poems, in English and in Hindi', 'Broadcast by All India Radio', 'Founding President, Delhi Poetry Circle', 'Founder of the poets&#8217; group P3', 'Plays, stories, essays, interviews'] },
  { sa: 'आकाश', en: 'Ether', of: 'Teaching', line: 'The element that carries sound.',
    icon: '<ellipse cx="24" cy="24" rx="10" ry="15"/><circle cx="24" cy="24" r="1.6" fill="#e8bd6a"/>',
    items: ['Communication, public speaking, writing', 'Eight courses created for students of law', 'Doctoral supervision', 'Faculty development, in India and abroad'] },
];

const OFFICES = [
  'Professor, National Law University, Delhi',
  'Director, Centre for Linguistic Justice and Endangered Languages',
  'Dean, Open and Distance Learning',
  'Project Coordinator, Study and Research towards Preservation and Promotion of Indigenous and Endangered Languages',
  'Visiting Professor, Universit&#233; Paris Nanterre, France',
  'Visiting Professor, Universit&#224; del Piemonte Orientale, Italy',
  'Fellow, Institute for Advanced Studies in the Humanities, Edinburgh',
  'Member, Publication Committee, Linguistic Society of India (2018&#8211;20)',
  'Founding President, Delhi Poetry Circle',
];

const LAURELS = [
  'British Academy Visiting Scholar, for <i>The Politics of Names and Naming in India</i>',
  'Erasmus Mundus Scholar of the European Union, European Masters in Clinical Linguistics',
  'Proposed the English course outline for the first Curriculum Development Committee of the Bar Council of India, 2010',
  'Received his doctorate at a convocation attended by Dr. A. P. J. Abdul Kalam',
  'Shared first position in the University of Delhi in Forensic Science',
  'Listed in the Limca Book of Records, 1993 and 1994',
  'Honourable Mention, Humanitas International Poetry Contest, Canada',
  'Prize for poetry, Culture Council, University of Delhi',
  'Life Member, Linguistic Society of India and Dravidian Linguistics Association',
  'Life Patron, Indraprasth Literature Festival',
];

const STAMPS = [
  { place: 'Delhi', land: 'India', what: 'University of Delhi, then National Law University', thanks: 'धन्यवाद &#183; <span lang="ur" dir="rtl">شکریہ</span>', lang: 'hi' },
  { place: 'Groningen', land: 'The Netherlands', what: 'M.A., on an Erasmus Mundus scholarship', thanks: 'Dank u wel', lang: 'nl' },
  { place: 'Potsdam', land: 'Germany', what: 'M.Sc., clinical linguistics', thanks: 'Danke sch&#246;n', lang: 'de' },
  { place: 'Sharjah', land: 'United Arab Emirates', what: 'Assistant Professor, Skyline University College', thanks: '<span dir="rtl">شكراً جزيلاً</span>', lang: 'ar' },
  { place: 'Edinburgh', land: 'Scotland', what: 'British Academy Visiting Scholar; Fellow, IASH', thanks: 'Tapadh leibh', lang: 'gd' },
  { place: 'Paris', land: 'France', what: 'Visiting Professor, Universit&#233; Paris Nanterre', thanks: 'Merci infiniment', lang: 'fr' },
  { place: 'Piemonte', land: 'Italy', what: 'Visiting Professor, Universit&#224; del Piemonte Orientale', thanks: 'Grazie di cuore', lang: 'it' },
  { place: 'Hamburg', land: 'Germany', what: 'Lecture at the University of Hamburg', thanks: 'Vielen Dank', lang: 'de' },
];

const BOOKS = [
  { kind: 'Textbook', title: 'Law and Literature: Readings in English', meta: 'LexisNexis &#183; 2016' },
  { kind: 'Monograph', title: 'Agrammatism', meta: 'Lincom Europa, Germany' },
  { kind: 'Textbook', title: 'English and Language Research for LL.B.', meta: 'Osbert &#183; 2015' },
  { kind: 'Edited volume', title: 'Interactions between Culture and Law in India and Europe', meta: 'Aracne &#183; 2019' },
  { kind: 'Poems', title: 'Poetic Reflections on Death', meta: 'Three decades of poems' },
  { kind: 'Poems', title: 'Beyond Words', meta: 'Poems in translation' },
  { kind: 'Anthology', title: 'Saajhi Udaan', meta: 'Hindi poems' },
  { kind: 'Edited anthology', title: 'Kavya Kalindi', meta: 'The poets of P3, in many languages' },
  { kind: 'Guide', title: 'English', meta: 'Taxmann &#183; 2015' },
  { kind: 'Guide', title: 'Legal General Knowledge', meta: 'Taxmann &#183; 2015' },
  { kind: 'Schoolbook', title: 'Functional English', meta: 'CBSE language skills' },
];

const COURSES = ['Law and Language', 'Law and Literature', 'Law and Poetry', 'Law and Culture', 'Law and Communication', 'Law and Linguistics', 'Forensic Linguistics', 'Linguistic Justice and Endangered Languages'];

const PROFILES = [
  ['Personal website', 'prasannanshu.com', 'https://www.prasannanshu.com/'],
  ['His full site', 'about a hundred pages', 'https://sites.google.com/view/prasannanshu/home'],
  ['National Law University, Delhi', 'official profile', 'https://nludelhi.ac.in/faculty/prof-dr-prasannanshu/'],
  ['YouTube', 'Professor&#8217;s Lighthouse', 'https://www.youtube.com/channel/UCOCBgpegCfq-O6IzV82kvZw'],
  ['Google Scholar', 'citations', 'https://scholar.google.com/citations?user=GeaUg_QAAAAJ&amp;hl=en'],
  ['ORCID', '0000-0001-9541-1993', 'https://orcid.org/0000-0001-9541-1993'],
  ['ResearchGate', 'Prasannanshu-Dr', 'https://www.researchgate.net/profile/Prasannanshu-Dr'],
  ['Academia.edu', 'nludelhi.academia.edu', 'https://nludelhi.academia.edu/Prasannanshu'],
  ['LinkedIn', 'in/prasannanshu', 'https://www.linkedin.com/in/prasannanshu/'],
  ['X (Twitter)', '@Prasannanshu', 'https://twitter.com/Prasannanshu'],
  ['Zotero', 'zotero.org/prasannanshu', 'https://www.zotero.org/prasannanshu'],
  ['Vidwan', 'ID 283801', 'https://vidwan.inflibnet.ac.in/profile/283801'],
  ['Penprofile', 'profile/prasannanshu', 'https://penprofile.com/profile/prasannanshu'],
  ['Centre for Linguistic Justice and Endangered Languages', 'NLU Delhi', 'https://sites.google.com/nludelhi.ac.in/cljel-nlud/home'],
  ['Indigenous and Endangered Languages', 'research project', 'https://sites.google.com/nludelhi.ac.in/iel/home'],
  ['Publications', 'papers and articles', 'https://drive.google.com/drive/folders/1q21AGYd7KAK1DiqXZJ45bcRxDK6rxvyG'],
];

/* A burst of light shafts as a conic gradient: n rays all the way round, each
   with its own width and brightness. Seeded, so every build is the same. */
const rays = (seed, n, lo, hi) => {
  let s = seed;
  const rnd = () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const seg = 360 / n, stops = ['transparent 0deg'];
  for (let i = 0; i < n; i++) {
    const c = (i + .3 + rnd() * .4) * seg, w = seg * (.1 + rnd() * .2), a = lo + rnd() * (hi - lo);
    stops.push('transparent ' + (c - w).toFixed(2) + 'deg', 'rgba(255,222,160,' + a.toFixed(3) + ') ' + c.toFixed(2) + 'deg', 'transparent ' + (c + w).toFixed(2) + 'deg');
  }
  return 'conic-gradient(' + stops.join(',') + ',transparent 360deg)';
};

const ORN = '<svg class="orn" viewBox="0 0 208 14" aria-hidden="true"><path d="M0 7h86M122 7h86" stroke="#e8bd6a" stroke-opacity=".45"/><path d="M104 1l6 6-6 6-6-6z" fill="none" stroke="#e8bd6a"/><circle cx="104" cy="7" r="1.4" fill="#e8bd6a"/></svg>';
const li = a => a.map(x => '<li>' + x + '</li>').join('\n      ');

const RAYS_A = rays(11, 16, .1, .34);   /* broad shafts */
const RAYS_B = rays(29, 38, .05, .2);    /* fine ones between them */

const portrait = PHOTO
  ? '<img class="face" src="' + PHOTO + '" alt="Prof. (Dr.) Prasannanshu">'
  : '<span class="face mono" lang="hi" aria-hidden="true">प्र</span>';

export const TRIBUTE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="dark">
${head('acknowledgements.html', { files: true })}
<style>
:root{--bg:#0a090b;--panel:#0f0e0d;--ink:#d8cfbf;--soft:#b0a594;--dim:#7d7568;--line:#2a2622;--gold:#e8bd6a;--pale:#f1e7d3;
 --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
 --serif:Georgia,"Iowan Old Style","Palatino Linotype",Palatino,serif;
 --sheen:linear-gradient(100deg,#b8893a 0,#f6dea0 22%,#e8bd6a 40%,#fff6d8 50%,#e8bd6a 60%,#f6dea0 78%,#b8893a 100%)}
*{box-sizing:border-box}
html{background:var(--bg);scroll-behavior:smooth}
body{margin:0;color:var(--ink);font:1.0625rem/1.7 var(--serif);-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:var(--gold)}
#sky{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0}
.gilt{color:var(--gold)}
@supports ((-webkit-background-clip:text) or (background-clip:text)){
 .gilt{background:var(--sheen);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:sheen 11s linear infinite}}
@keyframes sheen{from{background-position:110% 0}to{background-position:-110% 0}}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes breathe{0%,100%{opacity:.7;transform:scale(.94)}50%{opacity:1;transform:scale(1.04)}}

/* ---------- way-finding ---------- */
.way{position:sticky;top:0;z-index:5;display:flex;gap:.2rem;padding:0 16px;overflow-x:auto;scrollbar-width:none;
 background:linear-gradient(rgba(10,9,11,.92),rgba(10,9,11,.72));border-bottom:1px solid rgba(232,189,106,.14);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.way::-webkit-scrollbar{display:none}
/* centred while it fits, scrolling from the start when it does not */
.way>:first-child{margin-left:auto}.way>:last-child{margin-right:auto}
.way a,.way button{flex:none;padding:1rem .7rem;border:0;background:none;cursor:pointer;text-decoration:none;color:var(--dim);font:.68rem/1 var(--sans);letter-spacing:.18em;text-transform:uppercase;transition:color .3s ease}
.way a:hover,.way a:focus-visible,.way button:hover,.way button:focus-visible{color:var(--gold)}
.way a.out{color:var(--gold)}
.way [data-board-slot]{display:flex}

/* ---------- the lamp: his name ---------- */
.hero{position:relative;z-index:1;overflow:hidden;text-align:center;padding:clamp(2.5rem,7vh,5rem) 16px clamp(3.5rem,9vh,6rem);
 background:radial-gradient(ellipse 70% 34rem at 50% 18rem,rgba(232,189,106,.13),transparent 70%)}
.hero>*{position:relative;animation:rise 1.2s ease both}
.hero>:nth-child(2){animation-delay:.1s}.hero>:nth-child(3){animation-delay:.2s}.hero>:nth-child(4){animation-delay:.3s}
.hero>:nth-child(5){animation-delay:.45s}.hero>:nth-child(6){animation-delay:.6s}.hero>:nth-child(7){animation-delay:.7s}
.hero>:nth-child(8){animation-delay:.8s}.hero>:nth-child(9){animation-delay:.9s}.hero>:nth-child(10){animation-delay:1s}.hero>:nth-child(11){animation-delay:1.1s}
.kicker,.eyebrow{margin:0;text-align:center;font:.68rem/1.6 var(--sans);letter-spacing:.26em;text-transform:uppercase;color:var(--gold)}
.kicker small{display:block;margin-top:.5rem;font-size:inherit;letter-spacing:.14em;color:var(--dim);text-transform:none}
.shl{margin:2.2rem auto .5rem;font-size:clamp(1.05rem,2.6vw,1.3rem);line-height:1.9;color:var(--gold)}
.gl{max-width:34rem;margin:0 auto;font-size:.92rem;font-style:italic;color:var(--soft);text-wrap:balance}
.medal{--m:clamp(232px,62vw,300px);position:relative;width:var(--m);height:var(--m);margin:1.8rem auto 1.6rem}
/* light pouring out from behind the portrait: broad shafts and fine ones, all the
   way round, turning slowly against each other so the rays shimmer */
.rays{position:absolute;left:50%;top:50%;width:1900px;height:1900px;margin:-950px 0 0 -950px;border-radius:50%;pointer-events:none;
 -webkit-mask:radial-gradient(circle closest-side,#000 0 15%,rgba(0,0,0,.5) 30%,rgba(0,0,0,.16) 48%,transparent 70%);
 mask:radial-gradient(circle closest-side,#000 0 15%,rgba(0,0,0,.5) 30%,rgba(0,0,0,.16) 48%,transparent 70%)}
.rays.a{background:${RAYS_A};animation:spin 150s linear infinite}
.rays.b{background:${RAYS_B};animation:spin 210s linear infinite reverse}
.halo{position:absolute;left:50%;top:50%;width:230%;height:230%;margin:-115% 0 0 -115%;border-radius:50%;pointer-events:none;
 background:radial-gradient(circle closest-side,rgba(255,214,140,.5) 0 40%,rgba(255,200,120,.16) 62%,transparent 100%);animation:breathe 7s ease-in-out infinite}
.medal svg{position:absolute;top:0;left:0;width:100%;height:100%;filter:drop-shadow(0 0 14px rgba(255,214,140,.3))}
.medal .ring{transform-origin:120px 120px;animation:spin 70s linear infinite}
.face{position:absolute;top:15%;left:15%;width:70%;height:70%;border-radius:50%;object-fit:cover;
 border:1px solid rgba(232,189,106,.7);box-shadow:0 0 0 5px var(--bg),0 0 0 6px rgba(232,189,106,.3),0 0 60px rgba(255,210,122,.4)}
.mono{display:grid;place-items:center;font-size:calc(var(--m)*.28);line-height:1;padding-top:.5rem;color:var(--gold);
 background:radial-gradient(circle at 50% 35%,#3a2c14,#14100b 70%)}
.offer{margin:0 0 .6rem;font-style:italic;color:var(--soft)}
.name{margin:0;font-weight:normal;line-height:1.05}
.name .hon{display:block;font-size:clamp(1rem,2.6vw,1.35rem);letter-spacing:.34em;text-transform:uppercase;color:#cdb98f;margin-bottom:.4rem;padding-left:.34em}
.name .nm{display:inline-block;font-size:clamp(2.7rem,11.5vw,7rem);letter-spacing:.015em;padding:0 .04em}
.deva{margin:.5rem 0 0;font-size:clamp(1.5rem,4.4vw,2.3rem);line-height:1.5;color:var(--pale)}
.meaning{margin:.2rem auto 0;max-width:30rem;font-size:.95rem;color:var(--soft);text-wrap:balance}
.roles{margin:1.6rem 0 0;font:.72rem/1.9 var(--sans);letter-spacing:.24em;text-transform:uppercase;color:var(--gold)}
.lead{max-width:35rem;margin:1.5rem auto 0;font-size:1.08rem;color:#cfc5b4;text-wrap:pretty}
.cta{margin-top:2rem;display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap}
a.play{display:inline-block;border:1px solid #6a6050;color:var(--pale);text-decoration:none;padding:.9rem 1.8rem;border-radius:2px;
 font:.7rem/1 var(--sans);letter-spacing:.2em;text-transform:uppercase;transition:border-color .3s ease,background .3s ease}
a.play:hover,a.play:focus-visible{border-color:var(--gold);background:rgba(232,189,106,.1)}
a.play.gold{border-color:var(--gold);background:rgba(232,189,106,.12)}
a.play.gold:hover,a.play.gold:focus-visible{background:rgba(232,189,106,.22)}
a.quiet{color:var(--dim);font:.68rem/1 var(--sans);letter-spacing:.14em;text-transform:uppercase;text-decoration:none;padding:.9rem .4rem}
a.quiet:hover,a.quiet:focus-visible{color:var(--ink)}

/* ---------- sections ---------- */
main{position:relative;z-index:1;max-width:68rem;margin:0 auto;padding:0 16px 3rem}
.sec{padding-top:clamp(4.5rem,13vh,8rem);scroll-margin-top:1rem}
.sec h2{margin:.8rem 0 .9rem;text-align:center;font-weight:normal;font-size:clamp(1.8rem,4.8vw,3rem);line-height:1.14;color:var(--pale);text-wrap:balance}
.sub{max-width:37rem;margin:0 auto 2.8rem;text-align:center;font-style:italic;color:var(--soft);text-wrap:pretty}
.orn{display:block;width:min(13rem,60%);height:14px;margin:2.4rem auto}
.js .rv{opacity:0;transform:translateY(20px);transition:opacity 1.1s ease,transform 1.1s ease}
.js .rv.on{opacity:1;transform:none}

/* what he gave us */
.trio{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.trio article{background:var(--panel);padding:2rem 1.6rem 1.8rem;text-align:center}
.trio .no{display:block;font-size:2.6rem;line-height:1;letter-spacing:.08em}
.trio h3{margin:1rem 0 .8rem;font-weight:normal;font-size:1.5rem;line-height:1.25;color:var(--pale);text-wrap:balance}
.trio p{margin:0;color:#cfc5b4;text-wrap:pretty}
.flight{display:block;width:min(22rem,100%);height:auto;margin:3.2rem auto .6rem}
.bird{fill:none;stroke:#f6dea0;stroke-width:1.6;stroke-linecap:round;animation:soar 7s ease-in-out infinite}
.bird.b2{animation-delay:1.4s}.bird.b3{animation-delay:2.8s}
@keyframes soar{0%{transform:translate(-16px,12px);opacity:0}18%{opacity:1}75%{opacity:1}100%{transform:translate(40px,-30px);opacity:0}}
.tagore{max-width:40rem;margin:4rem auto 0;text-align:center}
.tagore h3{margin:0 0 .8rem;font-weight:normal;font-size:clamp(1.5rem,3.6vw,2.1rem);color:var(--pale)}
.tagore p{margin:0 auto 1.4rem;color:#cfc5b4;text-wrap:pretty}
.tagore .bn{margin:0 0 .6rem;font-size:clamp(1.3rem,3.6vw,1.8rem);line-height:1.7;color:var(--gold)}
.tagore blockquote{margin:0 auto;padding:0;font-size:1.18rem;line-height:1.75;font-style:italic;color:var(--pale)}
.tagore cite{display:block;margin:.9rem 0 1.8rem;font:.68rem/1.6 var(--sans);font-style:normal;letter-spacing:.2em;text-transform:uppercase;color:var(--dim)}
.vow{max-width:44rem;margin:3.4rem auto 0;text-align:center;font-size:clamp(1.5rem,4vw,2.4rem);line-height:1.35;color:var(--pale);text-wrap:balance}

.glow{animation:breathe 6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.note{max-width:40rem;margin:2rem auto 0;text-align:center;color:#8d8475;font-size:.95rem;text-wrap:balance}
.note b{font-weight:normal;color:var(--ink)}

/* the count */
.count{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line);margin-bottom:2.4rem}
.count div{background:var(--panel);padding:1.8rem 1rem 1.5rem;text-align:center}
.count b{display:block;font-family:Cambria,"Palatino Linotype","Book Antiqua","Times New Roman",serif;font-weight:normal;font-size:clamp(2.8rem,7.5vw,4.6rem);line-height:1}
.count span{display:block;margin-top:.7rem;font:.68rem/1.6 var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--soft);text-wrap:balance}
.chips{list-style:none;margin:0 auto;padding:0;max-width:56rem;display:flex;flex-wrap:wrap;justify-content:center;gap:.6rem}
.chips li{padding:.55rem 1rem;border:1px solid rgba(232,189,106,.32);border-radius:999px;font:.72rem/1.4 var(--sans);letter-spacing:.08em;color:#d9c9a4;background:rgba(232,189,106,.05)}
.also{max-width:44rem;margin:1.4rem auto 0;text-align:center;font-size:.95rem;color:var(--soft);text-wrap:balance}

/* five elements */
.five{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--line);border:1px solid var(--line);margin-top:3.4rem}
.el{background:var(--panel);padding:1.8rem 1.2rem 1.6rem;text-align:center;transition:background .5s ease}
.el:hover{background:#15120f}
.el svg{width:48px;height:48px;fill:none;stroke:var(--gold);stroke-width:1.3;transition:transform .8s ease}
.el:hover svg{transform:rotate(90deg) scale(1.1)}
.el .sa{display:block;margin-top:.6rem;font-size:1.7rem;line-height:1.5;color:var(--pale)}
.el .en{display:block;font:.66rem/1.6 var(--sans);letter-spacing:.22em;text-transform:uppercase;color:var(--dim)}
.el h3{margin:.9rem 0 .2rem;font-weight:normal;font-size:1.35rem;color:var(--gold)}
.el .ln{margin:0 0 1rem;font-style:italic;font-size:.92rem;color:var(--soft)}
.el ul{list-style:none;margin:0;padding:0;font-size:.9rem;line-height:1.5;color:#c9bfae}
.el li{padding:.42rem 0;border-top:1px solid rgba(232,189,106,.12)}
@media (max-width:1000px){.five{grid-template-columns:1fr 1fr}.el:last-child{grid-column:1/-1}}
@media (max-width:620px){.five{grid-template-columns:1fr}}

/* offices and laurels */
.two{display:grid;grid-template-columns:1fr 1fr;gap:clamp(1.5rem,4vw,3.5rem)}
.two h3{margin:0 0 1rem;font:.7rem/1.6 var(--sans);letter-spacing:.24em;text-transform:uppercase;color:var(--gold)}
.roll{list-style:none;margin:0;padding:0}
.roll li{position:relative;padding:.75rem 0 .75rem 1.9rem;border-top:1px solid var(--line);color:#d2c8b7;line-height:1.5}
.roll li::before{content:"";position:absolute;left:.3rem;top:1.25rem;width:7px;height:7px;border:1px solid var(--gold);transform:rotate(45deg)}
.roll li:first-child{color:var(--pale);font-size:1.1rem}
.roll i{color:var(--pale)}

/* the road */
.route{display:block;width:100%;height:auto;margin:0 0 1.6rem}
.plane{offset-path:path('M20 104 Q400 -44 780 104');offset-rotate:auto;animation:fly 16s linear infinite}
@keyframes fly{0%{offset-distance:0;opacity:0}6%{opacity:1}94%{opacity:1}100%{offset-distance:100%;opacity:0}}
.stamps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(14rem,1fr));gap:1.1rem}
.stamp{position:relative;padding:1.5rem 1.2rem 1.3rem;text-align:center;border:1px dashed rgba(232,189,106,.42);border-radius:6px;background:rgba(232,189,106,.03);transition:transform .5s ease,background .5s ease}
.stamp:nth-child(odd){transform:rotate(-.7deg)}.stamp:nth-child(even){transform:rotate(.6deg)}
.stamp:hover{transform:rotate(0) translateY(-4px);background:rgba(232,189,106,.08)}
.stamp .pl{display:block;font:.82rem/1.3 var(--sans);letter-spacing:.3em;text-transform:uppercase;color:var(--gold);padding-left:.3em}
.stamp .ld{display:block;margin-top:.25rem;font:.66rem/1.4 var(--sans);letter-spacing:.16em;text-transform:uppercase;color:var(--dim)}
.stamp .th{display:block;margin:.9rem 0 .6rem;font-size:1.5rem;line-height:1.5;color:var(--pale)}
.stamp .wh{display:block;font-size:.88rem;line-height:1.45;font-style:italic;color:var(--soft)}

/* the lighthouse */
.lh{display:block;width:min(24rem,100%);height:auto;margin:0 auto 1.4rem}
.beams{transform-box:view-box;transform-origin:120px 44px;animation:sweep 7s ease-in-out infinite}
@keyframes sweep{0%,100%{transform:scaleX(1);opacity:.95}50%{transform:scaleX(.06);opacity:.35}}
.lamp{animation:breathe 3.5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.cap{max-width:31rem;margin:1.8rem auto 0;text-align:center;font-size:1.12rem;font-style:italic;color:#cfc5b4;text-wrap:balance}
.cap small{display:block;margin-top:.9rem;font:.68rem/1.6 var(--sans);font-style:normal;letter-spacing:.2em;text-transform:uppercase;color:var(--dim)}
.cap a{text-decoration:none;border-bottom:1px solid rgba(232,189,106,.35)}
.cap a:hover,.cap a:focus-visible{border-color:var(--gold)}

/* the shelf */
.shelf{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(9.6rem,1fr));gap:1.1rem}
.book{position:relative;aspect-ratio:3/4;display:flex;flex-direction:column;justify-content:space-between;padding:1.2rem .95rem 1rem 1.25rem;
 background:linear-gradient(90deg,rgba(0,0,0,.45) 0,transparent 9%),linear-gradient(160deg,#1c1711,#100e0c);border:1px solid rgba(232,189,106,.3);
 box-shadow:0 18px 30px -18px #000;transition:transform .5s ease,border-color .5s ease}
.book::before{content:"";position:absolute;top:7px;right:7px;bottom:7px;left:13px;border:1px solid rgba(232,189,106,.14);pointer-events:none}
.book:hover{transform:translateY(-6px) rotate(-1deg);border-color:var(--gold)}
.book .kd{font:.62rem/1.4 var(--sans);letter-spacing:.2em;text-transform:uppercase;color:var(--gold)}
.book .tt{font-size:1.02rem;line-height:1.3;color:var(--pale);text-wrap:balance}
.book .mt{font:.66rem/1.5 var(--sans);letter-spacing:.06em;color:var(--dim)}
.sub2{margin:3rem 0 1.2rem;text-align:center;font:.7rem/1.6 var(--sans);letter-spacing:.24em;text-transform:uppercase;color:var(--gold)}

/* profiles */
.doors{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(14.5rem,1fr));gap:1px;background:var(--line);border:1px solid var(--line)}
.doors li{background:var(--panel);display:flex}
.doors a{flex:1;display:block;padding:1.15rem 2.6rem 1.1rem 1.2rem;position:relative;text-decoration:none;transition:background .4s ease}
.doors a:hover,.doors a:focus-visible{background:#17140f}
.doors b{display:block;font-weight:normal;font-size:1.02rem;line-height:1.35;color:var(--pale)}
.doors span{display:block;margin-top:.2rem;font:.68rem/1.5 var(--sans);letter-spacing:.08em;color:var(--dim);overflow-wrap:anywhere}
.doors a::after{content:"";position:absolute;right:1.2rem;top:1.5rem;width:7px;height:7px;border:solid var(--gold);border-width:1px 1px 0 0;transform:rotate(45deg);transition:transform .4s ease}
.doors a:hover::after,.doors a:focus-visible::after{transform:translate(4px,-4px) rotate(45deg)}

/* his words */
.said{max-width:40rem;margin:0 auto;text-align:center}
.said blockquote{margin:0;font-size:clamp(1.4rem,3.6vw,2.1rem);line-height:1.4;font-style:italic;color:var(--pale);text-wrap:balance}
.said cite{display:block;margin-top:1rem;font:.68rem/1.6 var(--sans);font-style:normal;letter-spacing:.2em;text-transform:uppercase;color:var(--dim)}
.said p{margin:1.6rem auto 0;color:#cfc5b4;text-wrap:pretty}

/* dedication: the gate, shut and saying "not yet", opens when the reader arrives */
.plaque{position:relative;overflow:hidden;text-align:center;margin-top:3.4rem;padding:clamp(3rem,7vw,5rem) clamp(1.2rem,6vw,4.5rem) clamp(2.6rem,6vw,4rem);
 border:1px solid rgba(232,189,106,.5);
 background:radial-gradient(ellipse 75% 26rem at 50% 0,rgba(255,210,122,.17),transparent 70%),linear-gradient(#12100e,#0c0b0a);
 box-shadow:0 0 0 6px var(--bg),0 0 0 7px rgba(232,189,106,.2),0 50px 140px -50px rgba(232,189,106,.3)}
.cn{position:absolute;width:22px;height:22px;border:0 solid rgba(232,189,106,.6);pointer-events:none}
.cn.a{top:12px;left:12px;border-width:1px 0 0 1px}.cn.b{top:12px;right:12px;border-width:1px 1px 0 0}
.cn.c{bottom:12px;left:12px;border-width:0 0 1px 1px}.cn.d{bottom:12px;right:12px;border-width:0 1px 1px 0}
.prose{max-width:35rem;margin:0 auto;text-align:left;color:#cfc5b4;font-size:1.06rem;line-height:1.8}
.prose p{margin:0 0 1.15rem;text-wrap:pretty}
.prose p:first-child::first-letter{float:left;font-size:3.5em;line-height:.82;padding:.08em .1em 0 0;color:var(--gold)}
.prose em{color:var(--pale)}
.prose .turn{font-size:1.2rem;color:var(--pale)}
.sign{margin:2.6rem 0 0;color:var(--soft);font-style:italic}
.sign b{display:block;margin-top:.5rem;font-weight:normal;font-style:normal;font-size:1.4rem;color:var(--pale)}
.sign span{display:block;margin-top:.15rem;font:.66rem/1.6 var(--sans);font-style:normal;letter-spacing:.2em;text-transform:uppercase;color:var(--dim)}
.leaf{display:none;position:absolute;top:0;bottom:0;width:50.5%;z-index:3;
 background:repeating-linear-gradient(90deg,rgba(0,0,0,.28) 0 1px,transparent 1px 4.5rem),linear-gradient(#17130f,#0d0b09);
 transition:transform 2.8s cubic-bezier(.72,0,.18,1),visibility 0s 2.9s}
.leaf.l{left:0;border-right:1px solid rgba(232,189,106,.55);box-shadow:inset -30px 0 60px -30px rgba(255,210,122,.22)}
.leaf.r{right:0;border-left:1px solid rgba(232,189,106,.55);box-shadow:inset 30px 0 60px -30px rgba(255,210,122,.22)}
.leaf i{position:absolute;top:min(32%,13rem);font-size:clamp(1.3rem,4.4vw,2rem);color:#cdb98f;letter-spacing:.06em}
.leaf.l i{right:1.1rem}.leaf.r i{left:1.1rem}
.leaf::after{content:"";position:absolute;top:calc(min(32%,13rem) + 4.2rem);width:14px;height:14px;border:1px solid rgba(232,189,106,.6);border-radius:50%}
.leaf.l::after{right:1.2rem}.leaf.r::after{left:1.2rem}
.js .leaf{display:block}
.js .open .leaf.l{transform:translateX(-101%);visibility:hidden}
.js .open .leaf.r{transform:translateX(101%);visibility:hidden}
.js .in{opacity:0;transform:translateY(14px);transition:opacity 1.3s ease,transform 1.3s ease;transition-delay:calc(1.1s + var(--i,0)*.25s)}
.js .open .in{opacity:1;transform:none}

.back{margin:4rem 0 0;text-align:center}
footer{margin-top:3rem;padding-top:1.8rem;border-top:1px solid rgba(232,189,106,.14);text-align:center;font:.7rem/2 var(--sans);letter-spacing:.22em;text-transform:uppercase;color:var(--dim)}
footer b{font-weight:normal;color:var(--gold)}
@media (max-width:760px){.pair,.two,.trio,.fit,.vs li{grid-template-columns:1fr}.count{grid-template-columns:1fr 1fr}.prose{font-size:1rem}}
@media (prefers-reduced-motion:reduce){
 html{scroll-behavior:auto}
 *,*::before,*::after{animation:none!important;transition:none!important}
 .js .leaf{display:none}.js .in,.js .rv{opacity:1;transform:none}}
html.board .way a,html.board .way button{font-size:.56rem;letter-spacing:.1em;padding:1rem .5rem}
/* on a classroom board the portrait grows with everything else */
html.board .medal{--m:19rem}
${BOARD_CSS}</style>
<script>${BOARD_JS}</script>
</head><body>
<canvas id="sky" aria-hidden="true"></canvas>
<nav class="way" aria-label="On this page">
  <a class="out" href="index.html">&#8592; The games</a><a href="#gift">His gift</a><a href="#scholar">The scholar</a><a href="#honours">Honours</a><a href="#road">The road</a><a href="#lighthouse">Lighthouse</a><a href="#shelf">The shelf</a><a href="#doors">Find him</a><a href="#dedication">Dedication</a><span data-board-slot></span>
</nav>

<header class="hero">
  <p class="kicker">Acknowledgements<small>the games on this site are a playable Festschrift: a volume made in honour of a scholar, made of games</small></p>
  <div class="medal">
    <div class="rays a" aria-hidden="true"></div><div class="rays b" aria-hidden="true"></div><div class="halo" aria-hidden="true"></div>
    <svg viewBox="0 0 240 240" aria-hidden="true">
      <defs><path id="orbit" d="M120 14a106 106 0 1 1-.01 0"/></defs>
      <circle cx="120" cy="120" r="118.5" fill="#0a090b" fill-opacity=".84" stroke="#e8bd6a" stroke-opacity=".55"/>
      <circle cx="120" cy="120" r="95" fill="none" stroke="#e8bd6a" stroke-opacity=".28"/>
      <g class="ring"><text fill="#e8bd6a" font-family="ui-sans-serif,system-ui,sans-serif" font-size="10.5" letter-spacing="2.4"><textPath href="#orbit" textLength="660" lengthAdjust="spacing">LAW &#8226; LANGUAGE &#8226; LITERATURE &#8226; LINGUISTICS &#8226; POETRY &#8226; TEACHING &#8226;</textPath></text></g>
    </svg>
    ${portrait}
  </div>
  <p class="offer">Made in honour of</p>
  <h1 class="name"><span class="hon">Prof. (Dr.)</span><span class="nm gilt">Prasannanshu</span></h1>
  <p class="deva" lang="hi">प्रसन्नांशु</p>
  <p class="meaning">In Sanskrit, <i>prasanna</i> is clear and serene, and <i>a&#7745;&#347;u</i> is a ray of light.</p>
  <p class="roles">Linguist &#183; Scholar of law &#183; Poet &#183; Teacher</p>
  <p class="shl" lang="sa">गुरुर्ब्रह्मा गुरुर्विष्णुः गुरुर्देवो महेश्वरः &#2404;<br>गुरुः साक्षात् परं ब्रह्म तस्मै श्रीगुरवे नमः &#2405;</p>
  <p class="gl">The teacher is the maker, the keeper and the transformer. The teacher is the highest truth made visible. To that teacher, I bow.</p>
  <p class="lead">Works of literature turned into games, and offered to the teacher whose lectures changed our lives and set our minds free.</p>
  <div class="cta"><a class="play gold" href="#gift">What he gave us</a><a class="play" href="index.html">Play the games</a></div>
</header>

<main>

<section class="sec" id="gift">
  <p class="eyebrow">What he gave us</p>
  <h2>His lectures changed our lives</h2>
  <p class="shl" lang="sa" style="text-align:center">सा विद्या या विमुक्तये</p>
  <p class="gl" style="text-align:center;margin-bottom:1.2rem">That alone is knowledge which sets us free. <span style="white-space:nowrap">(Vishnu Purana)</span></p>
  <p class="sub">The rest of this page sets out what he knows. It matters more to say first what his teaching did.</p>
  <div class="trio rv">
    <article><span class="no gilt">I</span><h3>He changed how we read</h3>
      <p>We came believing the law lived in statutes. His lectures showed us that it lives in language: in a parable, in a poem, in one carefully chosen word. We have not read anything the same way since.</p></article>
    <article><span class="no gilt">II</span><h3>He lifted us higher</h3>
      <p>He asked more of us than we thought we had, and then waited until we found it. The level we stand on now is one he saw before we did.</p></article>
    <article><span class="no gilt">III</span><h3>He set us free</h3>
      <p>Free of the fear of a difficult text. Free of the borrowed opinion. Free of the idea that law and literature are two subjects, and that a lawyer needs only one of them.</p></article>
  </div>

  <svg class="flight rv" viewBox="0 0 320 170" aria-hidden="true">
    <g fill="none" stroke="#c8a060" stroke-width="1.2">
      <path d="M45 150V100a35 35 0 0 1 70 0v50"/><path d="M62 150V72M80 150V65M98 150V72" stroke-opacity=".6"/>
      <path d="M38 150h84"/><circle cx="80" cy="59" r="5"/>
      <path d="M115 104l26-9v42l-26 9" stroke="#e8bd6a"/><path d="M128 100v42" stroke-opacity=".5"/>
    </g>
    <path class="bird" d="M150 104q7-9 13-2q7-7 13 2"/>
    <path class="bird b2" d="M196 70q6-8 11-2q6-6 11 2"/>
    <path class="bird b3" d="M244 40q5-6 9-1q5-5 9 1"/>
    <circle class="glow" cx="296" cy="16" r="5" fill="#ffe2a0"/>
  </svg>
  <p class="note rv">An anthology that carries his Hindi poems is called <b lang="hi">Saajhi Udaan</b>, a shared flight. That is what his classroom was.</p>

  <div class="tagore rv">
    <h3>And he gave us Tagore</h3>
    <p>Through him we met Tagore, and Tagore&#8217;s prayer for a mind that is free:</p>
    <p class="bn" lang="bn">চিত্ত যেথা ভয়শূন্য, উচ্চ যেথা শির</p>
    <blockquote>Where the mind is without fear and the head is held high;<br>Where knowledge is free &#8230;<br>Into that heaven of freedom, my Father, let my country awake.</blockquote>
    <cite>Rabindranath Tagore &#183; Gitanjali, 35</cite>
    <p>Tagore asked for that freedom as a prayer. In these lectures it was handed to us as a habit.</p>
    <blockquote>A lamp can never light another lamp unless it continues to burn its own flame.</blockquote>
    <cite>Rabindranath Tagore</cite>
    <p>His has never gone out.</p>
  </div>
  <p class="vow rv">We did not leave his lectures with notes.<br><span class="gilt">We left with a different mind.</span></p>
</section>

<section class="sec" id="scholar">
  <p class="eyebrow">The scholar</p>
  <h2>One mind, five elements</h2>
  <p class="sub">He began with zoology and arrived at law, by way of linguistics, two European universities and three decades of poems.</p>
  <div class="count rv">
    <div><b class="gilt" data-n="${DEGREES.length}">${DEGREES.length}</b><span>university degrees</span></div>
    <div><b class="gilt" data-n="7">7</b><span>countries studied, taught or lectured in</span></div>
    <div><b class="gilt" data-n="14">14</b><span>fields on his visiting card</span></div>
    <div><b class="gilt" data-n="${BOOKS.length}">${BOOKS.length}</b><span>books on the shelf below</span></div>
  </div>
  <ul class="chips rv">
      ${li(DEGREES)}
  </ul>
  <p class="also rv">And besides: a postgraduate diploma in marketing, postgraduate certificates in forensic science and in sports and science journalism, a course in the Urdu script, and another in art and culture.</p>

  <div class="five rv">
${ELEMENTS.map(e => `    <article class="el">
      <svg viewBox="0 0 48 48" aria-hidden="true">${e.icon}</svg>
      <span class="sa" lang="sa">${e.sa}</span><span class="en">${e.en}</span>
      <h3>${e.of}</h3>
      <p class="ln">${e.line}</p>
      <ul>
      ${li(e.items)}
      </ul>
    </article>`).join('\n')}
  </div>
  <p class="note">His own website ends with a page called <b>Beyond</b>: earth, water, fire, air, ether. His learning sorts itself the same way.</p>
</section>

<section class="sec" id="honours">
  <p class="eyebrow">Offices and honours</p>
  <h2>The titles, in full</h2>
  <p class="sub">Set down without abbreviation, as they deserve.</p>
  <div class="two">
    <div class="rv"><h3>Offices held</h3><ul class="roll">
      ${li(OFFICES)}
    </ul></div>
    <div class="rv"><h3>Laurels</h3><ul class="roll">
      ${li(LAURELS)}
    </ul></div>
  </div>
</section>

<section class="sec" id="road">
  <p class="eyebrow">The road</p>
  <h2>A scholar is honoured everywhere</h2>
  <p class="shl" lang="sa" style="text-align:center">विद्वत्त्वं च नृपत्वं च नैव तुल्यं कदाचन &#2404;<br>स्वदेशे पूज्यते राजा विद्वान् सर्वत्र पूज्यते &#2405;</p>
  <p class="gl" style="text-align:center;margin-bottom:2.2rem">Learning and kingship are never equals. A king is honoured in his own country; a scholar is honoured everywhere.</p>
  <svg class="route rv" viewBox="0 0 800 120" aria-hidden="true">
    <path d="M20 104 Q400 -44 780 104" fill="none" stroke="#e8bd6a" stroke-opacity=".5" stroke-dasharray="2 7" stroke-linecap="round"/>
    <circle cx="20" cy="104" r="4" fill="#e8bd6a"/><circle cx="780" cy="104" r="4" fill="none" stroke="#e8bd6a"/>
    <g class="plane"><path d="M-10 0l15-3 7 3-7 3zM-1-1.5l-6-8h3.4l8 8zM-1 1.5l-6 8h3.4l8-8zM-9-.6l-3-4h2l3.4 4zM-9 .6l-3 4h2l3.4-4z" fill="#f6dea0"/></g>
  </svg>
  <ul class="stamps rv">
${STAMPS.map(s => `    <li class="stamp"><span class="pl">${s.place}</span><span class="ld">${s.land}</span><span class="th" lang="${s.lang}">${s.thanks}</span><span class="wh">${s.what}</span></li>`).join('\n')}
  </ul>
  <p class="note">Each stop is thanked in its own language. Edinburgh is thanked in G&#224;idhlig, for a scholar who works to keep endangered languages alive.</p>
</section>

<section class="sec" id="lighthouse">
  <p class="eyebrow">The lighthouse</p>
  <h2>He opened our eyes</h2>
  <svg class="lh rv" viewBox="0 0 240 150" aria-hidden="true">
    <defs>
      <linearGradient id="beamR" x1="0" x2="1"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".8"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></linearGradient>
      <linearGradient id="beamL" x1="1" x2="0"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".8"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></linearGradient>
      <radialGradient id="lampg"><stop offset="0" stop-color="#fff3cf"/><stop offset=".35" stop-color="#ffd27a" stop-opacity=".7"/><stop offset="1" stop-color="#ffb050" stop-opacity="0"/></radialGradient>
    </defs>
    <g class="beams"><path d="M120 44L240 14V74z" fill="url(#beamR)"/><path d="M120 44L0 14V74z" fill="url(#beamL)"/></g>
    <circle class="lamp" cx="120" cy="44" r="20" fill="url(#lampg)"/>
    <path d="M110 36l10-11 10 11z" fill="#2a2520" stroke="#c8a060"/>
    <rect x="113" y="36" width="14" height="16" fill="none" stroke="#c8a060"/>
    <rect x="106" y="52" width="28" height="4" fill="#3a332c" stroke="#c8a060" stroke-width=".8"/>
    <path d="M110 56h20l6 72h-32z" fill="#17130f" stroke="#c8a060"/>
    <path d="M108.6 74h22.8M107 94h26M105.4 114h29.2" stroke="#c8a060" stroke-opacity=".5"/>
    <rect x="117" y="116" width="6" height="12" fill="#ffd690" opacity=".6"/>
    <path d="M78 136q10-10 26-8h32q16-2 26 8z" fill="#1c1814" stroke="#3a332c"/>
    <path d="M0 140q15-5 30 0t30 0 30 0 30 0 30 0 30 0 30 0 30 0" fill="none" stroke="#9aa2b8" stroke-opacity=".35"/>
    <path d="M10 147q15-4 30 0t30 0 30 0 30 0 30 0 30 0 30 0" fill="none" stroke="#9aa2b8" stroke-opacity=".2"/>
  </svg>
  <p class="shl rv" lang="sa" style="text-align:center">अज्ञानतिमिरान्धस्य ज्ञानाञ्जनशलाकया &#2404;<br>चक्षुरुन्मीलितं येन तस्मै श्रीगुरवे नमः &#2405;</p>
  <p class="gl rv" style="text-align:center">I was blind in the darkness of not knowing. With the salve of knowledge he opened my eyes. To that teacher, I bow.</p>
  <p class="cap rv">A lighthouse does not walk the road for anyone. It makes sure the harbour can be seen.
    <small>He keeps one: <a href="https://www.youtube.com/channel/UCOCBgpegCfq-O6IzV82kvZw" target="_blank" rel="noopener">Professor&#8217;s Lighthouse</a>, on YouTube</small></p>
</section>

<section class="sec" id="shelf">
  <p class="eyebrow">The shelf</p>
  <h2>Books with his name on them</h2>
  <p class="sub">A study of language breakdown in Hindi, readings for students of law, an edited volume in three languages, and poems.</p>
  <ul class="shelf rv">
${BOOKS.map(b => `    <li class="book"><span class="kd">${b.kind}</span><span class="tt">${b.title}</span><span class="mt">${b.meta}</span></li>`).join('\n')}
  </ul>
  <p class="sub2 rv">Courses he built for students of law</p>
  <ul class="chips rv">
      ${li(COURSES)}
  </ul>
</section>

<section class="sec" id="doors">
  <p class="eyebrow">Find him</p>
  <h2>Every door that leads to him</h2>
  <p class="sub">These open in the browser and need a connection. Everything else on this page works offline.</p>
  <ul class="doors rv">
${PROFILES.map(p => `    <li><a href="${p[2]}" target="_blank" rel="noopener"><b>${p[0]}</b><span>${p[1]}</span></a></li>`).join('\n')}
  </ul>
</section>

<section class="sec" id="dedication" aria-labelledby="ded-h">
  <p class="eyebrow">Dedication</p>
  <h2 id="ded-h">In his own words, and then in ours</h2>
  <div class="said rv">
    <blockquote>&#8220;I am just a conduit between my teachers and students.&#8221;</blockquote>
    <cite>Prof. (Dr.) Prasannanshu, on his website</cite>
    <p class="shl" lang="sa">विद्या ददाति विनयम्</p>
    <p class="gl">Learning gives humility.</p>
    <p>We stand at the far end of that stream, and what follows is what reached us.</p>
  </div>

  <div class="plaque" id="plaque">
    <div class="leaf l" aria-hidden="true"><i>not</i></div><div class="leaf r" aria-hidden="true"><i>yet</i></div>
    <span class="cn a"></span><span class="cn b"></span><span class="cn c"></span><span class="cn d"></span>
    <p class="shl in" lang="hi" style="--i:0;margin-top:0">गुरु गोविन्द दोऊ खड़े, काके लागूँ पाँय &#2404;<br>बलिहारी गुरु आपने, गोविन्द दियो बताय &#2405;</p>
    <p class="gl in" style="--i:1">Teacher and God both stand before me: whose feet do I touch first? Yours, my teacher, for it was you who showed me God. <span style="white-space:nowrap">(Kabir)</span></p>
    <div class="in" style="--i:2">${ORN}</div>
    <div class="prose in" style="--i:3">
      <p>Kafka&#8217;s man from the country finds a doorkeeper standing before the Law, hears <em>not yet</em>, and waits on a stool until his life is spent. Kafka&#8217;s messenger carries a word meant for one person alone, and never clears the palace.</p>
      <p class="turn">We were more fortunate than Kafka&#8217;s people.</p>
      <p>At our gate stood a teacher, and what he said was <em>come in</em>. The message he carried, that the law is built of words and must be read before it can be practised, did reach us. It arrived in a classroom, by way of the poems, plays and parables he chose for students of law.</p>
      <p>These games are our reply. Whatever in them is clear is owed to his teaching; whatever is clumsy is ours alone.</p>
    </div>
    <p class="sign in" style="--i:4">With gratitude and deep respect,<b>${SIGNED}</b><span>his student</span></p>
  </div>
</section>

<p class="back"><a class="play gold" href="index.html">&#8592; Back to the games</a></p>
<footer>Developed by <b>${SIGNED}</b><br>LLB26057 &#183; National Law University, Delhi</footer>
</main>
<script>
(function(){
var d=document,w=window,rm=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches,io='IntersectionObserver' in w;
d.documentElement.classList.add('js');
function each(sel,fn){var l=d.querySelectorAll(sel);for(var i=0;i<l.length;i++)fn(l[i])}

/* the numbers count up when they come into view */
function count(b){
  var n=+b.getAttribute('data-n'),t0=0;if(!n||rm)return;b.textContent='0';
  function f(t){if(!t0)t0=t;var k=Math.min((t-t0)/1400,1);b.textContent=Math.round(n*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)}
  requestAnimationFrame(f);
}
function show(el){el.classList.add('on');var bs=el.querySelectorAll('[data-n]');for(var i=0;i<bs.length;i++)count(bs[i])}
if(rm||!io){each('.rv',show)}else{
  var ro=new IntersectionObserver(function(es){for(var i=0;i<es.length;i++){if(es[i].isIntersecting){show(es[i].target);ro.unobserve(es[i].target)}}},{rootMargin:'0px 0px -12% 0px'});
  each('.rv',function(el){ro.observe(el)});
}

/* the gate opens when the reader reaches it */
var pl=d.getElementById('plaque'),done=false;
function open(){if(!done){done=true;pl.classList.add('open')}}
if(rm||!io){open()}else{
  var go=new IntersectionObserver(function(es){
    for(var i=0;i<es.length;i++){if(es[i].isIntersecting){setTimeout(open,700);go.disconnect();break}}
  },{rootMargin:'0px 0px -30% 0px'});
  go.observe(pl);
}

/* a night sky: fixed stars that twinkle, and slow gold motes rising */
var c=d.getElementById('sky'),x=c.getContext?c.getContext('2d'):null;if(!x)return;
var W=0,H=0,P=[],S=[],r=Math.min(w.devicePixelRatio||1,2),t0=0,run=true,i;
function size(){W=c.width=Math.floor(w.innerWidth*r);H=c.height=Math.floor(w.innerHeight*r)}
for(i=0;i<70;i++)P.push({x:Math.random(),y:Math.random(),s:.4+Math.random()*1.3,v:.004+Math.random()*.012,p:Math.random()*6.283,w:.3+Math.random()*.9});
for(i=0;i<150;i++)S.push({x:Math.random(),y:Math.random(),s:.3+Math.random()*.9,p:Math.random()*6.283,w:.2+Math.random()*1.2});
function draw(t){
  var m,a,j;x.clearRect(0,0,W,H);
  for(j=0;j<S.length;j++){m=S[j];a=.12+.4*(.5+.5*Math.sin(t*.001*m.w+m.p));
    x.beginPath();x.arc(m.x*W,m.y*H,m.s*r,0,6.283);x.fillStyle='rgba(214,222,240,'+a.toFixed(3)+')';x.fill()}
  for(j=0;j<P.length;j++){m=P[j];a=(.1+.3*(.5+.5*Math.sin(t*.001*m.w+m.p)))*(m.s/1.7+.3);
    x.beginPath();x.arc(m.x*W+Math.sin(t*.0002+m.p)*12*r,m.y*H,m.s*r,0,6.283);x.fillStyle='rgba(232,189,106,'+a.toFixed(3)+')';x.fill()}
}
function step(t){
  var dt=Math.min(t-t0,60)/1000;t0=t;
  for(var j=0;j<P.length;j++){P[j].y-=P[j].v*dt;if(P[j].y<-.02){P[j].y=1.02;P[j].x=Math.random()}}
  draw(t);if(run)requestAnimationFrame(step);
}
size();
w.addEventListener('resize',function(){size();if(rm)draw(0)});
if(rm){draw(0)}else{
  requestAnimationFrame(step);
  d.addEventListener('visibilitychange',function(){var was=run;run=!d.hidden;if(run&&!was){t0=performance.now();requestAnimationFrame(step)}});
}
})();
</script>
</body></html>`;
