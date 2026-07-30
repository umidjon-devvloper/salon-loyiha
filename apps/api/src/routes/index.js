import { Router } from 'express';
import mongoose from 'mongoose';
import { ok } from '../utils/response.js';
import { dbReady } from '../middleware/dbReady.js';
import { listCities } from '../services/catalog.service.js';
import authRoutes from './auth.routes.js';
import publicRoutes from './public.routes.js';

const router = Router();

/* ── Bazaga TEGMAYDIGAN endpointlar — dbReady dan oldin ────────────
   Monitoring baza yiqilganda ham /health dan javob olishi kerak,
   shahar/tuman ro'yxati esa konstantalardan o'qiladi. */

router.get('/health', (req, res) =>
  ok(res, {
    status: 'ok',
    uptime: Math.round(process.uptime()),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  }),
);

router.get('/cities', (req, res) => ok(res, listCities()));

/* ── Shundan keyingi hamma narsa bazani talab qiladi ───────────── */
router.use(dbReady);

router.use('/auth', authRoutes);

// ⚠️ Katalog oxirida: uning '/:slug' kabi keng route'lari
// yuqoridagi aniq yo'llarni "yutib yubormasligi" kerak
router.use('/', publicRoutes);

// Keyingi bloklarda ulanadi:
// router.use('/bookings', bookingRoutes);
// router.use('/owner', ownerRoutes);
// router.use('/admin', adminRoutes);
// router.use('/payme', paymeRoutes);

export default router;
