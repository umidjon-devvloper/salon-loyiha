import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Sevimlilar v1 da FAQAT brauzerda saqlanadi (qaror: backendsiz).
 *
 * Shuning uchun bu yerda id emas, kartochkaning o'zi saqlanadi: aks holda
 * sahifani ochganda har bir salon uchun alohida so'rov yuborish kerak bo'ladi.
 * Narx yoki reyting eskirishi mumkin — salon ochilganda yangisi ko'rinadi.
 */
export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      items: [],

      isFavorite: (id) => get().items.some((item) => item.id === id),

      toggle: (salon) =>
        set((state) => ({
          items: state.items.some((item) => item.id === salon.id)
            ? state.items.filter((item) => item.id !== salon.id)
            : [
                {
                  id: salon.id,
                  slug: salon.slug,
                  name: salon.name,
                  coverThumb: salon.coverThumb ?? null,
                  city: salon.city,
                  district: salon.district,
                  rating: salon.rating ?? 0,
                  reviewCount: salon.reviewCount ?? 0,
                  minPrice: salon.minPrice ?? 0,
                  isTop: Boolean(salon.isTop),
                  isVerified: Boolean(salon.isVerified),
                  categories: salon.categories ?? [],
                },
                ...state.items,
              ],
        })),

      clear: () => set({ items: [] }),
    }),
    { name: 'ga-favorites' },
  ),
);

export default useFavoritesStore;
