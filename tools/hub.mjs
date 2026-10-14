/* dist/index.html: the page that opens first. The games come first: a visitor
   should see at once what this is and be one click from playing. Then how to
   play, why the project exists, and where teachers and the acknowledgements
   are. (The tribute to Prof. (Dr.) Prasannanshu has its own page,
   acknowledgements.html, built by tribute.mjs.)
   Plain HTML, inline SVG and one small inline script. No network requests.

   To add a reading, add an entry to GAMES in games.mjs. */
import { head } from './site.mjs';
import { BOARD_CSS, BOARD_JS } from './board.mjs';
import { GAMES } from './games.mjs';

const card = g => `    <article class="card">
      <a class="art" href="${g.file}" tabindex="-1" aria-hidden="true"><svg viewBox="0 0 300 150">${g.art}</svg></a>
      <span class="year">${g.tag}</span>
      <h2><a href="${g.file}">${g.title}</a></h2>
      <p class="blurb">${g.blurb}</p>
      <p class="meta">About ${g.minutes} minutes &#183; narrated &#183; headphones help</p>
      <div class="go"><a class="play" href="${g.file}"><span aria-hidden="true">&#9654;</span> Play ${g.title}</a><a class="quiet" href="${g.text}">Text-only version</a></div>
    </article>`;

export const HUB = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="dark">
${head('index.html', { files: true })}
<style>
:root{--bg:#0a090b;--panel:#0f0e0d;--ink:#d8cfbf;--soft:#b0a594;--dim:#7d7568;--line:#2a2622;--gold:#e8bd6a;--pale:#f1e7d3;
 --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
 --serif:Georgia,"Iowan Old Style","Palatino Linotype",Palatino,serif;
 --sheen:linear-gradient(100deg,#b8893a 0,#f6dea0 22%,#e8bd6a 40%,#fff6d8 50%,#e8bd6a 60%,#f6dea0 78%,#b8893a 100%)}
*{box-sizing:border-box}
html{background:var(--bg);scroll-behavior:smooth}
body{margin:0;color:var(--ink);font:1.0625rem/1.7 var(--serif);-webkit-font-smoothing:antialiased;overflow-x:hidden;
 background:radial-gradient(ellipse 80% 34rem at 50% -8rem,rgba(232,189,106,.13),transparent 70%) no-repeat}
a{color:var(--gold)}
#sky{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0}
.gilt{color:var(--gold)}
@supports ((-webkit-background-clip:text) or (background-clip:text)){
 .gilt{background:var(--sheen);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:sheen 11s linear infinite}}
@keyframes sheen{from{background-position:110% 0}to{background-position:-110% 0}}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes breathe{0%,100%{opacity:.7;transform:scale(.94)}50%{opacity:1;transform:scale(1.04)}}

/* ---------- the bar ---------- */
.way{position:sticky;top:0;z-index:5;display:flex;gap:.2rem;padding:0 16px;overflow-x:auto;scrollbar-width:none;
 background:linear-gradient(rgba(10,9,11,.94),rgba(10,9,11,.78));border-bottom:1px solid rgba(232,189,106,.14);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.way::-webkit-scrollbar{display:none}
.way>:first-child{margin-left:auto}.way>:last-child{margin-right:auto}
.way a,.way button{flex:none;padding:1rem .7rem;border:0;background:none;cursor:pointer;text-decoration:none;color:var(--dim);font:.68rem/1 var(--sans);letter-spacing:.18em;text-transform:uppercase;transition:color .3s ease}
.way a:hover,.way a:focus-visible,.way button:hover,.way button:focus-visible{color:var(--gold)}
.way a.brand{color:var(--pale);letter-spacing:.24em;margin-right:.8rem}
.way [data-board-slot]{display:flex}

/* ---------- top ---------- */
.top{position:relative;z-index:1;text-align:center;padding:clamp(1.8rem,5vh,3.2rem) 16px clamp(1.4rem,3.5vh,2.2rem)}
.top>*{animation:rise 1s ease both}
.top>:nth-child(2){animation-delay:.1s}.top>:nth-child(3){animation-delay:.2s}
.kicker,.eyebrow{margin:0;text-align:center;font:.68rem/1.6 var(--sans);letter-spacing:.26em;text-transform:uppercase;color:var(--gold)}
h1{margin:.7rem 0 .6rem;font-weight:normal;font-size:clamp(2.1rem,6.2vw,3.6rem);line-height:1.1;color:var(--pale);text-wrap:balance}
.lead{max-width:34rem;margin:0 auto;font-size:1.12rem;color:#cfc5b4;text-wrap:balance}

/* ---------- the games ---------- */
main{position:relative;z-index:1;max-width:68rem;margin:0 auto;padding:0 16px 3rem}
.games{display:grid;grid-template-columns:1fr 1fr;gap:1.2rem;scroll-margin-top:4rem;animation:rise 1.1s .25s ease both}
.card{position:relative;display:flex;flex-direction:column;padding:1.4rem 1.6rem 1.5rem;background:var(--panel);border:1px solid rgba(232,189,106,.28);border-radius:4px;
 transition:border-color .4s ease,background .4s ease,transform .4s ease}
.card:hover,.card:focus-within{border-color:rgba(232,189,106,.7);background:#141210}
.card .art{display:block;margin:-.4rem -.6rem .8rem}
.card svg{display:block;width:100%;height:7.4rem}
.card .year{font:.66rem/1 var(--sans);letter-spacing:.2em;text-transform:uppercase;color:var(--gold)}
.card h2{margin:.5rem 0 .5rem;font-weight:normal;font-size:clamp(1.6rem,3.4vw,2rem);line-height:1.15}
.card h2 a{color:var(--pale);text-decoration:none}
.card h2 a:hover,.card h2 a:focus-visible{color:#fff3dc}
.card .blurb{margin:0 0 .7rem;color:#bfb5a4;flex:1;text-wrap:pretty}
.card .meta{margin:0 0 1.1rem;font:.72rem/1.5 var(--sans);letter-spacing:.06em;color:var(--dim)}
.go{display:flex;gap:.4rem 1rem;align-items:center;flex-wrap:wrap}
a.play{display:inline-flex;align-items:center;gap:.6rem;min-height:3.2rem;padding:.9rem 1.6rem;border:1px solid var(--gold);border-radius:3px;
 background:rgba(232,189,106,.16);color:#fff3dc;text-decoration:none;font:.76rem/1.2 var(--sans);letter-spacing:.16em;text-transform:uppercase;
 transition:background .3s ease,color .3s ease}
a.play:hover,a.play:focus-visible{background:rgba(232,189,106,.3);color:#fff}
a.play span{color:var(--gold);font-size:.9em}
a.quiet{color:var(--dim);font:.68rem/1 var(--sans);letter-spacing:.14em;text-transform:uppercase;text-decoration:none;padding:.9rem .2rem}
a.quiet:hover,a.quiet:focus-visible{color:var(--ink)}
.glow{animation:breathe 6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.runner{animation:run 9s cubic-bezier(.08,.7,.12,1) infinite}
@keyframes run{0%{transform:translateX(0);opacity:0}6%{opacity:1}80%{opacity:1}100%{transform:translateX(118px);opacity:0}}
.hint{max-width:44rem;margin:1.6rem auto 0;text-align:center;color:#9a9082;font-size:.98rem;text-wrap:balance}
.hint b{font-weight:normal;color:var(--ink)}

/* ---------- sections ---------- */
.sec{padding-top:clamp(4rem,11vh,6.5rem);scroll-margin-top:2rem}
.sec h2{margin:.8rem 0 .9rem;text-align:center;font-weight:normal;font-size:clamp(1.7rem,4.4vw,2.7rem);line-height:1.15;color:var(--pale);text-wrap:balance}
.sub{max-width:37rem;margin:0 auto 2.4rem;text-align:center;font-style:italic;color:var(--soft);text-wrap:pretty}
.sub2{margin:3rem 0 1rem;text-align:center;font:.7rem/1.6 var(--sans);letter-spacing:.24em;text-transform:uppercase;color:var(--gold)}
.no{font-size:1.7rem;line-height:1;font-family:Cambria,"Palatino Linotype","Book Antiqua","Times New Roman",serif}

/* how to play */
.how{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.how li{background:var(--panel);padding:1.3rem 1.3rem 1.2rem}
.how b{display:block;margin:.6rem 0 .3rem;font-weight:normal;font-size:1.15rem;color:var(--pale)}
.how span{display:block;color:#bfb5a4;font-size:.95rem;line-height:1.55}
kbd{font:.85em ui-monospace,Consolas,monospace;border:1px solid #4a443c;border-radius:3px;padding:0 .3rem;color:var(--pale)}

/* why */
.reason{max-width:39rem;margin:0 auto 2.6rem;text-align:center;font-size:1.12rem;line-height:1.8;color:#d6ccba;text-wrap:pretty}
.reason b{font-weight:normal;color:var(--gold)}
.vs{list-style:none;margin:0;padding:0;border:1px solid var(--line);background:var(--line);display:grid;gap:1px}
.vs li{display:grid;grid-template-columns:1fr 1fr;gap:1px}
.vs div{background:var(--panel);padding:1.3rem 1.5rem 1.2rem}
.vs small{display:block;margin-bottom:.5rem;font:.64rem/1.4 var(--sans);letter-spacing:.22em;text-transform:uppercase;color:var(--dim)}
.vs .a{font-style:italic;color:#9a9082}
.vs .b{color:var(--pale);box-shadow:inset 2px 0 0 var(--gold);background:#13110e}
.vs .b small{color:var(--gold)}
.fit{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line)}
.fit article{background:var(--panel);padding:1.5rem 1.6rem 1.4rem 4.2rem;position:relative}
.fit .no{position:absolute;left:1.5rem;top:1.4rem}
.fit h3{margin:0 0 .5rem;font-weight:normal;font-size:1.22rem;line-height:1.3;color:var(--pale)}
.fit p{margin:0;color:#c9bfae;font-size:.98rem;text-wrap:pretty}

/* teachers */
.teach{display:flex;gap:1.4rem 2rem;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:clamp(4rem,11vh,6.5rem);
 padding:1.8rem 2rem;border:1px solid rgba(232,189,106,.3);border-radius:4px;background:linear-gradient(120deg,#15120e,#0f0e0d)}
.teach h2{margin:.4rem 0 .4rem;font-weight:normal;font-size:clamp(1.4rem,3.2vw,1.9rem);color:var(--pale);text-align:left}
.teach p{margin:0;max-width:36rem;color:#bfb5a4}
.teach .eyebrow{text-align:left}

footer{margin-top:4rem;padding-top:1.8rem;border-top:1px solid rgba(232,189,106,.14);text-align:center;font:.7rem/2 var(--sans);letter-spacing:.2em;text-transform:uppercase;color:var(--dim)}
footer b{font-weight:normal;color:var(--gold)}
footer a{color:var(--soft);text-decoration:none;border-bottom:1px solid rgba(232,189,106,.3)}
footer a:hover,footer a:focus-visible{color:var(--gold)}

@media (max-width:860px){.how{grid-template-columns:1fr 1fr}}
@media (max-width:760px){.games,.fit,.vs li{grid-template-columns:1fr}.way a.brand{display:none}}
@media (max-width:480px){.how{grid-template-columns:1fr}.teach{padding:1.5rem 1.3rem}}
@media (prefers-reduced-motion:reduce){
 html{scroll-behavior:auto}
 *,*::before,*::after{animation:none!important;transition:none!important}}
html.board .way a,html.board .way button{font-size:.56rem;letter-spacing:.1em;padding:1rem .5rem}
${BOARD_CSS}</style>
<script>${BOARD_JS}</script>
</head><body>
<canvas id="sky" aria-hidden="true"></canvas>
<nav class="way" aria-label="Site">
  <a class="brand" href="#top">Playable Readings</a><a href="#play">Play</a><a href="#how">How to play</a><a href="#why">Why</a><a href="for-teachers.html">For teachers</a><a href="acknowledgements.html">Acknowledgements</a><span data-board-slot></span>
</nav>

<header class="top" id="top">
  <p class="kicker">Playable Readings &#183; free &#183; nothing to install &#183; works offline</p>
  <h1>Feel Kafka. <span class="gilt">Don&#8217;t just read him.</span></h1>
  <p class="lead">Two of Franz Kafka&#8217;s parables, turned into short games. Pick one and press Play.</p>
</header>

<main>
<section class="games" id="play" aria-label="The games">
${GAMES.map(card).join('\n')}
</section>
<p class="hint">New here? Start with <b>Before the Law</b>. The games run in any browser, on a laptop, a phone or a classroom board; the text-only versions suit older machines.</p>

<section class="sec" id="how">
  <p class="eyebrow">How to play</p>
  <h2>Four things to know</h2>
  <ul class="how">
    <li><span class="no gilt">1</span><b>Choose</b><span>Click or tap a choice. The number keys <kbd>1</kbd>&#8211;<kbd>4</kbd> work too.</span></li>
    <li><span class="no gilt">2</span><b>Hold to move</b><span>Hold the mouse button, a finger, or <kbd>&#8593;</kbd> to walk or to run. Drag to look around.</span></li>
    <li><span class="no gilt">3</span><b>Listen</b><span>Every line is spoken and also shown on screen. Click the text to hurry it.</span></li>
    <li><span class="no gilt">4</span><b>Reflect</b><span>At the end, <i>What happened here</i> shows what you did and asks what it meant.</span></li>
  </ul>
  <p class="hint">On a classroom board, press <b>Classroom board</b> in the bar above for larger text and controls, or see the page for teachers.</p>
</section>

<section class="sec" id="why">
  <p class="eyebrow">Why this project</p>
  <h2>To live a text, not to memorise it</h2>
  <p class="reason">I built these games for one reason. <b>A theme that is memorised stays on the page; a theme that is lived stays in the person.</b> Kafka&#8217;s parables are usually taught as a list of ideas: authority, delay, futility, the unreachable. Here the student does not learn those words. They wait at the gate, they run with the message, and the ideas arrive as their own first-hand experience.</p>
  <ul class="vs">
    <li><div class="a"><small>Memorised</small>The man from the country waits at the gate until he dies.</div>
        <div class="b"><small>Lived</small>You wait. Enter is on the screen the whole time, and still the years go by.</div></li>
    <li><div class="a"><small>Memorised</small>The Emperor&#8217;s message never reaches the one it was meant for.</div>
        <div class="b"><small>Lived</small>You carry it yourself, chamber after chamber, and the palace does not end.</div></li>
    <li><div class="a"><small>Memorised</small>Kafka&#8217;s themes are authority, delay and futility.</div>
        <div class="b"><small>Lived</small>You find that nobody stopped you. You stopped yourself.</div></li>
  </ul>

  <p class="sub2">Why it belongs in this course</p>
  <p class="sub" style="margin-bottom:2rem">The course joins law, language, literature and communication. So does the project.</p>
  <div class="fit">
    <article><span class="no gilt">1</span><h3>Law, seen from the other side</h3>
      <p><i>Before the Law</i> comes from <i>The Trial</i>, and it is about access to law. Every lawyer will one day stand at that gate as its keeper. The game makes them stand there first as the one kept waiting.</p></article>
    <article><span class="no gilt">2</span><h3>Close reading, done by hand</h3>
      <p>Each choice on the screen is a sentence of Kafka&#8217;s. To play it well, and certainly to build it, every line has to be read slowly enough to act on.</p></article>
    <article><span class="no gilt">3</span><h3>Interpretation without an answer key</h3>
      <p>The games never say what the parables mean. The reflection page sets out several readings and asks the student to take a position, which is what a statute asks of a lawyer.</p></article>
    <article><span class="no gilt">4</span><h3>Language in more than one form</h3>
      <p>The text is read, heard in narration, discussed through set questions and answered in writing. <i>An Imperial Message</i> also sets it beside Kafka&#8217;s German, with notes on its key words.</p></article>
    <article><span class="no gilt">5</span><h3>Creativity as a method</h3>
      <p>The course asks students to answer literature by making something of their own. This project is that instruction, taken literally.</p></article>
    <article><span class="no gilt">6</span><h3>Made to be used again</h3>
      <p>Each reading is one file that opens offline and takes ten to fifteen minutes, with a text-only version for older machines. The next class can play it within a single period.</p></article>
  </div>
</section>

<section class="teach" aria-labelledby="teach-h">
  <div><p class="eyebrow">For teachers</p><h2 id="teach-h">Use it in one class period</h2>
  <p>A lesson plan, the discussion questions, and notes for running the games on a classroom board or on students&#8217; laptops.</p></div>
  <a class="play" href="for-teachers.html">Open the page for teachers</a>
</section>

<footer>Developed by <b>Vikas Goyanka</b> &#183; LLB26057 &#183; National Law University, Delhi<br><a href="acknowledgements.html">Acknowledgements</a></footer>
</main>
<script>
/* a quiet night sky behind the page: fixed stars that twinkle */
(function(){
var d=document,w=window,c=d.getElementById('sky'),x=c.getContext?c.getContext('2d'):null;if(!x)return;
var rm=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches,W=0,H=0,S=[],r=Math.min(w.devicePixelRatio||1,2),run=true,i;
function size(){W=c.width=Math.floor(w.innerWidth*r);H=c.height=Math.floor(w.innerHeight*r)}
for(i=0;i<130;i++)S.push({x:Math.random(),y:Math.random(),s:.3+Math.random()*.9,p:Math.random()*6.283,w:.2+Math.random()*1.2,g:Math.random()<.3});
function draw(t){
  x.clearRect(0,0,W,H);
  for(var j=0;j<S.length;j++){var m=S[j],a=.1+.35*(.5+.5*Math.sin(t*.001*m.w+m.p));
    x.beginPath();x.arc(m.x*W,m.y*H,m.s*r,0,6.283);x.fillStyle=(m.g?'rgba(232,189,106,':'rgba(214,222,240,')+a.toFixed(3)+')';x.fill()}
}
function step(t){draw(t);if(run)requestAnimationFrame(step)}
size();
w.addEventListener('resize',function(){size();if(rm)draw(0)});
if(rm){draw(0)}else{
  requestAnimationFrame(step);
  d.addEventListener('visibilitychange',function(){var was=run;run=!d.hidden;if(run&&!was)requestAnimationFrame(step)});
}
})();
</script>
</body></html>`;
