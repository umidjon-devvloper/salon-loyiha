import { Router } from 'express';
import {
  adminSalonsQuerySchema,
  salonStatusSchema,
  salonVerifySchema,
  salonTopSchema,
  salonRatingSchema,
  categorySchema,
  categoryUpdateSchema,
  reorderSchema,
  adminUsersQuerySchema,
  userStatusSchema,
  userRoleSchema,
  userPasswordSchema,
  adminBookingsQuerySchema,
  settingsSchema,
  idParamSchema,
} from '@gozal/shared/schemas/admin.schema';

import * as ctrl from '../controllers/admin.controller.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(auth, requireRole(ROLES.ADMIN));

// ── Salonlar (moderatsiya) ──────────────────────────────────────

router.get('/salons', validate({ query: adminSalonsQuerySchema }), ctrl.salons);
router.get('/salons/:id', validate({ params: idParamSchema }), ctrl.salon);
router.patch(
  '/salons/:id/status',
  validate({ params: idParamSchema, body: salonStatusSchema }),
  ctrl.setSalonStatus,
);
router.patch(
  '/salons/:id/verify',
  validate({ params: idParamSchema, body: salonVerifySchema }),
  ctrl.verifySalon,
);
router.patch(
  '/salons/:id/top',
  validate({ params: idParamSchema, body: salonTopSchema }),
  ctrl.setSalonTop,
);
router.patch(
  '/salons/:id/rating',
  validate({ params: idParamSchema, body: salonRatingSchema }),
  ctrl.setSalonRating,
);
router.delete('/salons/:id', validate({ params: idParamSchema }), ctrl.deleteSalon);

// ── Kategoriyalar ───────────────────────────────────────────────

router.get('/categories', ctrl.categories);
router.post('/categories', validate({ body: categorySchema }), ctrl.createCategory);
router.patch('/categories/reorder', validate({ body: reorderSchema }), ctrl.reorderCategories);
router.put(
  '/categories/:id',
  validate({ params: idParamSchema, body: categoryUpdateSchema }),
  ctrl.updateCategory,
);
router.delete('/categories/:id', validate({ params: idParamSchema }), ctrl.deleteCategory);

// ── Foydalanuvchilar ────────────────────────────────────────────

router.get('/users', validate({ query: adminUsersQuerySchema }), ctrl.users);
router.patch(
  '/users/:id/status',
  validate({ params: idParamSchema, body: userStatusSchema }),
  ctrl.setUserStatus,
);
router.patch(
  '/users/:id/role',
  validate({ params: idParamSchema, body: userRoleSchema }),
  ctrl.setUserRole,
);
// SMS va email yo'q — parolni tiklashning yagona yo'li
router.patch(
  '/users/:id/password',
  validate({ params: idParamSchema, body: userPasswordSchema }),
  ctrl.resetUserPassword,
);

// ── Yozuvlar, statistika, sozlamalar ────────────────────────────

router.get('/bookings', validate({ query: adminBookingsQuerySchema }), ctrl.bookings);
router.get('/stats', ctrl.stats);
router.get('/top-orders', ctrl.topOrders);
router.get('/settings', ctrl.settings);
router.put('/settings', validate({ body: settingsSchema }), ctrl.updateSettings);

export default router;
