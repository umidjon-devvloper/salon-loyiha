import { Router } from 'express';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateMeSchema,
  changePasswordSchema,
  pushTokenSchema,
  deleteAccountSchema,
} from '@gozal/shared/schemas/auth.schema';

import * as ctrl from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

// ── Ochiq ───────────────────────────────────────────────────────
router.post('/register', authLimiter, validate({ body: registerSchema }), ctrl.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), ctrl.login);
router.post('/refresh', validate({ body: refreshSchema }), ctrl.refresh);

// ── Auth talab qilinadi ─────────────────────────────────────────
router.post('/logout', auth, ctrl.logout);
router.get('/me', auth, ctrl.me);
router.patch('/me', auth, validate({ body: updateMeSchema }), ctrl.updateMe);
router.post(
  '/change-password',
  auth,
  authLimiter,
  validate({ body: changePasswordSchema }),
  ctrl.changePassword,
);

// ── Mobil ilova uchun (v1 da majburiy tayyorgarlik) ─────────────
router.post('/push-token', auth, validate({ body: pushTokenSchema }), ctrl.savePushToken);
// ⚠️ Apple talabi: hisobni ilova ichidan o'chirish
router.delete('/me', auth, validate({ body: deleteAccountSchema }), ctrl.deleteAccount);

export default router;
