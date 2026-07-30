import * as ownerService from '../services/owner.service.js';
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
