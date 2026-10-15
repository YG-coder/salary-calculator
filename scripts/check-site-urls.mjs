import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { inspectCopy, inspectParticleTemplates } from './ui-copy-checks.mjs';
const ts = createRequire(import.meta.url)('typescript');
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { domainToUnicode } from 'node:url';
import { inspectHtml, inspectRobots, isIndexableHtml, siteUrl, xmlText } from './site-url-checks.mjs';
const config = JSON.parse(readFileSync('src/lib/site.config.json', 'utf8'));
assert.equal(config.url, new URL(config.url).origin); assert(/^[\x00-\x7f]+$/.test(config.url), 'ASCII origin required');
assert.equal(new URL(config.displayUrl).origin, config.url); assert.equal(new URL(config.url).hostname, new URL(config.displayUrl).hostname);
assert.equal(config.displayUrl, `${new URL(config.url).protocol}//${domainToUnicode(new URL(config.url).hostname)}`);
const root = '.next/server/app';
const urls = [...readFileSync(join(root, 'sitemap.xml.body'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => xmlText(m[1]));
assert(urls.length, 'empty sitemap'); const seen = new Set(); const images = new Set();
for (const value of urls) {
  const url = siteUrl(value, config, 'sitemap'); assert(!seen.has(url.href), `duplicate sitemap ${value}`); seen.add(url.href);
  const name = decodeURIComponent(url.pathname.slice(1)).replace(/\/$/, '') || 'index';
  const file = join(root, `${name}.html`); assert(existsSync(file), `published HTML missing: ${value}`);
  const html = readFileSync(file, 'utf8'); inspectCopy(html, value, config.copyIdentifierAllowlist ?? []);
  const result = inspectHtml(html, config, value); [...result.images, ...result.twitter].forEach(v => images.add(v));
}
// Also check indexable generated routes omitted from sitemap (e.g. salary detail pages).
let indexablePages = 0;
function scanHtml(directory, prefix = '') {
 for (const entry of readdirSync(directory, {withFileTypes:true})) {
  const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
  if (entry.isDirectory()) scanHtml(join(directory, entry.name), relative);
  else if (entry.name.endsWith('.html') && !['_global-error.html', '_not-found.html'].includes(relative)) {
   const html = readFileSync(join(directory,entry.name),'utf8');
   if (!isIndexableHtml(html)) continue;
   const path = relative === 'index.html' ? '/' : `/${relative.slice(0,-5)}`;
   const expected = new URL(path,config.url).href;
   const checked = inspectHtml(html,config,expected);
   inspectCopy(html,expected,config.copyIdentifierAllowlist ?? []);
   [...checked.images,...checked.twitter].forEach(value=>images.add(value));
   indexablePages++;
  }
 }
}
scanHtml(root);
inspectRobots(readFileSync(join(root, 'robots.txt.body'), 'utf8'), config);
for (const value of images) {
  const url = new URL(value); if (url.origin !== config.url) continue;
  const file = join('public', decodeURIComponent(url.pathname));
  const generated = join(root, `${decodeURIComponent(url.pathname.slice(1))}.body`);
  assert(existsSync(file) || existsSync(generated), `image asset missing: ${value}`);
}
function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name); if (entry.isDirectory()) scan(path);
    else if (/\.(?:ts|tsx|js|jsx|mjs|json)$/.test(path) && !/\.test\./.test(path)) {
      if (/\.tsx?$/.test(path)) inspectParticleTemplates(ts, readFileSync(path, 'utf8'), path);
      for (const [raw] of readFileSync(path, 'utf8').matchAll(/https?:\/\/[^\s"'`<>\\)]+/g)) {
        let host; try { host = new URL(raw).hostname; } catch { continue; }
        for (const forbidden of config.forbiddenHosts ?? []) { const blocked = new URL(`https://${forbidden}`).hostname; assert(host !== blocked && !host.endsWith(`.${blocked}`), `${path}: forbidden URL ${raw}`); }
      }
    }
  }
}
scan('src');
console.log(`[site URLs] ${urls.length} sitemap pages / ${indexablePages} indexable pages: canonical/origin, OG/Twitter images, large cards, robots, JSON-LD and image assets verified`);
