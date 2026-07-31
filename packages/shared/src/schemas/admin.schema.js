import { z } from 'zod';
import { objectIdSchema, dateSchema } from './booking.schema.js';
import { phoneSchema, passwordSchema, fullNameSchema } from './auth.schema.js';

/** Admin panel sxemalari */

const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

const blankToUndefined = (v) => (v === '' || v === null ? undefined : v);
const optionalText = (max) =>
  z.preprocess(blankToUndefined, z.string().trim().min(1).max(max).optional());

// ── Salonlar ────────────────────────────────────────────────────

export const adminSalonsQuerySchema = z.object({
  status: z.preprocess(
    blankToUndefined,
    z.enum(['draft', 'pending', 'active', 'blocked']).optional(),
  ),
  city: optionalText(60),
  q: optionalText(80),
  page: pageSchema,
  limit: limitSchema,
});

/**
 * Moderatsiya qarori.
 * Rad etish (`blocked`) yoki qaytarish (`draft`) da sabab MAJBURIY —
 * salon egasi nimani tuzatishini bilishi kerak, aks holda u qayta yuboradi
 * va navbat aylanib qoladi.
 */
export const salonStatusSchema = z
  .object({
    status: z.enum(['pending', 'active', 'blocked', 'draft'], {
      errorMap: () => ({ message: "Bunday holat yo'q" }),
    }),
    rejectReason: z.string().trim().max(300).default(''),
  })
  .refine((v) => !['blocked', 'draft'].includes(v.status) || v.rejectReason.length > 0, {
    message: 'Sababini yozing — salon egasiga shu matn ko\u2019rinadi',
    path: ['rejectReason'],
  });

export const salonVerifySchema = z.object({
  isVerified: z.coerce.boolean(),
});

/**
 * TOP e'lon. `plan: null` — TOP ni o'chirish.
 * Pul platformadan tashqarida olinadi (naqd yoki karta), bu yerda faqat log.
 */
export const salonTopSchema = z
  .object({
    plan: z.enum(['week', 'month']).nullable(),
    amount: z.coerce.number().int().min(0).max(100_000_000).optional(),
    note: z.string().trim().max(300).default(''),
  })
  .refine((v) => v.plan === null || v.amount !== undefined, {
    message: 'To\u2019langan summani kiriting',
    path: ['amount'],
  });

/** v1 da reyting qo'lda kiritiladi — sharh tizimi v2 da */
export const salonRatingSchema = z.object({
  rating: z.coerce
    .number()
    .min(0, 'Reyting 0 dan kichik bo\u2019la olmaydi')
    .max(5, 'Reyting 5 dan katta bo\u2019la olmaydi'),
  reviewCount: z.coerce.number().int().min(0).default(0),
});

// ── Kategoriyalar ───────────────────────────────────────────────

export const categorySchema = z.object({
  nameUz: z
    .string({ required_error: 'Nom kiritilishi shart' })
    .trim()
    .min(2, 'Nom kamida 2 belgidan iborat bo\u2019lsin')
    .max(60),
  nameRu: z.string().trim().max(60).default(''),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Slug faqat lotin harflari, raqam va chiziqchadan iborat')
    .max(60)
    .optional(),
  icon: z.string().trim().max(40).nullable().default(null),
  order: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const categoryUpdateSchema = categorySchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'O\u2019zgartirish uchun kamida bitta maydon kerak',
  });

export const reorderSchema = z.object({
  items: z
    .array(z.object({ id: objectIdSchema, order: z.coerce.number().int().min(0).max(999) }))
    .min(1)
    .max(100),
});

// ── Foydalanuvchilar ────────────────────────────────────────────

export const adminUsersQuerySchema = z.object({
  role: z.preprocess(blankToUndefined, z.enum(['client', 'owner', 'admin']).optional()),
  q: optionalText(80),
  page: pageSchema,
  limit: limitSchema,
});

export const userStatusSchema = z.object({ isActive: z.coerce.boolean() });

export const userRoleSchema = z.object({ role: z.enum(['client', 'owner', 'admin']) });

/** SMS va email yo'q — parolni faqat admin tiklay oladi */
export const userPasswordSchema = z.object({ password: passwordSchema });

export const userCreateSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  fullName: fullNameSchema,
  role: z.enum(['client', 'owner', 'admin']).default('client'),
});

// ── Yozuvlar va sozlamalar ──────────────────────────────────────

export const adminBookingsQuerySchema = z
  .object({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    salon: objectIdSchema.optional(),
    status: z
      .enum(['awaiting_payment', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'])
      .optional(),
    page: pageSchema,
    limit: limitSchema,
  })
  .refine((v) => !v.from || !v.to || v.to >= v.from, {
    message: 'Oraliq noto\u2019g\u2019ri',
    path: ['to'],
  });

export const settingsSchema = z
  .object({
    bookingFee: z
      .object({
        enabled: z.coerce.boolean(),
        mode: z.enum(['fixed', 'percent']),
        fixedAmount: z.coerce.number().int().min(0).max(1_000_000),
        percent: z.coerce.number().min(0).max(100),
        minAmount: z.coerce.number().int().min(0),
        maxAmount: z.coerce.number().int().min(0),
      })
      .partial()
      .optional(),
    holdMinutes: z.coerce.number().int().min(1).max(30).optional(),
    topPrices: z
      .object({
        week: z.coerce.number().int().min(0),
        month: z.coerce.number().int().min(0),
      })
      .partial()
      .optional(),
    promoText: z.string().trim().max(300).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'O\u2019zgartirish uchun kamida bitta maydon kerak',
  });

export const idParamSchema = z.object({ id: objectIdSchema });

export default {
  adminSalonsQuerySchema,
  salonStatusSchema,
  salonTopSchema,
  salonRatingSchema,
  categorySchema,
  adminUsersQuerySchema,
  adminBookingsQuerySchema,
  settingsSchema,
};
