import * as ownerService from '../services/owner.service.js';
import * as scheduleService from '../services/ownerSchedule.service.js';
import * as bookingService from '../services/ownerBooking.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';

/**
 * Controller faqat so'rov/javob bilan ishlaydi.
 * `req.salon` ni `ownerOfSalon` middleware qo'yadi — so'rovdan kelgan
 * `salonId` ga HECH QACHON ishonilmaydi.
 */

// ── Salon ───────────────────────────────────────────────────────

export const getSalon = asyncHandler(async (req, res) => {
  ok(res, await ownerService.getMySalon(req.salon));
});

export const createSalon = asyncHandler(async (req, res) => {
  created(res, await ownerService.createSalon(req.user.id, req.body));
});

export const updateSalon = asyncHandler(async (req, res) => {
  ok(res, await ownerService.updateSalon(req.salon, req.body));
});

export const submitSalon = asyncHandler(async (req, res) => {
  ok(res, await ownerService.submitSalon(req.salon));
});

// ── Rasmlar ─────────────────────────────────────────────────────

export const uploadImages = asyncHandler(async (req, res) => {
  created(res, await ownerService.uploadSalonImages(req.salon, req.files));
});

export const deleteImage = asyncHandler(async (req, res) => {
  ok(res, await ownerService.deleteSalonImage(req.salon, req.params.filename));
});

export const setCover = asyncHandler(async (req, res) => {
  ok(res, await ownerService.setSalonCover(req.salon, req.params.filename));
});

// ── Xizmatlar ───────────────────────────────────────────────────

export const listServices = asyncHandler(async (req, res) => {
  ok(res, await ownerService.listServices(req.salon._id));
});

export const createService = asyncHandler(async (req, res) => {
  created(res, await ownerService.createService(req.salon, req.body));
});

export const updateService = asyncHandler(async (req, res) => {
  ok(res, await ownerService.updateService(req.salon, req.params.id, req.body));
});

export const deleteService = asyncHandler(async (req, res) => {
  ok(res, await ownerService.deleteService(req.salon, req.params.id));
});

export const reorderServices = asyncHandler(async (req, res) => {
  ok(res, await ownerService.reorderServices(req.salon, req.body.items));
});

// ── Mutaxassislar ───────────────────────────────────────────────

export const listMasters = asyncHandler(async (req, res) => {
  ok(res, await ownerService.listMasters(req.salon._id));
});

export const createMaster = asyncHandler(async (req, res) => {
  created(res, await ownerService.createMaster(req.salon, req.body));
});

export const updateMaster = asyncHandler(async (req, res) => {
  ok(res, await ownerService.updateMaster(req.salon, req.params.id, req.body));
});

export const deleteMaster = asyncHandler(async (req, res) => {
  ok(res, await ownerService.deleteMaster(req.salon, req.params.id));
});

export const uploadMasterPhoto = asyncHandler(async (req, res) => {
  ok(res, await ownerService.uploadMasterPhoto(req.salon, req.params.id, req.file));
});

// ── Ish vaqti va dam olish kunlari ──────────────────────────────

export const getSchedule = asyncHandler(async (req, res) => {
  const masterId = req.validated?.query?.masterId ?? req.query.masterId ?? null;
  ok(res, await scheduleService.getSchedule(req.salon, masterId));
});

export const updateSchedule = asyncHandler(async (req, res) => {
  ok(res, await scheduleService.updateSchedule(req.salon, req.body));
});

export const resetMasterSchedule = asyncHandler(async (req, res) => {
  ok(res, await scheduleService.resetMasterSchedule(req.salon, req.params.id));
});

export const listTimeOffs = asyncHandler(async (req, res) => {
  ok(res, await scheduleService.listTimeOffs(req.salon, req.validated?.query ?? req.query));
});

export const createTimeOff = asyncHandler(async (req, res) => {
  created(res, await scheduleService.createTimeOff(req.salon, req.body));
});

export const deleteTimeOff = asyncHandler(async (req, res) => {
  ok(res, await scheduleService.deleteTimeOff(req.salon, req.params.id));
});

// ── Yozuvlar ────────────────────────────────────────────────────

export const listBookings = asyncHandler(async (req, res) => {
  ok(res, await bookingService.listBookings(req.salon, req.validated?.query ?? req.query));
});

export const getBooking = asyncHandler(async (req, res) => {
  ok(res, await bookingService.getBooking(req.salon, req.params.id));
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  ok(res, await bookingService.updateStatus(req.salon, req.params.id, req.body));
});

export const createManualBooking = asyncHandler(async (req, res) => {
  created(res, await bookingService.createManualBooking(req.salon, req.body));
});

export const stats = asyncHandler(async (req, res) => {
  ok(res, await bookingService.getStats(req.salon));
});

export const todaySummary = asyncHandler(async (req, res) => {
  ok(res, await bookingService.todaySummary(req.salon));
});
