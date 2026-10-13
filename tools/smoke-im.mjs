/* Quick load check of imperial-message-3d.html: errors, a title shot. */
import puppeteer from 'puppeteer';
import path from 'path';
import { pathToFileURL } from 'url';
const file = pathToFileURL(path.resolve('../imperial-message-3d.html')).href;
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 600000,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 960, height: 600 });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
await page.goto(file, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction('window.__frames > 3', { timeout: 120000 });
const t0 = Date.now(); const f0 = await page.evaluate(() => __frames);
await new Promise(r => setTimeout(r, 5000));
const f1 = await page.evaluate(() => __frames);
console.log('fps ~', ((f1 - f0) / ((Date.now() - t0) / 1000)).toFixed(1));
await page.screenshot({ path: 'im-00-title.png' });
console.log(errs.join('\n') || 'no errors');
await browser.close();
