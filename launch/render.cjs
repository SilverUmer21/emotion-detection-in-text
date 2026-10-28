// Renders the SUBTEXT video frames (or single stills) from scene.html with Playwright.
//   node launch/render.cjs stills out/ 2.6 7.0 ...       -> out/still-<t>.png
//   node launch/render.cjs frames out/                   -> out/f0000.jpg ... + out/events.json
//   node launch/render.cjs clip out/ 25.2 32 15 [notag]  -> frames of one section at 15 fps; notag hides the placeholder tag
//                                                           (only for sections that show no model scores, like the VS screen)
//   node launch/render.cjs covers out/                   -> the four cover images (covers.html)
//   node launch/render.cjs demo out/                     -> the pixel style comparison (style-demo.html)
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = __dirname;
const FPS = 30;
const [mode = 'stills', outDir = path.join(ROOT, 'out'), ...rest] = process.argv.slice(2);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };

function serve() {
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server)));
}

async function grab(page, type, quality) {
  const url = await page.evaluate(([t, q]) => document.getElementById('c').toDataURL(t, q), [type, quality]);
  return Buffer.from(url.split(',')[1], 'base64');
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  page.on('pageerror', e => { console.error('page error:', e.message); process.exitCode = 1; });

  if (mode === 'demo') {
    await page.goto(`${base}/style-demo.html`);
    await page.evaluate(() => window.ready);
    for (const style of ['booth', 'cozy', 'gameboy', 'pico']) for (const kind of ['scene', 'faces']) {
      await page.evaluate(([s, k]) => window.drawDemo(s, k), [style, kind]);
      fs.writeFileSync(path.join(outDir, `demo-${style}-${kind}.png`), await grab(page, 'image/png'));
      console.log('demo', style, kind);
    }
  } else if (mode === 'covers') {
    await page.goto(`${base}/covers.html`);
    await page.evaluate(() => window.ready);
    const kinds = await page.evaluate(() => Object.keys(window.COVERS));
    for (const kind of kinds) {
      await page.evaluate(k => window.drawCover(k), kind);
      const png = await grab(page, 'image/png');
      fs.writeFileSync(path.join(outDir, `cover-${kind}.png`), png);
      console.log('cover', kind);
    }
  } else {
    await page.goto(`${base}/scene.html?t=0`);
    await page.evaluate(() => window.ready);
    if (mode === 'stills') {
      for (const t of rest.map(Number)) {
        await page.evaluate(x => window.render(x), t);
        fs.writeFileSync(path.join(outDir, `still-${t.toFixed(2)}.png`), await grab(page, 'image/png'));
        console.log('still', t);
      }
    } else if (mode === 'clip') {
      const [from, to, fps, notag] = rest;
      if (notag === 'notag') await page.evaluate(() => { window.HIDE_PLACEHOLDER_TAG = true; });
      const n = Math.round((Number(to) - Number(from)) * Number(fps));
      for (let f = 0; f < n; f++) {
        await page.evaluate(x => window.render(x), Number(from) + f / Number(fps));
        fs.writeFileSync(path.join(outDir, `c${String(f).padStart(4, '0')}.png`), await grab(page, 'image/png'));
      }
      console.log('clip frames', n);
    } else if (mode === 'frames') {
      const { END, EVENTS } = await page.evaluate(() => ({ END: window.SUB.END, EVENTS: window.SUB.EVENTS }));
      const frames = Math.round(END * FPS);
      for (let f = 0; f < frames; f++) {
        await page.evaluate(x => window.render(x), f / FPS);
        fs.writeFileSync(path.join(outDir, `f${String(f).padStart(4, '0')}.jpg`), await grab(page, 'image/jpeg', 0.95));
        if (f % 150 === 0) console.log(`frame ${f}/${frames}`);
      }
      fs.writeFileSync(path.join(outDir, 'events.json'), JSON.stringify({ fps: FPS, frames, duration: frames / FPS, events: EVENTS }, null, 1));
      console.log('frames done', frames);
    }
  }
  await browser.close();
  server.close();
})();
