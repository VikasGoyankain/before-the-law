# Playable Readings: feel Kafka, don't just read him

Two of Franz Kafka's parables, *Before the Law* and *An Imperial Message*,
turned into games that a class can play in one period.

This project has one aim: that students should **feel Kafka instead of only
reading him**. A theme that is memorised stays on the page. A theme that is
lived stays in the person.

- **Play it:** open [`dist/index.html`](dist/index.html) in a browser. No
  server, no installation, no internet connection.
- **Published site:** https://vikasgoyankain.github.io/playable-readings/
- **For teachers:** [`dist/for-teachers.html`](dist/for-teachers.html) has a
  lesson plan for one period, discussion questions, and notes for a classroom
  digital board.
- **About the published folder:** [`dist/README.md`](dist/README.md).

Developed by Vikas Goyanka, LLB26057, National Law University, Delhi, in
honour of Prof. (Dr.) Prasannanshu, whose teaching asks students to answer a
work of literature by making something of their own.

## What is here

| Path | What it is |
|---|---|
| `dist/` | The finished site: the home page (games first), the teachers' page, the acknowledgements, four game pages, and the files search engines and AI assistants read. Committed already built |
| `before-the-law.html`, `imperial-message.html` | The two text-only games, written by hand. Each also holds its game's prose, in a block called `T`, which the 3D builds read |
| `src/`, `src/im/` | Source of the two 3D games (three.js) |
| `tools/` | Build scripts, the headless tests, and `publish.mjs`, which puts `dist/` on the `gh-pages` branch that GitHub Pages serves |
| `assets/` | Textures, narration, prepared 3D models, the portrait, share-preview images, and `LICENSES.md` |
| `docs/` | Design notes for *An Imperial Message* |

## Building

Everything runs from `tools/`, with Node 20 or newer.

```bash
cd tools
npm install
node build-3d.mjs      # Before the Law  ->  ../before-the-law-3d.html
node build-im.mjs      # An Imperial Message  ->  ../imperial-message-3d.html
node package.mjs       # assembles ../dist
node publish.mjs       # puts ../dist on the gh-pages branch, which GitHub Pages serves
```

Other steps, needed only when their inputs change:

| Command | When |
|---|---|
| `node make-voice.mjs` / `node make-voice.mjs im` | After changing any spoken line. Generates the narration |
| `node prep-models.mjs` / `node prep-models.mjs im` | After changing a 3D model |
| `node prep-portrait.mjs <image>` | To replace the portrait on the acknowledgements page |
| `node make-social.mjs` | After changing the portrait or the share-preview wording |

If the site's address changes, set `SITE` in `tools/site.mjs` and run
`node package.mjs` again: the share previews, sitemap, `robots.txt` and
`llms.txt` all carry the full address.

## Testing

The tests drive the real pages in a headless browser.

| Command | What it checks |
|---|---|
| `node play.mjs` | A full playthrough of *Before the Law* in 3D. About ten minutes |
| `node play-im.mjs` | A full playthrough of *An Imperial Message* in 3D. About ten minutes |
| `node play-btl-text.mjs`, `node play-im-text.mjs` | Full playthroughs of the two text-only games |
| `node verify-dist.mjs` | Every page in `dist/` loads with no errors and no network requests |
| `node shoot-hub.mjs` | The home page and the acknowledgements page, at desktop, laptop and phone width |
| `node shoot-thanks.mjs` | The acknowledgement on each game's end screen |
| `node shoot-board.mjs` | Classroom-board mode at 1920x1080, by touch alone |

## Rules the project keeps

- **Each game is one file.** Everything is inlined, so a game page opens by
  double-click from a folder and makes no network requests.
- **Kafka's text lives in one place per game:** the `T` block of the
  hand-written HTML file. The `*.gen.js` files are generated; do not edit them.
- **In *Before the Law*, Enter is always the last choice and never disabled.**
- **In *An Imperial Message*, Run is always in the same place and always
  works, and the message is never written anywhere.**
- **Nothing a student writes leaves their device.**

## Licences

[`assets/LICENSES.md`](assets/LICENSES.md) is the full record. The code, prose,
sound and narration are original work; three.js and howler.js are MIT. Two
things are not free to reuse and are marked there: the portrait on the
acknowledgements page, and the character models in *An Imperial Message*, which were made with
AI modelling tools whose terms depend on the plan they were made under.
