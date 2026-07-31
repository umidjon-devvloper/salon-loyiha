import { ceilToStep } from '@gozal/shared/utils/time';

/**
 * ⭐ Booking dvijogining yuragi. Bu faylda BAZAGA murojaat yo'q —
 * hammasi toza funksiya, shuning uchun 04-booking-algoritmi.md dagi
 * test holatlari bazasiz tekshiriladi.
 *
 * BO'SH SLOTLAR = ISH VAQTI
 *               − tanaffuslar
 *               − timeOffs (ta'til, bayram)
 *               − band yozuvlar
 *               − o'tib ketgan vaqt (bugun bo'lsa)
 */

/** Bir intervaldan kesikni ayirish → 0, 1 yoki 2 ta interval qoladi */
export function subtract(interval, cut) {
  // kesishmaydi
  if (cut.end <= interval.start || cut.start >= interval.end) return [interval];

  const out = [];
  if (cut.start > interval.start) out.push({ start: interval.start, end: cut.start });
  if (cut.end < interval.end) out.push({ start: cut.end, end: interval.end });
  return out;
}

/** Intervallar massividan bir nechta kesikni ayirish */
export function subtractMany(intervals, cuts) {
  let result = intervals;

  for (const cut of cuts || []) {
    result = result.flatMap((interval) => subtract(interval, cut));
  }

  return result.filter((interval) => interval.end > interval.start);
}

/**
 * Ustaning aynan shu kundagi ochiq intervallari.
 * Ustaning o'z jadvali bo'lmasa — salonniki qo'llanadi (arxitektura qarori).
 */
export function getWorkingIntervals({ salon, master, weekday }) {
  const source = master?.workingHours?.length ? master.workingHours : salon?.workingHours || [];
  const day = source.find((d) => d.weekday === weekday);

  if (!day || !day.isOpen) return { intervals: [], reason: 'closed' };

  const breaks = (day.breaks || []).map((b) => ({ start: b.startMin, end: b.endMin }));
  const intervals = subtractMany([{ start: day.startMin, end: day.endMin }], breaks);

  return { intervals, reason: null };
}

/**
 * Bloklangan kunlar/vaqtlar.
 * `dateFrom`/`dateTo` — 'YYYY-MM-DD' string: bu formatda oddiy string
 * solishtirish xronologik solishtirishga teng, Date obyekti kerak emas.
 */
export function applyTimeOffs(intervals, timeOffs, dateStr) {
  const cuts = [];

  for (const timeOff of timeOffs || []) {
    if (dateStr < timeOff.dateFrom || dateStr > timeOff.dateTo) continue;

    if (timeOff.allDay) {
      return { intervals: [], reason: timeOff.reason || 'timeoff' };
    }

    cuts.push({ start: timeOff.startMin, end: timeOff.endMin });
  }

  return { intervals: subtractMany(intervals, cuts), reason: null };
}

/**
 * Intervallardan slot yasaydi.
 *
 * Ikki qoida buzilmaydi:
 *  1. Xizmat ish vaqti ICHIDA tugashi kerak (`t + duration <= end`) —
 *     90 daqiqalik xizmatni 19:00 da yopiladigan salonda 18:30 ga yozib bo'lmaydi
 *  2. Slotlar qadamga tekislanadi: 09:00, 09:15 — 09:07 emas
 */
export function generateSlots({ intervals, totalDuration, step, earliest = 0 }) {
  const slots = [];

  for (const interval of intervals) {
    let t = ceilToStep(interval.start, step);

    while (t + totalDuration <= interval.end) {
      if (t >= earliest) slots.push(t);
      t += step;
    }
  }

  return slots;
}

/**
 * Bir kunning bo'sh slotlari — to'liq zanjir, toza funksiya.
 *
 * @param {object[]} bookings  [{ startMin, endMin }] — band yozuvlar
 * @param {number}   earliest  eng erta ruxsat etilgan boshlanish daqiqasi
 */
export function computeDaySlots({
  salon,
  master,
  dateStr,
  weekday,
  timeOffs = [],
  bookings = [],
  totalDuration,
  step,
  earliest = 0,
}) {
  let { intervals, reason } = getWorkingIntervals({ salon, master, weekday });
  if (!intervals.length) return { isWorkingDay: false, reason, slots: [] };

  ({ intervals, reason } = applyTimeOffs(intervals, timeOffs, dateStr));
  if (!intervals.length) return { isWorkingDay: false, reason, slots: [] };

  intervals = subtractMany(
    intervals,
    bookings.map((b) => ({ start: b.startMin, end: b.endMin })),
  );

  const slots = generateSlots({ intervals, totalDuration, step, earliest });

  // Ish kuni, lekin joy qolmagan — bu "yopiq" dan boshqa holat:
  // mijozga "boshqa kunni tanlang" deyish kerak, "dam olish kuni" emas
  return {
    isWorkingDay: true,
    reason: slots.length ? null : 'full',
    slots,
  };
}

export default {
  subtract,
  subtractMany,
  getWorkingIntervals,
  applyTimeOffs,
  generateSlots,
  computeDaySlots,
};
