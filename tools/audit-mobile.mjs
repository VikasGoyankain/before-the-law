import puppeteer from 'puppeteer';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const file = pathToFileURL(require('path').resolve('../before-the-law-3d.html')).href;
const b = await puppeteer.launch({ headless: true,
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl'] });
for (const [name, w, h] of [['iPhone SE', 375, 667], ['iPhone 14', 390, 844], ['Pixel 7', 412, 915]]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148');
  await p.goto(file, { waitUntil: 'load', timeout: 60000 });
  await p.waitForFunction('window.__game && window.__game.ready()', { timeout: 90000 });
  const r = await p.evaluate(() => {
    const bs = [...document.querySelectorAll('#choices button')].map(x => x.getBoundingClientRect());
    const t = document.getElementById('text').getBoundingClientRect();
    const c = document.getElementById('choices').getBoundingClientRect();
    return {
      low: window.__game.low,
      minTouchH: Math.min(...bs.map(x => x.height)).toFixed(1),
      buttons: bs.length,
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
      textTop: Math.round(t.top), choicesBottom: Math.round(c.bottom),
      viewportH: window.innerHeight,
      collide: t.bottom > c.top + 1,
      canvas: document.querySelector('#view canvas').width + 'x' + document.querySelector('#view canvas').height,
    };
  });
  console.log(`${name.padEnd(11)} ${w}x${h}  low=${r.low}  touch=${r.minTouchH}px x${r.buttons}` +
    `  overflowX=${r.overflowX}  textOverlapsChoices=${r.collide}  canvas=${r.canvas}`);
  await p.close();
}
await b.close();
