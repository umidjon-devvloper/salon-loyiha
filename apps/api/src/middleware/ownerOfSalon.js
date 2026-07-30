import { Salon } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES, ROLES } from '../config/constants.js';

/**
 * ⭐ Har bir /api/owner/* so'rovda MAJBURIY.
 *
 * Foydalanuvchining salonini topadi va `req.salon` ga qo'yadi.
 * Shundan keyin controller'lar HAR DOIM `req.salon._id` bilan ishlaydi —
 * so'rovdan kelgan `salonId` ga hech qachon ishonilmaydi.
 *
 * v1: bir egaga bitta salon (Salon.owner unique).
 */
export async function ownerOfSalon(req, _res, next) {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized('Avtorizatsiya talab qilinadi', ERROR_CODES.UNAUTHORIZED));
    }

    // Admin istalgan salonni ko'ra oladi: ?salonId=... yoki :salonId
    if (req.user.role === ROLES.ADMIN) {
      const id = req.params.salonId || req.query.salonId;
      if (!id) return next(ApiError.badRequest("salonId ko'rsatilmagan"));
      const salon = await Salon.findById(id);
      if (!salon) return next(ApiError.notFound('Salon topilmadi'));
      req.salon = salon;
      return next();
    }

    const salon = await Salon.findOne({ owner: req.user.id });
    if (!salon) {
      return next(ApiError.notFound('Sizda hali salon yaratilmagan', ERROR_CODES.NOT_FOUND));
    }

    if (String(salon.owner) !== String(req.user.id)) {
      return next(ApiError.forbidden('Bu salon sizga tegishli emas', ERROR_CODES.NOT_OWNER));
    }

    req.salon = salon;
    next();
  } catch (err) {
    next(err);
  }
}

export default ownerOfSalon;
