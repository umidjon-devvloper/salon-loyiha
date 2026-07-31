import { Booking } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { createBooking } from './booking.service.js';
import { toHHMM, todayStr } from '@gozal/shared/utils/time';
import { BOOKING_STATUS, ACTIVE_BOOKING_STATUSES, ERROR_CODES } from '../config/constants.js';

/**
 * Salon egasi kabinetidagi yozuvlar.
 *
 * Mijoz javobidan farqi: bu yerda mijozning telefon raqami KO'RINADI —
 * egasi tasdiqlash uchun qo'ng'iroq qiladi (SMS yo'q).
 */

// ── Status o'tishlari (toza qoida, testlanadi) ──────────────────

/**
 * Qaysi holatdan qaysisiga o'tish mumkin.
 * Tugagan holatlar (`completed`, `cancelled`, `no_show`) — yakuniy:
 * ularni qaytarish tarixni buzadi va statistikani yolg'on qiladi.
 */
export const ALLOWED_TRANSITIONS = {
  awaiting_payment: ['cancelled'],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function canTransition(from, to) {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

// ── Ro'yxat ─────────────────────────────────────────────────────

function serializeOwnerBooking(booking) {
  const master = booking.master?._id ? booking.master : null;

  return {
    id: String(booking._id),
    code: booking.code,
    status: booking.status,
    source: booking.source,
    date: booking.date,
    start: toHHMM(booking.startMin),
    end: toHHMM(booking.endMin),
    startMin: booking.startMin,
    endMin: booking.endMin,
    totalPrice: booking.totalPrice,
    totalDuration: booking.totalDuration,
    items: booking.items.map((i) => ({
      name: i.name,
      price: i.price,
      durationMin: i.durationMin,
    })),
    // ⭐ Egasi shu raqamga qo'ng'iroq qiladi
    clientName: booking.clientName,
    clientPhone: booking.clientPhone,
    note: booking.note || '',
    cancelledBy: booking.cancelledBy ?? null,
    cancelReason: booking.cancelReason ?? null,
    confirmedAt: booking.confirmedAt ?? null,
    createdAt: booking.createdAt,
    master: master ? { id: String(master._id), fullName: master.fullName } : null,
  };
}

export async function listBookings(salon, { date, from, to, masterId, status }) {
  const filter = { salon: salon._id };

  if (date) filter.date = date;
  else if (from || to) filter.date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };

  if (masterId) filter.master = masterId;
  if (status) filter.status = status;

  const bookings = await Booking.find(filter)
    .sort({ date: 1, startMin: 1 })
    .limit(500)
    .populate({ path: 'master', select: 'fullName' })
    .lean();

  return bookings.map(serializeOwnerBooking);
}

export async function getBooking(salon, id) {
  const booking = await Booking.findOne({ _id: id, salon: salon._id })
    .populate({ path: 'master', select: 'fullName' })
    .lean();

  if (!booking) throw ApiError.notFound('Yozuv topilmadi');
  return serializeOwnerBooking(booking);
}

// ── Status o'zgartirish ─────────────────────────────────────────

const STATUS_LABEL = {
  awaiting_payment: "to'lov kutilmoqda",
  pending: 'kutilmoqda',
  confirmed: 'tasdiqlangan',
  completed: 'yakunlangan',
  cancelled: 'bekor qilingan',
  no_show: 'kelmadi',
};

export async function updateStatus(salon, id, { status, cancelReason }) {
  const booking = await Booking.findOne({ _id: id, salon: salon._id });
  if (!booking) throw ApiError.notFound('Yozuv topilmadi');

  if (booking.status === status) {
    throw ApiError.badRequest(
      `Yozuv allaqachon "${STATUS_LABEL[status]}" holatida`,
      ERROR_CODES.INVALID_STATUS,
    );
  }

  if (!canTransition(booking.status, status)) {
    throw ApiError.badRequest(
      `"${STATUS_LABEL[booking.status]}" holatidagi yozuvni "${STATUS_LABEL[status]}" qilib bo'lmaydi`,
      ERROR_CODES.INVALID_STATUS,
    );
  }

  // "Kelmadi" ni yozuv vaqti kelmasdan turib qo'yib bo'lmaydi
  if (status === BOOKING_STATUS.NO_SHOW && booking.date > todayStr()) {
    throw ApiError.badRequest(
      'Kelgusi yozuvni "kelmadi" deb belgilab bo\'lmaydi',
      ERROR_CODES.INVALID_STATUS,
    );
  }

  booking.status = status;

  if (status === BOOKING_STATUS.CONFIRMED) booking.confirmedAt = new Date();

  if (status === BOOKING_STATUS.CANCELLED) {
    booking.cancelledBy = 'owner';
    booking.cancelReason = cancelReason || null;
  }

  await booking.save();

  // Bekor qilinganda slot avtomatik bo'shaydi — partial index uni hisoblamaydi
  return getBooking(salon, id);
}

// ── Qo'lda yozuv ────────────────────────────────────────────────

/**
 * ⭐ Bu funksiyasiz platforma ishlamaydi.
 *
 * Salonlarning mijozlari hali ham asosan telefon qilib yoziladi. Egasi ularni
 * tizimga kiritmasa, jadval real bo'lmaydi va onlayn ko'rinayotgan bo'sh
 * slotlar yolg'on chiqadi — mijoz keladi, usta band.
 *
 * Farqlari:
 *  - `client: null`, `source: 'manual'` — mijozning akkaunti yo'q
 *  - lead time 0 — mijoz telefonda turibdi, "bir soatdan keyin" cheklovi ortiqcha
 *  - mijoz limitlari tekshirilmaydi (ular ro'yxatdan o'tgan mijoz uchun)
 *  - darhol `confirmed` — egasi o'zi kiritdi, o'ziga tasdiqlash kerak emas
 */
export async function createManualBooking(salon, data) {
  const booking = await createBooking({
    userId: null,
    source: 'manual',
    leadTimeMin: 0,
    status: BOOKING_STATUS.CONFIRMED,
    ...data,
  });

  return getBooking(salon, booking.id);
}

// ── Kabinet boshiga qisqa xulosa ────────────────────────────────

export async function todaySummary(salon) {
  const today = todayStr();

  const [total, pending, upcoming] = await Promise.all([
    Booking.countDocuments({ salon: salon._id, date: today }),
    Booking.countDocuments({ salon: salon._id, status: BOOKING_STATUS.PENDING }),
    Booking.countDocuments({
      salon: salon._id,
      date: { $gt: today },
      status: { $in: ACTIVE_BOOKING_STATUSES },
    }),
  ]);

  return { date: today, today: total, pending, upcoming };
}

export default {
  listBookings,
  getBooking,
  updateStatus,
  createManualBooking,
  todaySummary,
  canTransition,
};
