import { z } from 'zod';
import { normalizePhone } from '../utils/format.js';

/**
 * Auth zod sxemalari — backend va frontend AYNI qoidalarni ishlatadi.
 * Xato xabarlari foydalanuvchiga ko'rinadi → o'zbek tilida.
 */

/** Har qanday ko'rinishdagi telefonni '+998XXXXXXXXX' ga aylantiradi */
export const phoneSchema = z
  .string({ required_error: 'Telefon raqam kiritilishi shart' })
  .trim()
  .transform((v, ctx) => {
    const normalized = normalizePhone(v);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Telefon raqam noto'g'ri. Namuna: +998 90 123 45 67",
      });
      return z.NEVER;
    }
    return normalized;
  });

export const passwordSchema = z
  .string({ required_error: 'Parol kiritilishi shart' })
  .min(6, "Parol kamida 6 belgidan iborat bo'lishi kerak")
  .max(72, 'Parol juda uzun'); // bcrypt 72 baytdan keyingisini kesib tashlaydi

export const fullNameSchema = z
  .string({ required_error: 'Ism kiritilishi shart' })
  .trim()
  .min(2, "Ism kamida 2 belgidan iborat bo'lishi kerak")
  .max(100, 'Ism juda uzun');

export const registerSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  fullName: fullNameSchema,
  // 'admin' ni tanlab bo'lmaydi — faqat mavjud admin bera oladi
  role: z.enum(['client', 'owner']).default('client'),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z
    .string({ required_error: 'Parol kiritilishi shart' })
    .min(1, 'Parol kiritilishi shart'),
});

export const refreshSchema = z.object({
  refreshToken: z.string({ required_error: "Token yo'q" }).min(10, "Token noto'g'ri"),
});

export const updateMeSchema = z
  .object({
    fullName: fullNameSchema.optional(),
    city: z.string().trim().max(60).optional(),
    avatar: z.string().trim().max(300).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "O'zgartirish uchun kamida bitta maydon kerak",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Joriy parol kiritilishi shart' })
      .min(1, 'Joriy parol kiritilishi shart'),
    newPassword: passwordSchema,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    path: ['newPassword'],
    message: 'Yangi parol eskisidan farq qilishi kerak',
  });

/** Mobil ilova uchun (v1 da to'planadi, v2 da ishlatiladi) */
export const pushTokenSchema = z.object({
  token: z.string().trim().min(10, "Push token noto'g'ri").max(300),
  platform: z.enum(['ios', 'android']),
  deviceId: z.string().trim().max(100).optional().default(''),
});

/** Hisobni o'chirish — Apple talabi. Parol bilan tasdiqlanadi */
export const deleteAccountSchema = z.object({
  password: z
    .string({ required_error: 'Parol kiritilishi shart' })
    .min(1, 'Parol kiritilishi shart'),
});
