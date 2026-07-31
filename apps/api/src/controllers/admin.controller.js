import * as adminService from '../services/admin.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';

/** Controller faqat so'rov/javob bilan ishlaydi */

const q = (req) => req.validated?.query ?? req.query;

// ── Salonlar ────────────────────────────────────────────────────

export const salons = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listSalons(q(req));
  ok(res, items, meta);
});

export const salon = asyncHandler(async (req, res) => {
  ok(res, await adminService.getSalon(req.params.id));
});

export const setSalonStatus = asyncHandler(async (req, res) => {
  ok(res, await adminService.setSalonStatus(req.params.id, req.body));
});

export const verifySalon = asyncHandler(async (req, res) => {
  ok(res, await adminService.verifySalon(req.params.id, req.body));
});

export const setSalonTop = asyncHandler(async (req, res) => {
  ok(res, await adminService.setSalonTop(req.params.id, req.body, req.user.id));
});

export const setSalonRating = asyncHandler(async (req, res) => {
  ok(res, await adminService.setSalonRating(req.params.id, req.body));
});

export const deleteSalon = asyncHandler(async (req, res) => {
  ok(res, await adminService.deleteSalon(req.params.id));
});

// ── Kategoriyalar ───────────────────────────────────────────────

export const categories = asyncHandler(async (req, res) => {
  ok(res, await adminService.listCategories());
});

export const createCategory = asyncHandler(async (req, res) => {
  created(res, await adminService.createCategory(req.body));
});

export const updateCategory = asyncHandler(async (req, res) => {
  ok(res, await adminService.updateCategory(req.params.id, req.body));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  ok(res, await adminService.deleteCategory(req.params.id));
});

export const reorderCategories = asyncHandler(async (req, res) => {
  ok(res, await adminService.reorderCategories(req.body.items));
});

// ── Foydalanuvchilar ────────────────────────────────────────────

export const users = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listUsers(q(req));
  ok(res, items, meta);
});

export const setUserStatus = asyncHandler(async (req, res) => {
  ok(res, await adminService.setUserStatus(req.params.id, req.body, req.user.id));
});

export const setUserRole = asyncHandler(async (req, res) => {
  ok(res, await adminService.setUserRole(req.params.id, req.body, req.user.id));
});

export const resetUserPassword = asyncHandler(async (req, res) => {
  ok(res, await adminService.resetUserPassword(req.params.id, req.body));
});

// ── Yozuvlar, statistika, sozlamalar ────────────────────────────

export const bookings = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listBookings(q(req));
  ok(res, items, meta);
});

export const stats = asyncHandler(async (req, res) => {
  ok(res, await adminService.getStats());
});

export const topOrders = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listTopOrders(q(req));
  ok(res, items, meta);
});

export const settings = asyncHandler(async (req, res) => {
  ok(res, await adminService.getSettings());
});

export const updateSettings = asyncHandler(async (req, res) => {
  ok(res, await adminService.updateSettings(req.body));
});
