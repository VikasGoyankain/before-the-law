/* The plain-text files that go out with the site: the README, llms.txt (a
   summary written for AI assistants), robots.txt, the sitemap and the
   not-found page. package.mjs writes them into dist/. */
import { SITE, SITE_NAME, PAGES, AUTHOR_LINE, PROFESSOR, head } from './site.mjs';

const today = () => new Date().toISOString().slice(0, 10);

export const ROBOTS = `# ${SITE_NAME}: everything here may be crawled and indexed.
User-agent: *
Allow: /

Sitemap: ${SITE}sitemap.xml
`;

export const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.values(PAGES).map(p => `  <url><loc>${SITE}${p.path}</loc><lastmod>${today()}</lastmod><priority>${p.priority}</priority></url>`).join('\n')}
</urlset>
`;

/* GitHub Pages serves this for any address that does not exist */
export const NOT_FOUND = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="robots" content="noindex">
<title>Not here | ${SITE_NAME}</title>
<style>
html{background:#0a090b}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:2rem;text-align:center;color:#d8cfbf;
 font:1.0625rem/1.7 Georgia,"Palatino Linotype",serif}
p.k{margin:0 0 1rem;font:.68rem/1.6 ui-sans-serif,system-ui,sans-serif;letter-spacing:.26em;text-transform:uppercase;color:#e8bd6a}
h1{margin:0 0 1rem;font-weight:normal;font-size:clamp(1.8rem,6vw,2.8rem);color:#f1e7d3}
p{margin:0 auto 2rem;max-width:30rem;font-style:italic;color:#b0a594}
a{display:inline-block;border:1px solid #e8bd6a;color:#f1e7d3;text-decoration:none;padding:.9rem 1.8rem;border-radius:2px;
 font:.7rem/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase}
</style></head><body><main>
<p class="k">Not yet</p>
<h1>There is no page behind this door</h1>
<p>The address may have changed. The gate you are looking for is on the home page.</p>
<a href="${SITE}">Home page</a>
</main></body></html>
`;

export const LLMS = `# ${SITE_NAME}: feel Kafka, don't just read him

> Two free browser games that let a student live Franz Kafka's parables "Before the Law" and "An Imperial Message" from the inside, instead of memorising their themes. Each takes one sitting of twelve to fifteen minutes, needs no account or installation, works offline, and ends with background notes and discussion questions. Made by a law student at National Law University, Delhi, for classroom use anywhere.

## The motive

This project has one aim: that students should feel Kafka instead of only reading him.

Kafka's parables are usually taught as a list of ideas to remember: authority, delay, futility, the unreachable. A student can learn those words for an examination without ever feeling what they name. Here the student does not learn the words. They are the man from the country, and they choose to wait at an open gate while the years pass. They are the messenger, and they run through a palace that does not end. The themes arrive as the student's own first-hand experience, and discussion starts from something that happened to them.

A theme that is memorised stays on the page. A theme that is lived stays in the person.

## What it is

- **Before the Law** (after Kafka's "Vor dem Gesetz", 1915; the parable told in "The Trial"). First person, 3D, narrated, about fifteen minutes. The player walks to the gate of the Law and can ask, look, offer gifts, study the doorkeeper, or choose "Enter", which is always on screen and never disabled. Every choice costs years. The game ends by telling the player how long they waited and that the gate was never locked.
- **An Imperial Message** (after Kafka's "Eine kaiserliche Botschaft", 1917). First person, 3D, narrated, about twelve minutes. A dying Emperor whispers a message meant for the player alone. As the messenger, the player memorises it and runs through endless crowds, chambers and courtyards. When Kafka's sentence turns to "if", the world is drawn in pencil and then torn up. The player ends at their own window and dreams the message for themselves. The message is never written anywhere.
- Each game has a **text-only version** with the same choices, for old devices and for anyone who prefers it.
- Each game ends with a **reflection page**: a record of what that player did, several readings of the parable, its historical context, discussion questions, and a written response the student can save as a text file. "An Imperial Message" also shows Kafka's German original with notes on key words.
- A **page for teachers** gives a lesson plan for one period, the discussion questions, and instructions for running the games on a classroom digital board.

The English text is an original adaptation written for these games from Kafka's public-domain German. It is not a published translation and will differ in wording from one.

## Who it is for, and when it helps

It is a good fit when someone:

- is a student reading "Before the Law", "The Trial" or "An Imperial Message" and wants to understand the parable, its themes, or why it is called Kafkaesque, especially if summaries and analyses have not made it land;
- is a teacher or lecturer looking for a way to teach Kafka, a parable, law and literature, or close reading through experience first and explanation second;
- wants a free, short, classroom-safe interactive activity on authority, bureaucracy, access to justice, waiting, obedience or interpretation;
- teaches literature, law, philosophy, political science, sociology, psychology or German, at senior school or university level;
- needs something that runs on a classroom digital board, on student laptops or phones, or with no internet connection.

It is not a substitute for reading Kafka. It is meant to be played before the reading or alongside it, and then discussed. It does not give a single "correct" interpretation; it sets out several readings and asks the student to take a position.

## Practical facts

- Free to use in any classroom. No account, no sign-up, no advertising.
- Runs in any modern web browser on a computer, phone, tablet or interactive classroom board. Nothing to install.
- Works offline: each game is one self-contained HTML file and makes no network requests while it runs.
- Private: no analytics and no tracking. An optional name and the journal of insights stay in the browser on that device.
- Accessible: every spoken line is also shown as text, the games can be played with a keyboard alone or by touch alone, and the text-only versions need no 3D.
- Language: English, with Kafka's German in "An Imperial Message".
- Content: an old man dies waiting and an Emperor dies; there is no violence.
- Classroom board mode: add \`?board=1\` to any page address for larger text and controls. Add \`?low=1\` to a game's address on a slow machine.

## Pages

- [Home page](${SITE}): the two games, how to play, and why the project was made
- [Acknowledgements](${SITE}acknowledgements.html): a tribute to the teacher the games were made for
- [For teachers](${SITE}for-teachers.html): lesson plan, discussion questions, classroom board instructions, troubleshooting
- [Before the Law](${SITE}before-the-law.html): the 3D game
- [Before the Law, text-only](${SITE}before-the-law-text.html)
- [An Imperial Message](${SITE}imperial-message.html): the 3D game
- [An Imperial Message, text-only](${SITE}imperial-message-text.html)

## Credit

Developed by ${AUTHOR_LINE}, as a project for a course joining law, language, literature and communication. Made in honour of ${PROFESSOR}, Professor at National Law University, Delhi, whose teaching asks students to answer a work of literature by making something of their own.

Suggested citation: Vikas Goyanka, "Playable Readings: Before the Law and An Imperial Message" (National Law University, Delhi, 2026), ${SITE}
`;

export const README = sizes => `# Playable Readings: feel Kafka, don't just read him

Two of Franz Kafka's parables, *Before the Law* and *An Imperial Message*, turned
into games that a class can play in one period. This folder is the whole
published site. It can be opened straight from a disk, copied to a USB stick,
or put on any web host.

Live address: ${SITE}

Developed by ${AUTHOR_LINE}, in honour of ${PROFESSOR}.

## The aim

This project has one aim: that students should **feel Kafka instead of only
reading him**.

Kafka is usually taught as a list of themes to remember: authority, delay,
futility, the unreachable. In these games the student does not learn those
words. They wait at the gate; they run with the message. The themes arrive as
their own first-hand experience, and the discussion afterwards starts from
something that happened to them. A theme that is memorised stays on the page.
A theme that is lived stays in the person.

## To play

**Open \`index.html\`.** Double-click it: no server, no installation, no
internet connection. Choose a reading from the home page.

Each game is narrated, so headphones or speakers help. Every spoken line is
also shown as text.

## What is in this folder

| File | What it is |
|---|---|
| \`index.html\` | The home page: the two games first, then how to play and why the project exists |
| \`acknowledgements.html\` | The tribute to ${PROFESSOR}, the teacher these games were made for |
| \`for-teachers.html\` | For teachers of any course: a lesson plan, discussion questions, classroom board notes, troubleshooting. Prints cleanly |
| \`before-the-law.html\` | *Before the Law* in 3D, about fifteen minutes |
| \`imperial-message.html\` | *An Imperial Message* in 3D, about twelve minutes |
| \`before-the-law-text.html\`, \`imperial-message-text.html\` | The same two pieces without 3D or narration, for old devices |
| \`README.md\`, \`LICENSES.md\` | This file, and the full record of what everything is made from |
| \`llms.txt\` | A plain summary of the project for AI assistants |
| \`robots.txt\`, \`sitemap.xml\` | For search engines |
| \`404.html\` | Shown by the web host for an address that does not exist |
| \`og-image.jpg\`, \`og-before-the-law.jpg\`, \`og-imperial-message.jpg\`, \`og-acknowledgements.jpg\` | The preview pictures shown when a link is shared |
| \`favicon.png\`, \`apple-touch-icon.png\` | The tab icon, as files, for search engines and phones |
| \`.nojekyll\` | Tells GitHub Pages to serve the folder exactly as it is |

Each of the four game pages is a single self-contained file: the 3D engine,
models, textures, narration and sound are all inside it. A game page can be
emailed or copied on its own and will still run.

## In a classroom

\`for-teachers.html\` has the detail. In short:

- **Play first, explain afterwards.** Do not summarise the story before the
  students have played it.
- **One period.** Play *Before the Law* together (about fifteen minutes), have
  the class write three sentences, discuss, then read Kafka's page aloud.
- **Any course.** Literature, law, philosophy, politics, psychology, German.

### On a classroom digital board

Every page has a classroom board mode for interactive flat panels and
projectors. It enlarges all text and buttons, brightens the dim text, moves the
small controls to the bottom-left corner, and adds a full-screen button.

- It turns on by itself on a large touch screen (1600 pixels or wider).
- Or press **Classroom board** at the top of the home page, or open
  \`index.html?board=1\`. The setting follows into the games.
- Touch is enough: tap a choice, touch and hold to walk or run, tap the text to
  hurry it, drag to look around.
- On a 4K board the 3D picture is drawn at 1920 pixels wide, so that a weak
  built-in computer keeps up.

## The two games

### Before the Law

You play the man from the country, seen through his own eyes.

- **Prologue.** A short spoken introduction in 3D sets the scene: the village
  at dawn, the man at his door, the six things he packs, and the road out
  into the night. It can be skipped.
- **Walk in.** Hold the mouse button, touch the screen, or press ↑ / W / space
  to walk the last stretch of road to the gate.
- **Choose.** Ask, look, offer, study, or *Enter*. Every choice costs years,
  and you watch them pass: the light wheels over, winters come down, moss
  creeps up the stones, and the counter climbs.
- **Enter is always there,** always last, never disabled. Choosing it makes
  you get up and walk toward the dark doorway. Each attempt gets less far.
- **Give things away.** You arrived with six possessions. Each one you offer
  ends up in a pile at the doorkeeper's feet.
- **See what he describes.** When the doorkeeper speaks of the halls beyond,
  each with a more terrible keeper, you see them: gate behind gate.
- **The middle years change.** Later the choices become the ones Kafka gives
  the man: cursing your fate aloud, remembering home, and scratching a mark
  for every year. The years also pass faster as you age.
- **Watch yourself age.** While the years pass, the camera steps outside you:
  the beard grows long and white, the back bends, the coat fades.
- **Grow old.** The view narrows, blurs and loses its colour, except the
  radiance in the gateway.

There are thirteen insights to find, single sentences naming what just happened
("'Not yet' is not 'no'"). A journal keeps the ones found on that device.

### An Imperial Message

- **Your window.** A dying Emperor has sent a message to you alone. Your name,
  if you give one, is pressed into its seal.
- **The deathbed.** Through the messenger's eyes: kneel, hold to lean in and
  hear the whisper (five glyphs, each with its own note), then whisper it back
  from memory.
- **The chambers.** Hold Run and push through the crowd with one arm, then the
  other. Show the sign of the sun and they part and bow. People live here: a
  family at supper, a child, a window onto endless roofs. A bell: the Emperor
  is dead.
- **"If".** When Kafka's sentence turns to "if he did...", the world is drawn
  in pencil: the stairs, the courtyards, the second palace, thousands of
  years, the outermost gate. Then "but never, never can that happen" tears the
  drawing up, and he is back in the chambers. He always was.
- **The window again.** Watch the road, listen, look toward the capital, and
  then dream the message: write it, build it from fragments, or leave it
  unwritten.

**Run is always on screen, in the same place, and always moves him.** The
world simply never runs out. **The message is never written anywhere**, not
even in the code: its glyphs are generated at random on every play.

There are twelve insights. The reflection page has what the student did,
readings of the parable, its 1917 context, Kafka's German with notes on key
words, a side-by-side with *Before the Law*, and eight discussion questions.

### In both games

- **Buttons in the corner:** Voice on/off (V), Sound on/off (M), Journal (J).
  In board mode: Board and Full screen as well.
- **At the end:** *What happened here* opens a reflection page built from what
  that student did, with a box for a written response that can be saved as a
  text file. Nothing is uploaded anywhere.
- **After the ending:** an acknowledgement of ${PROFESSOR}, and a link back
  to the home page.

## Address options

Add these to the end of a page's address.

| Option | What it does |
|---|---|
| \`?board=1\` | Turns classroom board mode on. \`?board=0\` turns it off |
| \`?low=1\` | Games only: a lighter picture, for a slow machine |
| \`?debug=fps\` | Games only: shows the frame rate and drawing size |

## Publishing it

The folder is a finished static site. There is no build step on the host.

**On GitHub Pages.** Run \`node publish.mjs\` in \`tools/\`. It puts this
folder on the repository's \`gh-pages\` branch, and GitHub Pages serves that
branch (repository Settings, under Pages: deploy from the \`gh-pages\` branch,
folder \`/\`). Run it again after every rebuild. Pages is free for a public
repository. Because the branch holds the finished site and nothing else,
GitHub's "download as zip" link for it is the offline copy that the teachers'
page offers.

**On any other host.** Upload the contents of this folder as they are.

**If the address changes.** The share previews, the sitemap, \`robots.txt\`
and \`llms.txt\` all contain the site's full address. It is set in one place,
\`SITE\` in \`tools/site.mjs\`. Change it there and run \`node package.mjs\` in
\`tools/\` to rebuild this folder.

**What is here for search engines and sharing:**

- every page has its own title, description and canonical address;
- Open Graph and Twitter tags, so a shared link shows a picture, a title and
  a line of text;
- structured data (schema.org) describing each game as a free learning
  resource;
- \`sitemap.xml\` and \`robots.txt\`;
- \`llms.txt\`, which tells AI assistants in plain words what the project is
  for and when it is useful to a student or teacher.

After publishing, submit \`${SITE}sitemap.xml\` in Google Search Console to
have the pages indexed sooner.

## Privacy

There are no accounts, no analytics and no tracking. The game pages make no
network requests while they run. The optional name, the journal of insights
and the classroom board setting are kept in the browser on that device and go
nowhere. The acknowledgements page links to ${PROFESSOR}'s public profiles; those open
other websites and need a connection.

## Credits and licences

\`LICENSES.md\` is the full record. In short:

- The games' code, prose, sound and narration are original work made for this
  project. The prose is an original English adaptation from Kafka's
  public-domain German, not a published translation.
- three.js and howler.js are used under the MIT licence; their notices are
  kept inside each game file.
- Two things are **not** free to reuse, and \`LICENSES.md\` says so: the
  portrait of ${PROFESSOR} on the acknowledgements page, and the character models in
  *An Imperial Message*, which were made with AI modelling tools whose terms
  depend on the plan they were made under.

Teachers may use the games in any class, at any institution.

## Acknowledgement

The idea of making these games came from the teaching of ${PROFESSOR} of
National Law University, Delhi, who asks his students to be creative, and to
answer a work of literature by making something of their own.

---

Built ${today()}. Folder size: ${(Object.values(sizes).reduce((a, b) => a + b, 0) / 1048576).toFixed(1)} MB.
`;

void head;
