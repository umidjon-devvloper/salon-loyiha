import test from 'node:test';
import assert from 'node:assert/strict';

import { canChangeSalonStatus, topEndDate, ALLOWED_SALON_TRANSITIONS } from './admin.service.js';
import { JOBS } from '../jobs/index.js';

// ── Salon holatlari ─────────────────────────────────────────────

test('moderatsiya oqimi: pending → active yoki draft', () => {
  assert.equal(canChangeSalonStatus('pending', 'active'), true);
  assert.equal(canChangeSalonStatus('pending', 'draft'), true);
  assert.equal(canChangeSalonStatus('pending', 'blocked'), true);
});

test("to'ldirilmagan salonni to'g'ridan-to'g'ri tasdiqlab bo'lmaydi", () => {
  // draft → active yo'q: salon avval tekshiruvga yuborilishi kerak
  assert.equal(canChangeSalonStatus('draft', 'active'), false);
  assert.equal(canChangeSalonStatus('draft', 'pending'), true);
});

test('bloklangan salon qayta tiklanadi', () => {
  assert.equal(canChangeSalonStatus('blocked', 'active'), true);
  assert.equal(canChangeSalonStatus('blocked', 'pending'), true);
});

test("noma'lum holat rad etiladi", () => {
  assert.equal(canChangeSalonStatus('yo\u2019q', 'active'), false);
  assert.equal(canChangeSalonStatus('active', 'yo\u2019q'), false);
});

test('har bir holat uchun ruxsat berilgan o‘tishlar aniqlangan', () => {
  for (const status of ['draft', 'pending', 'active', 'blocked']) {
    assert.ok(Array.isArray(ALLOWED_SALON_TRANSITIONS[status]), `${status} tushib qolgan`);
  }
});

// ── TOP muddati ─────────────────────────────────────────────────

const NOW = new Date('2026-08-05T10:00:00Z');
const daysBetween = (a, b) => Math.round((b - a) / 86_400_000);

test('haftalik tarif 7 kun beradi', () => {
  const { days, endDate } = topEndDate({ plan: 'week', currentUntil: null, now: NOW });
  assert.equal(days, 7);
  assert.equal(daysBetween(NOW, endDate), 7);
});

test('oylik tarif 30 kun beradi', () => {
  const { days, endDate } = topEndDate({ plan: 'month', currentUntil: null, now: NOW });
  assert.equal(days, 30);
  assert.equal(daysBetween(NOW, endDate), 30);
});

test('muddati tugamagan TOP ustiga qo\u2019shiladi, o\u2019chirilmaydi', () => {
  // 10 kun qolgan salonga yana hafta sotildi → 17 kun bo'lishi kerak
  const currentUntil = new Date('2026-08-15T10:00:00Z');
  const { endDate } = topEndDate({ plan: 'week', currentUntil, now: NOW });

  assert.equal(daysBetween(NOW, endDate), 17);
});

test('muddati tugagan TOP hozirdan boshlab hisoblanadi', () => {
  const expired = new Date('2026-07-01T10:00:00Z');
  const { endDate } = topEndDate({ plan: 'week', currentUntil: expired, now: NOW });

  assert.equal(daysBetween(NOW, endDate), 7);
});

// ── Cron ────────────────────────────────────────────────────────

test('cron ishlari kunlik va tunda bajariladi', () => {
  const names = JOBS.map((j) => j.name);
  assert.deepEqual(names.sort(), ['autoComplete', 'expireTop']);

  for (const job of JOBS) {
    const [minute, hour] = job.schedule.split(' ');
    assert.match(minute, /^\d+$/, `${job.name}: daqiqa aniq bo'lsin`);
    // Tunda: yuklama past, kunduzgi so'rovlarga xalaqit bermaydi
    assert.ok(Number(hour) < 6, `${job.name} tunda bajarilsin`);
  }
});
