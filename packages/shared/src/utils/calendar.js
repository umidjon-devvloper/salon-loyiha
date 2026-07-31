import { MONTHS_UZ, addDays, monthBounds, weekdayOf } from './time.js';

/**
 * Kalendar gridi — sof sana mantig'i, UI'siz.
 * Web va mobil ilova ayni shu funksiyani ishlatadi (mobil kalendar boshqacha
 * ko'rinadi, lekin kunlarni bir xil joylashtiradi).
 */

/**
 * Oyni 7 ustunli gridga joylaydi. Hafta DUSHANBADAN boshlanadi —
 * `weekdayOf` esa yakshanbani 0 deb qaytaradi, shuning uchun surish kerak.
 *
 * Bo'sh kataklar `null` bo'ladi. Uzunlik har doim 7 ga karrali.
 */
export function buildMonthGrid(monthStr) {
  const { first, days } = monthBounds(monthStr);
  const leading = (weekdayOf(first) + 6) % 7;

  const cells = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: days }, (_, i) => addDays(first, i)),
  ];

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * '2026-08' → 'Avgust 2026'
 *
 * `MONTHS_UZ` kichik harfda ('5-avgust, chorshanba' ichida shunday kerak),
 * sarlavhada esa bosh harf bilan yoziladi.
 */
export function formatMonthUz(monthStr) {
  const name = MONTHS_UZ[Number(monthStr.slice(5, 7)) - 1];
  return `${name[0].toUpperCase()}${name.slice(1)} ${monthStr.slice(0, 4)}`;
}

/** Dushanbadan boshlangan hafta kunlari — kalendar sarlavhasi uchun */
export const WEEK_LABELS_UZ = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

export default { buildMonthGrid, formatMonthUz, WEEK_LABELS_UZ };
