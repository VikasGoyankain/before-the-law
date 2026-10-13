# An Imperial Message: game plan

> **Status (8 Oct 2026): built.** Text-only version: `imperial-message.html`. 3D
> version: `imperial-message-3d.html`, built from `src/im/` with
> `tools/build-im.mjs`. Hub page: `dist/index.html`. Decisions taken: the
> optional name prompt, the hub, and the German toggle are all in. The target is
> students aged 18–19 on desktops. Still to do: Meshy sculpts (see
> `docs/meshy-prompts.md`; the game uses hand-built figures until then).

A companion to *Before the Law*. It uses the same engine, the same classroom format
(about 12 minutes of play, then reflection) and the same promises: it runs offline
from one file, it has a text-only fallback, and the text lives in one source file.

---

## 1. The parable

**Source.** *Eine kaiserliche Botschaft*. Kafka wrote it in spring 1917 as a passage
inside the longer story *Beim Bau der chinesischen Mauer* ("Building the Great Wall
of China"). It was published on its own in the Prague Jewish weekly *Selbstwehr*
(24 Sept 1919) and in the collection *Ein Landarzt* (A Country Doctor, 1919/20). The
German is in the public domain. Published English translations mostly are not, so we
write our own adaptation, as we did for *Before the Law*.

**What happens, beat by beat** (my summary, not a translation):

1. The Emperor has sent a message to **you**, which is how the story is told. You are
   his lone, wretched subject, a tiny shadow that has fled to the farthest distance
   from the imperial sun. The message comes from his deathbed.
2. He makes the messenger kneel and **whispers** the message into his ear. It matters
   so much to him that he makes the messenger whisper it back, then **nods**: correct.
3. The whole court watches him die. The walls have been knocked down and the great
   people of the empire stand in a ring on the wide stairs. In front of all of them,
   he sends the messenger off.
4. The messenger is **strong and tireless**. He pushes through the crowd one arm after
   the other. When someone blocks him, he points to the **sign of the sun on his
   chest** and they let him pass. He moves easily, as no one else could.
5. **But the crowds are too large. Their homes never end.** If he had open fields in
   front of him he would fly, and soon you would hear **his fists knocking on your
   door**. Instead he struggles for nothing. He is still in the innermost chambers and
   will never get through them. If he did, he would only gain the **stairs**, then the
   **courtyards**, then the **second palace** that surrounds the first, then stairs and
   courtyards again, then another palace, **and so on for thousands of years.**
6. And if he ever burst through the outermost gate (*"but never, never can that
   happen"*), the capital would lie in front of him: the centre of the world, piled
   high with its own sediment. **Nobody gets through here, least of all with a message
   from a dead man.**
7. **But you sit at your window when evening falls and dream the message to yourself.**

**Context worth one card in the game.** Emperor Franz Joseph died in November 1916
after ruling Kafka's empire for 68 years. Kafka wrote this a few months later. In the
frame story, villagers in a far province worship emperors who died centuries ago and
treat old news as new, because the empire is too big for news to arrive. It is
context, not "the answer".

**Readings a student should come across** (the game hints at them; it never settles
on one):

| Reading | Core idea |
|---|---|
| Power and distance | Between the centre of power and one person there is too much structure: crowds, buildings, layers of officials. |
| Communication | No one in the story is the villain. The message fails because of scale and accumulation, not because anyone stops it. |
| Religious / metaphysical | A revelation from a dying (dead?) god that never reaches the believer. It was published in a Zionist weekly, so messianic waiting is part of the context. |
| Existential | Meaning does not come from outside; we "dream it ourselves". Is that consolation or illusion? |
| Hope vs futility | The ending is ambiguous on purpose: sad, beautiful, or both. |
| Form | The sentences pile clause on clause, each enclosure leading to another, and the outcome is told in "if" and "never". The grammar acts out the meaning. |

**Mirror of *Before the Law*.** That is the key insight for students who play both:

> In *Before the Law* you go to the source and **cannot get in**.
> In *An Imperial Message* the source comes to you and **cannot get out**.
> Both doors and both messages were meant **only for you**.

---

## 2. What a first-time student must leave with

1. **The message was for me personally.** The game addresses the player by name.
2. **Nobody is the enemy; the size of everything is.** Crowds, homes, palaces, time.
3. **It can never arrive.** The sender is already dead by the time it would.
4. **The ending turns everything around.** At the window you make the meaning
   yourself. The game asks whether that is hope or self-deception, and does not
   answer.

---

## 3. Core idea and pillars

**One-line pitch.** *You carry a message you can't read to someone you are, it turns
out, yourself.* You play the messenger, and in the last act the camera turns around:
you are the person at the window.

**Pillars.** These are kept as strictly as the ENTER rule in *Before the Law*, and
the test harness checks them.

1. **RUN always works.** The forward action is never disabled, is always in the same
   place, and always moves you forward. The world simply never runs out. This is the
   equivalent of the ENTER rule.
2. **The message does not exist.** The source code contains no message string. The
   whispered glyphs are generated fresh each run and never decoded. The harness
   searches the build for any such string. It is a good reveal for teachers: "even
   the game doesn't know."
3. **Second person throughout.** The narration always says "you", as Kafka's does.
4. **Futility through scale, not grind.** No section lasts longer than about 90 s.
   Each one ends in a zoom-out that shows how small the progress was. The player
   always feels local progress while the overall distance grows.
5. **Same technical pillars as before.** The text lives only in the `T` block. The
   game opens by double-click with no network access. There is a text-only fallback.
   Narration is voiced with Kokoro.

---

## 4. Flow (about 12 minutes)

| # | Act | Time | What the player does | What it teaches |
|---|---|---|---|---|
| 0 | **The window (cold open)** | 0:45 | Dusk in a far-off village. A card says: "The Emperor has sent a message to *you*." The player types a name (optional) and it is pressed into a wax seal. | The message is personal |
| 1 | **The deathbed** | 2:00 | First person as the messenger. Hold to **lean in** and hear the whisper. Glyphs glow and fade. **Repeat it back** (a Simon-style tap sequence; you can't fail, and a wrong tap makes him whisper again, slower). He **nods**. The sun sign is fastened to your chest. The court stands in a ring on the stairs, the walls already torn down. | It matters; you hold it but can't read it |
| 2 | **The throng** | 3:00 | **Push through**: alternate ←/→ (A/D, or alternate thumbs on mobile) like swimming strokes. Good rhythm builds momentum. At a dense knot of people, **hold SPACE to show the sun**: the crowd parts in a gold ripple and bows (the power moment). Optional encounters: a chamberlain wants a pass stamped "in the east wing", a family eats supper in the corridor, a child asks what the message says. | Strength, then the first doubt |
| 2b | **Stairs → courtyards** | 1:00 | Stairs are a step-timing rhythm. The courtyards are finally **open ground**: sprint, wind, music swells, and you **hear knocking** (your door, imagined). Then the **second palace wall** rises over the horizon. | "If only he had open fields…" |
| 3 | **And so on, for millennia** | 2:00 | The camera rises. Palace rings spread like **tree rings or a mandala**, and the messenger is a gold spark. Keep holding RUN. A counter speeds up from years to centuries to millennia. Day and night flicker, clothes change, buildings rise on top of buildings ("sediment"). **A bell tolls: the Emperor is dead** and the seal cracks. HUD: *rooms crossed 4,312 · rooms remaining 9,000,000 and rising*. | Scale; the message is now from a dead man |
| 4 | **The gate that never opens** | 1:00 | A "subjunctive" sequence in a desaturated pencil-sketch style. You burst through the outermost gate and the endless capital lies ahead. Then the text and the world **rewind and erase themselves**: *"but never, never can that happen."* You are back in the chambers. | The ending is impossible, and the grammar shows it |
| 5 | **The window** | 2:00 | **The point of view turns around: you are the subject at the window.** Evening, a faint glow far off on the horizon. Look at the road (a pedlar, not him). A **knock**, but it is the shutter in the wind. As the light fades, **dream the message**: the Act 1 glyphs drift in and you compose it by writing freely or by choosing fragments (for students who won't type). Your sealed message closes. | You make the meaning yourself: hope or illusion? |
| 6 | **Reflection** | free | Four questions. Reveals: "You were both the messenger and the one waiting" and "The message never existed, not even in this game's code". The 1916 context card. A diagram mirroring *Before the Law*. The insight journal. | Discussion-ready |

### Insights (10, unlocked by curiosity, as in *Before the Law*)

1. Try to **read the message** on your chest: it was given to you to carry, not to read.
2. **Go back** toward the deathbed: the ring of the great has closed behind you.
3. **Get the pass stamped**: the bureaucracy loop sends you to another queue.
4. **Look out of a palace window**: roofs to the horizon.
5. **Stop running** for 20 s: the crowd closes the gap you made.
6. Show the sun **too often**: people stop bowing because they have seen it before.
7. Hear the **knocking** in the courtyards (it was in your head).
8. Watch the **bell / seal crack**: "a message from a dead man".
9. **Try to keep the dream gate**: it is erased anyway.
10. At the window, **refuse to dream** (leave it blank). That is a valid ending too, and
    it gets its own final line.

---

## 5. Visuals

- **Two palettes, one contrast.** The palace is crowded, warm, gold and vermilion,
  lamp-lit and stifling. The window is cool indigo and silver dusk, open and lonely.
  The tiny gold glow on the horizon at the window is the same gold as the palace.
- **Architecture.** Abstract and stylised, loosely after the nested enclosures of the
  Forbidden City (gates inside walls inside walls). Kafka's China is imaginary, so we
  keep it dreamlike rather than ethnographic and avoid caricature.
- **The crowd.** Faceless robed silhouettes, thousands of them, drawn as instances with
  shader sway. That avoids stereotyping, is cheap to render, and reads as "the
  multitude".
- **The zoom-out.** A powers-of-ten pull-back from the messenger to the room, the
  palace, the rings, the capital, the empire, and finally one lit window at the edge.
  This is the shot students will remember.
- **The subjunctive style** (Act 4): pencil lines, paper grain, no colour, and a rewind
  that peels the strokes away.
- **Text overlay.** Same reveal-one-line-at-a-time system as *Before the Law*,
  voiced.

## 6. Sound

Everything is procedural in `src/audio.js` (CC0, no sourcing), plus Kokoro narration.

| Cue | Where | How |
|---|---|---|
| Laboured breathing, whisper (unintelligible) | Deathbed | Filtered noise with formant sweeps |
| Glyph tones (pentatonic) | Repeat-back | Additive synthesis; each glyph has a pitch, which helps memory and accessibility |
| Crowd murmur that rises with density | Throng | Layered Kokoro babble of nonsense syllables, pitch-shifted |
| Shove thuds, cloth rustle | Push strokes | Noise bursts in rhythm with the player |
| Sun-sign "bloom" plus mass bow | SPACE | A bright swell, then a whoosh of robes |
| Wind and the swelling theme | Courtyards | The score opens up |
| **Knocking on a door** | Courtyards (imagined) / window (shutter) | The same sample both times; the echo is the point |
| Death bell | Millennia | Reuses `bell-oldage` |
| Time-lapse drone that rises in pitch | Millennia | Shepard tone: it rises forever and never arrives, the parable as sound |
| Paper rip and rewind | Gate | Reversed noise |
| Evening crickets, distant dog | Window | Quiet; silence is part of the design |

## 7. Technical plan

- **Layout.** Leave the working *Before the Law* files where they are. Add:
  - `imperial-message.html`: the `T` block (prose) plus the text-only version
  - `src/im/`: `game.js`, `palace.js` (procedural rooms, stairs, courtyards, ring
    generator), `crowd.js` (InstancedMesh crowd plus parting shader), `whisper.js`
    (repeat-back), `window.js`, `dream.js`
  - shared modules reused as they are: reveal, `audio.js`, voice, `insights.js`,
    `reflect.js`
  - the build tools get a `--game im` flag, producing `dist/imperial-message.html`
  - `dist/index.html` becomes a small **"Kafka's Parables" hub** linking both games
    (*Before the Law* moves to `dist/before-the-law.html`)
- **Performance.** 30 fps on school laptops. The crowd has about 2,500 instances
  (600 in LOW). Far palace rings are flat impostor discs. The zoom-out uses fixed
  levels of detail.
- **Harness** (puppeteer, like `play.mjs`): a full run with a frozen clock. It asserts
  that the RUN button is enabled at the same pixel on every screen, that the build
  contains no message string, that all ten insights can be reached, and that the
  text-only version ends.

## 8. Milestones (each one playable and verified before the next)

1. **Text and text-only.** Write the adaptation, the `T` block, and a text-only version
   playable end to end. *You review the prose here.*
2. **Greybox 3D.** Palace generator, crowd, push and sun-sign mechanics, using boxes.
3. **Deathbed** and the whisper repeat-back.
4. **Zoom-out, millennia, subjunctive gate.**
5. **Window, dream composer, reflection, insights.**
6. **Audio and Kokoro voice.**
7. **Models swapped in**, performance and mobile pass, packaging, the hub page, the full
   harness.

## 9. Risks

| Risk | Mitigation |
|---|---|
| "It never ends" feels like a bug or is boring | Short sections, a reveal at the end of each, a time-lapse that takes over, and narration that tells the player it is intended |
| Crowd performance | Instancing, LOW mode, impostors |
| Cultural depiction | Stylised and faceless; a dream China, as Kafka's was |
| Translation copyright | Original adaptation from the public-domain German only |
| Typing at the window (shy students, mobile) | A fragment-picker alternative; leaving it blank is a valid choice |

---

## 10. Assets I need from you

The game works without any of these: I can greybox everything and generate the audio.
The characters are where your input matters most.

### A. 3D characters (same Meshy → Mixamo route as before)

| Character | Suggested Meshy prompt | Mixamo animations |
|---|---|---|
| **Emperor** | "frail ancient emperor lying in a canopy bed, yellow silk robes, thin white beard, eyes half closed, stylised" | lying breathing idle; slight nod (or I animate the head) |
| **Messenger** | "strong tireless royal courier, simple belted tunic, bare forearms, round golden sun emblem on chest, stylised" | kneel, stand up, run, **pushing through crowd**, stair descent, sprint |
| **Courtier / crowd A-C** | "robed palace courtier, long sleeves, hands hidden, simple hat, faceless stylised" (×3 variations) | idle sway, **bow**; the rest is shader-driven |
| **Villager at the window** (optional; the view is first-person) | "humble provincial villager seated at a wooden window, plain clothes, stylised" | sitting idle |

**Licence check.** As far as I know, Meshy's free plan releases models under CC BY 4.0,
and this project's rule is "CC0, MIT, or original only". Please confirm which plan the
*Before the Law* models came from, and generate these on the same terms.

### B. Not strictly needed, but welcome

- Real recordings of a **gong or temple bell, a wooden door knock, a crowd in a
  hall**, but only if they are CC0 or your own. Otherwise I synthesise them.
- **Your voice, or a teacher's**, for the narration instead of Kokoro, if you prefer a
  human voice.

### C. Decisions for you (my recommendation first)

1. **Name prompt at the start.** *Recommended: yes, optional, stored only in the page.*
   It makes "the message is for you" hit hard.
2. **Repo layout.** *Recommended: add it alongside, plus a "Kafka's Parables" hub at
   `dist/index.html`.* The alternative is a separate repo.
3. **German original toggle** (public domain) on the reflection page, for language
   and literature classes? *Recommended: yes.*
4. **Classroom details.** Age or grade, typical devices (Chromebooks? phones?),
   whether teachers want a printable worksheet, and whether your syllabus uses a
   particular translation (we can't copy it, but I can match its key words).
