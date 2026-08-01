import axios from 'axios';

/**
 * Platformaga bog'liq BO'LMAGAN API klienti.
 *
 * Web va mobil ilova ayni shu faylni ishlatadi. Farq qiladigan narsalar
 * (token qayerda saqlanadi, chiqib ketganda qayerga yo'naltiriladi)
 * tashqaridan INJEKT qilinadi:
 *   web    → localStorage (zustand persist), window.location
 *   mobil  → expo-secure-store, expo-router
 *
 * Shuning uchun bu yerda `window`, `localStorage`, `import.meta` va
 * `document` ISHLATILMAYDI — ular React Native'da mavjud emas.
 */

/**
 * Backend xatosini bir xil shaklga keltiradi.
 * Tarmoq uzilganda ham foydalanuvchi tushunadigan xabar bo'lishi kerak.
 */
export function normalizeError(error) {
  if (error.response) {
    const { status, data } = error.response;
    return {
      status,
      code: data?.code || 'SERVER_ERROR',
      message: data?.message || 'Serverda xatolik yuz berdi',
      errors: data?.errors || null,
    };
  }

  if (error.code === 'ECONNABORTED') {
    return { status: 0, code: 'TIMEOUT', message: "Server javob bermadi. Qayta urinib ko'ring" };
  }

  return { status: 0, code: 'NETWORK_ERROR', message: 'Internetga ulanishni tekshiring' };
}

/** Javob har doim { success, data, meta } */
export const unwrap = (res) => res.data.data;

/** Sahifalangan ro'yxatlar uchun meta ham kerak */
export const unwrapList = (res) => ({ items: res.data.data, meta: res.data.meta });

/**
 * @param {object}   options
 * @param {string}   options.baseURL
 * @param {function} options.getTokens      → { accessToken, refreshToken } (async bo'lishi mumkin)
 * @param {function} options.onTokensRefreshed  yangi tokenlarni saqlaydi
 * @param {function} options.onUnauthorized     refresh ham ishlamadi → chiqarish
 * @param {number}   [options.timeout]
 */
export function createApiClient({
  baseURL,
  getTokens,
  onTokensRefreshed,
  onUnauthorized,
  timeout = 20_000,
}) {
  const client = axios.create({ baseURL, timeout });

  client.interceptors.request.use(async (config) => {
    const { accessToken } = (await getTokens()) || {};
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  });

  /**
   * Bir vaqtda faqat BITTA refresh so'rovi ketadi.
   *
   * Aks holda ekranda 5 ta so'rov bo'lsa, 5 ta refresh ketadi va token
   * rotatsiyasi tufayli ularning 4 tasi bekor qilingan tokendan foydalanib,
   * foydalanuvchini tizimdan otib yuboradi.
   */
  let refreshPromise = null;

  async function refreshTokens() {
    if (refreshPromise) return refreshPromise;

    const { refreshToken } = (await getTokens()) || {};
    if (!refreshToken) return null;

    refreshPromise = axios
      .post(`${baseURL}/auth/refresh`, { refreshToken })
      .then(async (res) => {
        const data = res.data.data;
        await onTokensRefreshed?.(data);
        return data.accessToken;
      })
      .catch(async () => {
        await onUnauthorized?.();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });

    return refreshPromise;
  }

  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const { response, config } = error;

      if (response?.status === 401 && response.data?.code === 'TOKEN_EXPIRED' && !config._retried) {
        config._retried = true;

        const token = await refreshTokens();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          return client(config);
        }

        await onUnauthorized?.();
      }

      return Promise.reject(normalizeError(error));
    },
  );

  return client;
}

export default createApiClient;
