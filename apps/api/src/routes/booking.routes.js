import { Router } from 'express';
import {
  createBookingSchema,
  cancelBookingSchema,
  myBookingsQuerySchema,
  idParamSchema,
} from '@gozal/shared/schemas/booking.schema';

import * as ctrl from '../controllers/booking.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

/** Band qilish — auth majburiy (mijoz o'z yozuvlarini ko'rishi kerak) */
const router = Router();

router.use(auth);

router.post('/', validate({ body: createBookingSchema }), ctrl.create);
router.get('/my', validate({ query: myBookingsQuerySchema }), ctrl.listMine);
router.get('/my/:id', validate({ params: idParamSchema }), ctrl.getMine);
router.patch(
  '/my/:id/cancel',
  validate({ params: idParamSchema, body: cancelBookingSchema }),
  ctrl.cancelMine,
);

export default router;
