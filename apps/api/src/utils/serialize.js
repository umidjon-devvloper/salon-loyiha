/**
 * Bazadagi hujjatni ochiq API javobiga aylantirish.
 *
 * Nima uchun kerak: `owner`, `__v`, ichki maydonlar mijozga chiqmasligi kerak.
 * Bir joyda turgani uchun yangi maydon qo'shilganda tasodifan sizib chiqmaydi.
 */
import { toHHMM } from '@gozal/shared/utils/time';

const img = (name, folder = 'salons') => (name ? `/uploads/${folder}/${name}` : null);

export function serializeCategory(c) {
  return {
    id: String(c._id),
    slug: c.slug,
    name: c.name?.uz ?? '',
    nameRu: c.name?.ru ?? '',
    icon: c.icon,
    order: c.order,
    salonCount: c.salonCount ?? undefined,
  };
}

export function serializeWorkingDay(d) {
  return {
    weekday: d.weekday,
    isOpen: d.isOpen,
    start: d.isOpen ? toHHMM(d.startMin) : null,
    end: d.isOpen ? toHHMM(d.endMin) : null,
    breaks: (d.breaks || []).map((b) => ({ start: toHHMM(b.startMin), end: toHHMM(b.endMin) })),
  };
}

/** Ro'yxatdagi kartochka uchun — yengil variant */
export function serializeSalonCard(s) {
  return {
    id: String(s._id),
    name: s.name,
    slug: s.slug,
    cover: img(s.cover),
    city: s.city,
    district: s.district,
    rating: s.rating,
    reviewCount: s.reviewCount,
    isTop: s.isTop,
    isVerified: s.isVerified,
    minPrice: s.minPrice,
    maxPrice: s.maxPrice,
    categories: (s.categories || []).map((c) =>
      typeof c === 'object' && c.name ? { slug: c.slug, name: c.name.uz } : String(c),
    ),
  };
}

/** To'liq profil */
export function serializeSalon(s) {
  return {
    ...serializeSalonCard(s),
    description: s.description,
    address: s.address,
    phone: s.phone,
    telegram: s.telegram,
    instagram: s.instagram,
    images: (s.images || []).map((n) => img(n)),
    workingHours: (s.workingHours || [])
      .slice()
      .sort((a, b) => a.weekday - b.weekday)
      .map(serializeWorkingDay),
  };
}

export function serializeMasterCard(m) {
  return {
    id: String(m._id),
    fullName: m.fullName,
    photo: img(m.photo, 'masters'),
    experienceYears: m.experienceYears,
    rating: m.rating,
    isPrimary: m.isPrimary,
    salon:
      m.salon && typeof m.salon === 'object'
        ? {
            id: String(m.salon._id),
            name: m.salon.name,
            slug: m.salon.slug,
            city: m.salon.city,
            district: m.salon.district,
          }
        : String(m.salon),
  };
}

export function serializeMaster(m) {
  return {
    ...serializeMasterCard(m),
    bio: m.bio,
    specialties: (m.specialties || []).map((c) =>
      typeof c === 'object' && c.name ? { slug: c.slug, name: c.name.uz } : String(c),
    ),
    // Bo'sh bo'lsa — salon jadvali ishlatiladi, buni frontend biladi
    hasOwnSchedule: Boolean(m.workingHours?.length),
    workingHours: (m.workingHours || [])
      .slice()
      .sort((a, b) => a.weekday - b.weekday)
      .map(serializeWorkingDay),
  };
}

export function serializeService(s) {
  return {
    id: String(s._id),
    name: s.name,
    description: s.description,
    price: s.price,
    priceTo: s.priceTo,
    isPriceFrom: s.isPriceFrom,
    durationMin: s.durationMin,
    category:
      s.category && typeof s.category === 'object' && s.category.name
        ? { id: String(s.category._id), slug: s.category.slug, name: s.category.name.uz }
        : String(s.category),
    // Bo'sh massiv = salondagi hamma usta bajaradi
    masters: (s.masters || []).map(String),
  };
}
