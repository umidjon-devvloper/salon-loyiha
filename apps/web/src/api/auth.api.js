import client, { unwrap } from './client';

export const authApi = {
  register: (body) => client.post('/auth/register', body).then(unwrap),
  login: (body) => client.post('/auth/login', body).then(unwrap),
  logout: (refreshToken) => client.post('/auth/logout', { refreshToken }).then(unwrap),
  me: () => client.get('/auth/me').then(unwrap),
  updateMe: (body) => client.patch('/auth/me', body).then(unwrap),
  changePassword: (body) => client.post('/auth/change-password', body).then(unwrap),
};

export default authApi;
