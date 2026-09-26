# Before the Law

An interactive adaptation of Kafka's parable.

## To play

**Open `index.html`.** Double-click it — no server, no install, no network
connection. Everything it needs is inside that one file.

`text-only.html` is the same piece without the 3D scene. It needs no WebGL and
loads in 17 KB, so it is the fallback for old devices, low bandwidth, or anywhere
the 3D version will not run.

## To host it

Copy this folder to any static host. For **GitHub Pages**: put these files in
`/docs` on the default branch (or the root of a `gh-pages` branch) and enable
Pages in repository settings. No build step, no CI, no configuration.

There is nothing to configure because there is nothing to fetch: the page makes
**zero network requests**. Textures, audio, geometry, and the engine are all
inlined. It works offline and from a `file://` URL.

## Debug

Append `?debug=fps` to the URL for an on-screen frame-rate readout — frames per
second, resolution, device pixel ratio, and whether the mobile low-detail path is
active. It is hidden otherwise.

## Licensing

See `LICENSES.md`. Everything is CC0 or original except two MIT libraries
(three.js and howler.js), whose notices are retained inside `index.html`.
Nothing here carries an attribution-tracking obligation.
