import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSitemap, buildUrlEntry } from './sitemap.service.js';

test('sitemap to\u2019g\u2019ri XML sxemasi bilan boshlanadi', () => {
  const xml = buildSitemap([{ loc: 'https://gozal.uz/' }]);

  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(xml, /<\/urlset>$/);
});

test('bo\u2019sh sitemap ham yaroqli XML', () => {
  const xml = buildSitemap([]);
  assert.match(xml, /<urlset[^>]*>\n<\/urlset>/);
});

test('ixtiyoriy maydonlar bo\u2019lmasa teg umuman chiqmaydi', () => {
  const entry = buildUrlEntry({ loc: 'https://gozal.uz/salon/lotus' });

  assert.match(entry, /<loc>https:\/\/gozal\.uz\/salon\/lotus<\/loc>/);
  assert.equal(entry.includes('<lastmod>'), false);
  assert.equal(entry.includes('<priority>'), false);
});

test('maxsus belgilar XML uchun ekranlanadi', () => {
  // Slug'da & bo'lmasligi kerak, lekin sitemap buzilib qolmasin
  const entry = buildUrlEntry({ loc: 'https://gozal.uz/salon/a&b' });

  assert.match(entry, /a&amp;b/);
  assert.equal(entry.includes('/a&b<'), false);
});

test('barcha maydonlar berilganda to\u2019liq yozuv chiqadi', () => {
  const entry = buildUrlEntry({
    loc: 'https://gozal.uz/',
    lastmod: '2026-08-01',
    changefreq: 'daily',
    priority: '1.0',
  });

  assert.match(entry, /<lastmod>2026-08-01<\/lastmod>/);
  assert.match(entry, /<changefreq>daily<\/changefreq>/);
  assert.match(entry, /<priority>1\.0<\/priority>/);
});
