/* dist/for-teachers.html: how to use the readings in a class. A plain, long,
   printable page for a teacher of any course at any university. The
   discussion questions are read out of the games' own reflection pages, so the
   two never drift apart. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { head, PROFESSOR, ZIP } from './site.mjs';
import { BOARD_CSS, BOARD_JS } from './board.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const questions = f => {
  const m = /const QUESTIONS = (\[[\s\S]*?\n\]);/.exec(fs.readFileSync(path.join(here, f), 'utf8'));
  if (!m) throw new Error('no QUESTIONS in ' + f);
  return new Function('return ' + m[1])();
};
const Q_BTL = questions('../src/reflect.js'), Q_IM = questions('../src/im/reflect.js');
const ol = a => '<ol>\n' + a.map(q => '    <li>' + q + '</li>').join('\n') + '\n  </ol>';

export const TEACHERS = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="dark">
${head('for-teachers.html', { files: true })}
<style>
:root{--bg:#0a090b;--panel:#0f0e0d;--ink:#d8cfbf;--soft:#b0a594;--dim:#7d7568;--line:#2a2622;--gold:#e8bd6a;--pale:#f1e7d3;
 --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;--serif:Georgia,"Iowan Old Style","Palatino Linotype",Palatino,serif}
*{box-sizing:border-box}
html{background:var(--bg);scroll-behavior:smooth}
body{margin:0;color:var(--ink);font:1.0625rem/1.75 var(--serif);-webkit-font-smoothing:antialiased;overflow-x:hidden;
 background:radial-gradient(ellipse 80% 40rem at 50% -14rem,rgba(232,189,106,.13),transparent 70%) no-repeat}
a{color:var(--gold)}
.way{position:sticky;top:0;z-index:5;display:flex;gap:.2rem;padding:0 16px;overflow-x:auto;scrollbar-width:none;
 background:linear-gradient(rgba(10,9,11,.94),rgba(10,9,11,.8));border-bottom:1px solid rgba(232,189,106,.14);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.way::-webkit-scrollbar{display:none}
.way>:first-child{margin-left:auto}.way>:last-child{margin-right:auto}
.way a,.way button{flex:none;padding:1rem .8rem;border:0;background:none;cursor:pointer;text-decoration:none;color:var(--dim);
 font:.68rem/1 var(--sans);letter-spacing:.2em;text-transform:uppercase;transition:color .3s ease}
.way a:hover,.way a:focus-visible,.way button:hover,.way button:focus-visible{color:var(--gold)}
.way a.home{color:var(--gold)}
.way [data-board-slot]{display:flex}
main{max-width:46rem;margin:0 auto;padding:clamp(2.5rem,8vh,5rem) 16px 4rem}
.eyebrow{margin:0;font:.68rem/1.6 var(--sans);letter-spacing:.26em;text-transform:uppercase;color:var(--gold)}
h1{margin:.8rem 0 1.2rem;font-weight:normal;font-size:clamp(2.1rem,6vw,3.4rem);line-height:1.1;color:var(--pale);text-wrap:balance}
.lead{font-size:1.2rem;line-height:1.7;color:#d6ccba;text-wrap:pretty}
.lead b{font-weight:normal;color:var(--gold)}
h2{margin:3.6rem 0 1rem;padding-top:1.4rem;border-top:1px solid var(--line);font-weight:normal;font-size:clamp(1.5rem,3.8vw,2rem);line-height:1.2;color:var(--pale);scroll-margin-top:4rem;text-wrap:balance}
h3{margin:2rem 0 .6rem;font:.72rem/1.5 var(--sans);letter-spacing:.2em;text-transform:uppercase;color:var(--gold)}
p,li{text-wrap:pretty}
p{margin:0 0 1.1rem}
b{font-weight:normal;color:var(--pale)}
ul,ol{margin:0 0 1.2rem;padding-left:1.4rem}
li{margin-bottom:.55rem}
li::marker{color:var(--gold)}
code{font:.9em ui-monospace,Consolas,monospace;color:#f0dcae;background:#17140f;padding:.1em .35em;border-radius:3px;overflow-wrap:anywhere}
.cta{display:flex;gap:.8rem;flex-wrap:wrap;margin:1.8rem 0 0}
a.play{display:inline-block;border:1px solid #6a6050;color:var(--pale);text-decoration:none;padding:.9rem 1.5rem;border-radius:2px;
 font:.7rem/1.2 var(--sans);letter-spacing:.18em;text-transform:uppercase;transition:border-color .3s ease,background .3s ease}
a.play:hover,a.play:focus-visible{border-color:var(--gold);background:rgba(232,189,106,.1)}
a.play.gold{border-color:var(--gold);background:rgba(232,189,106,.12)}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(11.5rem,1fr));gap:1px;margin:2rem 0 0;background:var(--line);border:1px solid var(--line)}
.facts div{background:var(--panel);padding:1rem 1.1rem}
.facts dt{font:.64rem/1.4 var(--sans);letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
.facts dd{margin:.35rem 0 0;color:var(--pale)}
.plan{list-style:none;margin:1.4rem 0;padding:0;border:1px solid var(--line);background:var(--line);display:grid;gap:1px}
.plan li{margin:0;display:grid;grid-template-columns:6.5rem 1fr;gap:1px}
.plan span{background:#13110e;padding:1rem .9rem;font:.72rem/1.5 var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
.plan div{background:var(--panel);padding:1rem 1.1rem}
.plan b{display:block;margin-bottom:.2rem;font-size:1.08rem}
.ways{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:1px;background:var(--line);border:1px solid var(--line);margin:1.2rem 0}
.ways div{background:var(--panel);padding:1.2rem 1.2rem 1rem}
.ways b{display:block;margin-bottom:.4rem;font-size:1.12rem;color:var(--gold)}
.ways p{margin:0;font-size:.98rem;color:#c9bfae}
.note{padding:1rem 1.2rem;border-left:2px solid var(--gold);background:#13110e;color:#d6ccba}
table{width:100%;border-collapse:collapse;margin:0 0 1.2rem;font-size:.98rem}
th,td{text-align:left;vertical-align:top;padding:.7rem .8rem .7rem 0;border-bottom:1px solid var(--line)}
th{font:.66rem/1.4 var(--sans);letter-spacing:.16em;text-transform:uppercase;color:var(--dim);font-weight:normal}
td:first-child{color:var(--pale);width:34%}
footer{margin-top:4rem;padding-top:1.8rem;border-top:1px solid rgba(232,189,106,.14);text-align:center;font:.7rem/2 var(--sans);letter-spacing:.2em;text-transform:uppercase;color:var(--dim)}
footer b{color:var(--gold)}
footer a{color:var(--soft);text-decoration:none;border-bottom:1px solid rgba(232,189,106,.3)}
footer a:hover,footer a:focus-visible{color:var(--gold)}
@media (max-width:640px){.plan li{grid-template-columns:1fr}.plan span{padding:.6rem .9rem}}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
@media print{
 html,body{background:#fff!important;color:#000}body{font-size:11pt}
 .way,.cta,[data-board],[data-fs]{display:none!important}
 main{max-width:none;padding:0}
 h1,h2,b,.facts dd,td:first-child,.lead,.lead b,.ways b,.ways p,.note,li,p{color:#000!important}
 h3,.eyebrow,.plan span,li::marker,a,footer,footer b,.facts dt,th{color:#444!important}
 .facts,.plan,.ways{background:#bbb;border-color:#bbb}
 .facts div,.plan div,.plan span,.ways div,.note,code{background:#fff!important}
 h2{break-after:avoid}.plan li,.ways div{break-inside:avoid}
}
html.board .way a,html.board .way button{font-size:.56rem;letter-spacing:.1em;padding:1rem .5rem}
${BOARD_CSS}</style>
<script>${BOARD_JS}</script>
</head><body>
<nav class="way" aria-label="On this page">
  <a class="home" href="index.html">&#8592; Home</a><a href="#aim">The aim</a><a href="#ways">Three ways</a><a href="#plan">Lesson plan</a><a href="#board">On a board</a><a href="#questions">Questions</a><a href="#courses">Your course</a><a href="#help">If something goes wrong</a><span data-board-slot></span>
</nav>
<main>
<p class="eyebrow">For teachers</p>
<h1>Let your students feel Kafka before they discuss him</h1>
<p class="lead">Two of Kafka&#8217;s parables, turned into games that take one class period. Your students do not read about a man who waits at a gate. <b>They wait at it.</b> Then you talk. Everything here is free, needs no sign-up and no installation, and works without an internet connection.</p>
<div class="cta">
  <a class="play gold" href="before-the-law.html">Open Before the Law</a>
  <a class="play gold" href="imperial-message.html">Open An Imperial Message</a>
  <a class="play" href="index.html?board=1">Open for a classroom board</a>
  <a class="play" href="${ZIP}">Download everything (zip)</a>
</div>
<dl class="facts">
  <div><dt>Time</dt><dd>About 15 minutes and about 12 minutes</dd></div>
  <div><dt>You need</dt><dd>Any modern browser. Sound helps.</dd></div>
  <div><dt>Cost</dt><dd>Free, for any classroom</dd></div>
  <div><dt>Level</dt><dd>Senior school to university</dd></div>
  <div><dt>Language</dt><dd>English, with Kafka&#8217;s German in one game</dd></div>
  <div><dt>Privacy</dt><dd>Nothing is uploaded or tracked</dd></div>
</dl>

<h2 id="aim">The aim</h2>
<p>This project has one aim: that students should <b>feel Kafka instead of only reading him</b>.</p>
<p>Kafka is usually taught as a list of themes to remember: authority, delay, futility, the unreachable. A student can learn those words for an examination and never once feel what they name. In these games the student is the man from the country, and is the messenger. They choose to wait, and watch the years go. They run, and the palace does not end. By the time the class sits down to discuss the text, every student already has an experience of their own to argue from.</p>
<p class="note">One piece of advice matters more than the rest: <b>play first, explain afterwards.</b> Do not summarise the story or name its themes before the students have played. The game works because nobody has told them yet that the gate was open.</p>

<h2 id="ways">Three ways to run it</h2>
<div class="ways">
  <div><b>On the classroom board</b><p>One game, played together. A student stands at the board and the room calls out the choices. The argument over whether to press Enter is the lesson. Best for a first encounter.</p></div>
  <div><b>One device each</b><p>Every student plays alone, with headphones, on a laptop or phone. Quieter and more personal, and each student leaves with their own record to write from.</p></div>
  <div><b>Before class</b><p>Set the game as preparation and use the whole period for discussion. Ask students to bring the reflection they saved at the end.</p></div>
</div>

<h2 id="plan">A lesson plan for one period</h2>
<p>Fifty minutes, built around <i>Before the Law</i> on the board. Shorten the discussion to fit a shorter period.</p>
<ol class="plan">
  <li><span>Before class</span><div><b>Set up</b>Open <code>index.html</code> on the board, turn on <i>Classroom board</i>, go full screen, and check that the narration can be heard at the back.</div></li>
  <li><span>0 to 3 min</span><div><b>Say almost nothing</b>&#8220;We are going to stand in front of a gate.&#8221; No summary, no themes, no author&#8217;s biography.</div></li>
  <li><span>3 to 20 min</span><div><b>Play it together</b>One student at the board; the class decides each choice. Let them disagree out loud. Do not hurry the years, and do not tell them what Enter does.</div></li>
  <li><span>20 to 25 min</span><div><b>Write in silence</b>Three sentences each: &#8220;What kept us outside the gate?&#8221;</div></li>
  <li><span>25 to 40 min</span><div><b>Discuss</b>Open <i>What happened here</i> at the end of the game. It shows what this class actually did: the years spent, the times they tried to enter, what they gave away. Start from that record, then use the questions below.</div></li>
  <li><span>40 to 48 min</span><div><b>Now read Kafka</b>Read the parable aloud from your own edition. It is barely a page. Ask what the page does that the game could not, and what the game did that the page cannot.</div></li>
  <li><span>48 to 50 min</span><div><b>Leave them with one question</b>&#8220;Is there a doorkeeper in your own life?&#8221;</div></li>
</ol>
<h3>A second period</h3>
<p>Play <i>An Imperial Message</i> the same way, then put the two side by side. In one, a man is outside, trying to get in. In the other, a message is inside, trying to get out. Kafka printed them in the same book in 1919. Ask what single picture the two halves make.</p>

<h2 id="board">On a classroom digital board</h2>
<p>Every page has a <b>classroom board mode</b> for interactive flat panels and projectors. It makes all text and buttons larger, brightens the dim text so it survives a lit room, moves the small controls to the bottom-left corner where a hand can reach them, and adds a full-screen button.</p>
<ul>
  <li><b>Turning it on.</b> It switches on by itself on a large touch screen. Otherwise press <i>Classroom board</i> at the top of the home page, or open <code>index.html?board=1</code>. The setting follows you into the games.</li>
  <li><b>Touch is enough.</b> Tap a choice to choose it. Touch and hold anywhere to walk or to run. Tap the text to hurry it. Drag to look around. No keyboard or mouse is needed for either story.</li>
  <li><b>Sound.</b> Every line is spoken and also shown on screen. Use the board&#8217;s speakers, or turn <i>Voice</i> off and have students read the lines aloud.</li>
  <li><b>No internet in the room?</b> Copy the folder to a USB stick and open <code>index.html</code> from it. Nothing is fetched from anywhere.</li>
  <li><b>A slow board.</b> Some boards have a weak built-in computer. Add <code>?low=1</code> to a game&#8217;s address for a lighter picture, use the text-only version, or connect a laptop to the board and play from that.</li>
</ul>
<p>Board mode has been checked at board resolution with touch input in a desktop browser. Boards differ, so open it once on yours before the lesson.</p>

<h2 id="questions">Questions for discussion</h2>
<p>These are the same questions the games show on their reflection pages.</p>
<h3>Before the Law</h3>
  ${ol(Q_BTL)}
<h3>An Imperial Message</h3>
  ${ol(Q_IM)}
<h3>Written work</h3>
<ul>
  <li><b>The saved reflection.</b> At the end of each game a student can write a short response and save it, with the record of their own play, as a text file to hand in.</li>
  <li><b>A comparison.</b> &#8220;What did you understand by playing that you had not understood by reading, and what did you lose?&#8221;</li>
  <li><b>Make something.</b> Ask students to answer another text the way this project answers Kafka: by making something of their own from it.</li>
</ul>

<h2 id="games">What happens in each game</h2>
<h3>Before the Law, about fifteen minutes</h3>
<p>The student is the man from the country, seen through his own eyes. He walks to the gate. He can ask, look, offer his possessions, study the doorkeeper, or choose <i>Enter</i>, which is always on the screen and never disabled. Every choice costs years, and the years are shown passing: the light wheels, winters come, the man ages. At the end the game says how long he stayed, and that the gate was never locked.</p>
<h3>An Imperial Message, about twelve minutes</h3>
<p>A dying Emperor whispers a message meant for the student alone. As the messenger, the student memorises it, then runs: through crowds, chambers, stairs and courtyards that do not end. When Kafka&#8217;s sentence turns to &#8220;if&#8221;, the world is drawn in pencil and then torn up. The student ends at their own window and dreams the message for themselves. It is never written anywhere, not even in the code.</p>
<p>Both games keep a journal of insights, and both end with a page of background, readings of the parable and questions. <i>An Imperial Message</i> also shows Kafka&#8217;s German with notes on its key words.</p>

<h2 id="courses">Whatever you teach</h2>
<table>
  <tr><th>Course</th><th>What the games give you</th></tr>
  <tr><td>Literature</td><td>The parable as a form, modernism, the unreliable promise of meaning, and the subjunctive mood made visible.</td></tr>
  <tr><td>Law and legal studies</td><td>Access to justice from the side of the person kept waiting; authority that works through delay and never through force.</td></tr>
  <tr><td>Philosophy and ethics</td><td>Freedom that goes unused, obedience without an order, and waiting as a choice.</td></tr>
  <tr><td>Politics and sociology</td><td>Bureaucracy, hierarchy and distance: power that cannot deliver even its own message.</td></tr>
  <tr><td>Psychology</td><td>Fear of authority, procrastination and self-deception, experienced before they are named.</td></tr>
  <tr><td>German studies</td><td>Kafka&#8217;s original set beside the English, with notes on the words that matter.</td></tr>
  <tr><td>Education and teacher training</td><td>A worked example of teaching a text through experience first and explanation second.</td></tr>
</table>

<h2 id="help">If something goes wrong</h2>
<table>
  <tr><th>What you see</th><th>What to do</th></tr>
  <tr><td>A message that the scene needs WebGL, or a blank picture</td><td>Open the text-only version of the same game. It has the same choices and the same ending.</td></tr>
  <tr><td>No sound</td><td>Click or tap the page once; browsers stay silent until then. Check <i>Voice</i> and <i>Sound</i> in the corner.</td></tr>
  <tr><td>The picture stutters</td><td>Add <code>?low=1</code> to the address, close other tabs, or use the text-only version.</td></tr>
  <tr><td>Text is too small from the back</td><td>Turn on <i>Classroom board</i>, or zoom the browser in.</td></tr>
  <tr><td>Students have already seen every insight</td><td>The journal is kept in the browser. Clearing the site&#8217;s data starts it again.</td></tr>
</table>
<h3>Good to know</h3>
<ul>
  <li><b>Privacy.</b> There are no accounts, no cookies for tracking and no analytics. The optional name and the journal stay in the browser of that device.</li>
  <li><b>Access.</b> Every spoken line is also on screen, the games can be played by keyboard alone, and the text-only versions work with no 3D at all. One optional moment in <i>An Imperial Message</i>, turning to look back, needs a keyboard.</li>
  <li><b>Content.</b> A man grows old and dies waiting; an Emperor dies. There is no violence.</li>
  <li><b>Translations.</b> The English is an original adaptation written for these games from Kafka&#8217;s German, so it will differ in wording from the translation in your textbook. That difference is worth a discussion of its own.</li>
</ul>

<h2 id="credit">Using and crediting it</h2>
<p>Use these games in any class, at any institution, as often as you like. If you mention them in a syllabus or a paper, a line such as this is enough:</p>
<p class="note">Vikas Goyanka, <i>Playable Readings: Before the Law and An Imperial Message</i> (National Law University, Delhi, 2026), made in honour of ${PROFESSOR}.</p>
<p>The project grew out of the teaching of ${PROFESSOR} at National Law University, Delhi, who asks his students to answer literature by making something of their own. <a href="acknowledgements.html">Read the acknowledgements.</a></p>

<footer>Developed by <b>Vikas Goyanka</b> &#183; LLB26057 &#183; National Law University, Delhi<br><a href="index.html">The games</a> &#183; <a href="acknowledgements.html">Acknowledgements</a></footer>
</main>
</body></html>`;
