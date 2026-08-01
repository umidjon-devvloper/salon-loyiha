import ApiError from '../utils/ApiError.js';
import { isZodError, zodIssues } from '../utils/isZodError.js';
import { ERROR_CODES } from '../config/constants.js';

/**
 * Zod validatsiya middleware'i.
 *
 * Ishlatilishi:
 *   router.post('/login', validate({ body: loginSchema }), ctrl.login)
 *
 * MUHIM: natija req.body / req.query / req.params ga QAYTA YOZILADI —
 * shunda controller normallashtirilgan qiymatni oladi
 * (masalan '90 123 45 67' → '+998901234567').
 *
 * `req.query` Express 5 da faqat getter, shuning uchun tayinlash o'rniga
 * `req.validated` ga ham yoziladi.
 */
export function validate(schemas) {
  /* Nom ataylab qo'yilgan: express router stack'ida ko'rinadi. Shu tufayli
     `routes/guards.test.js` yangi endpointda validatsiya unutilganini ushlaydi,
     va xato stack trace'ida ham anonim funksiya emas, `validate` chiqadi. */
  return function validate(req, _res, next) {
    try {
      req.validated = req.validated || {};

      if (schemas.body) {
        req.body = schemas.body.parse(req.body ?? {});
        req.validated.body = req.body;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params ?? {});
        req.validated.params = req.params;
      }
      if (schemas.query) {
        // req.query ga tayinlamaymiz (Express 5 da getter) — tozalab, ustiga yozamiz
        const parsed = schemas.query.parse({ ...req.query });
        req.validated.query = parsed;
        for (const key of Object.keys(req.query)) delete req.query[key];
        Object.assign(req.query, parsed);
      }

      next();
    } catch (err) {
      if (isZodError(err)) {
        return next(
          ApiError.badRequest(
            "Kiritilgan ma'lumotlarda xato bor",
            ERROR_CODES.VALIDATION_ERROR,
            zodIssues(err),
          ),
        );
      }
      next(err);
    }
  };
}

export default validate;
