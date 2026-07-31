import { z } from 'zod';
import { isValidDateStr, isValidMonthStr, isValidTimeStr } from '../utils/time.js';
import { phoneSchema } from './auth.schema.js';

/**
 * Band qilish sxemalari.
 * Sana va vaqt HAR DOIM string: 'YYYY-MM-DD' va 'HH:MM'.
 * Date obyekti ishlatilmaydi — timezone muammosi shu qarordan kelib chiqadi.
 */

export const objectIdSchema = z
  .string({ required_error: 'Tanlanmagan' })
  .regex(/^[a-f\d]{24}$/i, "Noto'g'ri identifikator");

export const dateSchema = z
  .string({ required_error: 'Sana tanlanmagan' })
  .refine(isValidDateStr, "Sana 'YYYY-MM-DD' ko'rinishida bo'lishi kerak");

export const monthSchema = z
  .string({ required_error: 'Oy tanlanmagan' })
  .refine(isValidMonthStr, "Oy 'YYYY-MM' ko'rinishida bo'lishi kerak");

export const timeSchema = z
  .string({ required_error: 'Vaqt tanlanmagan' })
  .refine(isValidTimeStr, "Vaqt 'HH:MM' ko'rinishida bo'lishi kerak");

/**
 * `serviceIds` URL'da vergul bilan keladi: ?serviceIds=65a...,65b...
 * Massiv ko'rinishida ham qabul qilinadi (body uchun).
 */
const serviceIdsSchema = z.preprocess(
  (v) => (typeof v === 'string' ? v.split(',').filter(Boolean) : v),
  z
    .array(objectIdSchema)
    .min(1, 'Kamida bitta xizmat tanlang')
    .max(10, "Bir yozuvga ko'pi bilan 10 ta xizmat"),
);

/** GET /api/availability */
export const availabilityQuerySchema = z.object({
  masterId: objectIdSchema,
  date: dateSchema,
  serviceIds: serviceIdsSchema,
});

/** GET /api/availability/days */
export const monthAvailabilityQuerySchema = z.object({
  masterId: objectIdSchema,
  month: monthSchema,
  serviceIds: serviceIdsSchema,
});

/** POST /api/bookings */
export const createBookingSchema = z.object({
  masterId: objectIdSchema,
  serviceIds: serviceIdsSchema,
  date: dateSchema,
  startTime: timeSchema,
  clientName: z
    .string({ required_error: 'Ism kiritilishi shart' })
    .trim()
    .min(2, "Ism kamida 2 belgidan iborat bo'lsin")
    .max(100),
  // SMS tasdiqlash yo'q — salon egasi shu raqamga qo'ng'iroq qiladi
  clientPhone: phoneSchema,
  note: z.string().trim().max(500, 'Izoh juda uzun').default(''),
});

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(200).default(''),
});

export const myBookingsQuerySchema = z.object({
  upcoming: z.preprocess((v) => v === 'true' || v === true, z.boolean().default(false)),
  status: z
    .enum(['awaiting_payment', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'])
    .optional(),
});

export const idParamSchema = z.object({ id: objectIdSchema });

export default {
  availabilityQuerySchema,
  monthAvailabilityQuerySchema,
  createBookingSchema,
  cancelBookingSchema,
  myBookingsQuerySchema,
};
