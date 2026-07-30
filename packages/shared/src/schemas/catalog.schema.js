import { z } from 'zod';

/**
 * Katalog filtri.
 * Frontend bu qiymatlarni URL search params'da saqlaydi (havolani ulashish uchun),
 * shuning uchun hamma narsa string'dan keladi va `coerce` bilan o'giriladi.
 */

export const SALON_SORTS = ['top', 'price_asc', 'price_desc', 'rating', 'new'];

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const salonListSchema = paginationSchema.extend({
  category: z.string().trim().toLowerCase().max(60).optional(),
  city: z.string().trim().max(60).optional(),
  district: z.string().trim().max(60).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  q: z.string().trim().max(80).optional(),
  sort: z.enum(SALON_SORTS).default('top'),
});

export const masterListSchema = paginationSchema.extend({
  category: z.string().trim().toLowerCase().max(60).optional(),
  city: z.string().trim().max(60).optional(),
  district: z.string().trim().max(60).optional(),
  salon: z.string().trim().max(40).optional(), // salon id
  q: z.string().trim().max(80).optional(),
});

export const searchSchema = z.object({
  q: z
    .string({ required_error: "Qidiruv so'zi kiritilishi shart" })
    .trim()
    .min(2, 'Kamida 2 ta belgi kiriting')
    .max(80),
  city: z.string().trim().max(60).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export const slugParamSchema = z.object({
  slug: z.string().trim().toLowerCase().min(1).max(90),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Noto'g'ri identifikator"),
});

/** Narx oralig'i teskari bo'lsa (min > max) — foydalanuvchi xatosi, tuzatib beramiz */
export function normalizePriceRange({ minPrice, maxPrice }) {
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return { minPrice: maxPrice, maxPrice: minPrice };
  }
  return { minPrice, maxPrice };
}
