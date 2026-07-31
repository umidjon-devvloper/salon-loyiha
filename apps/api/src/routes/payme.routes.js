import { Router } from 'express';
import { paymeCallback } from '../controllers/payme.controller.js';

/**
 * Payme webhooki.
 * Rate limit qo'llanmaydi — Payme ketma-ket ko'p so'rov yuborishi normal,
 * himoya Basic auth orqali.
 */
const router = Router();

router.post('/callback', paymeCallback);

export default router;
