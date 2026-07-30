import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Auth holati. Server ma'lumotlari uchun TanStack Query ishlatiladi —
 * bu store faqat foydalanuvchi va tokenlarni saqlaydi.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: ({ user, accessToken, refreshToken }) =>
        set((s) => ({
          user: user ?? s.user,
          accessToken: accessToken ?? s.accessToken,
          refreshToken: refreshToken ?? s.refreshToken,
        })),

      setUser: (user) => set({ user }),

      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'ga-auth' },
  ),
);

export const isLoggedIn = () => !!useAuthStore.getState().accessToken;

export default useAuthStore;
