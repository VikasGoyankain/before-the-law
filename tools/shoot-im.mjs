/* Stills of every scene in imperial-message-3d.html, set up directly (no
   playthrough): the window, the deathbed, the chambers, the "if" and the
   capital. Time is frozen and stepped by hand (window.__freeze/__advance),
   because SwiftShader draws about one frame a second.
   Usage: node shoot-im.mjs [name ...]   -> tools/im-<name>.png */
import puppeteer from 'puppeteer';
import path from 'path';
import { pathToFileURL } from 'url';

const only = process.argv.slice(2);
const file = pathToFileURL(path.resolve('../imperial-message-3d.html')).href;
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 900000,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 960, height: 600 });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await page.goto(file, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction('window.__frames > 2', { timeout: 120000 });
await page.evaluate(() => { document.getElementById('intro').hidden = true; window.__freeze = true; window.__advance = 0; });

/* advance the frozen clock by sec, one 0.1 s frame at a time */
async function step(sec) {
  const f0 = await page.evaluate(s => { window.__advance = s; return window.__frames; }, sec);
  const need = Math.ceil(sec / 0.1) + 2;
  await page.waitForFunction((f, n) => window.__frames >= f + n, { timeout: 900000, polling: 200 }, f0, need);
}
const G = (fn, arg) => page.evaluate(fn, arg);
const SHOTS = {
  /* every figure in a row, lit plainly, facing the camera: are they the right way round? */
  async lineup() {
    await G(() => {
      const g = __game, T = g.THREE, sc = new T.Scene(); sc.background = new T.Color(0x3a3a40);
      sc.add(new T.HemisphereLight(0xffffff, 0x404040, 2.2)); const d = new T.DirectionalLight(0xffffff, 2); d.position.set(2, 4, 5); sc.add(d);
      const kinds = Object.keys(g.geos); let x = -(kinds.length - 1) * 0.55;
      for (const k of kinds) { const m = new T.Mesh(g.geos[k], new T.MeshStandardMaterial({ vertexColors: true })); m.position.x = x; x += 1.1; sc.add(m); }
      const cam = new T.PerspectiveCamera(40, 1.6, 0.1, 100); cam.position.set(0, 1.1, 6.5); cam.lookAt(0, 0.9, 0);
      g.stage.show({ scene: sc, camera: cam, update() {} }); g.stage.snapPost('fade', 0); g.stage.snapPost('ifness', 0);
      window.__lineup = kinds.join(' ');
    });
    await step(0.2);
    console.log('  lineup:', await G(() => window.__lineup));
  },
  async windowSeat() { await G(() => { const g = __game; g.stage.show(g.win); g.win.place('seat'); g.win.evening(0.25, true); g.stage.snapPost('fade', 0); }); await step(0.3); },
  async windowCapital() { await G(() => { const g = __game; g.stage.show(g.win); g.win.place('capital'); g.win.evening(0.6, true); g.stage.snapPost('fade', 0); }); await step(0.3); },
  async windowOutside() { await G(() => { const g = __game; g.stage.show(g.win); g.win.place('outside'); g.win.evening(0.8, true); g.win.showSelf(true); g.stage.snapPost('fade', 0); }); await step(0.3); },
  async windowNight() { await G(() => { const g = __game; g.win.showSelf(false); g.win.place('up'); g.win.evening(1, true); const gl = []; }); await step(0.3); },
  async courtDoor() { await G(() => { const g = __game; g.stage.show(g.court); g.court.reset(); g.stage.snapPost('fade', 0); g.stage.snapPost('white', 0); }); await step(0.3); },
  async courtNear() { await G(() => { const g = __game; g.court.pose('near', 0.01); }); await step(0.3); },
  async courtKneel() { await G(() => { const g = __game; g.court.pose('kneel', 0.01); }); await step(0.3); },
  async courtLean() { await G(() => { const g = __game; g.court.pose('lean', 0.01); g.court.lean(true); g.court.turnHead(true); }); await step(2.5); },
  async courtRise() { await G(() => { const g = __game; g.court.turnHead(false); g.court.lean(false); g.court.pose('rise', 0.01); }); await step(0.5); },
  async palace0() { await G(() => { const g = __game; g.stage.show(g.palace); g.palace.reset(0, { 2: { knot: true }, 4: { family: true }, 5: { window: true }, 6: { child: true } }); g.palace.st.s = 3; }); await step(0.4); },
  async palaceKnot() { await G(() => { __game.palace.st.s = 14 * 2 + 4; }); await step(0.4); },
  async palaceSun() { await G(() => { __game.palace.showSun(); }); await step(0.8); },
  async palaceFamily() { await G(() => { __game.palace.st.s = 14 * 4 + 3.5; }); await step(0.4); },
  async palaceWindow() { await G(() => { __game.palace.st.s = 14 * 5 + 7; __game.palace.lookOutWindow(true); }); await step(3); },
  async palaceChild() { await G(() => { __game.palace.lookOutWindow(false); __game.palace.st.s = 14 * 6 + 5.5; }); await step(2.5); },
  async field() { await G(() => { __game.palace.fieldVision(true); __game.stage.snapPost('ifness', 0.3); }); await step(1); },
  async stairs() {
    await G(() => { const p = __game.palace; p.fieldVision(false); p.st.s = 14 * 8 + 2; p.replan(['stairs', 'court', 'wall', 'chamber']); __game.stage.snapPost('ifness', 0.4); });
    await step(0.3);
    await G(() => { const p = __game.palace; const seg = p.segAt(p.st.s); p.st.s = seg.s0 + seg.len + 14 + 6; });
    await step(0.4);
  },
  async courtyard() { await G(() => { const p = __game.palace; p.st.s += 22; __game.stage.snapPost('ifness', 0.5); }); await step(9.5); },
  async rings1() { await G(() => { const g = __game; g.stage.show(g.rings); g.rings.reset(); g.stage.snapPost('ifness', 0.72); }); await step(2); },
  async rings2() { await G(() => { __game.rings.st.zoom = 4; __game.rings.st.rm = 300; }); await step(0.3); },
  async gate() { await G(() => { const g = __game; g.stage.show(g.capital); g.capital.reset(); g.capital.st.s = 60; g.stage.snapPost('ifness', 0.97); }); await step(0.3); },
  async capital() { await G(() => { const g = __game; g.capital.st.mode = 'behold'; g.capital.camera.position.set(0, 1, 0); }); await G(() => { const c = __game.capital; c.st.mode = 'burst'; c.st.burst = 0.999; }); await step(0.4); },
  async crack() { await G(() => { __game.stage.snapPost('crack', 1); }); await step(0.2); },
  async rewind() { await G(() => { __game.stage.snapPost('rewind', 0.6); }); await step(0.2); },
};
for (const [name, fn] of Object.entries(SHOTS)) {
  const t = Date.now();
  await fn();
  if (!only.length || only.some(o => name.toLowerCase().startsWith(o.toLowerCase()))) {
    await page.screenshot({ path: 'im-' + name + '.png' });
    console.log(name.padEnd(16), ((Date.now() - t) / 1000).toFixed(0) + 's');
  }
}
console.log(errs.join('\n') || 'no errors');
await browser.close();
