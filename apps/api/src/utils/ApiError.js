import { ERROR_CODES } from '../config/constants.js';

/**
 * Barcha "kutilgan" xatolar shu klass orqali tashlanadi.
 * message — foydalanuvchiga ko'rsatiladigan matn, O'ZBEK TILIDA.
 * code — frontend uchun barqaror string konstanta.
 */
export class ApiError extends Error {
  constructor(status, message, code = ERROR_CODES.SERVER_ERROR, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code = ERROR_CODES.VALIDATION_ERROR, details = null) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Avtorizatsiya talab qilinadi', code = ERROR_CODES.UNAUTHORIZED) {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Ruxsat yo\'q', code = ERROR_CODES.FORBIDDEN) {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Topilmadi', code = ERROR_CODES.NOT_FOUND) {
    return new ApiError(404, message, code);
  }

  static conflict(message, code) {
    return new ApiError(409, message, code);
  }

  static tooMany(message = 'Juda ko\'p so\'rov', code = ERROR_CODES.RATE_LIMITED) {
    return new ApiError(429, message, code);
  }

  static internal(message = 'Serverda xatolik yuz berdi') {
    return new ApiError(500, message, ERROR_CODES.SERVER_ERROR);
  }
}

export default ApiError;
