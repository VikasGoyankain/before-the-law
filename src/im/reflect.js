/* The reflection page for "An Imperial Message": what happened in this
   run, what the parable is, how it pairs with "Before the Law", Kafka's
   German, and questions for the classroom. Nothing leaves the page except
   the text file the student chooses to save. */
import { T } from './text.gen.js';

const el = document.getElementById('reflect');
const times = n => n === 0 ? 'never' : n === 1 ? 'once' : n === 2 ? 'twice' : n + ' times';
const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const plain = s => { const d = document.createElement('div'); d.innerHTML = s; return d.textContent; };

function record(R) {
  const rows = [
    ['Chambers he really crossed', R.chambers],
    ['Pushes', R.pushes],
    ['Times you showed the sun', R.suns],
    ['Years of &#8220;if&#8221;', R.years.toLocaleString('en')],
    ['Emperors who died meanwhile', R.emperors],
    ['Tries to repeat the whisper', R.attempts],
  ];
  return '<dl class="rec">' + rows.map(r => `<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('') + '</dl>';
}

function observations(R) {
  const o = [];
  o.push(`You pushed ${times(R.pushes)} and showed the sign of the sun ${times(R.suns)}. It worked every time: people moved aside and bowed. Nobody in this story tries to stop the messenger. So what does stop him?`);
  if (R.attempts > 1) o.push(`It took you ${R.attempts} tries to whisper the message back. The Emperor never gave up on you; he only whispered it again, more slowly. The message was carefully checked at the start. Nothing goes wrong with it except distance.`);
  else o.push('You whispered the message back perfectly the first time. Nothing went wrong at the start. Everything that goes wrong afterwards is only distance.');
  o.push(`He really crossed ${R.chambers} chambers of the innermost palace. Everything after that, the stairs, the courtyards, the second palace, the ${R.years.toLocaleString('en')} years and the outermost gate, was &#8220;if&#8221;. You saw it drawn in pencil, then torn up. Kafka writes most of the story in a grammar of things that will never happen.`);
  if (R.dream) o.push(`At your window, you dreamed that it said: <i>&#8220;${esc(R.dream)}&#8221;</i> Why that? Nothing in the game told you. The message has no words except the ones its reader gives it.`);
  else o.push('At your window you left the message unwritten. That is a real answer too: Kafka never tells us what it said, and perhaps no words could carry it.');
  return o.map(p => `<p>${p}</p>`).join('');
}

function found(R) {
  if (!R.insights || !R.insights.length) return '';
  return '<h3>Insights you found</h3><ul class="found">' + R.insights.map(i => `<li><b>${i.title}.</b> ${i.text}</li>`).join('') + '</ul>';
}

const QUESTIONS = [
  'The Emperor is the most powerful person in the empire, and he cannot get one message to one person. What does the story suggest about power?',
  'Nobody blocks the messenger on purpose. Make a list of everything that stops him. Which of these could anyone actually fix?',
  'Almost everything after the first chambers is told with &#8220;if&#8221; and &#8220;would&#8221;. Why might Kafka tell most of a story in a mood that never happens? How did the game show you this?',
  'The message comes &#8220;from a dead man.&#8221; Does that make it worthless, or more precious? Would you still want to receive it?',
  'Kafka never tells us what the message says. What do you think it says, and what does your answer reveal about you?',
  'Read the last sentence again. Is it hopeful, sad, or both? Is dreaming the message a failure, or the only way it could ever arrive?',
  'In <i>Before the Law</i> a man waits outside, trying to get in. Here a message is inside, trying to get out. If the two stories are halves of one picture, what is it a picture of?',
  'Is there a message you are waiting for from far away: from an institution, a parent, a god, the future? What do you do while you wait?',
];

const ABOUT = `
<p>Franz Kafka (1883&#8211;1924) wrote <i>An Imperial Message</i> (<i lang="de">Eine kaiserliche Botschaft</i>) in Prague in the spring of 1917. It is a passage from a longer, unfinished story, <i>Building the Great Wall of China</i>, in which a man from a far southern province explains that his empire is so vast that news from the capital takes centuries to arrive. Villagers honour emperors who died long ago, and treat ancient battles as today&#8217;s news.</p>
<p>Kafka published the passage on its own in the Prague Jewish weekly <i>Selbstwehr</i> on 24 September 1919, and in his collection <i>A Country Doctor</i>, alongside <i>Before the Law</i>. A few months before he wrote it, the emperor of Kafka&#8217;s own empire, Franz Joseph, had died after ruling Austria-Hungary for 68 years. That is context, not the key: the story has no names and no dates.</p>
<h3>Some ways readers have read it</h3>
<ul>
<li><b>Power and distance.</b> Between the centre and the single person there is too much: crowds, buildings, layers upon layers. Even absolute power cannot cross it.</li>
<li><b>Communication.</b> The message is perfect at the source and checked word for word. It fails without anyone failing. It is simply never delivered.</li>
<li><b>Religious.</b> A revelation sent from a dying, perhaps dead, god to the one believer it was meant for. Published in a Zionist weekly, it has also been read as an image of messianic waiting.</li>
<li><b>Existential.</b> No meaning arrives from outside. &#8220;You dream it to yourself&#8221;: the reader makes the meaning. Is that freedom or consolation?</li>
<li><b>The grammar.</b> From the moment the crowd is too large, Kafka&#8217;s German slips into the subjunctive: <i lang="de">w&#252;rde, w&#228;re, gel&#228;nge, st&#252;rzte</i>. The messenger&#8217;s whole journey happens in &#8220;would&#8221;. Then the grammar itself says it: <i>never, never can that happen.</i></li>
</ul>
<h3>Read it with <i>Before the Law</i></h3>
<div class="mirror">
  <div><b>Before the Law</b><span>A man from the country, outside, trying to get in.</span><span>A doorkeeper and a gate that was meant only for him.</span><span>He waits his whole life. It does not open.</span></div>
  <div><b>An Imperial Message</b><span>A message from the centre, inside, trying to get out.</span><span>A messenger, and a message meant only for you.</span><span>He runs for thousands of years. It does not arrive.</span></div>
</div>
<p>In both, the obstacle is not a villain but a structure: gate behind gate, palace around palace. In both, what is blocked was meant for one person alone. One way to put it: the man waits outside for the message the Emperor is trying to send.</p>
<h3>What this game adds</h3>
<p>Kafka gives the messenger no choices; the game lets you drive him. The whispered glyphs, the family at supper, the child, the bell, the window onto the roofs, the pencil drawing of the &#8220;if&#8221;, and the dreaming at the end are the game&#8217;s additions. The order of events and the closing sentence follow Kafka closely. A good exercise: which of the game&#8217;s additions help you understand the story, and which change it?</p>
<p><b>The message is not hidden anywhere in this game.</b> The glyphs are made up fresh at random every time you play, and nothing translates them. Not even the game&#8217;s code knows what the Emperor said.</p>
`;

function german() {
  return `<section class="de" hidden><h3>Kafka&#8217;s German</h3>${T._de.map(p => `<p lang="de">${p}</p>`).join('')}
    <p class="src">${T._deSource}</p><h3>Words to notice</h3><dl class="notes">${T._deNotes.map(n => `<dt lang="de">${n.de}</dt><dd>${n.en}</dd>`).join('')}</dl></section>`;
}

export function openReflection(R, onAgain, onHub) {
  const mine = !!R;
  el.innerHTML = `
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="rf-h">
    <button type="button" class="x" data-act="close" aria-label="Close">Close</button>
    <h2 id="rf-h">${mine ? 'What happened to the message' : 'An Imperial Message, for students and teachers'}</h2>
    ${mine ? `<section>${record(R)}${observations(R)}${found(R)}</section>` : ''}
    <section><h3>About the parable</h3>${ABOUT}
      <div class="row"><button type="button" data-act="de">Read it in Kafka&#8217;s German</button></div>
    </section>
    ${german()}
    <section><h3>Questions to discuss</h3><ol class="qs">${QUESTIONS.map(q => `<li>${q}</li>`).join('')}</ol></section>
    ${mine ? `<section><h3>Your response</h3>
      <label for="rf-a">What did you dream the message said, and why that?</label>
      <textarea id="rf-a" rows="5" placeholder="Write here&#8230;">${R.dream ? esc(R.dream) + '\n\n' : ''}</textarea>
      <div class="row"><button type="button" data-act="save">Save as a text file</button>
      <button type="button" data-act="copy">Copy</button><span class="ok" aria-live="polite"></span></div></section>` : ''}
    <div class="row end">
      ${onAgain ? '<button type="button" data-act="again">Begin again</button>' : ''}
      ${onHub ? '<button type="button" data-act="hub">Play Before the Law</button>' : ''}
      <button type="button" data-act="close">Close</button>
    </div>
  </div>`;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('in'));
  el.scrollTop = 0;
  const h = el.querySelector('h2'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
  const say = msg => { const s = el.querySelector('.ok'); if (s) { s.textContent = msg; setTimeout(() => { s.textContent = ''; }, 2500); } };
  const asText = () => {
    const a = (el.querySelector('#rf-a') || {}).value || '';
    return [
      'AN IMPERIAL MESSAGE - what happened to the message', 'after Franz Kafka', '',
      'For: ' + (R.name || 'me'),
      'Chambers he really crossed: ' + R.chambers,
      'Pushes: ' + R.pushes + '   Sun shown: ' + R.suns,
      'Years of "if": ' + R.years, 'Emperors who died meanwhile: ' + R.emperors,
      'The message I dreamed: ' + (R.dream || '(left unwritten)'),
      'Insights found: ' + ((R.insights || []).map(i => plain(i.title)).join(', ') || 'none'),
      '', 'My response:', a.trim() || '(no answer written)', '',
    ].join('\r\n');
  };
  el.onclick = ev => {
    const act = ev.target.closest('[data-act]');
    if (!act) { if (ev.target === el) close(); return; }
    const a = act.dataset.act;
    if (a === 'close') close();
    else if (a === 'again') { close(); onAgain(); }
    else if (a === 'hub') onHub();
    else if (a === 'de') { const d = el.querySelector('section.de'); d.hidden = !d.hidden; if (!d.hidden) d.scrollIntoView({ behavior: 'smooth' }); }
    else if (a === 'save') {
      const url = URL.createObjectURL(new Blob([asText()], { type: 'text/plain' }));
      const link = document.createElement('a'); link.href = url; link.download = 'imperial-message-reflection.txt';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); say('Saved.');
    } else if (a === 'copy') {
      const t = asText();
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => say('Copied.'), () => {
        const ta = el.querySelector('#rf-a'); ta.value = t; ta.select(); say('Selected - press Ctrl+C.');
      });
    }
  };
  el.onkeydown = ev => { if (ev.key === 'Escape') close(); };
}
function close() {
  el.classList.remove('in');
  setTimeout(() => { el.hidden = true; el.innerHTML = ''; }, 400);
  const back = document.querySelector('#again.in, #begin');
  if (back) back.focus({ preventScroll: true });
}
export const reflectionOpen = () => !el.hidden;
