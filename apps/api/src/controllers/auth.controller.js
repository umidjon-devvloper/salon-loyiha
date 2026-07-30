import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, noContent } from '../utils/response.js';

/** Controller faqat so'rov/javob bilan ishlaydi — biznes logika services/ da */

const ua = (req) => req.headers['user-agent'] || '';

export const register = asyncHandler(async (req, res) => {
  const data = await authService.register({ ...req.body, userAgent: ua(req) });
  created(res, data);
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login({ ...req.body, userAgent: ua(req) });
  ok(res, data);
});

export const refresh = asyncHandler(async (req, res) => {
  const data = await authService.refresh({
    refreshToken: req.body.refreshToken,
    userAgent: ua(req),
  });
  ok(res, data);
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout({ userId: req.user.id, refreshToken: req.body?.refreshToken });
  ok(res, { message: 'Chiqildi' });
});

export const me = asyncHandler(async (req, res) => {
  ok(res, await authService.getMe(req.user.id));
});

export const updateMe = asyncHandler(async (req, res) => {
  ok(res, await authService.updateMe(req.user.id, req.body));
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  ok(res, { message: 'Parol o\'zgartirildi. Barcha qurilmalardan chiqildi' });
});

export const savePushToken = asyncHandler(async (req, res) => {
  await authService.savePushToken(req.user.id, req.body);
  ok(res, { message: 'Saqlandi' });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await authService.deleteAccount(req.user.id, req.body);
  noContent(res);
});
