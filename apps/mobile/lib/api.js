import Constants from 'expo-constants';
import { createApiClient, createEndpoints } from '@gozal/shared';

import { useAuthStore } from '../store/authStore';

/**
 * Mobil ilova uchun API klienti.
 *
 * Mantiq `packages/shared/api/client.js` da — web bilan bir xil.
 * Bu yerda faqat platformaga bog'liq qismlar injekt qilinadi:
 * tokenlar `expo-secure-store` da (shifrlangan), web'dagi kabi
 * `localStorage` da emas.
 */
const baseURL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000/api';

export const client = createApiClient({
  baseURL,

  getTokens: () => useAuthStore.getState().getTokens(),

  onTokensRefreshed: (data) => useAuthStore.getState().setAuth(data),

  onUnauthorized: () => useAuthStore.getState().logout(),
});

export const api = createEndpoints(client);

export { queryKeys } from '@gozal/shared';
export default api;
