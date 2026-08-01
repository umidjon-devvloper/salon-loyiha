import rateLimit from 'express-rate-limit';
import env from '../config/env.js';
import { ERROR_CODES } from '../config/constants.js';

const jsonHandler = (message) => (req, res) => {
  res.status(429).json({ success: false, message, code: ERROR_CODES.RATE_LIMITED });
};

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  // Dev'da chegaralar xalaqit bermasin
  skip: () => env.isDev,
};

/**
 * Payme webhooki chegaraga tushmaydi.
 *
 * Ikki sabab:
 *  1. Payme bitta IP'dan ketma-ket ko'p so'rov yuboradi (Check → Create →
 *     Perform), sandbox testlarida esa bu yanada zich bo'ladi
 *  2. Chegaraga tushsa u bizning { success: false } formatimizni oladi va
 *     tushunmaydi — unga har doim JSON-RPC kerak
 *
 * Himoya bu yerda rate limit emas, Basic auth (`checkAuth`).
 */
const skipPayme = (req) => req.path.startsWith('/payme/');

/** Login / register: 10 urinish / 15 daqiqa / IP */
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  handler: jsonHandler("Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring"),
});

/** Yozuv yaratish: 20 / soat / IP */
export const bookingLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  handler: jsonHandler("Juda ko'p yozuv. Bir ozdan keyin qayta urinib ko'ring"),
});

/** Umumiy API chegarasi */
export const apiLimiter = rateLimit({
  ...base,
  skip: (req) => env.isDev || skipPayme(req),
  windowMs: 60 * 1000,
  limit: 300,
  handler: jsonHandler("Juda ko'p so'rov. Bir ozdan keyin qayta urinib ko'ring"),
});
