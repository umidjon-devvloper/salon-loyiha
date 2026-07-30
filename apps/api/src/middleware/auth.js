import { verifyAccessToken } from '../services/token.service.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/** Token majburiy. req.user = { id, role } */
export function auth(req, _res, next) {
  const token = extractToken(req);
  if (!token) {
    return next(ApiError.unauthorized('Avtorizatsiya talab qilinadi', ERROR_CODES.UNAUTHORIZED));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    next(err); // TOKEN_EXPIRED yoki TOKEN_INVALID
  }
}

/**
 * Token bo'lsa o'qiydi, bo'lmasa o'tkazib yuboradi.
 * Katalog uchun: mehmon ham ko'radi, lekin kirgan foydalanuvchiga
 * qo'shimcha ma'lumot (masalan sevimlilar) berish mumkin.
 */
export function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // yaroqsiz token — mehmon sifatida davom etadi
  }
  next();
}

export default auth;
