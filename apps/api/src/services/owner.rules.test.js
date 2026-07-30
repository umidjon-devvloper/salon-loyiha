import test from 'node:test';
import assert from 'node:assert/strict';

import { priceRangeOf, buildUniqueSlug, salonSubmitIssues } from './owner.service.js';
import { buildFileName } from './upload.service.js';

// ── Narx oralig'i ───────────────────────────────────────────────

test("xizmatsiz salonda narx oralig'i nol", () => {
  assert.deepEqual(priceRangeOf([]), { minPrice: 0, maxPrice: 0 });
});

test("narx oralig'i eng arzon va eng qimmat xizmatdan olinadi", () => {
  const range = priceRangeOf([{ price: 100_000 }, { price: 50_000 }, { price: 300_000 }]);
  assert.deepEqual(range, { minPrice: 50_000, maxPrice: 300_000 });
});

test("priceTo bo'lsa yuqori chegara o'shandan olinadi", () => {
  const range = priceRangeOf([{ price: 100_000, priceTo: 180_000 }]);
  assert.deepEqual(range, { minPrice: 100_000, maxPrice: 180_000 });
});

test("faol emas xizmat narx filtriga ta'sir qilmaydi", () => {
  const range = priceRangeOf([
    { price: 100_000, isActive: true },
    { price: 10_000, isActive: false },
    { price: 900_000, isActive: false },
  ]);
  assert.deepEqual(range, { minPrice: 100_000, maxPrice: 100_000 });
});

// ── Slug ────────────────────────────────────────────────────────

test("bo'sh slug bo'lsa nom o'zgarishsiz ishlatiladi", async () => {
  const slug = await buildUniqueSlug('Lotus Beauty', async () => false);
  assert.equal(slug, 'lotus-beauty');
});

test("band slugga raqam qo'shiladi", async () => {
  const taken = new Set(['lotus', 'lotus-2']);
  const slug = await buildUniqueSlug('Lotus', async (s) => taken.has(s));
  assert.equal(slug, 'lotus-3');
});

test("o'zbekcha apostrof va kirill slugda yo'qoladi", async () => {
  const slug = await buildUniqueSlug("Go'zal Ayol", async () => false);
  assert.equal(slug, 'gozal-ayol');
});

test('faqat belgilardan iborat nom ham slug beradi', async () => {
  const slug = await buildUniqueSlug('!!! ???', async () => false);
  assert.equal(slug, 'salon');
});

// ── Tekshiruvga yuborish ────────────────────────────────────────

const readySalon = {
  categories: ['c1'],
  phone: '+998901234567',
  district: 'Chilonzor',
  workingHours: [{ weekday: 1, isOpen: true }],
};

test("to'liq salonda muammo yo'q", () => {
  const issues = salonSubmitIssues({ salon: readySalon, serviceCount: 3, masterCount: 1 });
  assert.deepEqual(issues, []);
});

test('xizmatsiz salon tekshiruvga yuborilmaydi', () => {
  const issues = salonSubmitIssues({ salon: readySalon, serviceCount: 0, masterCount: 1 });
  assert.equal(issues.length, 1);
  assert.match(issues[0], /xizmat/i);
});

test('hamma kuni yopiq salon tekshiruvga yuborilmaydi', () => {
  const salon = { ...readySalon, workingHours: [{ weekday: 1, isOpen: false }] };
  const issues = salonSubmitIssues({ salon, serviceCount: 2, masterCount: 1 });
  assert.match(issues[0], /ish vaqti/i);
});

test("bo'sh salonda hamma muammo bir vaqtda ko'rsatiladi", () => {
  const issues = salonSubmitIssues({
    salon: { categories: [], phone: '', district: '', workingHours: [] },
    serviceCount: 0,
    masterCount: 0,
  });
  assert.equal(issues.length, 6);
});

// ── Fayl nomi ───────────────────────────────────────────────────

test('fayl nomi bashorat qilinmaydi va .webp bilan tugaydi', () => {
  const a = buildFileName('salon-65f000000000000000000001');
  const b = buildFileName('salon-65f000000000000000000001');

  assert.notEqual(a, b);
  assert.match(a, /\.webp$/);
  assert.match(a, /^salon-/);
});

test('fayl nomida papka ajratuvchi va probel qolmaydi', () => {
  const name = buildFileName('../../etc/passwd salon');
  assert.equal(name.includes('/'), false);
  assert.equal(name.includes('..'), false);
  assert.equal(name.includes(' '), false);
});
