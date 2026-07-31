import bcrypt from 'bcryptjs';

import {
  Salon,
  Master,
  Service,
  Booking,
  Category,
  User,
  TopOrder,
  Settings,
} from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { paginate, searchRegex, metaOf } from '../utils/paginate.js';
import { serializeSalonCard, serializeCategory } from '../utils/serialize.js';
import { slugify } from '@gozal/shared/utils/format';
import { todayStr } from '@gozal/shared/utils/time';
import {
  SALON_STATUS,
  BOOKING_STATUS,
  ACTIVE_BOOKING_STATUSES,
  ERROR_CODES,
  ROLES,
} from '../config/constants.js';

const TOP_PLAN_DAYS = { week: 7, month: 30 };
const BCRYPT_ROUNDS = 10;

// ── Toza qoidalar (testlanadi) ──────────────────────────────────

export const ALLOWED_SALON_TRANSITIONS = {
  draft: ['pending', 'blocked'],
  pending: ['active', 'draft', 'blocked'],
  active: ['blocked', 'pending'],
  blocked: ['active', 'pending'],
};

export function canChangeSalonStatus(from, to) {
  return (ALLOWED_SALON_TRANSITIONS[from] || []).includes(to);
}

/**
 * TOP muddati.
 *
 * Muddati hali tugamagan salonga yana TOP sotilsa, kunlar MAVJUD muddat
 * ustiga qo'shiladi — aks holda mijoz pul to'lab, qolgan kunlarini yo'qotadi.
 */
export function topEndDate({ plan, currentUntil, now = new Date() }) {
  const days = TOP_PLAN_DAYS[plan];
  const base =
    currentUntil && new Date(currentUntil) > now ? new Date(currentUntil) : new Date(now);

  const end = new Date(base);
  end.setDate(end.getDate() + days);
  return { days, startDate: new Date(now), endDate: end };
}

// ── Salonlar (moderatsiya) ──────────────────────────────────────

export async function listSalons(query) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.city) filter.city = query.city;
  if (query.q) filter.name = searchRegex(query.q);

  const { items, meta } = await paginate(Salon, filter, {
    page: query.page,
    limit: query.limit,
    // Moderatsiya navbati: eng eski so'rov birinchi — kutib qolgan yo'q
    sort: { status: 1, updatedAt: 1 },
    populate: { path: 'owner', select: 'fullName phone' },
  });

  return {
    items: items.map((salon) => ({
      ...serializeSalonCard(salon),
      status: salon.status,
      rejectReason: salon.rejectReason ?? null,
      topUntil: salon.topUntil ?? null,
      bookingCount: salon.bookingCount ?? 0,
      owner: salon.owner
        ? { id: String(salon.owner._id), fullName: salon.owner.fullName, phone: salon.owner.phone }
        : null,
      createdAt: salon.createdAt,
    })),
    meta,
  };
}

export async function getSalon(id) {
  const salon = await Salon.findById(id)
    .populate({ path: 'owner', select: 'fullName phone createdAt' })
    .populate({ path: 'categories', select: 'slug name.uz' })
    .lean();

  if (!salon) throw ApiError.notFound('Salon topilmadi');

  const [serviceCount, masterCount, bookingCount] = await Promise.all([
    Service.countDocuments({ salon: salon._id, isActive: true }),
    Master.countDocuments({ salon: salon._id, isActive: true }),
    Booking.countDocuments({ salon: salon._id }),
  ]);

  return {
    ...serializeSalonCard(salon),
    status: salon.status,
    rejectReason: salon.rejectReason ?? null,
    topUntil: salon.topUntil ?? null,
    phone: salon.phone,
    address: salon.address ?? '',
    description: salon.description ?? '',
    owner: salon.owner
      ? {
          id: String(salon.owner._id),
          fullName: salon.owner.fullName,
          phone: salon.owner.phone,
          createdAt: salon.owner.createdAt,
        }
      : null,
    counts: { services: serviceCount, masters: masterCount, bookings: bookingCount },
    createdAt: salon.createdAt,
  };
}

export async function setSalonStatus(id, { status, rejectReason }) {
  const salon = await Salon.findById(id);
  if (!salon) throw ApiError.notFound('Salon topilmadi');

  if (salon.status === status) {
    throw ApiError.badRequest('Salon allaqachon shu holatda', ERROR_CODES.INVALID_STATUS);
  }

  if (!canChangeSalonStatus(salon.status, status)) {
    throw ApiError.badRequest(
      `"${salon.status}" holatidan "${status}" ga o'tib bo'lmaydi`,
      ERROR_CODES.INVALID_STATUS,
    );
  }

  salon.status = status;
  salon.rejectReason = ['blocked', 'draft'].includes(status) ? rejectReason : null;
  await salon.save();

  return getSalon(id);
}

export async function verifySalon(id, { isVerified }) {
  const salon = await Salon.findByIdAndUpdate(id, { $set: { isVerified } }, { new: true });
  if (!salon) throw ApiError.notFound('Salon topilmadi');
  return getSalon(id);
}

export async function setSalonRating(id, { rating, reviewCount }) {
  const salon = await Salon.findByIdAndUpdate(id, { $set: { rating, reviewCount } }, { new: true });
  if (!salon) throw ApiError.notFound('Salon topilmadi');
  return getSalon(id);
}

/**
 * TOP e'lonni yoqish yoki o'chirish.
 * `topOrders` — buxgalteriya logi: kim, qachon, qancha to'lagan.
 */
export async function setSalonTop(id, { plan, amount, note }, adminId) {
  const salon = await Salon.findById(id);
  if (!salon) throw ApiError.notFound('Salon topilmadi');

  if (plan === null) {
    salon.isTop = false;
    salon.topUntil = null;
    await salon.save();
    return getSalon(id);
  }

  if (salon.status !== SALON_STATUS.ACTIVE) {
    throw ApiError.badRequest(
      'Faqat tasdiqlangan salonni TOP qilish mumkin',
      ERROR_CODES.INVALID_STATUS,
    );
  }

  const { days, startDate, endDate } = topEndDate({ plan, currentUntil: salon.topUntil });

  salon.isTop = true;
  salon.topUntil = endDate;
  await salon.save();

  await TopOrder.create({
    salon: salon._id,
    plan,
    days,
    amount,
    startDate,
    endDate,
    paymentMethod: 'manual',
    paymentStatus: 'paid',
    createdBy: adminId,
    note,
  });

  return getSalon(id);
}

/**
 * Salonni o'chirish — faqat yozuvi bo'lmagan salon.
 * Yozuvi borini o'chirish tarixni yo'q qiladi; buning o'rniga `blocked`.
 */
export async function deleteSalon(id) {
  const salon = await Salon.findById(id);
  if (!salon) throw ApiError.notFound('Salon topilmadi');

  const bookingCount = await Booking.countDocuments({ salon: salon._id });
  if (bookingCount) {
    throw ApiError.conflict(
      `Bu salonda ${bookingCount} ta yozuv bor. O'chirish o'rniga bloklang`,
      ERROR_CODES.HAS_ACTIVE_BOOKINGS,
    );
  }

  await Promise.all([
    Master.deleteMany({ salon: salon._id }),
    Service.deleteMany({ salon: salon._id }),
    Salon.deleteOne({ _id: salon._id }),
  ]);

  return { id: String(salon._id) };
}

// ── Kategoriyalar ───────────────────────────────────────────────

export async function listCategories() {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ order: 1, _id: 1 }).lean(),
    Salon.aggregate([
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
    ]),
  ]);

  const countBy = new Map(counts.map((c) => [String(c._id), c.count]));

  return categories.map((c) => ({
    ...serializeCategory({ ...c, salonCount: countBy.get(String(c._id)) || 0 }),
    isActive: c.isActive,
  }));
}

export async function createCategory(data) {
  const slug = data.slug || slugify(data.nameUz);

  const exists = await Category.findOne({ slug }).select('_id').lean();
  if (exists) throw ApiError.conflict('Bunday slug allaqachon bor', ERROR_CODES.VALIDATION_ERROR);

  const category = await Category.create({
    name: { uz: data.nameUz, ru: data.nameRu },
    slug,
    icon: data.icon,
    order: data.order,
    isActive: data.isActive,
  });

  return serializeCategory(category.toObject());
}

export async function updateCategory(id, data) {
  const category = await Category.findById(id);
  if (!category) throw ApiError.notFound('Kategoriya topilmadi');

  if (data.nameUz !== undefined) category.name.uz = data.nameUz;
  if (data.nameRu !== undefined) category.name.ru = data.nameRu;
  if (data.slug !== undefined) category.slug = data.slug;
  if (data.icon !== undefined) category.icon = data.icon;
  if (data.order !== undefined) category.order = data.order;
  if (data.isActive !== undefined) category.isActive = data.isActive;

  await category.save();
  return serializeCategory(category.toObject());
}

/** Salonlarga biriktirilgan kategoriya o'chirilmaydi — ular kategoriyasiz qoladi */
export async function deleteCategory(id) {
  const used = await Salon.countDocuments({ categories: id });
  if (used) {
    throw ApiError.conflict(
      `Bu kategoriya ${used} ta salonda ishlatilgan. O'chirish o'rniga "faol emas" qiling`,
      ERROR_CODES.HAS_ACTIVE_BOOKINGS,
    );
  }

  const category = await Category.findByIdAndDelete(id);
  if (!category) throw ApiError.notFound('Kategoriya topilmadi');

  return { id: String(category._id) };
}

export async function reorderCategories(items) {
  await Category.bulkWrite(
    items.map((i) => ({
      updateOne: { filter: { _id: i.id }, update: { $set: { order: i.order } } },
    })),
  );

  return listCategories();
}

// ── Foydalanuvchilar ────────────────────────────────────────────

function serializeUser(user) {
  return {
    id: String(user._id),
    phone: user.phone,
    fullName: user.fullName,
    role: user.role,
    city: user.city,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
  };
}

export async function listUsers(query) {
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.q) {
    const rx = searchRegex(query.q);
    filter.$or = [{ fullName: rx }, { phone: rx }];
  }

  const { items, meta } = await paginate(User, filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1 },
  });

  return { items: items.map(serializeUser), meta };
}

export async function setUserStatus(id, { isActive }, adminId) {
  if (String(id) === String(adminId)) {
    throw ApiError.badRequest("O'zingizni bloklab bo'lmaydi", ERROR_CODES.FORBIDDEN);
  }

  const user = await User.findByIdAndUpdate(id, { $set: { isActive } }, { new: true });
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');

  return serializeUser(user.toObject());
}

export async function setUserRole(id, { role }, adminId) {
  if (String(id) === String(adminId)) {
    throw ApiError.badRequest("O'z rolingizni o'zgartirib bo'lmaydi", ERROR_CODES.FORBIDDEN);
  }

  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');

  // Salon egasidan rolni olib qo'yish salonni "egasiz" qoldiradi
  if (user.role === ROLES.OWNER && role !== ROLES.OWNER) {
    const salon = await Salon.findOne({ owner: user._id }).select('_id').lean();
    if (salon) {
      throw ApiError.conflict(
        'Bu foydalanuvchining saloni bor. Avval salonni boshqa egaga bering yoki bloklang',
        ERROR_CODES.HAS_ACTIVE_BOOKINGS,
      );
    }
  }

  user.role = role;
  await user.save();

  return serializeUser(user.toObject());
}

/**
 * Parolni tiklash — SMS va email yo'q, shuning uchun bu yagona yo'l.
 * Barcha sessiyalar yopiladi: parol o'zgargach eski tokenlar ishlamasin.
 */
export async function resetUserPassword(id, { password }) {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');

  user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  user.refreshTokens = [];
  await user.save();

  return { id: String(user._id), message: 'Parol yangilandi' };
}

// ── Yozuvlar va statistika ──────────────────────────────────────

export async function listBookings(query) {
  const filter = {};

  if (query.from || query.to) {
    filter.date = { ...(query.from && { $gte: query.from }), ...(query.to && { $lte: query.to }) };
  }
  if (query.salon) filter.salon = query.salon;
  if (query.status) filter.status = query.status;

  const { items, meta } = await paginate(Booking, filter, {
    page: query.page,
    limit: query.limit,
    sort: { date: -1, startMin: -1 },
    populate: { path: 'salon', select: 'name slug' },
  });

  return {
    items: items.map((b) => ({
      id: String(b._id),
      code: b.code,
      status: b.status,
      source: b.source,
      date: b.date,
      startMin: b.startMin,
      totalPrice: b.totalPrice,
      clientName: b.clientName,
      clientPhone: b.clientPhone,
      salon: b.salon ? { id: String(b.salon._id), name: b.salon.name, slug: b.salon.slug } : null,
      createdAt: b.createdAt,
    })),
    meta,
  };
}

export async function getStats() {
  const today = todayStr();

  const [users, salons, bookingsByStatus, todayCount, topRevenue] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Salon.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.countDocuments({ date: today }),
    TopOrder.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const byKey = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));

  const userCounts = byKey(users);
  const salonCounts = byKey(salons);
  const bookingCounts = byKey(bookingsByStatus);

  const topCount = await Salon.countDocuments({ isTop: true, topUntil: { $gt: new Date() } });

  return {
    users: {
      total: Object.values(userCounts).reduce((a, b) => a + b, 0),
      clients: userCounts.client || 0,
      owners: userCounts.owner || 0,
      admins: userCounts.admin || 0,
    },
    salons: {
      total: Object.values(salonCounts).reduce((a, b) => a + b, 0),
      active: salonCounts.active || 0,
      pending: salonCounts.pending || 0,
      draft: salonCounts.draft || 0,
      blocked: salonCounts.blocked || 0,
      top: topCount,
    },
    bookings: {
      total: Object.values(bookingCounts).reduce((a, b) => a + b, 0),
      today: todayCount,
      byStatus: bookingCounts,
      active: ACTIVE_BOOKING_STATUSES.reduce((sum, s) => sum + (bookingCounts[s] || 0), 0),
    },
    revenue: { topOrdersTotal: topRevenue[0]?.total || 0 },
  };
}

export async function listTopOrders({ page = 1, limit = 20 } = {}) {
  const [items, total] = await Promise.all([
    TopOrder.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'salon', select: 'name slug' })
      .lean(),
    TopOrder.countDocuments(),
  ]);

  return {
    items: items.map((o) => ({
      id: String(o._id),
      plan: o.plan,
      days: o.days,
      amount: o.amount,
      startDate: o.startDate,
      endDate: o.endDate,
      paymentMethod: o.paymentMethod,
      note: o.note || '',
      salon: o.salon ? { id: String(o.salon._id), name: o.salon.name, slug: o.salon.slug } : null,
      createdAt: o.createdAt,
    })),
    meta: metaOf({ page, limit, total }),
  };
}

// ── Sozlamalar ──────────────────────────────────────────────────

function serializeSettings(settings) {
  return {
    bookingFee: settings.bookingFee,
    holdMinutes: settings.holdMinutes,
    topPrices: settings.topPrices,
    promoText: settings.promoText || '',
  };
}

export async function getSettings() {
  const settings = await Settings.getGlobal();
  return serializeSettings(settings.toObject());
}

export async function updateSettings(data) {
  const settings = await Settings.getGlobal();

  if (data.bookingFee) Object.assign(settings.bookingFee, data.bookingFee);
  if (data.topPrices) Object.assign(settings.topPrices, data.topPrices);
  if (data.holdMinutes !== undefined) settings.holdMinutes = data.holdMinutes;
  if (data.promoText !== undefined) settings.promoText = data.promoText;

  if (settings.bookingFee.minAmount > settings.bookingFee.maxAmount) {
    throw ApiError.badRequest('Eng kam summa eng ko\u2019pdan katta bo\u2019lmasin');
  }

  await settings.save();
  return serializeSettings(settings.toObject());
}

export default {
  listSalons,
  getSalon,
  setSalonStatus,
  verifySalon,
  setSalonRating,
  setSalonTop,
  deleteSalon,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  listUsers,
  setUserStatus,
  setUserRole,
  resetUserPassword,
  listBookings,
  getStats,
  listTopOrders,
  getSettings,
  updateSettings,
  topEndDate,
  canChangeSalonStatus,
  BOOKING_STATUS,
};
