/**
 * NoSQL injection himoyasi.
 *
 * `express-mongo-sanitize` o'rniga yozildi: u Express 5 da ishlamaydi
 * (`req.query` faqat getter bo'lib qolgan, u esa qayta tayinlamoqchi bo'ladi)
 * va paket qo'llab-quvvatlanmaydi.
 *
 * Biz obyektni QAYTA TAYINLAMAYMIZ — ichidagi xavfli kalitlarni o'chiramiz.
 * Shu sababli Express 4 va 5 da bir xil ishlaydi.
 *
 * Xavfli kalit = `$` bilan boshlanadi (operator) yoki `.` bor (ichma-ich yo'l).
 */

const isDangerousKey = (key) => key.startsWith('$') || key.includes('.');

function scrub(value, depth = 0) {
  if (depth > 10 || value === null || typeof value !== 'object') return;

  if (Array.isArray(value)) {
    for (const item of value) scrub(item, depth + 1);
    return;
  }

  for (const key of Object.keys(value)) {
    if (isDangerousKey(key)) {
      delete value[key];
      continue;
    }
    scrub(value[key], depth + 1);
  }
}

export function sanitize(req, _res, next) {
  scrub(req.body);
  scrub(req.params);
  scrub(req.query); // mutatsiya — qayta tayinlash emas
  next();
}

export default sanitize;
