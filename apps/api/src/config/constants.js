import env from './env.js';

// ── Booking dvijogi ─────────────────────────────────────────────
export const SLOT_STEP_MIN = env.SLOT_STEP_MIN; // 15 daq
export const MIN_LEAD_TIME_MIN = env.MIN_LEAD_TIME_MIN; // hozirdan +60 daq
export const MAX_ADVANCE_DAYS = env.MAX_ADVANCE_DAYS; // 60 kun oldinga
export const CANCEL_LIMIT_MIN = env.CANCEL_LIMIT_MIN; // boshlanishiga 120 daq
export const BOOKING_HOLD_MINUTES = env.BOOKING_HOLD_MINUTES; // to'lov uchun 15 daq
export const TIMEZONE = env.TIMEZONE; // Asia/Tashkent

// Bir mijozning bir vaqtda ochiq yozuvlari chegarasi
export const MAX_ACTIVE_BOOKINGS = 5;

// ── Rollar ──────────────────────────────────────────────────────
export const ROLES = {
  CLIENT: 'client',
  OWNER: 'owner',
  ADMIN: 'admin',
};
export const ROLE_VALUES = Object.values(ROLES);

// ── Booking statuslari ──────────────────────────────────────────
export const BOOKING_STATUS = {
  AWAITING_PAYMENT: 'awaiting_payment',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};
export const BOOKING_STATUS_VALUES = Object.values(BOOKING_STATUS);

/**
 * Slotni BAND qiladigan statuslar.
 * Booking unique partial index va slot hisoblash ayni shu ro'yxatga tayanadi —
 * o'zgartirilsa, index ham migratsiya qilinishi shart.
 */
export const ACTIVE_BOOKING_STATUSES = [
  BOOKING_STATUS.AWAITING_PAYMENT,
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.CONFIRMED,
];

// ── Salon statuslari ────────────────────────────────────────────
export const SALON_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  ACTIVE: 'active',
  BLOCKED: 'blocked',
};
export const SALON_STATUS_VALUES = Object.values(SALON_STATUS);

// ── Xato kodlari ────────────────────────────────────────────────
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_OWNER: 'NOT_OWNER',
  NOT_FOUND: 'NOT_FOUND',
  PHONE_TAKEN: 'PHONE_TAKEN',
  SLOT_TAKEN: 'SLOT_TAKEN',
  DUPLICATE_BOOKING: 'DUPLICATE_BOOKING',
  HAS_ACTIVE_BOOKINGS: 'HAS_ACTIVE_BOOKINGS',
  INVALID_SERVICE: 'INVALID_SERVICE',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_STATUS: 'INVALID_STATUS',
  TOO_LATE: 'TOO_LATE',
  TOO_MANY_ACTIVE: 'TOO_MANY_ACTIVE',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  SERVER_ERROR: 'SERVER_ERROR',
};

// ── Rasm yuklash ────────────────────────────────────────────────
export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_SALON_IMAGES = 10;
export const IMAGE_SIZES = {
  full: { width: 1600, quality: 80 },
  thumb: { width: 400, height: 300, quality: 80 },
};

// ── Shahar va tumanlar (alohida kolleksiya kerak emas) ──────────
export const CITIES = [
  {
    name: 'Toshkent',
    districts: [
      'Bektemir',
      'Chilonzor',
      'Mirobod',
      'Mirzo Ulug\'bek',
      'Olmazor',
      'Sergeli',
      'Shayxontohur',
      'Uchtepa',
      'Yakkasaroy',
      'Yashnobod',
      'Yangihayot',
      'Yunusobod',
    ],
  },
  { name: 'Samarqand', districts: [] },
  { name: 'Buxoro', districts: [] },
  { name: 'Andijon', districts: [] },
  { name: 'Farg\'ona', districts: [] },
  { name: 'Namangan', districts: [] },
  { name: 'Qarshi', districts: [] },
  { name: 'Nukus', districts: [] },
  { name: 'Urganch', districts: [] },
  { name: 'Termiz', districts: [] },
  { name: 'Jizzax', districts: [] },
  { name: 'Guliston', districts: [] },
  { name: 'Navoiy', districts: [] },
];

export const DEFAULT_CITY = 'Toshkent';

// ── Hafta kunlari (0 = Yakshanba, JS Date bilan bir xil) ────────
export const WEEKDAYS_UZ = [
  'Yakshanba',
  'Dushanba',
  'Seshanba',
  'Chorshanba',
  'Payshanba',
  'Juma',
  'Shanba',
];
