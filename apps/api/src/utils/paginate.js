/**
 * Regex uchun foydalanuvchi kiritgan matnni xavfsizlantirish.
 * Busiz `(`, `[`, `*` kabi belgilar regex'ni buzadi yoki ReDoS ga olib keladi.
 */
export function escapeRegex(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Qidiruv uchun case-insensitive regex.
 *
 * Nima uchun `$text` emas: MongoDB matn indeksi FAQAT to'liq so'zni topadi —
 * "lot" yozilganda "Lotus" chiqmaydi. Katalogda esa yozayotganda qidirish kerak.
 * v1 hajmida (yuzlab salon) regex skani muammo emas.
 */
export function searchRegex(q) {
  return new RegExp(escapeRegex(q), 'i');
}

export function skipOf({ page, limit }) {
  return (page - 1) * limit;
}

export function metaOf({ page, limit, total }) {
  return { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}

/**
 * Ro'yxat + hisob bitta joyda. `count` va `find` PARALLEL ketadi.
 * @param {import('mongoose').Model} Model
 */
export async function paginate(Model, filter, { page, limit, sort, select, populate, lean = true }) {
  let query = Model.find(filter).sort(sort).skip(skipOf({ page, limit })).limit(limit);

  if (select) query = query.select(select);
  if (populate) query = query.populate(populate);
  if (lean) query = query.lean();

  const [items, total] = await Promise.all([query, Model.countDocuments(filter)]);

  return { items, meta: metaOf({ page, limit, total }) };
}
