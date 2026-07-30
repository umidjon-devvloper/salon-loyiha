import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  toMin,
  toHHMM,
  todayStr,
  nowMin,
  tomorrowStr,
  weekdayOf,
  addDays,
  diffDays,
  compareDates,
  isPastDate,
  isToday,
  monthOf,
  daysInMonth,
  monthBounds,
  addMonths,
  currentMonth,
  ceilToStep,
  floorToStep,
  overlaps,
  isValidDateStr,
  isValidMonthStr,
  isValidTimeStr,
  formatDateUz,
  formatDateShortUz,
  formatDurationUz,
} from './time.js';

describe('toMin / toHHMM', () => {
  test('konvertatsiya to\'g\'ri', () => {
    assert.equal(toMin('00:00'), 0);
    assert.equal(toMin('09:30'), 570);
    assert.equal(toMin('13:00'), 780);
    assert.equal(toMin('19:00'), 1140);
    assert.equal(toMin('23:59'), 1439);
    assert.equal(toMin('24:00'), 1440);
  });

  test('teskari konvertatsiya', () => {
    assert.equal(toHHMM(0), '00:00');
    assert.equal(toHHMM(570), '09:30');
    assert.equal(toHHMM(1140), '19:00');
    assert.equal(toHHMM(1440), '24:00');
  });

  test('aylanma: toHHMM(toMin(x)) === x', () => {
    for (const t of ['00:00', '07:05', '12:45', '18:15', '23:59']) {
      assert.equal(toHHMM(toMin(t)), t);
    }
  });

  test('noto\'g\'ri qiymatda xato tashlaydi', () => {
    assert.throws(() => toMin('9:30'), TypeError); // 0 yo'q
    assert.throws(() => toMin('25:00'), TypeError);
    assert.throws(() => toMin('09:60'), TypeError);
    assert.throws(() => toMin(''), TypeError);
    assert.throws(() => toMin(570), TypeError);
    assert.throws(() => toHHMM(-1), TypeError);
    assert.throws(() => toHHMM(1441), TypeError);
    assert.throws(() => toHHMM(10.5), TypeError);
  });
});

describe('Toshkent vaqt zonasi (eng xatarli qism)', () => {
  test('UTC kuni o\'tmagan, Toshkentda o\'tgan — kun surilmaydi', () => {
    // 05-avgust 19:30 UTC  =  06-avgust 00:30 Toshkentda
    const now = new Date('2026-08-05T19:30:00Z');
    assert.equal(todayStr(now), '2026-08-06');
    assert.equal(nowMin(now), 30);
  });

  test('yarim kechada 24:00 emas, 00:00', () => {
    // 06-avgust 19:00 UTC = 07-avgust 00:00 Toshkentda
    const now = new Date('2026-08-06T19:00:00Z');
    assert.equal(todayStr(now), '2026-08-07');
    assert.equal(nowMin(now), 0);
  });

  test('kun boshi va oxiri', () => {
    // 05-avgust 19:01 UTC = 06-avgust 00:01
    assert.equal(nowMin(new Date('2026-08-05T19:01:00Z')), 1);
    // 05-avgust 18:59 UTC = 05-avgust 23:59
    assert.equal(nowMin(new Date('2026-08-05T18:59:00Z')), 1439);
    assert.equal(todayStr(new Date('2026-08-05T18:59:00Z')), '2026-08-05');
  });

  test('yil almashishi', () => {
    // 31-dekabr 19:00 UTC = 1-yanvar 00:00 Toshkentda
    const now = new Date('2026-12-31T19:00:00Z');
    assert.equal(todayStr(now), '2027-01-01');
    assert.equal(nowMin(now), 0);
  });

  test('tomorrowStr', () => {
    assert.equal(tomorrowStr(new Date('2026-08-31T06:00:00Z')), '2026-09-01');
  });

  test('parametrsiz chaqiruv to\'g\'ri formatda qaytaradi', () => {
    assert.match(todayStr(), /^\d{4}-\d{2}-\d{2}$/);
    const n = nowMin();
    assert.ok(Number.isInteger(n) && n >= 0 && n < 1440);
  });
});

describe('weekdayOf', () => {
  test('0 = Yakshanba', () => {
    assert.equal(weekdayOf('2026-08-02'), 0); // yakshanba
    assert.equal(weekdayOf('2026-08-03'), 1); // dushanba
    assert.equal(weekdayOf('2026-08-05'), 3); // chorshanba
    assert.equal(weekdayOf('2026-08-08'), 6); // shanba
  });

  test('kabisa yili 29-fevral', () => {
    assert.equal(weekdayOf('2028-02-29'), 2); // seshanba
  });
});

describe('addDays / diffDays', () => {
  test('oddiy qo\'shish', () => {
    assert.equal(addDays('2026-08-05', 3), '2026-08-08');
    assert.equal(addDays('2026-08-05', 0), '2026-08-05');
    assert.equal(addDays('2026-08-05', -5), '2026-07-31');
  });

  test('oy va yil chegarasi', () => {
    assert.equal(addDays('2026-08-31', 1), '2026-09-01');
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(addDays('2027-01-01', -1), '2026-12-31');
  });

  test('kabisa yili', () => {
    assert.equal(addDays('2028-02-28', 1), '2028-02-29');
    assert.equal(addDays('2028-02-29', 1), '2028-03-01');
    assert.equal(addDays('2026-02-28', 1), '2026-03-01'); // kabisa emas
  });

  test('60 kun oldinga (MAX_ADVANCE_DAYS)', () => {
    assert.equal(addDays('2026-08-05', 60), '2026-10-04');
    assert.equal(diffDays('2026-08-05', '2026-10-04'), 60);
  });

  test('diffDays', () => {
    assert.equal(diffDays('2026-08-01', '2026-08-05'), 4);
    assert.equal(diffDays('2026-08-05', '2026-08-01'), -4);
    assert.equal(diffDays('2026-08-05', '2026-08-05'), 0);
  });
});

describe('compareDates / isPastDate / isToday', () => {
  test('string solishtirish xronologik', () => {
    assert.equal(compareDates('2026-08-05', '2026-08-06'), -1);
    assert.equal(compareDates('2026-08-06', '2026-08-05'), 1);
    assert.equal(compareDates('2026-08-05', '2026-08-05'), 0);
    // oddiy `<` ham ishlaydi — algoritmda shunga tayanamiz
    assert.ok('2026-08-05' < '2026-08-06');
    assert.ok('2026-09-01' > '2026-08-31');
  });

  test('o\'tgan kun aniqlanadi', () => {
    const now = new Date('2026-08-05T06:00:00Z'); // Toshkentda 05-avgust 11:00
    assert.equal(isPastDate('2026-08-04', now), true);
    assert.equal(isPastDate('2026-08-05', now), false);
    assert.equal(isPastDate('2026-08-06', now), false);
    assert.equal(isToday('2026-08-05', now), true);
  });
});

describe('oy funksiyalari', () => {
  test('monthOf', () => {
    assert.equal(monthOf('2026-08-05'), '2026-08');
  });

  test('daysInMonth', () => {
    assert.equal(daysInMonth('2026-01'), 31);
    assert.equal(daysInMonth('2026-02'), 28);
    assert.equal(daysInMonth('2028-02'), 29); // kabisa
    assert.equal(daysInMonth('2026-04'), 30);
    assert.equal(daysInMonth('2026-12'), 31);
  });

  test('monthBounds', () => {
    assert.deepEqual(monthBounds('2026-08'), {
      first: '2026-08-01',
      last: '2026-08-31',
      days: 31,
    });
    assert.deepEqual(monthBounds('2026-02'), {
      first: '2026-02-01',
      last: '2026-02-28',
      days: 28,
    });
  });

  test('addMonths', () => {
    assert.equal(addMonths('2026-08', 1), '2026-09');
    assert.equal(addMonths('2026-12', 1), '2027-01');
    assert.equal(addMonths('2026-01', -1), '2025-12');
  });

  test('currentMonth', () => {
    assert.equal(currentMonth(new Date('2026-08-31T19:00:00Z')), '2026-09');
  });
});

describe('slot yordamchilari', () => {
  test('ceilToStep — slotlar 15 daqiqaga tekislanadi', () => {
    assert.equal(ceilToStep(540, 15), 540); // 09:00 → 09:00
    assert.equal(ceilToStep(547, 15), 555); // 09:07 → 09:15
    assert.equal(ceilToStep(541, 15), 555);
    assert.equal(ceilToStep(555, 15), 555);
  });

  test('floorToStep', () => {
    assert.equal(floorToStep(547, 15), 540);
    assert.equal(floorToStep(540, 15), 540);
  });

  test('overlaps — chegara tegishi kesishish emas', () => {
    assert.equal(overlaps({ start: 600, end: 660 }, { start: 660, end: 720 }), false);
    assert.equal(overlaps({ start: 600, end: 660 }, { start: 630, end: 720 }), true);
    assert.equal(overlaps({ start: 840, end: 930 }, { start: 855, end: 900 }), true); // ichида
    assert.equal(overlaps({ start: 600, end: 660 }, { start: 700, end: 720 }), false);
  });
});

describe('validatsiya', () => {
  test('isValidDateStr', () => {
    assert.equal(isValidDateStr('2026-08-05'), true);
    assert.equal(isValidDateStr('2028-02-29'), true); // kabisa
    assert.equal(isValidDateStr('2026-02-30'), false); // yo'q kun
    assert.equal(isValidDateStr('2026-13-01'), false);
    assert.equal(isValidDateStr('2026-8-5'), false); // 0 yo'q
    assert.equal(isValidDateStr('05-08-2026'), false);
    assert.equal(isValidDateStr(''), false);
    assert.equal(isValidDateStr(null), false);
    assert.equal(isValidDateStr(20260805), false);
  });

  test('isValidMonthStr', () => {
    assert.equal(isValidMonthStr('2026-08'), true);
    assert.equal(isValidMonthStr('2026-13'), false);
    assert.equal(isValidMonthStr('2026-00'), false);
    assert.equal(isValidMonthStr('2026-8'), false);
  });

  test('isValidTimeStr', () => {
    assert.equal(isValidTimeStr('09:30'), true);
    assert.equal(isValidTimeStr('24:00'), true);
    assert.equal(isValidTimeStr('24:01'), false);
    assert.equal(isValidTimeStr('9:30'), false);
  });

  test('noto\'g\'ri sanada funksiyalar xato tashlaydi', () => {
    assert.throws(() => weekdayOf('2026-02-30'), TypeError);
    assert.throws(() => addDays('kecha', 1), TypeError);
    assert.throws(() => daysInMonth('2026-13'), TypeError);
  });
});

describe('o\'zbekcha formatlash', () => {
  test('formatDateUz', () => {
    assert.equal(formatDateUz('2026-08-05'), '5-avgust, chorshanba');
    assert.equal(formatDateUz('2026-01-01'), '1-yanvar, payshanba');
    assert.equal(formatDateUz('2026-12-31'), '31-dekabr, payshanba');
    assert.equal(formatDateUz('2026-08-05', { withWeekday: false }), '5-avgust');
  });

  test('formatDateShortUz', () => {
    assert.equal(formatDateShortUz('2026-08-05'), '5-avg');
    assert.equal(formatDateShortUz('2026-01-15'), '15-yan');
  });

  test('formatDurationUz', () => {
    assert.equal(formatDurationUz(45), '45 daqiqa');
    assert.equal(formatDurationUz(60), '1 soat');
    assert.equal(formatDurationUz(90), '1 soat 30 daqiqa');
    assert.equal(formatDurationUz(150), '2 soat 30 daqiqa');
    assert.equal(formatDurationUz(0), '0 daqiqa');
  });
});
