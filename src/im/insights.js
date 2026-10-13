/* Insights: one-sentence discoveries the player earns by what they try.
   Same idea as in "Before the Law": the reward is understanding, not
   points. Found ones are remembered between plays on this device, and the
   journal shows the rest as "?". */
import * as A from './sound.js';

export const INSIGHTS = [
  { id: 'carry', title: 'Not his to read', text: 'The messenger knows every word and understands none of it. He was given the message to carry, not to read.' },
  { id: 'dwellings', title: 'People live here', text: 'The crowd is not an army. It is families, beds and suppers. The palace is where they live, and their homes never end.' },
  { id: 'sun', title: 'The sign works', text: 'The sun on his chest opens every way he shows it to. There are simply more ways than he could ever open.' },
  { id: 'closed', title: 'Closed like water', text: 'Behind him the crowd has already closed again. There is no way back either.' },
  { id: 'standstill', title: 'Standing still', text: 'Stop, and the crowd fills the space you made. Running is how he stays where he is.' },
  { id: 'roofs', title: 'Roofs to the edge of the sky', text: 'Seen from the innermost palace, the palace is the whole world.' },
  { id: 'knock', title: 'Only imagined', text: 'The knocking on your door is only ever an &#8220;if&#8221;. It happens in the story&#8217;s imagination, and in yours.' },
  { id: 'dead', title: 'A dead man&#8217;s message', text: 'The man who sent it is gone. The message is still on its way, and now there is no one to ask what it meant.' },
  { id: 'if', title: 'Only &#8220;if&#8221;', text: 'The stairs, the courtyards, the palaces and the gate were all &#8220;if&#8221;. Most of the story is spent on things that never happen.' },
  { id: 'still', title: 'Still running', text: 'He has not stopped, and he never will. The story does not end; it just stops watching him.' },
  { id: 'waiting', title: 'Waiting is work', text: 'You watched the road, you listened, you looked toward the capital. Waiting is something you do, not only something that happens to you.' },
  { id: 'blank', title: 'Left unwritten', text: 'You did not make up a message. Kafka never wrote one either.' },
];

const KEY = 'im:insights';
let ever = new Set();
try { ever = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) {}
let run = new Set();
const toast = document.getElementById('toast');
const countEl = document.getElementById('jcount');
const queue = [];
let showing = false;
function refresh() { if (countEl) countEl.textContent = ever.size + '/' + INSIGHTS.length; }
refresh();

export function resetRun() { run = new Set(); window.__insights = []; }
export function foundThisRun() { return INSIGHTS.filter(i => run.has(i.id)); }
export function has(id) { return run.has(id); }
export function unlock(id) {
  if (run.has(id)) return;
  run.add(id);
  const first = !ever.has(id);
  ever.add(id);
  try { localStorage.setItem(KEY, JSON.stringify([...ever])); } catch (e) {}
  refresh();
  queue.push({ ins: INSIGHTS.find(i => i.id === id), first });
  if (!showing) next();
  window.__insights = [...run];
}
function next() {
  const item = queue.shift();
  if (!item || !toast) { showing = false; return; }
  showing = true;
  const n = INSIGHTS.indexOf(item.ins) + 1;
  toast.innerHTML = `<span class="k">Insight ${n} of ${INSIGHTS.length}${item.first ? ' &#183; new' : ''}</span><b>${item.ins.title}</b><span class="t">${item.ins.text}</span>`;
  toast.classList.add('in');
  A.insight();
  setTimeout(() => { toast.classList.remove('in'); setTimeout(next, 900); }, 6200);
}
export function journalHTML() {
  return '<ol class="journal">' + INSIGHTS.map(i => ever.has(i.id)
    ? `<li class="${run.has(i.id) ? 'now' : ''}"><b>${i.title}</b><span>${i.text}</span></li>`
    : '<li class="locked"><b>?</b><span>Not yet discovered.</span></li>').join('') + '</ol>' +
    `<p class="jnote">${ever.size === INSIGHTS.length ? 'You have found every insight.' : 'Some insights only appear if you play differently. What did you never try?'}</p>`;
}
