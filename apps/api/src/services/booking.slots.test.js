import test from 'node:test';
import assert from 'node:assert/strict';
import { toHHMM, weekdayOf } from '@gozal/shared/utils/time';

import { computeDaySlots, subtractMany, getWorkingIntervals } from './schedule.service.js';
import { assertBookableDate } from './booking.service.js';
import { ACTIVE_BOOKING_STATUSES, SLOT_STEP_MIN } from '../config/constants.js';

/**
 * 04-booking-algoritmi.md dagi 14 ta test holati.
 * Bazasiz ishlaydi — slot hisoblash toza funksiyaga ajratilgan.
 *
 * 9-holat (bir slotga ikki parallel so'rov) haqiqiy MongoDB talab qiladi,
 * u `models/booking.index.test.js` da (MONGO_TEST_URI bilan ishga tushadi).
 */

const WED = '2026-08-05'; // chorshanba
const SUN = '2026-08-09'; // yakshanba
const MON = '2026-08-10'; // dushanba

/** Du–Sha 09:00–19:00, tanaffus 13:00–14:00, yakshanba yopiq */
function week(overrides = {}) {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    isOpen: weekday !== 0,
    startMin: 540,
    endMin: 1140,
    breaks: weekday === 0 ? [] : [{ startMin: 780, endMin: 840 }],
    ...(overrides[weekday] || {}),
  }));
}

const salon = { workingHours: week() };
const master = { _id: 'm1', workingHours: [] };

function slotsFor(dateStr, options = {}) {
  const result = computeDaySlots({
    salon,
    master,
    dateStr,
    weekday: weekdayOf(dateStr),
    totalDuration: 60,
    step: SLOT_STEP_MIN,
    ...options,
  });

  return { ...result, times: result.slots.map(toHHMM) };
}

// ── 1. Dam olish kuni ───────────────────────────────────────────

test("1) yakshanba — ish kuni emas, slot yo'q", () => {
  const result = slotsFor(SUN);
  assert.equal(result.isWorkingDay, false);
  assert.equal(result.reason, 'closed');
  assert.deepEqual(result.slots, []);
});

// ── 2. Tanaffus ─────────────────────────────────────────────────

test('2) tushlik tanaffusi ichida slot chiqmaydi', () => {
  const { times } = slotsFor(WED);

  // 60 daqiqalik xizmat 13:00 da boshlansa 14:00 da tugaydi — tanaffus ustiga tushadi
  for (const t of ['12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45']) {
    assert.equal(times.includes(t), false, `${t} chiqmasligi kerak edi`);
  }

  assert.ok(times.includes('12:00'), "12:00–13:00 tanaffusgacha sig'adi");
  assert.ok(times.includes('14:00'), 'tanaffusdan keyin ochiladi');
});

// ── 3. Ish vaqti ichida tugash ──────────────────────────────────

test('3) 90 daqiqalik xizmatda oxirgi slot 17:30 (19:00 da yopiladi)', () => {
  const { times } = slotsFor(WED, { totalDuration: 90 });
  assert.equal(times[times.length - 1], '17:30');
  assert.equal(times.includes('17:45'), false);
});

// ── 4. Band vaqt ────────────────────────────────────────────────

test("4) 14:00–15:30 band bo'lsa, unga tegadigan slotlar yo'qoladi", () => {
  const { times } = slotsFor(WED, {
    bookings: [{ startMin: 840, endMin: 930 }], // 14:00–15:30
  });

  for (const t of ['13:15', '14:00', '14:30', '15:00']) {
    assert.equal(times.includes(t), false, `${t} chiqmasligi kerak edi`);
  }

  assert.ok(times.includes('15:30'), 'band vaqt tugagach ochiladi');
});

// ── 5. Lead time ────────────────────────────────────────────────

test("5) bugun soat 10:00 bo'lsa, 11:00 dan oldingi slot chiqmaydi", () => {
  const { times } = slotsFor(WED, { earliest: 10 * 60 + 60 }); // hozir 10:00 + 60 daq

  assert.equal(times.includes('10:00'), false);
  assert.equal(times.includes('10:45'), false);
  assert.equal(times[0], '11:00');
});

// ── 6. Bir nechta xizmat ────────────────────────────────────────

test('6) ikkita xizmat (60 + 90) 150 daqiqalik slot beradi', () => {
  const totalDuration = 60 + 90;
  const result = computeDaySlots({
    salon,
    master,
    dateStr: WED,
    weekday: weekdayOf(WED),
    totalDuration,
    step: SLOT_STEP_MIN,
  });

  // 09:00 dan boshlansa 11:30 da tugaydi — tanaffusgacha sig'adi
  assert.ok(result.slots.includes(540));
  // 11:00 da boshlansa 13:30 — tanaffus ustiga tushadi, chiqmasligi kerak
  assert.equal(result.slots.includes(660), false);
  // tanaffusdan keyin: 14:00–16:30
  assert.ok(result.slots.includes(840));
  // oxirgi slot 16:30 (19:00 da tugaydi)
  assert.equal(Math.max(...result.slots), 990);
});

// ── 7. Ustaning ta'tili ─────────────────────────────────────────

test("7) usta ta'tilda (allDay) — butun kun yopiq", () => {
  const result = slotsFor(WED, {
    timeOffs: [{ dateFrom: '2026-08-03', dateTo: '2026-08-07', allDay: true, reason: "Ta'til" }],
  });

  assert.equal(result.isWorkingDay, false);
  assert.equal(result.reason, "Ta'til");
  assert.deepEqual(result.slots, []);
});

test("7b) ta'til oralig'idan tashqarida kun ochiq qoladi", () => {
  const result = slotsFor(MON, {
    timeOffs: [{ dateFrom: '2026-08-03', dateTo: '2026-08-07', allDay: true }],
  });
  assert.equal(result.isWorkingDay, true);
  assert.ok(result.slots.length > 0);
});

// ── 8. Butun salon yopiq ────────────────────────────────────────

test('8) butun salon yopiq (master: null) — hamma usta uchun amal qiladi', () => {
  // Bunday timeOff barcha ustalar so'rovida qaytadi ($or: [{master}, {master: null}]),
  // shuning uchun hisoblashda oddiy timeOff kabi ishlaydi
  const result = slotsFor(WED, {
    timeOffs: [{ dateFrom: WED, dateTo: WED, allDay: true, master: null, reason: 'Bayram' }],
  });

  assert.equal(result.isWorkingDay, false);
  assert.equal(result.reason, 'Bayram');
});

test("8b) kunning bir qismi bloklansa faqat o'sha oraliq yopiladi", () => {
  const { times } = slotsFor(WED, {
    timeOffs: [
      { dateFrom: WED, dateTo: WED, allDay: false, startMin: 600, endMin: 720 }, // 10:00–12:00
    ],
  });

  assert.equal(times.includes('10:00'), false);
  assert.equal(times.includes('11:00'), false);
  assert.ok(times.includes('09:00'));
  assert.ok(times.includes('12:00'));
});

// ── 10. Bekor qilingan yozuv slotni bo'shatadi ──────────────────

test('10) bekor qilingan va kelmagan yozuvlar slotni band qilmaydi', () => {
  // Slot hisoblashda faqat shu statuslar band deb qaraladi
  assert.deepEqual(ACTIVE_BOOKING_STATUSES, ['awaiting_payment', 'pending', 'confirmed']);
  assert.equal(ACTIVE_BOOKING_STATUSES.includes('cancelled'), false);
  assert.equal(ACTIVE_BOOKING_STATUSES.includes('no_show'), false);
  assert.equal(ACTIVE_BOOKING_STATUSES.includes('completed'), false);
});

// ── 11. Ustaning o'z jadvali ────────────────────────────────────

test("11) ustaning o'z jadvali bo'lsa, salonniki emas, ustaniki ishlatiladi", () => {
  const ownMaster = {
    _id: 'm2',
    workingHours: week({ 3: { startMin: 600, endMin: 900, breaks: [] } }), // chorshanba 10:00–15:00
  };

  const result = computeDaySlots({
    salon,
    master: ownMaster,
    dateStr: WED,
    weekday: weekdayOf(WED),
    totalDuration: 60,
    step: SLOT_STEP_MIN,
  });

  const times = result.slots.map(toHHMM);
  assert.equal(times[0], '10:00');
  assert.equal(times[times.length - 1], '14:00');
  assert.equal(times.includes('09:00'), false, 'salon jadvali ishlatilib ketdi');
});

// ── 12–13. Sana chegaralari ─────────────────────────────────────

test("12) o'tgan sana rad etiladi", () => {
  assert.throws(() => assertBookableDate('2026-08-04', '2026-08-05'), /INVALID_DATE|o'tgan/i);
});

test('13) 60 kundan naridagi sana rad etiladi', () => {
  assert.doesNotThrow(() => assertBookableDate('2026-10-04', '2026-08-05')); // 60 kun
  assert.throws(() => assertBookableDate('2026-10-05', '2026-08-05')); // 61 kun
});

test('bugungi sana qabul qilinadi', () => {
  assert.doesNotThrow(() => assertBookableDate('2026-08-05', '2026-08-05'));
});

// ── 14. Qo'lda kiritilgan yozuv ─────────────────────────────────

test("14) egasi qo'lda kiritgan yozuv onlayn slotlardan yo'qoladi", () => {
  // Qo'lda yozuv ham oddiy Booking — `source: manual`, statusi `confirmed`.
  // Slot hisoblash manbaga qaramaydi, faqat vaqt oralig'iga qaraydi
  const { times } = slotsFor(WED, {
    bookings: [{ startMin: 600, endMin: 660, source: 'manual', status: 'confirmed' }],
  });

  assert.equal(times.includes('10:00'), false);
  assert.ok(times.includes('11:00'));
});

// ── Interval arifmetikasi ───────────────────────────────────────

test("kesishmaydigan kesik intervalni o'zgartirmaydi", () => {
  const result = subtractMany([{ start: 540, end: 1140 }], [{ start: 1200, end: 1300 }]);
  assert.deepEqual(result, [{ start: 540, end: 1140 }]);
});

test("intervalni to'liq qoplaydigan kesik uni yo'q qiladi", () => {
  const result = subtractMany([{ start: 540, end: 600 }], [{ start: 500, end: 700 }]);
  assert.deepEqual(result, []);
});

test("o'rtadan kesik ikkita interval qoldiradi", () => {
  const result = subtractMany([{ start: 540, end: 1140 }], [{ start: 780, end: 840 }]);
  assert.deepEqual(result, [
    { start: 540, end: 780 },
    { start: 840, end: 1140 },
  ]);
});

test("jadval umuman kiritilmagan bo'lsa kun yopiq deb qaraladi", () => {
  const result = getWorkingIntervals({ salon: { workingHours: [] }, master: {}, weekday: 3 });
  assert.deepEqual(result.intervals, []);
  assert.equal(result.reason, 'closed');
});

test('joy qolmagan kun "yopiq" emas, "full" deb belgilanadi', () => {
  const result = slotsFor(WED, {
    bookings: [
      { startMin: 540, endMin: 780 }, // 09:00–13:00
      { startMin: 840, endMin: 1140 }, // 14:00–19:00
    ],
  });

  assert.equal(result.isWorkingDay, true);
  assert.equal(result.reason, 'full');
  assert.deepEqual(result.slots, []);
});
