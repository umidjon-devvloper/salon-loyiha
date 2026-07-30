import mongoose from 'mongoose';
import env from '../config/env.js';
import { ERROR_CODES } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';
import { isZodError, zodIssues } from '../utils/isZodError.js';

/** Route topilmadi */
export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Yo'l topilmadi: ${req.method} ${req.originalUrl}`));
}

/**
 * Yagona xato formati:
 * { success: false, message, code, errors? }
 */
export function errorHandler(err, req, res, _next) {
  let status = 500;
  let message = 'Serverda xatolik yuz berdi';
  let code = ERROR_CODES.SERVER_ERROR;
  let errors;

  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
    code = err.code;
    if (err.details) errors = err.details;
  } else if (isZodError(err)) {
    status = 400;
    message = 'Kiritilgan ma\'lumotlarda xato bor';
    code = ERROR_CODES.VALIDATION_ERROR;
    errors = zodIssues(err);
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Kiritilgan ma\'lumotlarda xato bor';
    code = ERROR_CODES.VALIDATION_ERROR;
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = 'Noto\'g\'ri identifikator';
    code = ERROR_CODES.VALIDATION_ERROR;
  } else if (err.code === 11000) {
    // Unique index buzildi. Booking uchun bu — slot band.
    status = 409;
    const field = Object.keys(err.keyPattern || {}).join(', ');
    if (field.includes('startMin')) {
      message = 'Kechirasiz, bu vaqtni sizdan oldin band qilishdi';
      code = ERROR_CODES.SLOT_TAKEN;
    } else if (field.includes('phone')) {
      message = 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan';
      code = ERROR_CODES.PHONE_TAKEN;
    } else {
      message = 'Bu ma\'lumot allaqachon mavjud';
      code = 'DUPLICATE_KEY';
    }
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Yuborilgan ma\'lumot juda katta';
    code = ERROR_CODES.PAYLOAD_TOO_LARGE;
  }

  // Kutilmagan xatolarni log qilamiz (kutilganlarini emas — shovqin bo'ladi)
  if (status >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.error(err);
  }

  const body = { success: false, message, code };
  if (errors) body.errors = errors;
  if (!env.isProd && status >= 500) body.stack = err.stack;

  res.status(status).json(body);
}

export default errorHandler;
