import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  salonListSchema,
  masterListSchema,
  searchSchema,
  idParamSchema,
  normalizePriceRange,
  SALON_SORTS,
} from './catalog.schema.js';

describe('salonListSchema', () => {
  test('bo\'sh query — standart qiymatlar', () => {
    const r = salonListSchema.parse({});
    assert.equal(r.page, 1);
    assert.equal(r.limit, 20);
    assert.equal(r.sort, 'top');
  });

  test('URL params string bo\'ladi — songa o\'giriladi', () => {
    const r = salonListSchema.parse({ page: '3', limit: '12', minPrice: '50000' });
    assert.equal(r.page, 3);
    assert.equal(r.limit, 12);
    assert.equal(r.minPrice, 50000);
  });

  test('limit 50 dan oshmaydi (bir so\'rovda butun bazani so\'rab bo\'lmaydi)', () => {
    assert.equal(salonListSchema.safeParse({ limit: '500' }).success, false);
  });

  test('page 0 yoki manfiy bo\'lolmaydi', () => {
    assert.equal(salonListSchema.safeParse({ page: '0' }).success, false);
    assert.equal(salonListSchema.safeParse({ page: '-1' }).success, false);
  });

  test('noma\'lum sort rad etiladi', () => {
    assert.equal(salonListSchema.safeParse({ sort: 'random' }).success, false);
    for (const s of SALON_SORTS) {
      assert.equal(salonListSchema.safeParse({ sort: s }).success, true, s);
    }
  });

  test('kategoriya slug kichik harfga o\'giriladi', () => {
    assert.equal(salonListSchema.parse({ category: 'Manikyur' }).category, 'manikyur');
  });

  test('q trim qilinadi', () => {
    assert.equal(salonListSchema.parse({ q: '  lotus  ' }).q, 'lotus');
  });
});

describe('normalizePriceRange', () => {
  test('teskari oraliq to\'g\'rilanadi', () => {
    assert.deepEqual(normalizePriceRange({ minPrice: 200000, maxPrice: 50000 }), {
      minPrice: 50000,
      maxPrice: 200000,
    });
  });

  test('to\'g\'ri oraliq o\'zgarmaydi', () => {
    assert.deepEqual(normalizePriceRange({ minPrice: 50000, maxPrice: 200000 }), {
      minPrice: 50000,
      maxPrice: 200000,
    });
  });

  test('bittasi bo\'lmasa tegilmaydi', () => {
    assert.deepEqual(normalizePriceRange({ minPrice: 50000 }), {
      minPrice: 50000,
      maxPrice: undefined,
    });
    assert.deepEqual(normalizePriceRange({}), { minPrice: undefined, maxPrice: undefined });
  });
});

describe('searchSchema', () => {
  test('bitta belgi yetarli emas', () => {
    assert.equal(searchSchema.safeParse({ q: 'a' }).success, false);
    assert.equal(searchSchema.safeParse({ q: 'ma' }).success, true);
  });

  test('q majburiy', () => {
    assert.equal(searchSchema.safeParse({}).success, false);
  });

  test('limit standart 5', () => {
    assert.equal(searchSchema.parse({ q: 'lotus' }).limit, 5);
  });
});

describe('masterListSchema', () => {
  test('salon id ixtiyoriy', () => {
    assert.equal(masterListSchema.parse({}).salon, undefined);
  });
});

describe('idParamSchema', () => {
  test('faqat 24 belgili hex qabul qilinadi', () => {
    assert.equal(idParamSchema.safeParse({ id: '65f0000000000000000000a1' }).success, true);
    assert.equal(idParamSchema.safeParse({ id: '123' }).success, false);
    assert.equal(idParamSchema.safeParse({ id: 'zzz0000000000000000000a1' }).success, false);
  });
});
