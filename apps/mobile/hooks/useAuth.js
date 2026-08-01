import { useRouter } from 'expo-router';

import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

/**
 * Auth holati va amallari.
 *
 * `requireAuth` — himoyalangan amaldan oldin chaqiriladi. Kirmagan bo'lsa
 * kirish ekraniga yuboradi va qayerdan kelganini eslab qoladi, shunda
 * foydalanuvchi kirgandan keyin o'sha joyga qaytadi. Band qilish oqimida
 * bu muhim: yo'qolgan qadam odamni butunlay yo'qotadi.
 */
export function useAuth() {
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const clear = useAuthStore((s) => s.logout);

  const logout = async () => {
    const { refreshToken } = useAuthStore.getState().getTokens();

    try {
      if (refreshToken) await api.auth.logout(refreshToken);
    } catch {
      // Server javob bermasa ham lokal chiqish bajariladi
    }

    await clear();
    router.replace('/(tabs)');
  };

  const requireAuth = (redirect) => {
    if (accessToken && user) return true;

    router.push({
      pathname: '/(auth)/kirish',
      params: redirect ? { redirect } : {},
    });
    return false;
  };

  return {
    user,
    isAuthenticated: Boolean(accessToken && user),
    isHydrated,
    role: user?.role ?? null,
    logout,
    requireAuth,
  };
}

export default useAuth;
