/* Insights: small discoveries the player earns by what they do at the gate.
   Each is one sentence that names what just happened, so the reward is
   understanding rather than points. Found ones are remembered between plays
   (per browser), and the journal shows the ones still hidden as "?" - which is
   what sends a student back to try the gate a different way. */
import { playInsight } from './audio.js';

export const INSIGHTS = [
  { id: 'open',     title: 'The open gate',          text: 'Nothing stands in the doorway but a man.' },
  { id: 'threshold',title: 'Words, not walls',        text: 'He did not touch you or block your way. He only spoke.' },
  { id: 'notyet',   title: 'Not yet',                 text: '&#8220;Not yet&#8221; is not &#8220;no&#8221;. It is a promise &#8212; and promises keep people waiting.' },
  { id: 'untried',  title: 'Something untried',       text: 'He takes your gifts so that you will feel you tried everything. Not so that you can enter.' },
  { id: 'fleas',    title: 'The fleas in his collar', text: 'You now know the guard far better than you know the gate.' },
  { id: 'lessfar',  title: 'Less far each time',      text: 'Every attempt to enter has ended sooner than the one before.' },
  { id: 'anger',    title: 'Even the anger goes',     text: 'You cursed aloud once. Now you only mutter. The years have worn that down too.' },
  { id: 'marks',    title: 'Counting',                text: 'You have counted every year, and never once the few steps to the door.' },
  { id: 'memory',   title: 'Nowhere to go back to',   text: 'The longer you wait, the less there is behind you to return to.' },
  { id: 'nothing',  title: 'Nothing left',            text: 'You have given away everything &#8212; even the way home.' },
  { id: 'radiance', title: 'The radiance',            text: 'Only now, as your eyes fail, do you see the light inside.' },
  { id: 'cannot',   title: 'Too late to stand',       text: 'Now that you would go in, your body will not carry you.' },
  { id: 'alone',    title: 'Meant for you alone',     text: 'The entrance was yours. No one else could ever have used it.' },
];

const KEY = 'btl:insights';
let ever = new Set();
try { ever = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) {}
let run = new Set();

const toast = document.getElementById('toast');
const countEl = document.getElementById('jcount');
const queue = [];
let showing = false;

function refreshCount() { if (countEl) countEl.textContent = ever.size + '/' + INSIGHTS.length; }
refreshCount();

export function resetRun() { run = new Set(); }
export function foundThisRun() { return INSIGHTS.filter(i => run.has(i.id)); }

export function unlock(id) {
  if (run.has(id)) return;
  run.add(id);
  const first = !ever.has(id);
  ever.add(id);
  try { localStorage.setItem(KEY, JSON.stringify([...ever])); } catch (e) {}
  refreshCount();
  const ins = INSIGHTS.find(i => i.id === id);
  queue.push({ ins, first });
  if (!showing) next();
  window.__insights = [...run];
}

function next() {
  const item = queue.shift();
  if (!item || !toast) { showing = false; return; }
  showing = true;
  const n = INSIGHTS.indexOf(item.ins) + 1;
  toast.innerHTML = `<span class="k">Insight ${n} of ${INSIGHTS.length}${item.first ? ' &#183; new' : ''}</span>` +
    `<b>${item.ins.title}</b><span class="t">${item.ins.text}</span>`;
  toast.classList.add('in');
  playInsight();
  setTimeout(() => {
    toast.classList.remove('in');
    setTimeout(next, 900);
  }, 6200);
}

/* the journal: everything found on this device, the rest as questions */
export function journalHTML() {
  return '<ol class="journal">' + INSIGHTS.map((i, k) => ever.has(i.id)
    ? `<li class="${run.has(i.id) ? 'now' : ''}"><b>${i.title}</b><span>${i.text}</span></li>`
    : `<li class="locked"><b>?</b><span>Not yet discovered.</span></li>`).join('') + '</ol>' +
    `<p class="jnote">${ever.size === INSIGHTS.length ? 'You have found every insight.' : 'Some insights only appear if you play differently. What did you never try?'}</p>`;
}
