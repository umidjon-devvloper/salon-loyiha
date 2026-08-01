import { unwrap, unwrapList } from './client.js';

/**
 * Barcha endpointlar bir joyda.
 *
 * Web va mobil ilova ayni shu funksiyalarni chaqiradi — URL'lar va
 * parametr nomlari ikki joyda saqlanmaydi. Backend endpointni
 * o'zgartirsa, tuzatiladigan joy bitta.
 */

/** Bo'sh qiymatlar so'rovga qo'shilmaydi — URL toza va kesh kaliti barqaror */
const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined),
  );

export function createEndpoints(client) {
  return {
    auth: {
      register: (body) => client.post('/auth/register', body).then(unwrap),
      login: (body) => client.post('/auth/login', body).then(unwrap),
      logout: (refreshToken) => client.post('/auth/logout', { refreshToken }).then(unwrap),
      me: () => client.get('/auth/me').then(unwrap),
      updateMe: (body) => client.patch('/auth/me', body).then(unwrap),
      changePassword: (body) => client.post('/auth/change-password', body).then(unwrap),
      // Mobil: push bildirishnoma tokeni (v1 da saqlanadi, v2 da ishlatiladi)
      savePushToken: (body) => client.post('/auth/push-token', body).then(unwrap),
      // ⚠️ Apple talabi: hisobni ilova ichidan o'chirish
      deleteAccount: (body) => client.delete('/auth/me', { data: body }).then(unwrap),
    },

    catalog: {
      categories: () => client.get('/categories').then(unwrap),
      cities: () => client.get('/cities').then(unwrap),
      settings: () => client.get('/settings').then(unwrap),
      salons: (params) => client.get('/salons', { params: clean(params) }).then(unwrapList),
      salon: (slug) => client.get(`/salons/${slug}`).then(unwrap),
      masters: (params) => client.get('/masters', { params: clean(params) }).then(unwrapList),
      master: (id) => client.get(`/masters/${id}`).then(unwrap),
      search: (params) => client.get('/search', { params: clean(params) }).then(unwrap),
    },

    booking: {
      availability: ({ masterId, date, serviceIds }) =>
        client
          .get('/availability', { params: { masterId, date, serviceIds: serviceIds.join(',') } })
          .then(unwrap),

      availabilityDays: ({ masterId, month, serviceIds }) =>
        client
          .get('/availability/days', {
            params: { masterId, month, serviceIds: serviceIds.join(',') },
          })
          .then(unwrap),

      create: (body) => client.post('/bookings', body).then(unwrap),
      mine: (params) => client.get('/bookings/my', { params: clean(params) }).then(unwrap),
      one: (id) => client.get(`/bookings/my/${id}`).then(unwrap),
      cancel: (id, reason = '') =>
        client.patch(`/bookings/my/${id}/cancel`, { reason }).then(unwrap),
    },

    app: {
      version: () => client.get('/app/version').then(unwrap),
    },
  };
}

/**
 * TanStack Query kalitlari — web va mobil bir xil ishlatadi.
 * Invalidatsiya qilishda kalit nomini eslab o'tirmaslik uchun.
 */
export const queryKeys = {
  categories: ['categories'],
  cities: ['cities'],
  settings: ['public-settings'],
  salons: (params) => ['salons', params],
  salon: (slug) => ['salon', slug],
  masters: (params) => ['masters', params],
  master: (id) => ['master', id],
  search: (params) => ['search', params],
  availability: (params) => ['availability', params],
  availabilityDays: (params) => ['availability-days', params],
  myBookings: (params) => ['my-bookings', params],
  myBooking: (id) => ['my-booking', id],
};

export default createEndpoints;
