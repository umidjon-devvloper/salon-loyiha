import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { escapeRegex, searchRegex, skipOf, metaOf } from './paginate.js';

describe('escapeRegex', () => {
  test('maxsus belgilar zararsizlantiriladi', () => {
    assert.equal(escapeRegex('a.b*c'), 'a\\.b\\*c');
    assert.equal(escapeRegex('(salon)'), '\\(salon\\)');
    assert.equal(escapeRegex('a+b?c'), 'a\\+b\\?c');
  });

  test("oddiy matn o'zgarmaydi", () => {
    assert.equal(escapeRegex('lotus beauty'), 'lotus beauty');
  });
});

describe('searchRegex', () => {
  test('katta-kichik harf farq qilmaydi', () => {
    assert.ok(searchRegex('lotus').test('Lotus Beauty'));
    assert.ok(searchRegex('LOTUS').test('lotus beauty'));
  });

  test("⭐ qisman so'z topiladi ($text buni qila olmaydi)", () => {
    assert.ok(searchRegex('lot').test('Lotus Beauty'));
    assert.ok(searchRegex('eaut').test('Lotus Beauty'));
  });

  test('regex buzuvchi kirish xatoga olib kelmaydi', () => {
    assert.doesNotThrow(() => searchRegex('('));
    assert.doesNotThrow(() => searchRegex('[a-'));
    assert.doesNotThrow(() => searchRegex('*'));
    assert.equal(searchRegex('(').test('salon (yangi)'), true);
  });

  test('mos kelmasa false', () => {
    assert.equal(searchRegex('zebra').test('Lotus Beauty'), false);
  });
});

describe('skipOf / metaOf', () => {
  test("skip to'g'ri hisoblanadi", () => {
    assert.equal(skipOf({ page: 1, limit: 20 }), 0);
    assert.equal(skipOf({ page: 2, limit: 20 }), 20);
    assert.equal(skipOf({ page: 5, limit: 12 }), 48);
  });

  test('sahifalar soni', () => {
    assert.deepEqual(metaOf({ page: 1, limit: 20, total: 143 }), {
      page: 1,
      limit: 20,
      total: 143,
      pages: 8,
    });
  });

  test("natija yo'q bo'lsa ham pages kamida 1", () => {
    assert.equal(metaOf({ page: 1, limit: 20, total: 0 }).pages, 1);
  });

  test("aniq bo'linsa ortiqcha sahifa qo'shilmaydi", () => {
    assert.equal(metaOf({ page: 1, limit: 20, total: 40 }).pages, 2);
  });
});
