import { Category, Salon, Master, Service } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { SALON_STATUS, CITIES } from '../config/constants.js';
import { paginate, searchRegex, metaOf, skipOf } from '../utils/paginate.js';
import { normalizePriceRange } from '@gozal/shared/schemas/catalog.schema';
import {
  serializeCategory,
  serializeSalonCard,
  serializeSalon,
  serializeMasterCard,
  serializeMaster,
  serializeService,
} from '../utils/serialize.js';

/** Katalogda FAQAT tasdiqlangan salonlar ko'rinadi — hamma joyda shu filtr */
const ACTIVE = { status: SALON_STATUS.ACTIVE };

const SORTS = {
  top: { isTop: -1, rating: -1, createdAt: -1 },
  price_asc: { minPrice: 1, rating: -1 },
  price_desc: { minPrice: -1, rating: -1 },
  rating: { rating: -1, reviewCount: -1 },
  new: { createdAt: -1 },
};

// ── Kategoriyalar ───────────────────────────────────────────────

/** Har bir kategoriyada nechta faol salon borligi bilan */
export async function listCategories() {
  const [categories, counts] = await Promise.all([
    Category.find({ isActive: true }).sort({ order: 1 }).lean(),
    Salon.aggregate([
      { $match: ACTIVE },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
    ]),
  ]);

  const countBy = new Map(counts.map((c) => [String(c._id), c.count]));

  return categories.map((c) =>
    serializeCategory({ ...c, salonCount: countBy.get(String(c._id)) || 0 }),
  );
}

export function listCities() {
  return CITIES.map((c) => ({ name: c.name, districts: c.districts }));
}

// ── Salonlar ────────────────────────────────────────────────────

async function buildSalonFilter(query) {
  const { minPrice, maxPrice } = normalizePriceRange(query);
  const filter = { ...ACTIVE };

  if (query.city) filter.city = query.city;
  if (query.district) filter.district = query.district;

  if (query.category) {
    const category = await Category.findOne({ slug: query.category }).select('_id').lean();
    // Kategoriya topilmasa bo'sh ro'yxat qaytadi — 404 emas, chunki bu filtr
    filter.categories = category ? category._id : null;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    // Salonda so'ralgan oraliqqa tushadigan xizmat bo'lishi kerak:
    // eng arzoni <= maxPrice VA eng qimmati >= minPrice
    if (maxPrice !== undefined) filter.minPrice = { $lte: maxPrice };
    if (minPrice !== undefined) filter.maxPrice = { $gte: minPrice };
  }

  if (query.q) filter.name = searchRegex(query.q);

  return filter;
}

export async function listSalons(query) {
  const filter = await buildSalonFilter(query);

  const { items, meta } = await paginate(Salon, filter, {
    page: query.page,
    limit: query.limit,
    sort: SORTS[query.sort] || SORTS.top,
    select: 'name slug cover city district rating reviewCount isTop isVerified minPrice maxPrice categories',
    populate: { path: 'categories', select: 'slug name.uz' },
  });

  return { items: items.map(serializeSalonCard), meta };
}

/** Salon profili: salon + xizmatlar (kategoriya bo'yicha guruhlangan) + ustalar */
export async function getSalonBySlug(slug) {
  const salon = await Salon.findOne({ slug, ...ACTIVE })
    .populate({ path: 'categories', select: 'slug name.uz' })
    .lean();

  if (!salon) throw ApiError.notFound('Salon topilmadi');

  const [services, masters] = await Promise.all([
    Service.find({ salon: salon._id, isActive: true })
      .sort({ order: 1 })
      .populate({ path: 'category', select: 'slug name.uz' })
      .lean(),
    Master.find({ salon: salon._id, isActive: true }).sort({ order: 1 }).lean(),
  ]);

  // Xizmatlar kategoriya bo'yicha guruhlanadi — salon sahifasi shunday ko'rsatadi
  const groups = new Map();
  for (const s of services) {
    const key = s.category?.slug || 'boshqalar';
    if (!groups.has(key)) {
      groups.set(key, {
        slug: key,
        name: s.category?.name?.uz || 'Boshqalar',
        services: [],
      });
    }
    groups.get(key).services.push(serializeService(s));
  }

  return {
    ...serializeSalon(salon),
    serviceGroups: [...groups.values()],
    serviceCount: services.length,
    masters: masters.map(serializeMasterCard),
  };
}

// ── Mutaxassislar ───────────────────────────────────────────────

export async function listMasters(query) {
  // Usta salon orqali filtrlanadi — avval mos salonlarni topamiz
  const salonFilter = { ...ACTIVE };
  if (query.city) salonFilter.city = query.city;
  if (query.district) salonFilter.district = query.district;

  if (query.category) {
    const category = await Category.findOne({ slug: query.category }).select('_id').lean();
    salonFilter.categories = category ? category._id : null;
  }

  const salons = await Salon.find(salonFilter).select('_id').lean();
  const salonIds = salons.map((s) => s._id);

  const filter = { isActive: true, salon: { $in: salonIds } };
  if (query.salon) filter.salon = query.salon;
  if (query.q) filter.fullName = searchRegex(query.q);

  const { items, meta } = await paginate(Master, filter, {
    page: query.page,
    limit: query.limit,
    sort: { rating: -1, experienceYears: -1 },
    select: 'fullName photo experienceYears rating isPrimary salon',
    populate: { path: 'salon', select: 'name slug city district' },
  });

  return { items: items.map(serializeMasterCard), meta };
}

export async function getMasterById(id) {
  const master = await Master.findOne({ _id: id, isActive: true })
    .populate({ path: 'salon', select: 'name slug city district status workingHours' })
    .populate({ path: 'specialties', select: 'slug name.uz' })
    .lean();

  if (!master || master.salon?.status !== SALON_STATUS.ACTIVE) {
    throw ApiError.notFound('Mutaxassis topilmadi');
  }

  // Bu usta bajaradigan xizmatlar. `masters` bo'sh = salondagi hamma usta bajaradi
  const services = await Service.find({
    salon: master.salon._id,
    isActive: true,
    $or: [{ masters: { $size: 0 } }, { masters: master._id }],
  })
    .sort({ order: 1 })
    .populate({ path: 'category', select: 'slug name.uz' })
    .lean();

  return {
    ...serializeMaster(master),
    services: services.map(serializeService),
  };
}

// ── Umumiy qidiruv ──────────────────────────────────────────────

/**
 * Bitta so'rovda uch xil natija: salon, usta, xizmat.
 * Uchtasi PARALLEL bajariladi.
 */
export async function search({ q, city, limit }) {
  const rx = searchRegex(q);
  const salonFilter = { ...ACTIVE, ...(city ? { city } : {}) };

  const activeSalons = await Salon.find(salonFilter).select('_id').lean();
  const salonIds = activeSalons.map((s) => s._id);

  const [salons, masters, services] = await Promise.all([
    Salon.find({ ...salonFilter, name: rx })
      .sort(SORTS.top)
      .limit(limit)
      .select('name slug cover city district rating reviewCount isTop isVerified minPrice maxPrice')
      .lean(),

    Master.find({ isActive: true, salon: { $in: salonIds }, fullName: rx })
      .sort({ rating: -1 })
      .limit(limit)
      .select('fullName photo experienceYears rating isPrimary salon')
      .populate({ path: 'salon', select: 'name slug city district' })
      .lean(),

    Service.find({ isActive: true, salon: { $in: salonIds }, name: rx })
      .sort({ price: 1 })
      .limit(limit)
      .populate({ path: 'category', select: 'slug name.uz' })
      .populate({ path: 'salon', select: 'name slug city district' })
      .lean(),
  ]);

  return {
    query: q,
    salons: salons.map(serializeSalonCard),
    masters: masters.map(serializeMasterCard),
    services: services.map((s) => ({
      ...serializeService(s),
      salon: s.salon
        ? { id: String(s.salon._id), name: s.salon.name, slug: s.salon.slug }
        : null,
    })),
    total: salons.length + masters.length + services.length,
  };
}

// ── Bosh sahifa uchun TOP salonlar ──────────────────────────────

export async function listTopSalons(limit = 8) {
  const salons = await Salon.find(ACTIVE)
    .sort(SORTS.top)
    .limit(limit)
    .select('name slug cover city district rating reviewCount isTop isVerified minPrice maxPrice categories')
    .populate({ path: 'categories', select: 'slug name.uz' })
    .lean();

  return salons.map(serializeSalonCard);
}

export { metaOf, skipOf };
