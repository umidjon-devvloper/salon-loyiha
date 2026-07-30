import { Salon, Master, Service, Category, Booking } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { slugify } from '@gozal/shared/utils/format';
import { todayStr } from '@gozal/shared/utils/time';
import {
  SALON_STATUS,
  ERROR_CODES,
  ACTIVE_BOOKING_STATUSES,
  MAX_SALON_IMAGES,
} from '../config/constants.js';
import { saveImage, saveImages, removeImage } from './upload.service.js';
import {
  serializeSalon,
  serializeMaster,
  serializeMasterCard,
  serializeService,
} from '../utils/serialize.js';

// ── Toza yordamchilar (testlanadi) ──────────────────────────────

/**
 * Salonning narx oralig'i FAOL xizmatlardan hisoblanadi.
 * Katalog filtri shu ikki maydonga tayanadi, shuning uchun xizmat har
 * o'zgarganda qayta hisoblanadi — aks holda filtr yolg'on natija beradi.
 */
export function priceRangeOf(services) {
  const active = (services || []).filter((s) => s.isActive !== false);
  if (!active.length) return { minPrice: 0, maxPrice: 0 };

  return {
    minPrice: Math.min(...active.map((s) => s.price)),
    // "100 000 – 180 000" ko'rinishidagi xizmatda yuqori chegara priceTo
    maxPrice: Math.max(...active.map((s) => s.priceTo ?? s.price)),
  };
}

/**
 * Nomdan slug yasaydi va band bo'lsa raqam qo'shadi: lotus, lotus-2, lotus-3...
 * @param {(slug: string) => Promise<boolean>} exists
 */
export async function buildUniqueSlug(name, exists) {
  const base = slugify(name) || 'salon';

  if (!(await exists(base))) return base;

  for (let i = 2; i <= 50; i++) {
    const candidate = `${base}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}

/** Topshirishga tayyormi? Bo'sh salon katalogda ko'rinmasligi kerak */
export function salonSubmitIssues({ salon, serviceCount, masterCount }) {
  const issues = [];

  if (!salon.categories?.length) issues.push('Kamida bitta kategoriya tanlang');
  if (!salon.phone) issues.push('Telefon raqam kiriting');
  if (!salon.district) issues.push('Tuman tanlang');
  if (!serviceCount) issues.push("Kamida bitta xizmat qo'shing (nom, narx, davomiylik bilan)");
  if (!masterCount) issues.push("Kamida bitta mutaxassis qo'shing");

  const hasOpenDay = (salon.workingHours || []).some((d) => d.isOpen);
  if (!hasOpenDay) issues.push("Ish vaqtini kiriting — kamida bitta ish kuni ochiq bo'lsin");

  return issues;
}

// ── Ichki tekshiruvlar ──────────────────────────────────────────

async function assertCategories(ids) {
  if (!ids?.length) return;

  const count = await Category.countDocuments({ _id: { $in: ids }, isActive: true });
  if (count !== ids.length) {
    throw ApiError.badRequest('Tanlangan kategoriya topilmadi', ERROR_CODES.VALIDATION_ERROR);
  }
}

/** Usta boshqa salonga tegishli bo'lsa — so'rovdan kelgan idga ishonilmaydi */
async function assertMastersOfSalon(salonId, masterIds) {
  if (!masterIds?.length) return;

  const count = await Master.countDocuments({ _id: { $in: masterIds }, salon: salonId });
  if (count !== masterIds.length) {
    throw ApiError.badRequest(
      'Tanlangan mutaxassis bu salonga tegishli emas',
      ERROR_CODES.NOT_OWNER,
    );
  }
}

async function recalcPrices(salonId) {
  const services = await Service.find({ salon: salonId }).select('price priceTo isActive').lean();
  const { minPrice, maxPrice } = priceRangeOf(services);
  await Salon.updateOne({ _id: salonId }, { $set: { minPrice, maxPrice } });
  return { minPrice, maxPrice };
}

/** Salon egasi o'z salonini status va rad etish sababi bilan ko'radi */
function serializeOwnerSalon(salon) {
  const doc = salon.toObject ? salon.toObject() : salon;
  return {
    ...serializeSalon(doc),
    status: doc.status,
    rejectReason: doc.rejectReason ?? null,
    topUntil: doc.topUntil ?? null,
    bookingCount: doc.bookingCount ?? 0,
  };
}

// ── Salon ───────────────────────────────────────────────────────

export async function getMySalon(salon) {
  return serializeOwnerSalon(salon);
}

/**
 * v1: bir egaga bitta salon.
 * Salon bilan birga "asosiy usta" yaratiladi — salonda ustalar bo'linmagan
 * bo'lsa ham booking har doim `master` ga bog'lanadi (arxitektura qarori).
 */
export async function createSalon(userId, data) {
  const existing = await Salon.findOne({ owner: userId }).select('_id').lean();
  if (existing) {
    throw ApiError.conflict('Sizda allaqachon salon mavjud', ERROR_CODES.SALON_EXISTS);
  }

  await assertCategories(data.categories);

  const slug = await buildUniqueSlug(data.name, async (s) => {
    const found = await Salon.findOne({ slug: s }).select('_id').lean();
    return Boolean(found);
  });

  const salon = await Salon.create({
    ...data,
    owner: userId,
    slug,
    status: SALON_STATUS.DRAFT,
  });

  await Master.create({
    salon: salon._id,
    fullName: salon.name,
    isPrimary: true,
    isActive: true,
    order: 0,
  });

  return serializeOwnerSalon(salon);
}

/**
 * ⚠️ `slug` nomni o'zgartirganda ham o'zgarmaydi: havolalar tarqalgan bo'ladi,
 * ularni buzish mumkin emas. Zarur bo'lsa admin qo'lda o'zgartiradi.
 */
export async function updateSalon(salon, data) {
  if (data.categories) await assertCategories(data.categories);

  Object.assign(salon, data);
  await salon.save();

  return serializeOwnerSalon(salon);
}

/** draft → pending. Admin tasdiqlagach katalogda ko'rinadi */
export async function submitSalon(salon) {
  if (salon.status === SALON_STATUS.ACTIVE) {
    throw ApiError.badRequest('Salon allaqachon tasdiqlangan', ERROR_CODES.INVALID_STATUS);
  }
  if (salon.status === SALON_STATUS.PENDING) {
    throw ApiError.badRequest('Salon tekshiruvda — javobni kuting', ERROR_CODES.INVALID_STATUS);
  }
  if (salon.status === SALON_STATUS.BLOCKED) {
    throw ApiError.forbidden('Salon bloklangan. Administratorga murojaat qiling');
  }

  const [serviceCount, masterCount] = await Promise.all([
    Service.countDocuments({ salon: salon._id, isActive: true }),
    Master.countDocuments({ salon: salon._id, isActive: true }),
  ]);

  const issues = salonSubmitIssues({ salon, serviceCount, masterCount });
  if (issues.length) {
    throw ApiError.badRequest(
      'Salon tekshiruvga tayyor emas',
      ERROR_CODES.VALIDATION_ERROR,
      issues.map((message) => ({ field: 'salon', message })),
    );
  }

  salon.status = SALON_STATUS.PENDING;
  salon.rejectReason = null;
  await salon.save();

  return serializeOwnerSalon(salon);
}

// ── Salon rasmlari ──────────────────────────────────────────────

export async function uploadSalonImages(salon, files) {
  if (!files?.length) throw ApiError.badRequest('Rasm yuklanmadi');

  const current = salon.images?.length || 0;
  if (current + files.length > MAX_SALON_IMAGES) {
    throw ApiError.badRequest(
      `Salonga ko'pi bilan ${MAX_SALON_IMAGES} ta rasm yuklash mumkin (hozir ${current} ta)`,
    );
  }

  const names = await saveImages(files, { folder: 'salons', prefix: `salon-${salon._id}` });

  salon.images = [...(salon.images || []), ...names];
  // Birinchi rasm avtomatik muqova bo'ladi — egasi tanlashni unutmasin
  if (!salon.cover) salon.cover = names[0];
  await salon.save();

  return serializeOwnerSalon(salon);
}

export async function deleteSalonImage(salon, filename) {
  if (!(salon.images || []).includes(filename)) {
    throw ApiError.notFound('Rasm topilmadi');
  }

  salon.images = salon.images.filter((n) => n !== filename);
  if (salon.cover === filename) salon.cover = salon.images[0] ?? null;
  await salon.save();

  await removeImage('salons', filename);

  return serializeOwnerSalon(salon);
}

export async function setSalonCover(salon, filename) {
  if (!(salon.images || []).includes(filename)) {
    throw ApiError.badRequest('Avval rasmni yuklang');
  }

  salon.cover = filename;
  await salon.save();

  return serializeOwnerSalon(salon);
}

// ── Xizmatlar ───────────────────────────────────────────────────

export async function listServices(salonId) {
  const services = await Service.find({ salon: salonId })
    .sort({ order: 1, createdAt: 1 })
    .populate({ path: 'category', select: 'slug name.uz' })
    .lean();

  return services.map((s) => ({ ...serializeService(s), isActive: s.isActive, order: s.order }));
}

export async function createService(salon, data) {
  await assertCategories([data.category]);
  await assertMastersOfSalon(salon._id, data.masters);

  const service = await Service.create({ ...data, salon: salon._id });
  await recalcPrices(salon._id);

  const populated = await service.populate({ path: 'category', select: 'slug name.uz' });
  return { ...serializeService(populated.toObject()), isActive: service.isActive };
}

export async function updateService(salon, id, data) {
  const service = await Service.findOne({ _id: id, salon: salon._id });
  if (!service) throw ApiError.notFound('Xizmat topilmadi');

  if (data.category) await assertCategories([data.category]);
  if (data.masters) await assertMastersOfSalon(salon._id, data.masters);

  Object.assign(service, data);
  await service.save();
  await recalcPrices(salon._id);

  const populated = await service.populate({ path: 'category', select: 'slug name.uz' });
  return { ...serializeService(populated.toObject()), isActive: service.isActive };
}

/**
 * Xizmatni o'chirish xavfsiz: yozuvda xizmat SNAPSHOT ko'rinishida saqlanadi
 * (nom, narx, davomiylik), shuning uchun eski yozuvlar buzilmaydi.
 */
export async function deleteService(salon, id) {
  const service = await Service.findOneAndDelete({ _id: id, salon: salon._id });
  if (!service) throw ApiError.notFound('Xizmat topilmadi');

  await recalcPrices(salon._id);
  return { id: String(service._id) };
}

export async function reorderServices(salon, items) {
  const ids = items.map((i) => i.id);
  const count = await Service.countDocuments({ _id: { $in: ids }, salon: salon._id });
  if (count !== ids.length) throw ApiError.badRequest('Xizmat topilmadi');

  await Service.bulkWrite(
    items.map((i) => ({
      updateOne: { filter: { _id: i.id, salon: salon._id }, update: { $set: { order: i.order } } },
    })),
  );

  return listServices(salon._id);
}

// ── Mutaxassislar ───────────────────────────────────────────────

export async function listMasters(salonId) {
  const masters = await Master.find({ salon: salonId })
    .sort({ order: 1, createdAt: 1 })
    .populate({ path: 'specialties', select: 'slug name.uz' })
    .lean();

  return masters.map((m) => ({
    ...serializeMaster(m),
    isActive: m.isActive,
    order: m.order,
  }));
}

export async function createMaster(salon, data) {
  await assertCategories(data.specialties);

  const master = await Master.create({ ...data, salon: salon._id, isPrimary: false });
  return { ...serializeMasterCard(master.toObject()), isActive: master.isActive };
}

export async function updateMaster(salon, id, data) {
  const master = await Master.findOne({ _id: id, salon: salon._id });
  if (!master) throw ApiError.notFound('Mutaxassis topilmadi');

  if (data.specialties) await assertCategories(data.specialties);

  Object.assign(master, data);
  await master.save();

  return { ...serializeMasterCard(master.toObject()), isActive: master.isActive };
}

/**
 * O'chirishdan oldin kelgusi faol yozuvlar tekshiriladi.
 * Ustani o'chirish yozuvni "egasiz" qoldiradi va mijoz kelib qoladi —
 * shuning uchun 409 qaytariladi va `isActive: false` taklif qilinadi.
 */
export async function deleteMaster(salon, id) {
  const master = await Master.findOne({ _id: id, salon: salon._id });
  if (!master) throw ApiError.notFound('Mutaxassis topilmadi');

  if (master.isPrimary) {
    throw ApiError.badRequest(
      "Asosiy mutaxassisni o'chirib bo'lmaydi. Uning ismini tahrirlashingiz mumkin",
      ERROR_CODES.INVALID_STATUS,
    );
  }

  const activeBookings = await Booking.countDocuments({
    master: master._id,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    date: { $gte: todayStr() },
  });

  if (activeBookings) {
    throw ApiError.conflict(
      `Bu mutaxassisda ${activeBookings} ta kelgusi yozuv bor. O'chirish o'rniga uni "faol emas" qiling`,
      ERROR_CODES.HAS_ACTIVE_BOOKINGS,
    );
  }

  await Master.deleteOne({ _id: master._id });
  if (master.photo) await removeImage('masters', master.photo);

  return { id: String(master._id) };
}

export async function uploadMasterPhoto(salon, id, file) {
  if (!file) throw ApiError.badRequest('Rasm yuklanmadi');

  const master = await Master.findOne({ _id: id, salon: salon._id });
  if (!master) throw ApiError.notFound('Mutaxassis topilmadi');

  const oldPhoto = master.photo;
  master.photo = await saveImage(file.buffer, {
    folder: 'masters',
    prefix: `master-${master._id}`,
  });
  await master.save();

  // Eski surat bazadan uzilgandan keyin o'chiriladi — o'chirish yiqilsa ham
  // baza to'g'ri holatda qoladi (yetim fayl yetim yozuvdan yaxshi)
  if (oldPhoto) await removeImage('masters', oldPhoto);

  return { ...serializeMasterCard(master.toObject()), isActive: master.isActive };
}

export default {
  getMySalon,
  createSalon,
  updateSalon,
  submitSalon,
  uploadSalonImages,
  deleteSalonImage,
  setSalonCover,
  listServices,
  createService,
  updateService,
  deleteService,
  reorderServices,
  listMasters,
  createMaster,
  updateMaster,
  deleteMaster,
  uploadMasterPhoto,
};
