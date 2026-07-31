import axios from 'axios';
import { useAuthStore } from '../store/authStore';

/** Bo'sh bo'lsa vite proxy ishlatiladi (dev) */
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const client = axios.create({ baseURL, timeout: 20_000 });

client.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

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
  return {
    status: 0,
    code: 'NETWORK_ERROR',
    message: 'Internetga ulanishni tekshiring',
  };
}

/**
 * Bir vaqtda faqat BITTA refresh so'rovi ketadi.
 * Aks holda sahifada 5 ta so'rov bo'lsa, 5 ta refresh ketadi va rotatsiya tufayli
 * ularning 4 tasi bekor qilingan tokendan foydalanib, foydalanuvchini tashqariga otadi.
 */
let refreshPromise = null;

function refreshTokens() {
  if (refreshPromise) return refreshPromise;

  const { refreshToken, setAuth, logout } = useAuthStore.getState();
  if (!refreshToken) return Promise.resolve(null);

  refreshPromise = axios
    .post(`${baseURL}/auth/refresh`, { refreshToken })
    .then((res) => {
      const data = res.data.data;
      setAuth(data);
      return data.accessToken;
    })
    .catch(() => {
      logout();
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
      if (!window.location.pathname.startsWith('/kirish')) {
        window.location.href = '/kirish';
      }
    }

    return Promise.reject(normalizeError(error));
  },
);

/** Javob har doim { success, data, meta } — data ni ajratib beramiz */
export const unwrap = (res) => res.data.data;

/** Sahifalangan ro'yxatlar uchun: meta ham kerak (jami, sahifalar soni) */
export const unwrapList = (res) => ({ items: res.data.data, meta: res.data.meta });

export default client;
