import * as catalog from '../services/catalog.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

export const categories = asyncHandler(async (req, res) => {
  ok(res, await catalog.listCategories());
});

export const salons = asyncHandler(async (req, res) => {
  const { items, meta } = await catalog.listSalons(req.validated.query);
  ok(res, items, meta);
});

export const salonBySlug = asyncHandler(async (req, res) => {
  ok(res, await catalog.getSalonBySlug(req.params.slug));
});

export const masters = asyncHandler(async (req, res) => {
  const { items, meta } = await catalog.listMasters(req.validated.query);
  ok(res, items, meta);
});

export const masterById = asyncHandler(async (req, res) => {
  ok(res, await catalog.getMasterById(req.params.id));
});

export const search = asyncHandler(async (req, res) => {
  ok(res, await catalog.search(req.validated.query));
});

export const topSalons = asyncHandler(async (req, res) => {
  ok(res, await catalog.listTopSalons());
});
