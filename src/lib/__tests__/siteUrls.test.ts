import assert from "node:assert/strict";
import { it as check } from "vitest";
import { inspectHtml, inspectRobots, siteUrl } from "../../../scripts/site-url-checks.mjs";
const config = { url: 'https://xn--989a00a691bv6b3zl.kr', displayUrl: 'https://주식계산기.kr', forbiddenHosts: ['fincalc.kr'], externalJsonLdOrigins: ['https://www.nts.go.kr'] };
const page = `${config.url}/example`;
const fixture = () => `<link rel="canonical" href="https://주식계산기.kr/example"><meta property="og:url" content="${page}"><meta property="og:image" content="${config.url}/og-image.png"><meta name="twitter:image" content="https://주식계산기.kr/og-image.png"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org', url:page, publisher:{url:'https://www.nts.go.kr'}})}</script>`;
check('Unicode/Punycode and allowed external authority', () => { assert.equal(inspectHtml(fixture(), config, page).images.length, 1); });
check('missing images and small cards fail', () => {
 for (const [pattern, replacement] of [[/<meta property="og:image"[^>]*>/, ''], [/<meta name="twitter:image"[^>]*>/, ''], [/summary_large_image/, 'summary']] as const) assert.throws(() => inspectHtml(fixture().replace(pattern, replacement), config, page));
});
check('foreign host, relative image, canonical path, duplicates fail', () => {
 for (const html of [fixture().replace(`${config.url}/og-image.png`, '/og-image.png'), fixture().replace('https://주식계산기.kr/example', 'https://other.example/example'), fixture().replace('https://주식계산기.kr/example', 'https://주식계산기.kr/wrong'), fixture()+`<link rel="canonical" href="${page}">`]) assert.throws(() => inspectHtml(html, config, page));
 assert.throws(() => siteUrl('https://fincalc.kr/', config));
 assert.throws(() => siteUrl('https://x.fincalc.kr/', config));
 assert.throws(() => siteUrl('https://user@주식계산기.kr/', config));
});
check('robots Host accepts hostname or complete URL', () => {
 for (const host of ['주식계산기.kr', config.url]) inspectRobots(`Host: ${host}\nSitemap: https://주식계산기.kr/sitemap.xml`, config);
 assert.throws(() => inspectRobots('Host: other.example\nSitemap: https://주식계산기.kr/sitemap.xml', config));
});
