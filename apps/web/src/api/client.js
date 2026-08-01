import { createApiClient, unwrap, unwrapList } from '@gozal/shared/api/client';

import { useAuthStore } from '../store/authStore';

/**
 * Web uchun klient.
 *
 * Butun mantiq `packages/shared/api/client.js` da — bu yerda faqat
 * platformaga bog'liq qismlar: tokenlar zustand'dan olinadi, chiqib
 * ketganda `window.location` ishlatiladi.
 * Mobil ilova ayni shu funksiyani SecureStore va expo-router bilan chaqiradi.
 */
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const client = createApiClient({
  baseURL,

  getTokens: () => {
    const { accessToken, refreshToken } = useAuthStore.getState();
    return { accessToken, refreshToken };
  },

  onTokensRefreshed: (data) => useAuthStore.getState().setAuth(data),

  onUnauthorized: () => {
    useAuthStore.getState().logout();
    // Kirish sahifasidan yana kirish sahifasiga yo'naltirilmasin
    if (!window.location.pathname.startsWith('/kirish')) {
      window.location.href = '/kirish';
    }
  },
});

export { unwrap, unwrapList };
export { normalizeError } from '@gozal/shared/api/client';

export default client;
