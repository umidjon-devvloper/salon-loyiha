import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Sevimlilar — faqat qurilmada saqlanadi (v1 qarori: backendsiz).
 *
 * ⚠️ Bu yerda `AsyncStorage`, tokenlardagi kabi `SecureStore` emas.
 * Sabab: sevimlilar maxfiy ma'lumot emas, SecureStore esa sekin va
 * hajmi cheklangan (iOS Keychain katta JSON uchun mo'ljallanmagan).
 *
 * Id emas, kartochkaning o'zi saqlanadi — aks holda ro'yxat ochilganda
 * har bir salon uchun alohida so'rov yuborish kerak bo'ladi.
 */
const KEY = 'ga-favorites';

export const useFavoritesStore = create((set, get) => ({
  items: [],
  isHydrated: false,

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      set({ items: raw ? JSON.parse(raw) : [], isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },

  isFavorite: (id) => get().items.some((item) => item.id === id),

  async toggle(salon) {
    const exists = get().items.some((item) => item.id === salon.id);

    const items = exists
      ? get().items.filter((item) => item.id !== salon.id)
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
          },
          ...get().items,
        ];

    set({ items });
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
  },
}));

export default useFavoritesStore;
