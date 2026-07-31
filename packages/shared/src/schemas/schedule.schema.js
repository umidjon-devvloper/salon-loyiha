import { z } from 'zod';
import { isValidDateStr, isValidTimeStr } from '../utils/time.js';
import { phoneSchema } from './auth.schema.js';
import { objectIdSchema, dateSchema, timeSchema } from './booking.schema.js';

/**
 * Salon egasi kabineti: ish vaqti, dam olish kunlari, yozuvlar.
 *
 * Vaqt tashqarida HAR DOIM 'HH:MM' string ko'rinishida yuriladi —
 * daqiqaga aylantirish backend ichida bo'ladi. Salon egasi ham, frontend ham
 * 540 degan raqam bilan ishlamasin.
 */

const breakSchema = z
  .object({ start: timeSchema, end: timeSchema })
  .refine((b) => b.end > b.start, {
    message: "Tanaffus tugashi boshlanishidan keyin bo'lsin",
    path: ['end'],
  });

const workingDaySchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    isOpen: z.coerce.boolean().default(true),
    start: timeSchema.optional(),
    end: timeSchema.optional(),
    breaks: z.array(breakSchema).max(3, "Bir kunda ko'pi bilan 3 ta tanaffus").default([]),
  })
  .refine((d) => !d.isOpen || (d.start && d.end), {
    message: 'Ochiq kun uchun boshlanish va tugash vaqti kerak',
    path: ['start'],
  })
  .refine((d) => !d.isOpen || d.end > d.start, {
    message: "Ish tugashi boshlanishidan keyin bo'lsin",
    path: ['end'],
  })
  .refine((d) => !d.isOpen || d.breaks.every((b) => b.start >= d.start && b.end <= d.end), {
    message: "Tanaffus ish vaqti ichida bo'lsin",
    path: ['breaks'],
  });

/**
 * PUT /api/owner/schedule
 * Hafta TO'LIQ yuboriladi: 7 kun, har biri bir marta.
 * Qisman yuborilsa, yuborilmagan kun jimgina "yopiq" bo'lib qoladi va
 * salon egasi buni bilmay qoladi — eng katta biznes xatari shu.
 */
export const scheduleUpdateSchema = z
  .object({
    target: z.enum(['salon', 'master']).default('salon'),
    masterId: objectIdSchema.nullable().default(null),
    days: z.array(workingDaySchema).length(7, 'Haftaning 7 kuni ham yuborilishi kerak'),
  })
  .refine((v) => new Set(v.days.map((d) => d.weekday)).size === 7, {
    message: "Har bir hafta kuni bir martadan bo'lsin",
    path: ['days'],
  })
  .refine((v) => v.target !== 'master' || v.masterId, {
    message: 'Mutaxassis tanlanmagan',
    path: ['masterId'],
  });

// ── Dam olish / bloklangan vaqt ─────────────────────────────────

export const timeOffCreateSchema = z
  .object({
    masterId: objectIdSchema.nullable().default(null), // null = butun salon
    dateFrom: dateSchema,
    dateTo: dateSchema,
    allDay: z.coerce.boolean().default(true),
    start: timeSchema.optional(),
    end: timeSchema.optional(),
    reason: z.string().trim().max(200).default(''),
  })
  .refine((v) => v.dateTo >= v.dateFrom, {
    message: "Tugash sanasi boshlanish sanasidan oldin bo'lmasin",
    path: ['dateTo'],
  })
  .refine((v) => v.allDay || (v.start && v.end), {
    message: "Kun bo'yi emas bo'lsa, vaqt oralig'ini kiriting",
    path: ['start'],
  })
  .refine((v) => v.allDay || v.end > v.start, {
    message: "Tugash vaqti boshlanishidan keyin bo'lsin",
    path: ['end'],
  });

export const timeOffQuerySchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

// ── Kabinet yozuvlari ───────────────────────────────────────────

export const ownerBookingsQuerySchema = z
  .object({
    date: dateSchema.optional(), // bir kunlik kalendar ko'rinishi
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    masterId: objectIdSchema.optional(),
    status: z
      .enum(['awaiting_payment', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'])
      .optional(),
  })
  .refine((v) => !v.from || !v.to || v.to >= v.from, {
    message: "Oraliq noto'g'ri",
    path: ['to'],
  });

export const bookingStatusSchema = z
  .object({
    status: z.enum(['confirmed', 'cancelled', 'completed', 'no_show'], {
      errorMap: () => ({ message: "Bunday holat yo'q" }),
    }),
    cancelReason: z.string().trim().max(200).default(''),
  })
  .refine((v) => v.status !== 'cancelled' || v.cancelReason.length > 0, {
    message: "Bekor qilish sababini yozing — mijozga shu ko'rinadi",
    path: ['cancelReason'],
  });

/**
 * POST /api/owner/bookings/manual
 * Telefon orqali kelgan mijozni egasi qo'lda kiritadi.
 * Mijozning akkaunti yo'q → `client: null`, `source: 'manual'`.
 */
export const manualBookingSchema = z.object({
  masterId: objectIdSchema,
  serviceIds: z.array(objectIdSchema).min(1, 'Kamida bitta xizmat tanlang').max(10),
  date: dateSchema,
  startTime: timeSchema,
  clientName: z
    .string({ required_error: 'Mijoz ismini yozing' })
    .trim()
    .min(2, "Ism kamida 2 belgidan iborat bo'lsin")
    .max(100),
  clientPhone: phoneSchema,
  note: z.string().trim().max(500).default(''),
});

export { isValidDateStr, isValidTimeStr };

export default {
  scheduleUpdateSchema,
  timeOffCreateSchema,
  timeOffQuerySchema,
  ownerBookingsQuerySchema,
  bookingStatusSchema,
  manualBookingSchema,
};
