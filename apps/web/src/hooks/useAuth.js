import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth.api';

/** Auth holati va amallari bitta joyda */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clear = useAuthStore((s) => s.logout);

  const logout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // Server javob bermasa ham lokal chiqish bajariladi
    }
    clear();
  };

  return {
    user,
    isAuthenticated: !!accessToken && !!user,
    role: user?.role ?? null,
    setAuth,
    logout,
  };
}

export default useAuth;
