import ApiError from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';

/**
 * Ishlatilishi: router.use(auth, requireRole('owner'))
 * `auth` middleware'idan KEYIN qo'yilishi shart.
 */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Avtorizatsiya talab qilinadi', ERROR_CODES.UNAUTHORIZED));
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Bu amal uchun ruxsat yo\'q', ERROR_CODES.FORBIDDEN));
    }
    next();
  };
}

export default requireRole;
