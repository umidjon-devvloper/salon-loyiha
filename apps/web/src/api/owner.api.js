import client, { unwrap } from './client';

/** Salon egasi kabineti so'rovlari */
export const ownerApi = {
  salon: () => client.get('/owner/salon').then(unwrap),
  createSalon: (body) => client.post('/owner/salon', body).then(unwrap),
  updateSalon: (body) => client.put('/owner/salon', body).then(unwrap),
  submitSalon: () => client.post('/owner/salon/submit').then(unwrap),

  uploadImages: (files) => {
    const form = new FormData();
    for (const file of files) form.append('images', file);
    return client
      .post('/owner/salon/images', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(unwrap);
  },
  deleteImage: (name) => client.delete(`/owner/salon/images/${name}`).then(unwrap),
  setCover: (name) => client.patch(`/owner/salon/cover/${name}`).then(unwrap),

  services: () => client.get('/owner/services').then(unwrap),
  createService: (body) => client.post('/owner/services', body).then(unwrap),
  updateService: (id, body) => client.put(`/owner/services/${id}`, body).then(unwrap),
  deleteService: (id) => client.delete(`/owner/services/${id}`).then(unwrap),

  masters: () => client.get('/owner/masters').then(unwrap),
  createMaster: (body) => client.post('/owner/masters', body).then(unwrap),
  updateMaster: (id, body) => client.put(`/owner/masters/${id}`, body).then(unwrap),
  deleteMaster: (id) => client.delete(`/owner/masters/${id}`).then(unwrap),
  uploadMasterPhoto: (id, file) => {
    const form = new FormData();
    form.append('photo', file);
    return client
      .post(`/owner/masters/${id}/photo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(unwrap);
  },

  schedule: (masterId) =>
    client.get('/owner/schedule', { params: masterId ? { masterId } : {} }).then(unwrap),
  updateSchedule: (body) => client.put('/owner/schedule', body).then(unwrap),
  resetMasterSchedule: (id) => client.delete(`/owner/masters/${id}/schedule`).then(unwrap),

  timeOffs: (params) => client.get('/owner/time-offs', { params }).then(unwrap),
  createTimeOff: (body) => client.post('/owner/time-offs', body).then(unwrap),
  deleteTimeOff: (id) => client.delete(`/owner/time-offs/${id}`).then(unwrap),

  bookings: (params) => client.get('/owner/bookings', { params }).then(unwrap),
  booking: (id) => client.get(`/owner/bookings/${id}`).then(unwrap),
  setBookingStatus: (id, body) => client.patch(`/owner/bookings/${id}/status`, body).then(unwrap),
  manualBooking: (body) => client.post('/owner/bookings/manual', body).then(unwrap),

  summary: () => client.get('/owner/summary').then(unwrap),
  stats: () => client.get('/owner/stats').then(unwrap),
};

export const ownerKeys = {
  salon: ['owner-salon'],
  services: ['owner-services'],
  masters: ['owner-masters'],
  schedule: (masterId) => ['owner-schedule', masterId ?? 'salon'],
  timeOffs: ['owner-time-offs'],
  bookings: (params) => ['owner-bookings', params],
  summary: ['owner-summary'],
  stats: ['owner-stats'],
};

export default ownerApi;
