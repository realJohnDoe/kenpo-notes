// Browser smoke test of the combined site (Quartz output plus the animations
// build), served under the base path GitHub Pages uses.
//
//   SITE_DIR=<combined site> [BASE_PATH=/kenpo-notes] [CHROME=<chrome binary>] npm run test:e2e
//
// BASE_PATH must match the BASE_PATH the site was built with. CHROME defaults
// to the Chromium installed by `npx playwright install chromium`.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright-core';

const siteDir = process.env.SITE_DIR;
const base = process.env.BASE_PATH ?? '/kenpo-notes';
assert(siteDir, 'set SITE_DIR to the combined site directory');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.yml': 'text/yaml',
  '.xml': 'application/xml'
};

const isFile = async (path) => (await stat(path).catch(() => null))?.isFile();

// Resolves a path like GitHub Pages: the file itself, then `.html`, then
// `index.html`. Anything outside the base path is a 404.
async function resolve(pathname) {
  if (pathname !== base && !pathname.startsWith(`${base}/`)) return null;
  const rel = normalize(decodeURIComponent(pathname.slice(base.length)));
  if (rel.includes('..')) return null;
  const path = join(siteDir, rel);
  for (const candidate of [path, `${path}.html`, join(path, 'index.html')]) {
    if (await isFile(candidate)) return candidate;
  }
  return null;
}

const server = createServer(async (req, res) => {
  const file = await resolve(new URL(req.url, 'http://x').pathname);
  const status = file ? 200 : 404;
  const body = await readFile(file ?? join(siteDir, '404.html')).catch(
    () => 'Not found'
  );
  res.writeHead(status, {
    'content-type':
      types[extname(file ?? '.html')] ?? 'application/octet-stream'
  });
  res.end(body);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({
  executablePath: process.env.CHROME || undefined,
  args: ['--no-sandbox']
});
const failures = [];
const check = async (name, fn) => {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`FAIL ${name}\n${e.message}`);
  }
};

const hrefs = (page, selector) =>
  page.$$eval(selector, (as) => [...new Set(as.map((a) => a.href))]);

// Links inside `selector` must stay on this site under the base path (the
// explorer and search build theirs in JS from baseUrl), and must not 404.
async function assertLinksResolve(page, urls, what) {
  assert(urls.length > 0, `${what}: no links found`);
  const bad = urls.filter((u) => {
    const url = new URL(u);
    return url.origin !== origin || !url.pathname.startsWith(`${base}/`);
  });
  assert.deepEqual(bad, [], `${what}: links outside ${origin}${base}/`);
  const missing = [];
  for (const u of urls) {
    const res = await page.request.get(u.split('#')[0]);
    if (!res.ok()) missing.push(`${res.status()} ${u}`);
  }
  assert.deepEqual(missing, [], `${what}: broken links`);
}

try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(`${origin}${base}/`, { waitUntil: 'networkidle' });

  await check('home page links are under the base path', async () => {
    const same = (await hrefs(page, 'a[href]')).filter(
      (u) => new URL(u).origin === origin
    );
    await assertLinksResolve(page, same, 'home page');
  });

  await check('explorer links are under the base path', async () => {
    // Open every folder, then read every link the explorer built.
    for (;;) {
      const closed = page.locator(
        '.explorer .folder-outer:not(.open) > .folder-container .folder-button'
      );
      if (!(await closed.count())) break;
      await closed.first().click();
    }
    await assertLinksResolve(
      page,
      await hrefs(page, '.explorer a[href]'),
      'explorer'
    );
  });

  await check('search result links are under the base path', async () => {
    await page.locator('.search-button').first().click();
    await page.locator('.search-bar').fill('sword');
    await page.locator('a.result-card').first().waitFor();
    await assertLinksResolve(
      page,
      await hrefs(page, 'a.result-card'),
      'search results'
    );
  });

  await check('animation player has named controls and plays', async () => {
    await page.goto(`${origin}${base}/animation/delayed-sword`, {
      waitUntil: 'networkidle'
    });
    for (const name of [
      '0.5x',
      '1x',
      '2x',
      'Previous step',
      'Play',
      'Next step'
    ]) {
      await page
        .getByRole('button', { name, exact: true })
        .waitFor({ timeout: 5000 });
    }
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page
      .getByRole('button', { name: 'Pause', exact: true })
      .waitFor({ timeout: 5000 });
    assert.deepEqual(errors, [], 'page errors');
  });
} finally {
  await browser.close();
  server.close();
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
