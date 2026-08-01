import { Router } from 'express';
import mongoose from 'mongoose';
import { ok } from '../utils/response.js';
import { dbReady } from '../middleware/dbReady.js';
import { listCities } from '../services/catalog.service.js';
import authRoutes from './auth.routes.js';
import publicRoutes from './public.routes.js';
import ownerRoutes from './owner.routes.js';
import bookingRoutes from './booking.routes.js';
import adminRoutes from './admin.routes.js';
import paymeRoutes from './payme.routes.js';
import seoRoutes from './seo.routes.js';

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

/* Payme webhooki dbReady dan OLDIN: unga javob HAR DOIM JSON-RPC formatida
   bo'lishi kerak, bizning { success, message, code } formatimizda emas.
   Baza yiqilganini controller o'zi tekshiradi va -32400 qaytaradi. */
router.use('/payme', paymeRoutes);
router.use('/', seoRoutes);

/* ── Shundan keyingi hamma narsa bazani talab qiladi ───────────── */
router.use(dbReady);

router.use('/auth', authRoutes);

router.use('/bookings', bookingRoutes);
router.use('/owner', ownerRoutes);
router.use('/admin', adminRoutes);

// ⚠️ Katalog oxirida: uning '/:slug' kabi keng route'lari
// yuqoridagi aniq yo'llarni "yutib yubormasligi" kerak
router.use('/', publicRoutes);

// Keyingi bloklarda ulanadi:

export default router;
