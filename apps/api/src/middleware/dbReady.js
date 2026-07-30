import mongoose from 'mongoose';
import { ERROR_CODES } from '../config/constants.js';

/**
 * Baza uzilgan bo'lsa so'rovni DARHOL rad etadi.
 *
 * Busiz har bir so'rov `serverSelectionTimeoutMS` (10 s) kutadi va shundan keyin
 * 500 qaytaradi. Baza bir daqiqa yiqilsa — minglab so'rov osilib qoladi,
 * Node event loop to'lib ketadi va sayt butunlay javob bermay qo'yadi.
 *
 * 503 + `Retry-After` esa to'g'ri javob: mijoz qayta urinishini biladi,
 * Nginx va monitoring buni to'g'ri talqin qiladi.
 */
export function dbReady(req, res, next) {
  // 1 = connected, 2 = connecting (ulanmoqda — kutib ko'ramiz)
  const state = mongoose.connection.readyState;
  if (state === 1 || state === 2) return next();

  res.set('Retry-After', '10');
  return res.status(503).json({
    success: false,
    message: "Xizmat vaqtincha mavjud emas. Bir ozdan keyin qayta urinib ko'ring",
    code: ERROR_CODES.DB_UNAVAILABLE,
  });
}

export default dbReady;
