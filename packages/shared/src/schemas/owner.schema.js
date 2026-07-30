import { z } from 'zod';
import { phoneSchema } from './auth.schema.js';

/**
 * Salon egasi kabineti sxemalari.
 * Xato xabarlari to'g'ridan-to'g'ri formada ko'rinadi → o'zbek tilida.
 */

export const objectIdSchema = z
  .string({ required_error: 'Tanlanmagan' })
  .regex(/^[a-f\d]{24}$/i, "Noto'g'ri identifikator");

const optionalLink = (max) =>
  z.preprocess((v) => (v === '' ? null : v), z.string().trim().max(max).nullable().optional());

// ── Salon ───────────────────────────────────────────────────────

export const salonCreateSchema = z.object({
  name: z
    .string({ required_error: 'Salon nomi kiritilishi shart' })
    .trim()
    .min(2, "Salon nomi kamida 2 belgidan iborat bo'lsin")
    .max(120, 'Salon nomi juda uzun'),
  description: z.string().trim().max(2000, 'Tavsif juda uzun').default(''),
  categories: z
    .array(objectIdSchema)
    .min(1, 'Kamida bitta kategoriya tanlang')
    .max(5, "Ko'pi bilan 5 ta kategoriya tanlang"),
  city: z
    .string({ required_error: 'Shahar tanlanmagan' })
    .trim()
    .min(1, 'Shahar tanlanmagan')
    .max(60),
  district: z
    .string({ required_error: 'Tuman tanlanmagan' })
    .trim()
    .min(1, 'Tuman tanlanmagan')
    .max(60),
  address: z.string().trim().max(300, 'Manzil juda uzun').default(''),
  phone: phoneSchema,
  telegram: optionalLink(100),
  instagram: optionalLink(100),
});

/** Tahrirlashda hamma maydon ixtiyoriy, lekin bo'sh so'rov yuborilmasin */
export const salonUpdateSchema = salonCreateSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "O'zgartirish uchun kamida bitta maydon kerak",
  });

// ── Xizmat ──────────────────────────────────────────────────────

const priceSchema = z.coerce
  .number({ invalid_type_error: "Narx raqam bo'lishi kerak" })
  .int("Narx butun son bo'lsin")
  .min(0, "Narx manfiy bo'la olmaydi")
  .max(100_000_000, 'Narx juda katta');

export const serviceCreateSchema = z
  .object({
    name: z
      .string({ required_error: 'Xizmat nomi kiritilishi shart' })
      .trim()
      .min(2, "Xizmat nomi kamida 2 belgidan iborat bo'lsin")
      .max(120, 'Xizmat nomi juda uzun'),
    description: z.string().trim().max(1000).default(''),
    category: objectIdSchema,
    price: priceSchema,
    priceTo: z.preprocess((v) => (v === '' ? null : v), priceSchema.nullable().default(null)),
    isPriceFrom: z.coerce.boolean().default(false),
    // ⭐ Slot hisoblashning asosi — busiz booking dvijogi ishlamaydi
    durationMin: z.coerce
      .number({ required_error: 'Davomiylik kiritilishi shart' })
      .int()
      .min(10, "Davomiylik kamida 10 daqiqa bo'lsin")
      .max(600, 'Davomiylik 10 soatdan oshmasin'),
    bufferMin: z.coerce
      .number()
      .int()
      .min(0)
      .max(120, 'Tayyorgarlik vaqti 2 soatdan oshmasin')
      .default(0),
    // Bo'sh massiv = salondagi hamma usta bajaradi
    masters: z.array(objectIdSchema).max(50).default([]),
    isActive: z.coerce.boolean().default(true),
    order: z.coerce.number().int().min(0).max(9999).default(0),
  })
  .refine((v) => v.priceTo === null || v.priceTo === undefined || v.priceTo > v.price, {
    message: "Yuqori narx quyi narxdan katta bo'lishi kerak",
    path: ['priceTo'],
  });

export const serviceUpdateSchema = serviceCreateSchema
  .innerType()
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "O'zgartirish uchun kamida bitta maydon kerak",
  })
  .refine(
    (v) =>
      v.priceTo === null || v.priceTo === undefined || v.price === undefined || v.priceTo > v.price,
    { message: "Yuqori narx quyi narxdan katta bo'lishi kerak", path: ['priceTo'] },
  );

// ── Mutaxassis ──────────────────────────────────────────────────

export const masterCreateSchema = z.object({
  fullName: z
    .string({ required_error: 'Ism kiritilishi shart' })
    .trim()
    .min(2, "Ism kamida 2 belgidan iborat bo'lsin")
    .max(100, 'Ism juda uzun'),
  bio: z.string().trim().max(1000).default(''),
  specialties: z.array(objectIdSchema).max(10).default([]),
  experienceYears: z.coerce
    .number()
    .int()
    .min(0, "Tajriba manfiy bo'la olmaydi")
    .max(60, 'Tajriba 60 yildan oshmasin')
    .default(0),
  isActive: z.coerce.boolean().default(true),
  order: z.coerce.number().int().min(0).max(9999).default(0),
});

export const masterUpdateSchema = masterCreateSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "O'zgartirish uchun kamida bitta maydon kerak",
  });

// ── Tartib o'zgartirish ─────────────────────────────────────────

export const reorderSchema = z.object({
  items: z
    .array(z.object({ id: objectIdSchema, order: z.coerce.number().int().min(0).max(9999) }))
    .min(1, "Ro'yxat bo'sh")
    .max(200),
});

export const idParamSchema = z.object({ id: objectIdSchema });

export const filenameParamSchema = z.object({
  filename: z
    .string()
    .trim()
    .min(1)
    .max(200)
    // Papka bo'ylab yurishga (../) yo'l qo'yilmaydi — fayl nomi faqat shu shakl
    .regex(/^[a-z0-9][a-z0-9._-]*\.(webp|jpg|jpeg|png)$/i, "Noto'g'ri fayl nomi"),
});

export default {
  salonCreateSchema,
  salonUpdateSchema,
  serviceCreateSchema,
  serviceUpdateSchema,
  masterCreateSchema,
  masterUpdateSchema,
  reorderSchema,
};
