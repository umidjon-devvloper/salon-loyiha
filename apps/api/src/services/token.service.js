import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';

/**
 * Faqat token bilan ishlaydi — bazaga tegmaydi.
 * Saqlash va bekor qilish `auth.service.js` da.
 */

const ACCESS = 'access';
const REFRESH = 'refresh';

export function signAccessToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role, typ: ACCESS }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  });
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, typ: REFRESH, jti: crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES },
  );
}

function verify(token, secret, expectedType) {
  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Sessiya muddati tugagan', ERROR_CODES.TOKEN_EXPIRED);
    }
    throw ApiError.unauthorized('Token yaroqsiz', ERROR_CODES.TOKEN_INVALID);
  }

  // Access token'ni refresh o'rnida ishlatishning oldini oladi
  if (payload.typ !== expectedType) {
    throw ApiError.unauthorized('Token turi noto\'g\'ri', ERROR_CODES.TOKEN_INVALID);
  }
  return payload;
}

export function verifyAccessToken(token) {
  return verify(token, env.JWT_ACCESS_SECRET, ACCESS);
}

export function verifyRefreshToken(token) {
  return verify(token, env.JWT_REFRESH_SECRET, REFRESH);
}

/**
 * Refresh token bazaga OCHIQ saqlanmaydi — faqat sha256 hashi.
 * Baza sizib chiqsa ham tokenlar ishlatib bo'lmaydi.
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Token ichidagi `exp` (sekund) → `Date` */
export function expiryOf(token) {
  const { exp } = jwt.decode(token) || {};
  return exp ? new Date(exp * 1000) : new Date(Date.now() + 30 * 86_400_000);
}
