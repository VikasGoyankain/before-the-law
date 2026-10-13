/* The reflection screen: what the player did at the gate, what the parable
   is, and questions to take into a classroom. It reads the run's record and
   writes nothing back - the only thing that leaves the page is the text file
   the student chooses to save. */

const el = document.getElementById('reflect');
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));
const times = n => n === 0 ? 'never' : n === 1 ? 'once' : n === 2 ? 'twice' : n + ' times';
/* gift labels arrive as HTML entities from the text block; flatten for the .txt */
const plain = s => { const d = document.createElement('div'); d.innerHTML = s; return d.textContent; };

function record(R) {
  const rows = [
    ['Years at the gate', R.years],
    ['Asked to be admitted', times(R.asked)],
    ['Looked through the gate', times(R.looks)],
    ['Studied the doorkeeper', times(R.studies)],
    ['Walked toward the gate', times(R.enters)],
    ['Gave away', R.gifts.length + ' of ' + R.giftsTotal + ' things you carried'],
  ];
  return '<dl class="rec">' + rows.map(r => `<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('') + '</dl>';
}

/* Observations are chosen by what the player actually did, so two students
   comparing notes will have read different things. */
function observations(R) {
  const o = [];
  if (R.enters === 0) {
    o.push('You never tried the gate. Neither does the man in Kafka&#8217;s story. The <b>Enter</b> choice was on every screen, always last, always in the same place &#8212; it was never hidden and never greyed out.');
  } else {
    o.push(`You walked toward the gate ${times(R.enters)}. Think about what stopped you. The doorkeeper never touched you, never stepped into your path, never locked anything. He only spoke &#8212; and each time, you sat back down.`);
  }
  if (R.gifts.length === R.giftsTotal) {
    o.push('You gave away everything you carried, including the money for the journey home. He took each thing &#8220;so that you do not feel you have left something untried.&#8221; The gifts changed nothing about the gate. What did they change about you?');
  } else if (R.gifts.length > 0) {
    o.push(`You gave away ${plural(R.gifts.length, 'thing')}: ${R.gifts.map(g => g.toLowerCase()).join(', ')}. Did giving feel like progress? The doorkeeper tells you plainly that it is not.`);
  } else if (R.offeredNone === 0) {
    o.push('You kept everything you brought. Kafka&#8217;s man spends it all trying to bribe his way in.');
  }
  if (R.asked >= 4) {
    o.push(`You asked ${times(R.asked)} and heard &#8220;not yet&#8221; each time. &#8220;Not yet&#8221; is not &#8220;no&#8221;. How much of the waiting was held in place by the hope in those two words?`);
  }
  if (R.studies > 0) {
    o.push('You studied the doorkeeper until you knew the fleas in his collar. The man gives his whole attention to the guard &#8212; and almost none to the open gate behind him.');
  }
  o.push(`You spent ${plural(R.years, 'year')} here, in about ${plural(Math.max(1, R.minutes), 'minute')} of your own time. The game moved time forward only when you chose something. In a sense, every year was one you chose.`);
  return o.map(p => `<p>${p}</p>`).join('');
}

function found(R) {
  if (!R.insights || !R.insights.length) return '';
  return '<h3>Insights you found</h3><ul class="found">' +
    R.insights.map(i => `<li><b>${i.title}.</b> ${i.text}</li>`).join('') + '</ul>';
}

const QUESTIONS = [
  'Nothing physical prevents the man from entering. What does stop him? Point to the moment in the story &#8212; or in your own play &#8212; where he gives up.',
  'At the very end the doorkeeper says the entrance &#8220;was meant for you alone.&#8221; Why tell him only then? What changes if every person has their own gate?',
  'Is the doorkeeper a liar, a servant, a guard, or something else? Find one thing he says that supports your answer, and one that complicates it.',
  'The man tries asking, bribing, flattering and even pleading with the fleas &#8212; but never simply walks in. Why do people choose indirect routes over direct action?',
  'The radiance appears only when the man is nearly blind. What might it stand for, and why does it come so late?',
  'When you pressed Enter, the game did not let you through &#8212; it had you talk yourself back down. Was that fair? What argument about the story is the game making by doing that?',
  'Is there a &#8220;doorkeeper&#8221; in your own life &#8212; a rule, a person or a fear that you have obeyed without ever testing it?',
];

const ABOUT = `
<p>Franz Kafka (1883&#8211;1924) wrote <i>Before the Law</i> (<i lang="de">Vor dem Gesetz</i>) in 1914, in Prague. It was first published in 1915 and later collected in <i>A Country Doctor</i> (1919). It is barely a page long.</p>
<p>It also appears inside Kafka&#8217;s novel <i>The Trial</i>, published after his death in 1925. There, a priest tells the parable to Josef K., a man arrested for a crime no one will name. The two of them then argue over what it means &#8212; whether the doorkeeper deceived the man, or the man deceived himself, or whether the doorkeeper is the one who is truly trapped. The novel never settles it, and that argument is part of the point.</p>
<h3>Some ways readers have read it</h3>
<ul>
<li><b>Power and bureaucracy.</b> Authority that never needs force, because it works through delay, rules and the promise of &#8220;later&#8221;.</li>
<li><b>Religious.</b> &#8220;The law&#8221; as divine truth or scripture: radiant, close, and somehow out of reach &#8212; and a path that is personal to each seeker.</li>
<li><b>Existential.</b> The man waits his whole life for permission he may never have needed. Freedom unused is a choice too.</li>
<li><b>Psychological.</b> Fear of authority, self-doubt, procrastination: the doorkeeper as the voice in your own head.</li>
</ul>
<p>None of these is the answer. Kafka gives the man no name, the law no shape and the doorkeeper no motive, which leaves room for all of them.</p>
<h3>What this game adds</h3>
<p>The parable never shows the man choosing anything; it only tells us what he did. The game hands you his choices and lets the years pass at your pace. The gifts you carried, the stool, the walk toward the gate and the gate&#8217;s closing are the game&#8217;s additions; the doorkeeper&#8217;s words follow Kafka closely. Comparing the two is a good exercise: what does the story gain by giving the man no choices at all?</p>
`;

export function openReflection(R, onAgain) {
  const mine = !!R;
  el.innerHTML = `
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="rf-h">
    <button type="button" class="x" data-act="close" aria-label="Close">Close</button>
    <h2 id="rf-h">${mine ? 'What happened at the gate' : 'Before the Law &#8212; for students and teachers'}</h2>
    ${mine ? `<section>${record(R)}${observations(R)}${found(R)}</section>` : ''}
    <section><h3>About the parable</h3>${ABOUT}</section>
    <section><h3>Questions to discuss</h3><ol class="qs">${QUESTIONS.map(q => `<li>${q}</li>`).join('')}</ol></section>
    ${mine ? `<section><h3>Your response</h3>
      <label for="rf-a">In a few sentences: what kept you outside the gate?</label>
      <textarea id="rf-a" rows="5" placeholder="Write here&#8230;"></textarea>
      <div class="row">
        <button type="button" data-act="save">Save as a text file</button>
        <button type="button" data-act="copy">Copy</button>
        <span class="ok" aria-live="polite"></span>
      </div></section>` : ''}
    <div class="row end">
      ${onAgain ? '<button type="button" data-act="again">Begin again</button>' : ''}
      <button type="button" data-act="close">Close</button>
    </div>
  </div>`;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('in'));
  el.scrollTop = 0;
  const first = el.querySelector('h2');
  first.setAttribute('tabindex', '-1'); first.focus({ preventScroll: true });

  const say = msg => { const s = el.querySelector('.ok'); if (s) { s.textContent = msg; setTimeout(() => { s.textContent = ''; }, 2500); } };
  const asText = () => {
    const a = (el.querySelector('#rf-a') || {}).value || '';
    return [
      'BEFORE THE LAW - my time at the gate',
      'after Franz Kafka',
      '',
      'Years at the gate: ' + R.years,
      'Asked to be admitted: ' + R.asked,
      'Looked through the gate: ' + R.looks,
      'Studied the doorkeeper: ' + R.studies,
      'Walked toward the gate: ' + R.enters,
      'Gave away: ' + (R.gifts.length ? R.gifts.map(plain).join(', ') : 'nothing'),
      'Insights found: ' + ((R.insights || []).map(i => plain(i.title)).join(', ') || 'none'),
      '',
      'What kept me outside the gate:',
      a.trim() || '(no answer written)',
      '',
    ].join('\r\n');
  };

  el.onclick = ev => {
    const act = ev.target.closest('[data-act]');
    if (!act) { if (ev.target === el) close(); return; }
    const a = act.dataset.act;
    if (a === 'close') close();
    else if (a === 'again') { close(); onAgain(); }
    else if (a === 'save') {
      const url = URL.createObjectURL(new Blob([asText()], { type: 'text/plain' }));
      const link = document.createElement('a');
      link.href = url; link.download = 'before-the-law-reflection.txt';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      say('Saved.');
    } else if (a === 'copy') {
      const t = asText();
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject())
        .then(() => say('Copied.'), () => {
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
