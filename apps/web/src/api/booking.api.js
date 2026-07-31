import client, { unwrap } from './client';

/** Band qilish so'rovlari. Sana 'YYYY-MM-DD', vaqt 'HH:MM' — har doim string */
export const bookingApi = {
  availability: ({ masterId, date, serviceIds }) =>
    client
      .get('/availability', { params: { masterId, date, serviceIds: serviceIds.join(',') } })
      .then(unwrap),

  availabilityDays: ({ masterId, month, serviceIds }) =>
    client
      .get('/availability/days', { params: { masterId, month, serviceIds: serviceIds.join(',') } })
      .then(unwrap),

  create: (body) => client.post('/bookings', body).then(unwrap),

  myBookings: (params) => client.get('/bookings/my', { params }).then(unwrap),
  myBooking: (id) => client.get(`/bookings/my/${id}`).then(unwrap),
  cancel: (id, reason = '') => client.patch(`/bookings/my/${id}/cancel`, { reason }).then(unwrap),
};

export const bookingKeys = {
  availability: (params) => ['availability', params],
  availabilityDays: (params) => ['availability-days', params],
  myBookings: (params) => ['my-bookings', params],
  myBooking: (id) => ['my-booking', id],
};

export default bookingApi;
