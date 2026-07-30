/**
 * Vaqt utilitalari — butun booking dvijogining poydevori.
 *
 * QAT'IY QOIDA (CONTEXT.md §6):
 *   Sana  → String  'YYYY-MM-DD'          masalan '2026-08-05'
 *   Vaqt  → Number  yarim kechadan daqiqa masalan 570 = 09:30
 *
 * `Date` obyekti biznes logikada ISHLATILMAYDI. U faqat shu faylda,
 * "hozir soat nechi" degan savolga javob berish uchun ishlatiladi.
 * Sabab: server UTC da, foydalanuvchi UTC+5 da — `Date` bilan kun surilib ketadi.
 *
 * Platforma faqat Asia/Tashkent (UTC+5, DST yo'q) da ishlaydi.
 */

export const TIMEZONE = 'Asia/Tashkent';

export const MINUTES_IN_DAY = 1440;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;
// 00:00–23:59, plus 24:00 (ish vaqti tugashi). 24:01 ruxsat etilmaydi.
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$|^24:00$/;

// ── Formatlarni tekshirish ──────────────────────────────────────

/** '2026-08-05' haqiqiy kalendar sanasimi? ('2026-02-30' → false) */
export function isValidDateStr(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
}

/** '2026-08' formatimi? */
export function isValidMonthStr(value) {
  if (typeof value !== 'string' || !MONTH_RE.test(value)) return false;
  const m = Number(value.slice(5, 7));
  return m >= 1 && m <= 12;
}

/** '09:30' formatimi? */
export function isValidTimeStr(value) {
  return typeof value === 'string' && TIME_RE.test(value);
}

// ── Konvertatsiya ───────────────────────────────────────────────

/** '09:30' → 570 */
export function toMin(hhmm) {
  if (!isValidTimeStr(hhmm)) {
    throw new TypeError(`toMin: noto'g'ri vaqt formati — ${hhmm}`);
  }
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** 570 → '09:30'. 1440 → '24:00' (ish vaqti tugashi uchun ruxsat) */
export function toHHMM(min) {
  if (!Number.isInteger(min) || min < 0 || min > MINUTES_IN_DAY) {
    throw new TypeError(`toHHMM: noto'g'ri daqiqa — ${min}`);
  }
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── "Hozir" — Toshkent vaqtida ──────────────────────────────────
// `now` parametri faqat test uchun. Ishlab chiqarishda hech qachon berilmaydi.

const dateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23', // yarim kechada '24:00' emas, '00:00' qaytishi uchun
});

/** Toshkentdagi bugungi sana → '2026-08-05' */
export function todayStr(now = new Date()) {
  return dateFmt.format(now);
}

/** Toshkentdagi hozirgi vaqt daqiqada → 570 */
export function nowMin(now = new Date()) {
  return toMin(timeFmt.format(now));
}

/** Toshkentdagi ertangi sana */
export function tomorrowStr(now = new Date()) {
  return addDays(todayStr(now), 1);
}

// ── Sana arifmetikasi ───────────────────────────────────────────

/** '2026-08-05' → 3 (0 = Yakshanba, JS `getDay()` bilan bir xil) */
export function weekdayOf(dateStr) {
  assertDate(dateStr, 'weekdayOf');
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** '2026-08-05' + 3 → '2026-08-08'. Manfiy son ham ishlaydi */
export function addDays(dateStr, n) {
  assertDate(dateStr, 'addDays');
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** Ikki sana orasidagi kunlar farqi: diffDays('2026-08-01','2026-08-05') → 4 */
export function diffDays(fromStr, toStr) {
  assertDate(fromStr, 'diffDays');
  assertDate(toStr, 'diffDays');
  const ms = utcMs(toStr) - utcMs(fromStr);
  return Math.round(ms / 86_400_000);
}

/**
 * Sanalarni solishtirish: -1 | 0 | 1
 * 'YYYY-MM-DD' leksikografik tartibda ham xronologik, shuning uchun
 * kodda `a < b` deb yozish ham to'g'ri. Bu funksiya niyatni ochiq qiladi.
 */
export function compareDates(a, b) {
  assertDate(a, 'compareDates');
  assertDate(b, 'compareDates');
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isPastDate(dateStr, now = new Date()) {
  return compareDates(dateStr, todayStr(now)) < 0;
}

export function isToday(dateStr, now = new Date()) {
  return dateStr === todayStr(now);
}

// ── Oy bilan ishlash (kalendar endpointi uchun) ─────────────────

/** '2026-08-05' → '2026-08' */
export function monthOf(dateStr) {
  assertDate(dateStr, 'monthOf');
  return dateStr.slice(0, 7);
}

/** '2026-08' → 31 */
export function daysInMonth(monthStr) {
  assertMonth(monthStr, 'daysInMonth');
  const y = Number(monthStr.slice(0, 4));
  const m = Number(monthStr.slice(5, 7));
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** '2026-08' → { first: '2026-08-01', last: '2026-08-31', days: 31 } */
export function monthBounds(monthStr) {
  const days = daysInMonth(monthStr);
  return {
    first: `${monthStr}-01`,
    last: `${monthStr}-${String(days).padStart(2, '0')}`,
    days,
  };
}

/** '2026-08' + 1 → '2026-09' */
export function addMonths(monthStr, n) {
  assertMonth(monthStr, 'addMonths');
  const y = Number(monthStr.slice(0, 4));
  const m = Number(monthStr.slice(5, 7));
  const dt = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Toshkentdagi joriy oy → '2026-08' */
export function currentMonth(now = new Date()) {
  return monthOf(todayStr(now));
}

// ── Slot yordamchilari ──────────────────────────────────────────

/** 547 → 555 (step = 15). Slotlar 09:00, 09:15, 09:30 ko'rinishida bo'lishi uchun */
export function ceilToStep(min, step) {
  return Math.ceil(min / step) * step;
}

export function floorToStep(min, step) {
  return Math.floor(min / step) * step;
}

/** Ikki interval kesishadimi? Chegara tegishi kesishish HISOBLANMAYDI */
export function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

// ── O'zbekcha formatlash ────────────────────────────────────────

export const WEEKDAYS_UZ = [
  'yakshanba',
  'dushanba',
  'seshanba',
  'chorshanba',
  'payshanba',
  'juma',
  'shanba',
];

export const MONTHS_UZ = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
];

/**
 * '2026-08-05' → '5-avgust, chorshanba'
 * `date-fns` ning `uz` locale'i to'liq emas, shuning uchun qo'lda.
 */
export function formatDateUz(dateStr, { withWeekday = true } = {}) {
  assertDate(dateStr, 'formatDateUz');
  const [, m, d] = dateStr.split('-').map(Number);
  const base = `${d}-${MONTHS_UZ[m - 1]}`;
  return withWeekday ? `${base}, ${WEEKDAYS_UZ[weekdayOf(dateStr)]}` : base;
}

/** '2026-08-05' → '5-avg' (kalendar sarlavhasi uchun) */
export function formatDateShortUz(dateStr) {
  assertDate(dateStr, 'formatDateShortUz');
  const [, m, d] = dateStr.split('-').map(Number);
  return `${d}-${MONTHS_UZ[m - 1].slice(0, 3)}`;
}

/** 150 → '2 soat 30 daqiqa' · 90 → '1 soat 30 daqiqa' · 45 → '45 daqiqa' */
export function formatDurationUz(min) {
  if (!Number.isInteger(min) || min < 0) {
    throw new TypeError(`formatDurationUz: noto'g'ri daqiqa — ${min}`);
  }
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} daqiqa`;
  if (m === 0) return `${h} soat`;
  return `${h} soat ${m} daqiqa`;
}

// ── Ichki yordamchilar ──────────────────────────────────────────

function utcMs(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function assertDate(value, fn) {
  if (!isValidDateStr(value)) {
    throw new TypeError(`${fn}: noto'g'ri sana — ${value} ('YYYY-MM-DD' kutilgan)`);
  }
}

function assertMonth(value, fn) {
  if (!isValidMonthStr(value)) {
    throw new TypeError(`${fn}: noto'g'ri oy — ${value} ('YYYY-MM' kutilgan)`);
  }
}
