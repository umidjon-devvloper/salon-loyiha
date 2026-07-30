import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSalonFilter, SORTS } from './catalog.service.js';
import { isTopActive, serializeSalonCard } from '../utils/serialize.js';

/**
 * Bazasiz testlar: `buildSalonFilter` faqat `category` berilganda Mongo'ga
 * murojaat qiladi, qolgan hollarda toza funksiya.
 */

// ── Filtr ───────────────────────────────────────────────────────

test('katalogda faqat active salonlar chiqadi', async () => {
  const filter = await buildSalonFilter({});
  assert.equal(filter.status, 'active');
});

test("shahar va tuman filtri qo'shiladi", async () => {
  const filter = await buildSalonFilter({ city: 'Toshkent', district: 'Chilonzor' });
  assert.equal(filter.city, 'Toshkent');
  assert.equal(filter.district, 'Chilonzor');
});

test("narx oralig'i kesishish bo'yicha ishlaydi", async () => {
  const filter = await buildSalonFilter({ minPrice: 50_000, maxPrice: 200_000 });
  assert.deepEqual(filter.minPrice, { $lte: 200_000 });
  assert.equal(filter.maxPrice.$gte, 50_000);
});

test("narx filtri qo'yilganda xizmatsiz salon (maxPrice = 0) chiqmaydi", async () => {
  const onlyMax = await buildSalonFilter({ maxPrice: 100_000 });
  assert.equal(onlyMax.maxPrice.$gt, 0);

  const onlyMin = await buildSalonFilter({ minPrice: 100_000 });
  assert.equal(onlyMin.maxPrice.$gt, 0);
  assert.equal(onlyMin.maxPrice.$gte, 100_000);
});

test("narx filtri yo'q bo'lsa narx sharti umuman qo'yilmaydi", async () => {
  const filter = await buildSalonFilter({ city: 'Toshkent' });
  assert.equal(filter.minPrice, undefined);
  assert.equal(filter.maxPrice, undefined);
});

test("qidiruv so'zi nom bo'yicha regexga aylanadi", async () => {
  const filter = await buildSalonFilter({ q: 'lotus' });
  assert.ok(filter.name instanceof RegExp);
  assert.ok(filter.name.test('Lotus Beauty'));
});

// ── Saralash ────────────────────────────────────────────────────

test('har bir saralash _id bilan tugaydi — pagination barqaror', () => {
  for (const [name, sort] of Object.entries(SORTS)) {
    const keys = Object.keys(sort);
    assert.equal(keys[keys.length - 1], '_id', `${name} saralashida _id yo'q`);
  }
});

// ── TOP muddati ─────────────────────────────────────────────────

test("muddati o'tgan TOP ko'rsatilmaydi (cron kechikkan bo'lsa ham)", () => {
  const now = new Date('2026-08-05T10:00:00Z');
  assert.equal(isTopActive({ isTop: true, topUntil: new Date('2026-08-10') }, now), true);
  assert.equal(isTopActive({ isTop: true, topUntil: new Date('2026-08-01') }, now), false);
  assert.equal(isTopActive({ isTop: true, topUntil: null }, now), true);
  assert.equal(isTopActive({ isTop: false, topUntil: new Date('2099-01-01') }, now), false);
});

test('serializeSalonCard TOP muddatini tekshiradi', () => {
  const expired = serializeSalonCard({
    _id: 'salon1',
    name: 'Lotus',
    slug: 'lotus',
    isTop: true,
    topUntil: new Date('2020-01-01'),
  });
  assert.equal(expired.isTop, false);

  const active = serializeSalonCard({
    _id: 'salon2',
    name: 'Iris',
    slug: 'iris',
    isTop: true,
    topUntil: new Date('2099-01-01'),
  });
  assert.equal(active.isTop, true);
});

test('kartochkada ichki maydonlar chiqmaydi', () => {
  const card = serializeSalonCard({
    _id: 'salon1',
    name: 'Lotus',
    slug: 'lotus',
    owner: 'user1',
    status: 'active',
    __v: 3,
  });
  assert.equal(card.owner, undefined);
  assert.equal(card.status, undefined);
  assert.equal(card.__v, undefined);
});
