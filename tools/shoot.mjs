import puppeteer from 'puppeteer';
import path from 'path';

const file = 'file:///' + path.resolve('../scene-3d.html').replace(/\\/g, '/');
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--enable-webgl', '--ignore-gpu-blocklist', '--allow-file-access-from-files',
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 760, deviceScaleFactor: 1 });

const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

await page.goto(file, { waitUntil: 'load', timeout: 60000 });

/* wait for the render loop to actually produce frames */
try {
  await page.waitForFunction('window.__frames > 40', { timeout: 45000 });
} catch (e) {
  errs.push('NO FRAMES: render loop never ran');
}

const info = await page.evaluate(() => {
  const c = document.querySelector('#view canvas');
  const gl = c && (c.getContext('webgl2') || c.getContext('webgl'));
  return {
    canvas: c ? c.width + 'x' + c.height : 'none',
    frames: window.__frames || 0,
    renderer: gl ? gl.getParameter(gl.VERSION) : 'no context',
    hasSnap: typeof window.snapStage === 'function',
  };
});
console.log(info);

for (const s of [1, 2, 3]) {
  await page.evaluate(n => window.snapStage(n), s);
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: `stage${s}.png` });
  console.log('shot stage' + s + '.png');
}

if (errs.length) { console.log('\n--- ERRORS ---'); errs.slice(0, 12).forEach(e => console.log(e)); }
else console.log('\nno page errors');
await browser.close();
