import fs from 'fs';
const P = '../src/game.js';
let s = fs.readFileSync(P, 'utf8');
const sub = (a, b) => { if (!s.includes(a)) throw new Error('NO MATCH: ' + a.slice(0, 60)); s = s.replace(a, b); };

sub("import { stage as sceneStage, closeGate, openGate, snap, LOW } from './scene.js';",
  "import { stage as sceneStage, closeGate, openGate, snap, LOW } from './scene.js';\n" +
  "import { initAudio, nudgeAudio, playGate, playBell, duckForEnding } from './audio.js';");

/* strip the placeholder Web Audio synthesis wholesale */
const a = s.indexOf('/* ---------------- the one sound ----------------');
const b = s.indexOf('/* ---------------- open / restart ---------------- */');
if (a < 0 || b < 0) throw new Error('could not locate the placeholder audio block');
s = s.slice(0, a) + s.slice(b);

sub('  S.busy = true;\n  unlockAudio();', '  S.busy = true;\n  nudgeAudio();');

/* the bell marks the moment the years run out */
sub("      sceneStage(3);\n      document.body.className = 's3';",
  "      sceneStage(3);\n      document.body.className = 's3';\n      playBell();");

/* black fades over 1800ms; duck the drone under it so the gate lands in silence */
sub("  S.over = true;\n  closeGate();\n  black.classList.add('on');",
  "  S.over = true;\n  closeGate();\n  duckForEnding(1800);\n  black.classList.add('on');");

sub('  later(gateCloses, 1900);', '  later(playGate, 1900);');

sub("opening();\n", "initAudio();\nopening();\n");

fs.writeFileSync(P, s);
console.log('game.js wired to Howler; placeholder synthesis removed');
console.log('  residual references to old synth:',
  ['gateCloses', 'unlockAudio', 'actx'].filter(k => s.includes(k)).join(', ') || 'none');
