/* Before the Law - game logic over the 3D stage.
   Text comes from text.gen.js, extracted from before-the-law.html.
   The player is the man from the country: the camera is his eyes, and every
   choice is followed by its years, which the scene plays out. Visual
   transitions live in scene.js; sound in audio.js; there is no second
   transition system here. */
import { T } from './text.gen.js';
import * as stage3d from './scene.js';
import * as A from './audio.js';
import { openReflection, reflectionOpen } from './reflect.js';
import { unlock, resetRun, foundThisRun, journalHTML } from './insights.js';
import { buildPrologue } from './prologue3d.js';

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
function reset() {
  S = {
    years: 0, asked: 0, looks: 0, studies: 0, enters: 0, strains: 0,
    waitAsks: 0, enterTurn: 0, gifts: [], given: {}, offeredNone: 0,
    seated: false, shown: 1, busy: true, over: false, phase: 'intro', t0: Date.now(),
    curses: 0, remembered: 0, marking: 0, ch: {},
  };
}
reset();
function stageOf() { return S.years >= 40 ? 3 : S.years >= 3 ? 2 : 1; }
function setPhase(p) { S.phase = p; document.body.dataset.phase = p; }

var $ = function (id) { return document.getElementById(id); };
var tableau = $('tableau'), textEl = $('text'), choices = $('choices'), yearsEl = $('years');
var black = $('black'), finalEl = $('final'), againEl = $('again'), toReflect = $('toReflect'), toHome = $('toHome'), thanksEl = $('thanks');
var intro = $('intro'), beginEl = $('begin'), aboutEl = $('about'), hint = $('hint');
var pro = $('prologue'), proArt = $('proArt'), proText = $('proText'), proSkip = $('proSkip');
var chapterEl = $('chapter'), fadeEl = $('fade');
var voiceBtn = $('voiceBtn'), soundBtn = $('soundBtn'), journalBtn = $('journalBtn'), journal = $('journal');

var timers = [];
function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
function clearTimers() { timers.forEach(clearTimeout); timers = []; }

/* ---------------- reveal: one line at a time ----------------
   With the voice on, each line waits for its speaker; with it off, for a
   reading pause. A click or the space bar hurries it either way: the pauses
   are for the first reading, not for the third time through in a classroom. */
var hurryNow = null;
function reveal(lines, done, onLine, into) {
  var box = into || textEl;
  box.classList.remove('out');
  box.innerHTML = '';
  A.preload(lines);
  var i = 0, skip = false, pend = null, token = 0;
  hurryNow = function () { if (skip) return; skip = true; token++; A.hush(); clearTimeout(pend); next(); };
  function next() {
    if (i >= lines.length) { hurryNow = null; pend = later(done, skip ? 300 : 700); return; }
    var p = document.createElement('p');
    p.className = 'line';
    p.innerHTML = lines[i];
    box.appendChild(p);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { p.classList.add('in'); });
    });
    if (onLine) onLine(i);
    var line = lines[i], wait = 950 + Math.min(2900, p.textContent.length * 27);
    i++;
    if (skip) { next(); return; }
    var my = ++token;
    A.speak(line).then(function (spoken) {
      if (my !== token || skip) return;
      pend = later(next, spoken ? 550 : wait);
    });
  }
  next();
}
function hurry() { if (hurryNow) hurryNow(); }

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
function button(label, cls, fn) {
  var b = document.createElement('button');
  b.type = 'button';
  b.innerHTML = label;
  if (cls) b.className = cls;
  b.addEventListener('click', function () { A.playChoose(); fn(); });
  b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') A.playHover(); });
  return b;
}
function present() {
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { choices.classList.add('in'); });
  });
}
/* The long middle of the story changes under you. The choices of the first
   years give way to the ones Kafka gives the man later: cursing, then only
   grumbling; remembering; counting. Enter never moves. */
var LABELS = {
  ask: 'Ask to be admitted', offer: 'Offer him what you have', study: 'Study the doorkeeper',
  remember: 'Remember home',
  curse: function () { return S.years >= 24 ? 'Grumble to yourself' : 'Curse your fate'; },
  mark: function () { return S.marking ? 'Scratch another mark' : 'Count the years'; },
};
function choicesFor(st) {
  if (st !== 2) return CHOICES[st];
  var y = S.years, ids;
  if (y < 12) ids = ['ask', 'offer', 'study'];
  else if (y < 24) ids = ['curse', 'remember', 'mark'].concat(remaining().length ? ['offer'] : []);
  else ids = ['curse', 'study', S.remembered < 3 ? 'remember' : 'ask', 'mark'];
  return ids.map(function (id) {
    var l = LABELS[id];
    return { id: id, label: typeof l === 'function' ? l() : l };
  }).concat([CHOICES[2][3]]);
}
/* the years go faster as you get older */
function cost(n) { return Math.max(1, Math.round(n * (1 + Math.max(0, S.years - 3) / 15))); }

function showChoices() {
  var list = choicesFor(stageOf());
  choices.innerHTML = '';
  list.forEach(function (c) {
    choices.appendChild(button(c.label, c.enter ? 'enter' : '', function () { choose(c); }));
  });
  present();
}
function hideChoices() { choices.classList.remove('in'); }
function ready() { showChoices(); S.busy = false; }
function updateYears() { yearsEl.textContent = S.years + (S.years === 1 ? ' year' : ' years'); }

/* what is still in your bundle */
function remaining() { return T.gifts.filter(function (g) { return !S.given[g.id]; }); }

function showGifts() {
  choices.classList.remove('in');
  later(function () {
    choices.innerHTML = '';
    var q = document.createElement('p');
    q.className = 'ask'; q.textContent = 'What will you give him?';
    choices.appendChild(q);
    var grid = document.createElement('div');
    grid.className = 'gifts';
    remaining().forEach(function (g) {
      grid.appendChild(button(g.label, 'gift', function () { give(g); }));
    });
    choices.appendChild(grid);
    choices.appendChild(button('Keep what you have', 'back', function () {
      if (S.busy) return;
      choices.classList.remove('in');
      later(showChoices, 450);
    }));
    choices.appendChild(button('Enter', 'enter', function () { choose(CHOICES[2][3]); }));
    present();
    S.busy = false;
  }, 450);
}

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
    S.looks++; return { years: 1, lines: T.s1look };
  }
  if (c.id === 'ask') {
    S.asked++; S.waitAsks++;
    return { years: cost(2), lines: T.s2ask[Math.min(S.waitAsks, 5) - 1] };
  }
  if (c.id === 'offer') { S.offeredNone++; return { years: cost(2), lines: T.s2offerNone }; }
  S.studies++;
  return { years: cost(4), lines: T.s2study };
}

function choose(c) {
  if (S.busy || S.over) return;
  S.busy = true;
  A.nudgeAudio();
  var st = stageOf();
  hideChoices();

  if (st === 3) {
    if (c.id === 'enter') {
      S.strains++;
      stage3d.cannotStand();
      A.heartbeat(true, 70, 52, 3);
      later(A.heartbeatOff, 3000);
      fadeOutText(function () { reveal(T.s3enter, function () { unlock('cannot'); ready(); }); });
    } else {
      fadeOutText(ending);
    }
    return;
  }

  if (c.id === 'offer' && remaining().length) { showGifts(); return; }

  if (c.id === 'enter') {
    /* you get up and walk toward it. Each attempt gets less far than the
       last, and the heart knows it before you do. */
    S.enters++;
    var lines = nextEnterLines();
    var reach = Math.max(0.3, 1 - 0.2 * (S.enters - 1));
    var years = st === 1 ? 1 : cost(2);
    textEl.classList.add('out');
    A.heartbeat(true, 66, 66 + 46 * reach, (S.seated ? 1.3 : 0) + 1.2 + 2.6 * reach);
    var speech = lines === T.s1enter;
    stage3d.approach(S.seated, reach, function () {
      reveal(lines, function () {
        A.heartbeatOff();
        unlock('threshold');
        if (S.enters >= 3) unlock('lessfar');
        stage3d.sitDown(function () { S.seated = true; passTime(years); });
      }, function (i) {
        /* "in each hall beyond this one stands another, each more terrible
           than the last": you see them, or think you do */
        if (!speech) return;
        if (i === 1) { stage3d.lookIntoHall(); stage3d.imagine(true); A.playVision(); }
        if (i === 2) { stage3d.imagine(false); stage3d.lookAtKeeper(); }
      });
    });
    return;
  }

  if (c.id === 'curse') {
    S.curses++;
    var late = S.years >= 24;
    fadeOutText(function () {
      if (!late) { stage3d.shout(); A.playEcho(); }
      reveal(late ? T.grumble : T.curse, function () {
        if (late) unlock('anger');
        passTime(cost(3));
      });
    });
    return;
  }
  if (c.id === 'remember') { remember(); return; }
  if (c.id === 'mark') {
    var first = !S.marking;
    S.marking++;
    textEl.classList.add('out');
    if (first) stage3d.startMarks();
    A.playScratch();
    stage3d.glanceMarks(function () {
      reveal(T.mark[first ? 0 : 1], function () {
        if (!first) unlock('marks');
        passTime(cost(2));
      });
    });
    return;
  }

  var r = respond(st, c);
  if (c.id === 'look') {
    /* you lean past him into the doorway; the hall answers from very far off */
    textEl.classList.add('out');
    A.playHallDepth();
    stage3d.peer(function () {
      reveal(r.lines, function () {
        unlock('open');
        stage3d.home(false, function () { passTime(r.years); });
      });
    });
    return;
  }
  if (c.id === 'study') {
    textEl.classList.add('out');
    stage3d.study(function () {
      reveal(r.lines, function () {
        unlock('fleas');
        stage3d.home(true, function () { passTime(r.years); });
      });
    });
    return;
  }
  fadeOutText(function () {
    reveal(r.lines, function () {
      if (S.asked >= 3) unlock('notyet');
      passTime(r.years);
    });
  });
}

function give(g) {
  if (S.busy || S.over) return;
  S.busy = true;
  S.given[g.id] = true;
  S.gifts.push(g.label);
  hideChoices();
  var lines = [g.line, S.gifts.length === 1 ? T.s2offer[0] : T.s2offerAgain[0]];
  /* the last thing goes, and with it the story's own summary */
  if (!remaining().length) lines.push(T.s2offer[1]);
  /* you look down and set it at his feet */
  textEl.classList.add('out');
  later(A.playGive, 1150);
  if (g.id === 'watch') later(function () { A.playWatch(5); }, 1300);
  stage3d.glance(g.id, function () {
    reveal(lines, function () {
      unlock('untried');
      if (!remaining().length) unlock('nothing');
      passTime(cost(3));
    });
  });
}

/* the years a choice cost, played out: the counter climbs, a tick for each
   year, as the light wheels over and the winters come down */
function passTime(n) {
  var ms = stage3d.timelapse(n, true);
  A.playYears(ms);
  var start = S.years;
  for (var k = 1; k <= n; k++) {
    (function (k) {
      later(function () {
        S.years = start + k;
        updateYears();
        stage3d.setYears(S.years);
        A.playYearTick();
      }, (ms * k) / (n + 0.5));
    })(k);
  }
  later(afterTime, ms + 350);
}

function afterTime() {
  var st = stageOf();
  if (st === 2 && S.shown === 1) {
    S.shown = 2;
    stage3d.stage(2);
    A.setMood('wait');
    A.setWind(0.025);
    document.body.className = 's2';
    /* "the doorkeeper gives him a little stool": you watch him do it */
    fadeOutText(function () {
      chapter(3, 'The stool', function () {
        var n = 0, both = function () { if (++n === 2) ready(); };
        stage3d.giveStool(S.seated, function () { S.seated = true; both(); });
        later(function () { reveal(T.s2stool, both); }, 2500);
      });
    });
    return;
  }
  if (st === 3 && S.shown !== 3) { S.shown = 3; oldAge(); return; }
  var marks = [[12, 'The long years'], [24, 'Growing old']];
  for (var m = 0; m < marks.length; m++) {
    if (S.years >= marks[m][0] && !S.ch[marks[m][0]]) {
      S.ch[marks[m][0]] = true;
      fadeOutText(function () { chapter(S.years, marks[m][1], ready); });
      return;
    }
  }
  ready();
}

/* ---------------- scene 3 ---------------- */
function oldAge() {
  later(function () {
    fadeOutText(function () {
      stage3d.stage(3);
      stage3d.goAged();
      document.body.className = 's3';
      A.playBell();
      A.setMood('radiance');
      A.setWind(0.012);
      /* let the 3D transition settle before the text arrives */
      later(function () { chapter(S.years, 'The radiance', function () { reveal(T.s3, function () { unlock('radiance'); ready(); }); }); }, 1800);
    });
  }, 900);
}

function ending() {
  S.busy = true;
  reveal(T.s3question, function () { unlock('alone'); later(blackout, 2200); }, function (i) {
    /* "he bends down to you, very far down" */
    if (i === 0) stage3d.bendDown();
  });
}

/* You leave the body; he leaves the gate; the gate closes. Then the dark. */
function blackout() {
  S.over = true;
  setPhase('end');
  textEl.classList.add('out');
  tableau.classList.remove('in');
  yearsEl.classList.add('gone');
  stage3d.endSequence();
  A.duckForEnding(4200);
  later(A.playGate, 3200);
  later(function () { black.classList.add('on'); }, 6600);
  later(function () {
    finalEl.innerHTML = 'You were there <b>' + S.years + '</b> years. The gate was never locked.';
    finalEl.classList.add('in');
    later(function () {
      againEl.classList.add('in'); toReflect.classList.add('in'); toHome.classList.add('in'); thanksEl.classList.add('in');
      toReflect.focus({ preventScroll: true });
    }, 5000);
  }, 11000);
  window.__ended = true;
  window.__endedAt = Date.now();
}

/* a chapter card: the year, and a name for what the years have become */
function chapter(year, title, done) {
  chapterEl.innerHTML = '<span>Year ' + year + '</span><b>' + title + '</b>';
  chapterEl.classList.add('in');
  later(function () { chapterEl.classList.remove('in'); later(done, 900); }, 3200);
}
function fade(on, done) { fadeEl.classList.toggle('on', on); later(done || function () {}, 900); }

/* "Remember home": back to the village of the prologue, which is a little
   more lost each time you go */
function remember() {
  var k = Math.min(S.remembered, 2);
  S.remembered++;
  fadeOutText(function () {
    fade(true, function () {
      if (!P) P = buildPrologue(stage3d.LOW);
      stage3d.lend(P);
      P.remember(k);
      document.body.classList.add('memory');
      fade(false, function () {
        reveal(T.remember[k], function () {
          later(function () {
            fade(true, function () {
              stage3d.reclaim();
              document.body.classList.remove('memory');
              textEl.innerHTML = '';
              fade(false, function () {
                if (k === 2) unlock('memory');
                passTime(cost(3));
              });
            });
          }, 1200);
        });
      });
    });
  });
}

function record() {
  return {
    years: S.years, asked: S.asked, looks: S.looks, studies: S.studies, enters: S.enters,
    gifts: S.gifts.slice(), giftsTotal: T.gifts.length, offeredNone: S.offeredNone,
    minutes: Math.round((Date.now() - S.t0) / 60000),
    insights: foundThisRun(),
  };
}

/* ---------------- the prologue ----------------
   Who you are, what you have heard, what you carry, how far you came - so
   that the gate means something when you reach it. Each card is spoken;
   any click moves on, and "skip" goes straight to the road. */
var ART = ['village', 'man', 'pack', 'road'];
var proCard = -1, P = null;
function begin() {
  if (S.phase !== 'intro') return;
  A.initAudio();
  A.nudgeAudio();
  intro.classList.add('gone');
  later(function () { intro.hidden = true; }, 1600);
  setPhase('prologue');
  document.body.classList.add('chrome');
  A.setMood('prologue');
  A.setWind(0.03);
  /* built on demand: nobody who never presses Begin pays for the village */
  if (!P) P = buildPrologue(stage3d.LOW);
  stage3d.lend(P);
  pro.hidden = false;
  requestAnimationFrame(function () { pro.classList.add('in'); });
  later(function () { card(0); }, 900);
}

function card(n) {
  if (S.phase !== 'prologue') return;
  if (n >= T.prologue.length) { endPrologue(); return; }
  proCard = n;
  pro.dataset.art = ART[n];
  P.show(n);
  proArt.querySelectorAll('.art').forEach(function (a) { a.classList.toggle('on', a.dataset.art === ART[n]); });
  if (ART[n] === 'pack') packItems();
  reveal(T.prologue[n], function () { later(function () { nextCard(n); }, 900); }, function (i) {
    /* "and then, in the dark, you see it" */
    if (ART[n] === 'road' && i === 1) P.nightfall();
  }, proText);
}
function nextCard(n) {
  if (proCard !== n || S.phase !== 'prologue') return;
  proCard = -1;
  proText.classList.add('out');
  later(function () { card(n + 1); }, 1100);
}
/* the six things go into the bundle one at a time, as they are named */
function packItems() {
  var list = proArt.querySelector('.items');
  list.innerHTML = '';
  T.gifts.forEach(function (g, i) {
    var li = document.createElement('li');
    li.innerHTML = g.label.replace(/^(Your|The) /, '');
    list.appendChild(li);
    later(function () { li.classList.add('in'); P.placeItem(g.id); A.playPack(i); }, 3600 + i * 900);
  });
}
function endPrologue() {
  if (S.phase !== 'prologue') return;
  A.hush();
  hurryNow = null;
  clearTimers();
  pro.classList.remove('in');
  setTimeout(function () { pro.hidden = true; proText.innerHTML = ''; }, 1400);
  stage3d.reclaim();
  startWalk();
}

/* ---------------- the walk in ---------------- */
function startWalk() {
  reset();
  resetRun();
  updateYears();
  document.body.className = 's1 chrome';
  stage3d.reset();
  setPhase('walk');
  A.setMood('prologue');
  A.setWind(0.05);
  tableau.classList.add('in');
  stage3d.startWalk(arrive);
  later(function () { if (S.phase === 'walk') hint.classList.add('in'); }, 1800);
  /* nobody should be stuck on the road: if they never press, walk them in */
  later(function () { if (S.phase === 'walk' && stage3d.walkProgress() < 0.05) stage3d.finishWalk(); }, 30000);
}

function arrive() {
  setPhase('play');
  hint.classList.remove('in');
  stage3d.holdWalk(false);
  A.setMood('arrive');
  A.setWind(0.035);
  later(function () { reveal(T.open, ready); }, 900);
}

/* ---------------- settings and journal ---------------- */
function paintSettings() {
  voiceBtn.textContent = 'Voice ' + (A.voiceEnabled() ? 'on' : 'off');
  voiceBtn.hidden = !A.voiceAvailable();
  soundBtn.textContent = 'Sound ' + (A.soundOn() ? 'on' : 'off');
}
voiceBtn.addEventListener('click', function () { A.setVoice(!A.voiceEnabled()); paintSettings(); });
soundBtn.addEventListener('click', function () { A.setSound(!A.soundOn()); paintSettings(); });
function toggleJournal(open) {
  var on = open === undefined ? journal.hidden : open;
  if (on) {
    journal.querySelector('.body').innerHTML = journalHTML();
    journal.hidden = false;
    requestAnimationFrame(function () { journal.classList.add('in'); });
  } else {
    journal.classList.remove('in');
    setTimeout(function () { journal.hidden = true; }, 350);
  }
}
journalBtn.addEventListener('click', function () { toggleJournal(); });
journal.addEventListener('click', function (e) { if (e.target === journal || e.target.closest('[data-act=close]')) toggleJournal(false); });
paintSettings();

/* ---------------- input ---------------- */
function onUI(t) { return t.closest && t.closest('button, textarea, a, #reflect, #intro, #journal, #settings'); }
window.addEventListener('pointerdown', function (e) {
  if (onUI(e.target)) return;
  if (S.phase === 'walk') stage3d.holdWalk(true);
  else if (S.phase === 'play') hurry();
  else if (S.phase === 'prologue') { if (hurryNow) hurry(); else nextCard(proCard); }
  drag = e.pointerType !== 'mouse' ? { x: e.clientX, y: e.clientY, lx: lookAt.x, ly: lookAt.y } : null;
});
function release() { stage3d.holdWalk(false); drag = null; }
window.addEventListener('pointerup', release);
window.addEventListener('pointercancel', release);
window.addEventListener('blur', release);

/* the head turns a little toward the pointer; on touch, drag to look */
var lookAt = { x: 0, y: 0 }, drag = null;
window.addEventListener('pointermove', function (e) {
  var w = window.innerWidth, h = window.innerHeight;
  if (e.pointerType === 'mouse') {
    lookAt.x = (e.clientX / w) * 2 - 1; lookAt.y = (e.clientY / h) * 2 - 1;
  } else if (drag) {
    lookAt.x = drag.lx - ((e.clientX - drag.x) / w) * 2.4;
    lookAt.y = drag.ly - ((e.clientY - drag.y) / h) * 2.4;
  } else return;
  stage3d.look(lookAt.x, lookAt.y);
});

/* A finger held on a touch screen is a right-click to Windows and the start of
   a selection to a phone. Here it means walk, run or lean in, so the menu stays shut. */
window.addEventListener('contextmenu', function (e) {
  if (!(e.target.closest && e.target.closest('textarea, input, #reflect'))) e.preventDefault();
});
var WALK_KEYS = { ArrowUp: 1, w: 1, W: 1, ' ': 1 };
window.addEventListener('keydown', function (e) {
  if (reflectionOpen() || S.phase === 'intro') return;
  if (e.key === 'Escape' && !journal.hidden) { toggleJournal(false); return; }
  if (e.target.closest && e.target.closest('textarea')) return;
  if (e.key === 'j' || e.key === 'J') { toggleJournal(); return; }
  if (e.key === 'v' || e.key === 'V') { voiceBtn.click(); return; }
  if (e.key === 'm' || e.key === 'M') { soundBtn.click(); return; }
  if (S.phase === 'prologue' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); if (hurryNow) hurry(); else nextCard(proCard); return; }
  if (S.phase === 'walk' && WALK_KEYS[e.key]) { stage3d.holdWalk(true); e.preventDefault(); return; }
  if (S.phase !== 'play') return;
  if (e.key === ' ' && !(e.target.closest && e.target.closest('button'))) { hurry(); e.preventDefault(); return; }
  /* number keys pick a choice, in on-screen order */
  var n = parseInt(e.key, 10);
  if (n >= 1 && choices.classList.contains('in')) {
    var bs = choices.querySelectorAll('button');
    if (bs[n - 1]) { bs[n - 1].click(); e.preventDefault(); }
  }
});
window.addEventListener('keyup', function (e) {
  if (S.phase === 'walk' && WALK_KEYS[e.key]) stage3d.holdWalk(false);
});

stage3d.setStepHandler(A.playStep);

beginEl.addEventListener('click', begin);
proSkip.addEventListener('click', endPrologue);
aboutEl.addEventListener('click', function () { openReflection(null); });
toReflect.addEventListener('click', function () { openReflection(record(), restart); });
againEl.addEventListener('click', restart);

/* ---------------- restart ---------------- */
function restart() {
  if (S.phase !== 'end') return;
  againEl.classList.remove('in');
  toReflect.classList.remove('in');
  toHome.classList.remove('in');
  thanksEl.classList.remove('in');
  finalEl.classList.remove('in');
  clearTimers();
  window.__ended = false;
  setPhase('restart');
  setTimeout(function () {
    textEl.innerHTML = '';
    textEl.classList.remove('out');
    choices.innerHTML = '';
    choices.classList.remove('in');
    finalEl.innerHTML = '';
    yearsEl.classList.remove('gone');
    A.resumeAfterEnding();
    startWalk();
    setTimeout(function () { black.classList.remove('on'); }, 600);
  }, 1500);
}

setPhase('intro');
stage3d.reset();

/* test hooks for the headless harness */
window.__game = {
  state: function () { return S; },
  stageOf: stageOf,
  phase: function () { return S.phase; },
  begin: begin,
  skipPrologue: endPrologue,
  skipWalk: function () { stage3d.finishWalk(); },
  labels: function () {
    return Array.prototype.map.call(choices.querySelectorAll('button'), function (b) { return b.textContent; });
  },
  press: function (label) {
    var bs = choices.querySelectorAll('button');
    for (var i = 0; i < bs.length; i++) if (bs[i].textContent === label) { bs[i].click(); return true; }
    return false;
  },
  hurry: hurry,
  ready: function () { return S.phase === 'play' && !S.busy && !S.over && choices.classList.contains('in'); },
  text: function () { return textEl.textContent; },
  final: function () { return finalEl.textContent; },
  record: record,
  /* jump to old age, for checking the ending without playing forty years */
  debugAge: function () {
    S.years = 41; S.seated = true; S.shown = 3; updateYears(); stage3d.setYears(41);
    stage3d.showStool(true); stage3d.stage(3); stage3d.placeAt('aged');
    document.body.className = 's3 chrome'; textEl.innerHTML = ''; ready();
  },
  /* show one prologue shot with no narration or timers, for screenshots */
  debugPrologue: function (n, extra) {
    if (!P) P = buildPrologue(stage3d.LOW);
    stage3d.lend(P); intro.hidden = true; P.show(n);
    if (extra === 'items') T.gifts.forEach(function (g) { P.placeItem(g.id); });
    if (extra === 'night') P.nightfall();
  },
  low: stage3d.LOW,
  scene: stage3d,
};
