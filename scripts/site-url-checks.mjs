import assert from 'node:assert/strict';

export function siteUrl(value, config, label = 'URL', allowExternal = []) {
  const url = new URL(value);
  const blocked = config.forbiddenHosts ?? [];
  assert(!blocked.some(h => { const host = new URL(`https://${h}`).hostname; return url.hostname === host || url.hostname.endsWith(`.${host}`); }), `${label}: forbidden host ${url.hostname}`);
  assert(!url.username && !url.password, `${label}: userinfo is not allowed`);
  assert([new URL(config.url).origin, ...allowExternal].includes(url.origin), `${label}: unexpected origin ${url.origin}`);
  return url;
}
export function xmlText(text) {
  const chars = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (_, key) => key[0] === '#' ? String.fromCodePoint(key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1))) : chars[key.toLowerCase()]);
}
function attr(tag, name) { const value = tag.match(new RegExp(`\\b${name}\\s*=\\s*(['"])(.*?)\\1`, 'i'))?.[2]; return value === undefined ? undefined : xmlText(value); }
export function inspectHtml(html, config, expected) {
  const canonical = [], og = [], images = [], twitter = [], cards = [];
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) if (attr(tag, 'rel')?.split(/\s+/).includes('canonical')) canonical.push(attr(tag, 'href'));
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const key = attr(tag, 'property') ?? attr(tag, 'name'), value = attr(tag, 'content');
    if (key === 'og:url') og.push(value);
    if (key === 'og:image') images.push(value);
    if (key === 'twitter:image') twitter.push(value);
    if (key === 'twitter:card') cards.push(value);
    if (['og:image:url', 'og:image:secure_url'].includes(key)) siteUrl(value, config, key, config.imageOrigins ?? []);
  }
  assert.equal(canonical.length, 1, `${expected}: canonical count`);
  assert.equal(siteUrl(canonical[0], config, 'canonical').href, new URL(expected).href, `${expected}: canonical path`);
  assert.equal(og.length, 1, `${expected}: og:url count`); assert.equal(siteUrl(og[0], config, 'og:url').href, new URL(expected).href, `${expected}: og:url path`);
  assert(images.length, `${expected}: og:image missing`); assert(twitter.length, `${expected}: twitter:image missing`);
  assert.deepEqual(cards, ['summary_large_image'], `${expected}: twitter:card`);
  for (const url of [...images, ...twitter]) siteUrl(url, config, 'image', config.imageOrigins ?? []);
  let jsonLdCount = 0;
  function visit(value, key) {
    if (key === '@context') return;
    if (typeof value === 'string' && (key === 'url' || key === '@id')) siteUrl(value, config, `JSON-LD ${key}`, config.externalJsonLdOrigins ?? []);
    else if (Array.isArray(value)) value.forEach(item => visit(item, key));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([field, item]) => visit(item, field));
  }
  for (const [tag, , body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) if (attr(tag, 'type') === 'application/ld+json') { visit(JSON.parse(body)); jsonLdCount++; }
  return { canonical, og, images, twitter, cards, jsonLdCount };
}
export function inspectRobots(text, config) {
  const values = (key) => [...text.matchAll(new RegExp(`^${key}: (.+)$`, 'gmi'))].map(m => m[1].trim());
  const maps = values('Sitemap'); assert(maps.length, 'robots Sitemap missing');
  for (const value of maps) assert.equal(siteUrl(value, config, 'robots Sitemap').href, new URL('/sitemap.xml', config.url).href);
  for (const host of values('Host')) assert.equal(new URL(host.includes('://') ? host : `https://${host}`).host, new URL(config.url).host, 'robots Host');
}

/** Sitemap inclusion is independent of whether a page allows indexing. */
export function isIndexableHtml(html) {
 for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
  if (['robots','googlebot'].includes(attr(tag,'name')?.toLowerCase()) && /(?:^|[\s,])(?:noindex|none)(?=$|[\s,])/i.test(attr(tag,'content') ?? '')) return false;
 }
 return true;
}
