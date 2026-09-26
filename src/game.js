/* Before the Law - game logic over the 3D stage.
   Text comes from text.gen.js, extracted from before-the-law.html.
   Visual transitions are delegated to scene.js; there is no second
   transition system here. */
import { T } from './text.gen.js';
import { stage as sceneStage, closeGate, openGate, snap, LOW } from './scene.js';
import { initAudio, nudgeAudio, playGate, playBell, duckForEnding } from './audio.js';

var CHOICES = {
  1: [
    { id: 'ask', label: 'Ask to be admitted' },
    { id: 'look', label: 'Look through the gate' },
    { id: 'enter', label: 'Enter', enter: true },
  ],
  2: [
    { id: 'ask', label: 'Ask to be admitted' },
    { id: 'offer', label: 'Offer him what you have' },
    { id: 'study', label: 'Study the doorkeeper' },
    { id: 'enter', label: 'Enter', enter: true },
  ],
  3: [
    { id: 'question', label: 'Ask the question you have never asked' },
    { id: 'enter', label: 'Enter', enter: true },
  ],
};

var S;
function reset() { S = { years: 0, asked: 0, waitAsks: 0, enterTurn: 0, shown: 1, busy: true, over: false }; }
function stageOf() { return S.years >= 40 ? 3 : S.years >= 3 ? 2 : 1; }

var tableau = document.getElementById('tableau');
var textEl = document.getElementById('text');
var choices = document.getElementById('choices');
var yearsEl = document.getElementById('years');
var black = document.getElementById('black');
var finalEl = document.getElementById('final');
var againEl = document.getElementById('again');

var timers = [];
function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
function clearTimers() { timers.forEach(clearTimeout); timers = []; }

/* ---------------- reveal: one line at a time, with real pauses ---------------- */
function reveal(lines, done) {
  textEl.classList.remove('out');
  textEl.innerHTML = '';
  var i = 0;
  (function next() {
    if (i >= lines.length) { later(done, 800); return; }
    var p = document.createElement('p');
    p.className = 'line';
    p.innerHTML = lines[i];
    textEl.appendChild(p);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { p.classList.add('in'); });
    });
    var wait = 950 + Math.min(2900, p.textContent.length * 27);
    i++;
    later(next, wait);
  })();
}

function fadeOutText(cb) {
  if (!textEl.firstChild) { later(cb, 300); return; }
  textEl.classList.add('out');
  later(function () {
    textEl.innerHTML = '';
    textEl.classList.remove('out');
    later(cb, 600);
  }, 1550);
}

/* ENTER is always last, and the list is bottom-anchored, so it occupies the
   identical pixel in every scene. It is never disabled and never restyled. */
function showChoices() {
  var list = CHOICES[stageOf()];
  choices.innerHTML = '';
  list.forEach(function (c) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = c.label;
    if (c.enter) b.className = 'enter';
    b.addEventListener('click', function () { choose(c); });
    choices.appendChild(b);
  });
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { choices.classList.add('in'); });
  });
}
function hideChoices() { choices.classList.remove('in'); }
function updateYears() { yearsEl.textContent = S.years + (S.years === 1 ? ' year' : ' years'); }

/* ---------------- turns ---------------- */
function nextEnterLines() {
  /* first press gets the doorkeeper's speech; after that the player is only
     ever talking themselves back down */
  if (S.enterTurn === 0) { S.enterTurn = 1; return T.s1enter; }
  var idx = (S.enterTurn - 1) % 3;
  S.enterTurn++;
  return T.s2enter[idx];
}

function respond(st, c) {
  if (st === 1) {
    if (c.id === 'ask') { S.asked++; return { years: 1, lines: T.s1ask }; }
    if (c.id === 'look') return { years: 1, lines: T.s1look };
    return { years: 1, lines: nextEnterLines() };
  }
  if (c.id === 'ask') {
    S.asked++; S.waitAsks++;
    return { years: 2, lines: T.s2ask[Math.min(S.waitAsks, 5) - 1] };
  }
  if (c.id === 'offer') return { years: 3, lines: T.s2offer };
  if (c.id === 'study') return { years: 4, lines: T.s2study };
  return { years: 2, lines: nextEnterLines() };
}

function choose(c) {
  if (S.busy || S.over) return;
  S.busy = true;
  nudgeAudio();
  var st = stageOf();

  if (st === 3) {
    hideChoices();
    if (c.id === 'enter') {
      fadeOutText(function () {
        reveal(T.s3enter, function () { showChoices(); S.busy = false; });
      });
    } else {
      fadeOutText(ending);
    }
    return;
  }

  var r = respond(st, c);
  hideChoices();
  fadeOutText(function () {
    S.years += r.years;
    updateYears();
    if (stageOf() === 2 && S.shown === 1) { S.shown = 2; sceneStage(2); document.body.className = 's2'; }
    reveal(r.lines, function () {
      if (stageOf() === 3 && S.shown !== 3) { S.shown = 3; oldAge(); }
      else { showChoices(); S.busy = false; }
    });
  });
}

/* ---------------- scene 3 ---------------- */
function oldAge() {
  later(function () {
    fadeOutText(function () {
      sceneStage(3);
      document.body.className = 's3';
      playBell();
      /* let the 3D transition settle before the text arrives */
      later(function () {
        reveal(T.s3, function () { showChoices(); S.busy = false; });
      }, 2800);
    });
  }, 1500);
}

function ending() {
  S.busy = true;
  reveal(T.s3question, function () { later(blackout, 1500); });
}

function blackout() {
  S.over = true;
  closeGate();
  duckForEnding(1800);
  black.classList.add('on');
  yearsEl.classList.add('gone');
  tableau.classList.remove('in');
  later(playGate, 1900);
  later(function () {
    finalEl.innerHTML = 'You were there <b>' + S.years + '</b> years. The gate was never locked.';
    finalEl.classList.add('in');
    later(function () { againEl.classList.add('in'); }, 5000);
  }, 7500);
  window.__ended = true;
  window.__endedAt = Date.now();
}

/* ---------------- open / restart ---------------- */
function opening() {
  reset();
  updateYears();
  document.body.className = 's1';
  snap(1);
  openGate();
  tableau.classList.add('in');
  later(function () {
    reveal(T.open, function () { showChoices(); S.busy = false; });
  }, 2500);
}

againEl.addEventListener('click', function () {
  againEl.classList.remove('in');
  finalEl.classList.remove('in');
  clearTimers();
  window.__ended = false;
  setTimeout(function () {
    textEl.innerHTML = '';
    textEl.classList.remove('out');
    choices.innerHTML = '';
    choices.classList.remove('in');
    finalEl.innerHTML = '';
    yearsEl.classList.remove('gone');
    black.classList.remove('on');
    setTimeout(opening, 2100);
  }, 1500);
});

initAudio();
opening();

/* test hooks for the headless harness */
window.__game = {
  state: function () { return S; },
  stageOf: stageOf,
  labels: function () {
    return Array.prototype.map.call(choices.querySelectorAll('button'), function (b) { return b.textContent; });
  },
  press: function (label) {
    var bs = choices.querySelectorAll('button');
    for (var i = 0; i < bs.length; i++) if (bs[i].textContent === label) { bs[i].click(); return true; }
    return false;
  },
  ready: function () { return !S.busy && !S.over; },
  text: function () { return textEl.textContent; },
  final: function () { return finalEl.textContent; },
  low: LOW,
};
