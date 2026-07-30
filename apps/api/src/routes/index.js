import { Router } from 'express';
import mongoose from 'mongoose';
import { ok } from '../utils/response.js';
import authRoutes from './auth.routes.js';

const router = Router();

router.get('/health', (req, res) =>
  ok(res, {
    status: 'ok',
    uptime: Math.round(process.uptime()),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  }),
);

router.use('/auth', authRoutes);

// Keyingi bloklarda ulanadi:
// router.use('/', publicRoutes);
// router.use('/bookings', bookingRoutes);
// router.use('/owner', ownerRoutes);
// router.use('/admin', adminRoutes);
// router.use('/payme', paymeRoutes);

export default router;
