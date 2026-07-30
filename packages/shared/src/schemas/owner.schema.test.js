import test from 'node:test';
import assert from 'node:assert/strict';

import {
  salonCreateSchema,
  salonUpdateSchema,
  serviceCreateSchema,
  serviceUpdateSchema,
  masterCreateSchema,
  reorderSchema,
  filenameParamSchema,
} from './owner.schema.js';

const oid = '650000000000000000000001';

const validSalon = {
  name: 'Lotus Beauty',
  categories: [oid],
  city: 'Toshkent',
  district: 'Chilonzor',
  phone: '90 123 45 67',
};

// ── Salon ───────────────────────────────────────────────────────

test('telefon salon yaratishda ham normallashtiriladi', () => {
  const salon = salonCreateSchema.parse(validSalon);
  assert.equal(salon.phone, '+998901234567');
  assert.equal(salon.description, '');
});

test('kategoriyasiz salon rad etiladi', () => {
  assert.throws(() => salonCreateSchema.parse({ ...validSalon, categories: [] }));
});

test("5 tadan ko'p kategoriya rad etiladi", () => {
  assert.throws(() => salonCreateSchema.parse({ ...validSalon, categories: Array(6).fill(oid) }));
});

test('tumansiz salon rad etiladi', () => {
  assert.throws(() => salonCreateSchema.parse({ ...validSalon, district: '' }));
});

test("bo'sh tahrirlash so'rovi rad etiladi", () => {
  assert.throws(() => salonUpdateSchema.parse({}));
  assert.doesNotThrow(() => salonUpdateSchema.parse({ name: 'Yangi nom' }));
});

test("ijtimoiy tarmoq havolasi bo'sh string bo'lsa null bo'ladi", () => {
  const salon = salonCreateSchema.parse({ ...validSalon, telegram: '' });
  assert.equal(salon.telegram, null);
});

// ── Xizmat ──────────────────────────────────────────────────────

const validService = { name: 'Gel qoplama', category: oid, price: 150_000, durationMin: 90 };

test("xizmat standart qiymatlar bilan to'ldiriladi", () => {
  const service = serviceCreateSchema.parse(validService);
  assert.equal(service.bufferMin, 0);
  assert.equal(service.isPriceFrom, false);
  assert.deepEqual(service.masters, []);
  assert.equal(service.priceTo, null);
});

test("davomiyliksiz xizmat rad etiladi — slot hisoblab bo'lmaydi", () => {
  assert.throws(() => serviceCreateSchema.parse({ ...validService, durationMin: undefined }));
  assert.throws(() => serviceCreateSchema.parse({ ...validService, durationMin: 5 }));
  assert.throws(() => serviceCreateSchema.parse({ ...validService, durationMin: 700 }));
});

test("teskari narx oralig'i rad etiladi", () => {
  assert.throws(() => serviceCreateSchema.parse({ ...validService, priceTo: 100_000 }));
  assert.doesNotThrow(() => serviceCreateSchema.parse({ ...validService, priceTo: 200_000 }));
});

test('xizmat tahrirlashda faqat kelgan maydon tekshiriladi', () => {
  assert.doesNotThrow(() => serviceUpdateSchema.parse({ price: 200_000 }));
  assert.throws(() => serviceUpdateSchema.parse({}));
  // ikkalasi birga kelsa oraliq baribir tekshiriladi
  assert.throws(() => serviceUpdateSchema.parse({ price: 200_000, priceTo: 100_000 }));
});

test("xizmat narxi butun son bo'lishi kerak", () => {
  assert.throws(() => serviceCreateSchema.parse({ ...validService, price: 150_000.5 }));
  assert.throws(() => serviceCreateSchema.parse({ ...validService, price: -1 }));
});

// ── Mutaxassis ──────────────────────────────────────────────────

test('usta standart qiymatlar bilan yaratiladi', () => {
  const master = masterCreateSchema.parse({ fullName: 'Dildora Karimova' });
  assert.equal(master.experienceYears, 0);
  assert.equal(master.isActive, true);
  assert.deepEqual(master.specialties, []);
});

test('60 yildan ortiq tajriba rad etiladi', () => {
  assert.throws(() => masterCreateSchema.parse({ fullName: 'Dildora', experienceYears: 61 }));
});

// ── Tartib va fayl nomi ─────────────────────────────────────────

test("bo'sh tartib ro'yxati rad etiladi", () => {
  assert.throws(() => reorderSchema.parse({ items: [] }));
  assert.doesNotThrow(() => reorderSchema.parse({ items: [{ id: oid, order: 3 }] }));
});

test("fayl nomida papka bo'ylab yurish rad etiladi", () => {
  assert.throws(() => filenameParamSchema.parse({ filename: '../../.env' }));
  assert.throws(() => filenameParamSchema.parse({ filename: 'salon.txt' }));
  assert.doesNotThrow(() =>
    filenameParamSchema.parse({ filename: 'salon-65f-1722345-ab12cd.webp' }),
  );
});
