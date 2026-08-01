import multer from 'multer';

import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { ALLOWED_IMAGE_MIME, MAX_SALON_IMAGES, ERROR_CODES } from '../config/constants.js';

/**
 * Rasmlar diskka multer orqali emas, `upload.service.js` orqali yoziladi:
 * sharp qayta yozmagan faylni diskda qoldirmaslik kerak.
 * Shuning uchun bu yerda `memoryStorage`.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
    return cb(
      ApiError.badRequest(
        'Faqat JPG, PNG yoki WEBP rasm yuklash mumkin',
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }
  cb(null, true);
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxUploadBytes, files: MAX_SALON_IMAGES },
});

/** Multer xatolarini loyihaning umumiy xato formatiga o'giradi */
function wrap(handler) {
  // Nom `guards.test.js` uchun: rasm yuklaydigan marshrutlar body
  // validatsiyasidan istisno qilinadi va ular shu nom bilan aniqlanadi
  return function uploadMiddleware(req, res, next) {
    handler(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            ApiError.badRequest(
              `Rasm hajmi ${env.MAX_UPLOAD_MB} MB dan oshmasligi kerak`,
              ERROR_CODES.PAYLOAD_TOO_LARGE,
            ),
          );
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(
            ApiError.badRequest(`Bir vaqtda ko'pi bilan ${MAX_SALON_IMAGES} ta rasm yuklanadi`),
          );
        }
        return next(ApiError.badRequest('Rasm yuklashda xatolik'));
      }

      return next(err);
    });
  };
}

/** Bitta rasm: avatar, usta surati */
export const uploadSingle = (field = 'image') => wrap(multerUpload.single(field));

/** Bir nechta rasm: salon galereyasi */
export const uploadMany = (field = 'images', max = MAX_SALON_IMAGES) =>
  wrap(multerUpload.array(field, max));

export default { uploadSingle, uploadMany };
