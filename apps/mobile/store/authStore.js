import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

/**
 * Auth holati.
 *
 * ⚠️ Tokenlar `expo-secure-store` da saqlanadi — iOS Keychain va Android
 * Keystore. Web'dagi `localStorage` ning mobil ekvivalenti AsyncStorage
 * bo'lardi, lekin u shifrlanmaydi: telefon root qilingan bo'lsa token
 * oddiy fayldan o'qiladi.
 *
 * SecureStore async, shuning uchun ilova ochilganda tokenlar bir marta
 * o'qib olinadi (`hydrate`) va `useAuthStore` ichida sinxron turadi.
 */
const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  // Tokenlar o'qilgunicha navigatsiya kutadi, aks holda kirgan foydalanuvchi
  // bir lahzaga kirish ekranini ko'radi
  isHydrated: false,

  async hydrate() {
    try {
      const [accessToken, refreshToken, userJson] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_KEY),
        SecureStore.getItemAsync(REFRESH_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      set({
        accessToken,
        refreshToken,
        user: userJson ? JSON.parse(userJson) : null,
        isHydrated: true,
      });
    } catch {
      // O'qib bo'lmasa mehmon sifatida davom etadi
      set({ isHydrated: true });
    }
  },

  getTokens() {
    const { accessToken, refreshToken } = get();
    return { accessToken, refreshToken };
  },

  async setAuth({ user, accessToken, refreshToken }) {
    set((state) => ({
      user: user ?? state.user,
      accessToken,
      refreshToken,
    }));

    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
      user ? SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)) : Promise.resolve(),
    ]);
  },

  async logout() {
    set({ user: null, accessToken: null, refreshToken: null });

    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  },
}));

export default useAuthStore;
