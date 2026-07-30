import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatNumber,
  formatPrice,
  formatServicePrice,
  normalizePhone,
  isValidPhone,
  formatPhone,
  slugify,
  truncate,
  initials,
} from './format.js';

describe('narx', () => {
  test('formatNumber — probel bilan ajratiladi', () => {
    assert.equal(formatNumber(100000), '100 000');
    assert.equal(formatNumber(1500000), '1 500 000');
    assert.equal(formatNumber(500), '500');
    assert.equal(formatNumber(0), '0');
    assert.equal(formatNumber('150000'), '150 000');
    assert.equal(formatNumber(null), '0');
  });

  test('ajratgich oddiy probel (NBSP emas)', () => {
    assert.ok(!/\u00A0|\u202F/.test(formatNumber(100000)));
  });

  test('formatPrice', () => {
    assert.equal(formatPrice(100000), "100 000 so'm");
  });

  test('formatServicePrice — uchala holat', () => {
    assert.equal(formatServicePrice({ price: 100000 }), "100 000 so'm");
    assert.equal(formatServicePrice({ price: 100000, isPriceFrom: true }), "100 000 so'mdan");
    assert.equal(formatServicePrice({ price: 100000, priceTo: 180000 }), "100 000 – 180 000 so'm");
  });

  test("priceTo price dan kichik bo'lsa e'tiborga olinmaydi", () => {
    assert.equal(formatServicePrice({ price: 100000, priceTo: 90000 }), "100 000 so'm");
  });
});

describe('telefon', () => {
  test('normalizePhone — har xil kirishlar bir xil natija beradi', () => {
    const expected = '+998901234567';
    assert.equal(normalizePhone('901234567'), expected);
    assert.equal(normalizePhone('90 123 45 67'), expected);
    assert.equal(normalizePhone('998901234567'), expected);
    assert.equal(normalizePhone('+998901234567'), expected);
    assert.equal(normalizePhone('+998 (90) 123-45-67'), expected);
  });

  test("noto'g'ri raqamlar null", () => {
    assert.equal(normalizePhone('12345'), null);
    assert.equal(normalizePhone('+7 900 123 45 67'), null); // 998 emas
    assert.equal(normalizePhone(''), null);
    assert.equal(normalizePhone(null), null);
    assert.equal(normalizePhone(998901234567), null); // string emas
  });

  test('isValidPhone', () => {
    assert.equal(isValidPhone('90 123 45 67'), true);
    assert.equal(isValidPhone('123'), false);
  });

  test("formatPhone — ko'rsatish uchun", () => {
    assert.equal(formatPhone('+998901234567'), '+998 90 123 45 67');
    assert.equal(formatPhone('901234567'), '+998 90 123 45 67');
  });
});

describe('slugify', () => {
  test('lotin', () => {
    assert.equal(slugify('Lotus Beauty'), 'lotus-beauty');
    assert.equal(slugify("Go'zallik Saloni"), 'gozallik-saloni');
    assert.equal(slugify('  Salon   №1  '), 'salon-1');
  });

  test('kirill translit', () => {
    assert.equal(slugify('Красота'), 'krasota');
    assert.equal(slugify('Гўзал'), 'gozal');
  });

  test('chegara holatlari', () => {
    assert.equal(slugify('---'), '');
    assert.ok(slugify('a'.repeat(200)).length <= 80);
  });
});

describe('matn', () => {
  test('truncate', () => {
    assert.equal(truncate('qisqa matn', 50), 'qisqa matn');
    assert.equal(truncate('abcdefghij', 5), 'abcd…');
  });

  test('initials', () => {
    assert.equal(initials('Dildora Karimova'), 'DK');
    assert.equal(initials('Nargiza'), 'N');
    assert.equal(initials(''), '');
  });
});
