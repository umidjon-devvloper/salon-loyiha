import client, { unwrap, unwrapList } from './client';

/**
 * Ochiq katalog so'rovlari.
 * Bo'sh qiymatlar so'rovga qo'shilmaydi — URL toza qoladi va
 * TanStack Query kaliti bir xil filtr uchun bir xil bo'ladi.
 */
function clean(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined),
  );
}

export const catalogApi = {
  categories: () => client.get('/categories').then(unwrap),
  cities: () => client.get('/cities').then(unwrap),

  salons: (params) => client.get('/salons', { params: clean(params) }).then(unwrapList),
  salon: (slug) => client.get(`/salons/${slug}`).then(unwrap),

  masters: (params) => client.get('/masters', { params: clean(params) }).then(unwrapList),
  master: (id) => client.get(`/masters/${id}`).then(unwrap),

  search: (params) => client.get('/search', { params: clean(params) }).then(unwrap),
};

/** Query kalitlari bir joyda — invalidatsiya qilishda adashmaslik uchun */
export const catalogKeys = {
  categories: ['categories'],
  cities: ['cities'],
  salons: (params) => ['salons', params],
  salon: (slug) => ['salon', slug],
  masters: (params) => ['masters', params],
  master: (id) => ['master', id],
  search: (params) => ['search', params],
};

export default catalogApi;
