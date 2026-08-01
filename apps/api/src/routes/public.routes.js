import { Router } from 'express';
import {
  salonListSchema,
  masterListSchema,
  searchSchema,
  slugParamSchema,
  idParamSchema,
} from '@gozal/shared/schemas/catalog.schema';

import {
  availabilityQuerySchema,
  monthAvailabilityQuerySchema,
} from '@gozal/shared/schemas/booking.schema';

import * as ctrl from '../controllers/public.controller.js';
import * as bookingCtrl from '../controllers/booking.controller.js';
import { validate } from '../middleware/validate.js';

const router = Router();

/** Hammasi ochiq — mehmon ham ko'radi. Band qilish uchun auth kerak bo'ladi */

router.get('/categories', ctrl.categories);
// /cities routes/index.js da — u bazaga tegmaydi

router.get('/salons', validate({ query: salonListSchema }), ctrl.salons);
router.get('/salons/top', ctrl.topSalons);
router.get('/salons/:slug', validate({ params: slugParamSchema }), ctrl.salonBySlug);

router.get('/masters', validate({ query: masterListSchema }), ctrl.masters);
router.get('/masters/:id', validate({ params: idParamSchema }), ctrl.masterById);

router.get('/settings', ctrl.settings);

router.get('/search', validate({ query: searchSchema }), ctrl.search);

// ── Bo'sh vaqtlar ⭐ ─────────────────────────────────────────────
// Mehmon ham ko'ra oladi: avval bo'sh vaqtni ko'rsatib, keyin ro'yxatdan
// o'tishni so'rash — teskarisidan ko'ra ko'proq odam yozilib qoladi
router.get('/availability', validate({ query: availabilityQuerySchema }), bookingCtrl.availability);
router.get(
  '/availability/days',
  validate({ query: monthAvailabilityQuerySchema }),
  bookingCtrl.availabilityDays,
);

export default router;
