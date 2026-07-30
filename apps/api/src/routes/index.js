import { Router } from 'express';
import mongoose from 'mongoose';
import { ok } from '../utils/response.js';
import authRoutes from './auth.routes.js';
import publicRoutes from './public.routes.js';

const router = Router();

router.get('/health', (req, res) =>
  ok(res, {
    status: 'ok',
    uptime: Math.round(process.uptime()),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  }),
);

router.use('/auth', authRoutes);

// ⚠️ Katalog oxirida turadi: uning '/:slug' kabi keng route'lari
// yuqoridagi aniq yo'llarni "yutib yubormasligi" kerak
router.use('/', publicRoutes);

// Keyingi bloklarda ulanadi:
// router.use('/bookings', bookingRoutes);
// router.use('/owner', ownerRoutes);
// router.use('/admin', adminRoutes);
// router.use('/payme', paymeRoutes);

export default router;
