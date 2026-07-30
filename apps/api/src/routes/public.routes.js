import { Router } from 'express';
import {
  salonListSchema,
  masterListSchema,
  searchSchema,
  slugParamSchema,
  idParamSchema,
} from '@gozal/shared/schemas/catalog.schema';

import * as ctrl from '../controllers/public.controller.js';
import { validate } from '../middleware/validate.js';

const router = Router();

/** Hammasi ochiq — mehmon ham ko'radi. Band qilish uchun auth kerak bo'ladi */

router.get('/categories', ctrl.categories);
router.get('/cities', ctrl.cities);

router.get('/salons', validate({ query: salonListSchema }), ctrl.salons);
router.get('/salons/top', ctrl.topSalons);
router.get('/salons/:slug', validate({ params: slugParamSchema }), ctrl.salonBySlug);

router.get('/masters', validate({ query: masterListSchema }), ctrl.masters);
router.get('/masters/:id', validate({ params: idParamSchema }), ctrl.masterById);

router.get('/search', validate({ query: searchSchema }), ctrl.search);

export default router;
