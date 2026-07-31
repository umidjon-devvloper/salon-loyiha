import client, { unwrap, unwrapList } from './client';

/** Admin panel so'rovlari */
export const adminApi = {
  salons: (params) => client.get('/admin/salons', { params }).then(unwrapList),
  salon: (id) => client.get(`/admin/salons/${id}`).then(unwrap),
  setSalonStatus: (id, body) => client.patch(`/admin/salons/${id}/status`, body).then(unwrap),
  verifySalon: (id, isVerified) =>
    client.patch(`/admin/salons/${id}/verify`, { isVerified }).then(unwrap),
  setSalonTop: (id, body) => client.patch(`/admin/salons/${id}/top`, body).then(unwrap),
  setSalonRating: (id, body) => client.patch(`/admin/salons/${id}/rating`, body).then(unwrap),
  deleteSalon: (id) => client.delete(`/admin/salons/${id}`).then(unwrap),

  categories: () => client.get('/admin/categories').then(unwrap),
  createCategory: (body) => client.post('/admin/categories', body).then(unwrap),
  updateCategory: (id, body) => client.put(`/admin/categories/${id}`, body).then(unwrap),
  deleteCategory: (id) => client.delete(`/admin/categories/${id}`).then(unwrap),

  users: (params) => client.get('/admin/users', { params }).then(unwrapList),
  setUserStatus: (id, isActive) =>
    client.patch(`/admin/users/${id}/status`, { isActive }).then(unwrap),
  setUserRole: (id, role) => client.patch(`/admin/users/${id}/role`, { role }).then(unwrap),
  resetPassword: (id, password) =>
    client.patch(`/admin/users/${id}/password`, { password }).then(unwrap),

  bookings: (params) => client.get('/admin/bookings', { params }).then(unwrapList),
  stats: () => client.get('/admin/stats').then(unwrap),
  topOrders: (params) => client.get('/admin/top-orders', { params }).then(unwrapList),

  settings: () => client.get('/admin/settings').then(unwrap),
  updateSettings: (body) => client.put('/admin/settings', body).then(unwrap),
};

export const adminKeys = {
  salons: (params) => ['admin-salons', params],
  salon: (id) => ['admin-salon', id],
  categories: ['admin-categories'],
  users: (params) => ['admin-users', params],
  bookings: (params) => ['admin-bookings', params],
  stats: ['admin-stats'],
  topOrders: ['admin-top-orders'],
  settings: ['admin-settings'],
};

export default adminApi;
