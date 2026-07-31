import { Salon, Master, Service, Booking, TimeOff } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { generateBookingCode } from '../utils/bookingCode.js';
import { computeDaySlots } from './schedule.service.js';
import { serializeService } from '../utils/serialize.js';
import {
  toMin,
  toHHMM,
  todayStr,
  nowMin,
  weekdayOf,
  addDays,
  monthBounds,
  diffDays,
} from '@gozal/shared/utils/time';
import {
  SLOT_STEP_MIN,
  MIN_LEAD_TIME_MIN,
  MAX_ADVANCE_DAYS,
  CANCEL_LIMIT_MIN,
  MAX_ACTIVE_BOOKINGS,
  ACTIVE_BOOKING_STATUSES,
  BOOKING_STATUS,
  SALON_STATUS,
  ERROR_CODES,
} from '../config/constants.js';

/** Kod takrorlanib qolsa necha marta qayta uriniladi */
const CODE_ATTEMPTS = 5;

/** Kun yopiq bo'lgan sabab uchun o'zbekcha matn */
const REASON_TEXT = {
  closed: 'Dam olish kuni',
  full: "Bu kunda bo'sh vaqt qolmadi",
  past: "O'tgan sana",
  timeoff: 'Salon bu kuni ishlamaydi',
};

function reasonText(reason) {
  if (!reason) return null;
  return REASON_TEXT[reason] || reason; // timeOff.reason ixtiyoriy matn bo'lishi mumkin
}

/**
 * Sana chegaralari. O'tgan sana va 60 kundan naridagi sana umuman
 * hisoblanmaydi — bazaga so'rov ham yubormaymiz.
 */
export function assertBookableDate(dateStr, today = todayStr()) {
  if (dateStr < today) {
    throw ApiError.badRequest("O'tgan sanaga yozilib bo'lmaydi", ERROR_CODES.INVALID_DATE);
  }

  if (diffDays(today, dateStr) > MAX_ADVANCE_DAYS) {
    throw ApiError.badRequest(
      `Ko'pi bilan ${MAX_ADVANCE_DAYS} kun oldin yozilish mumkin`,
      ERROR_CODES.INVALID_DATE,
    );
  }
}

/**
 * Usta, salon va xizmatlarni bir marta yuklaydi va tekshiradi.
 * Availability ham, band qilish ham AYNI shu tekshiruvdan o'tadi —
 * ikki joyda ikki xil qoida bo'lib qolmasin.
 */
async function loadContext({ masterId, serviceIds }) {
  const master = await Master.findOne({ _id: masterId, isActive: true }).lean();
  if (!master) throw ApiError.notFound('Mutaxassis topilmadi');

  const salon = await Salon.findOne({ _id: master.salon, status: SALON_STATUS.ACTIVE }).lean();
  if (!salon) throw ApiError.notFound('Salon topilmadi');

  const services = await Service.find({
    _id: { $in: serviceIds },
    salon: salon._id,
    isActive: true,
  }).lean();

  if (services.length !== serviceIds.length) {
    throw ApiError.badRequest(
      'Tanlangan xizmat topilmadi yoki bu salonga tegishli emas',
      ERROR_CODES.INVALID_SERVICE,
    );
  }

  // Xizmat aynan shu ustaga biriktirilganmi? Bo'sh massiv = hamma usta bajaradi
  const notAllowed = services.find(
    (s) => s.masters?.length && !s.masters.some((m) => String(m) === String(master._id)),
  );

  if (notAllowed) {
    throw ApiError.badRequest(
      `"${notAllowed.name}" xizmatini bu mutaxassis bajarmaydi`,
      ERROR_CODES.INVALID_SERVICE,
    );
  }

  // bufferMin — xizmatdan keyingi tozalash vaqti, davomiylikka qo'shiladi
  const totalDuration = services.reduce((sum, s) => sum + s.durationMin + (s.bufferMin || 0), 0);
  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

  return { master, salon, services, totalDuration, totalPrice };
}

/**
 * Bugungi kun uchun eng erta ruxsat etilgan vaqt: hozir + lead time.
 *
 * Onlayn mijoz uchun lead time 60 daqiqa — salon egasi tayyorlanishi kerak.
 * Qo'lda yozuvda esa 0: mijoz allaqachon telefonda turibdi va "yarim soatdan
 * keyin kelaman" deydi. Bunga "iloji yo'q" deb bo'lmaydi.
 */
function earliestOf(dateStr, today, now, leadTimeMin = MIN_LEAD_TIME_MIN) {
  return dateStr === today ? now + leadTimeMin : 0;
}

// ── Bo'sh vaqtlar ───────────────────────────────────────────────

export async function getAvailableSlots({
  masterId,
  dateStr,
  serviceIds,
  leadTimeMin = MIN_LEAD_TIME_MIN,
}) {
  const today = todayStr();
  assertBookableDate(dateStr, today);

  const { master, salon, totalDuration } = await loadContext({ masterId, serviceIds });

  const [timeOffs, bookings] = await Promise.all([
    TimeOff.find({
      salon: salon._id,
      $or: [{ master: master._id }, { master: null }], // master: null = butun salon yopiq
      dateFrom: { $lte: dateStr },
      dateTo: { $gte: dateStr },
    }).lean(),

    Booking.find({
      master: master._id,
      date: dateStr,
      status: { $in: ACTIVE_BOOKING_STATUSES },
    })
      .select('startMin endMin')
      .lean(),
  ]);

  const result = computeDaySlots({
    salon,
    master,
    dateStr,
    weekday: weekdayOf(dateStr),
    timeOffs,
    bookings,
    totalDuration,
    step: SLOT_STEP_MIN,
    earliest: earliestOf(dateStr, today, nowMin(), leadTimeMin),
  });

  const source = master.workingHours?.length ? master.workingHours : salon.workingHours;
  const day = source.find((d) => d.weekday === weekdayOf(dateStr));

  return {
    date: dateStr,
    weekday: weekdayOf(dateStr),
    isWorkingDay: result.isWorkingDay,
    reason: reasonText(result.reason),
    totalDuration,
    workingHours: day?.isOpen
      ? {
          start: toHHMM(day.startMin),
          end: toHHMM(day.endMin),
          breaks: (day.breaks || []).map((b) => ({
            start: toHHMM(b.startMin),
            end: toHHMM(b.endMin),
          })),
        }
      : null,
    slots: result.slots.map((startMin) => ({
      startMin,
      start: toHHMM(startMin),
      end: toHHMM(startMin + totalDuration),
    })),
  };
}

/**
 * Kalendar uchun bir oy.
 *
 * ⚠️ Har kun uchun alohida so'rov = 30 ta DB so'rovi. Bu yerda hamma yozuv
 * va timeOff BIR MARTA olinadi va xotirada guruhlanadi — jami 5 ta so'rov.
 */
export async function getMonthAvailability({ masterId, month, serviceIds }) {
  const { master, salon, totalDuration } = await loadContext({ masterId, serviceIds });

  const { first, last, days: dayCount } = monthBounds(month);

  const [bookings, timeOffs] = await Promise.all([
    Booking.find({
      master: master._id,
      date: { $gte: first, $lte: last },
      status: { $in: ACTIVE_BOOKING_STATUSES },
    })
      .select('date startMin endMin')
      .lean(),

    TimeOff.find({
      salon: salon._id,
      $or: [{ master: master._id }, { master: null }],
      dateFrom: { $lte: last },
      dateTo: { $gte: first },
    }).lean(),
  ]);

  const byDate = new Map();
  for (const booking of bookings) {
    if (!byDate.has(booking.date)) byDate.set(booking.date, []);
    byDate.get(booking.date).push(booking);
  }

  const today = todayStr();
  const now = nowMin();
  const days = {};

  for (let i = 0; i < dayCount; i++) {
    const dateStr = addDays(first, i);

    if (dateStr < today) {
      days[dateStr] = { available: false, reason: reasonText('past') };
      continue;
    }

    if (diffDays(today, dateStr) > MAX_ADVANCE_DAYS) {
      days[dateStr] = { available: false, reason: 'Hali ochilmagan' };
      continue;
    }

    const result = computeDaySlots({
      salon,
      master,
      dateStr,
      weekday: weekdayOf(dateStr),
      timeOffs,
      bookings: byDate.get(dateStr) || [],
      totalDuration,
      step: SLOT_STEP_MIN,
      earliest: earliestOf(dateStr, today, now),
    });

    days[dateStr] = result.slots.length
      ? { available: true, slotCount: result.slots.length }
      : { available: false, reason: reasonText(result.reason) };
  }

  return { month, totalDuration, days };
}

// ── Yozuv yaratish ──────────────────────────────────────────────

/**
 * ⭐ Ikki qatlamli himoya:
 *   1. Slot SHU YERDA qaytadan hisoblanadi — frontenddan kelgan `startTime` ga
 *      ishonilmaydi, chunki mijoz slotni ko'rgandan keyin uni boshqa kishi
 *      band qilib ulgurgan bo'lishi mumkin
 *   2. Unique partial index — aynan bir sekundda kelgan ikki so'rovdan birini
 *      baza rad etadi (`11000` → `409 SLOT_TAKEN`)
 *
 * ⚠️ v1 da to'lov yo'q, yozuv to'g'ridan-to'g'ri `pending` bo'ladi.
 * Payme (5-hafta) qo'shilganda bu `awaiting_payment` + `holdUntil` ga o'zgaradi.
 */
export async function createBooking({
  userId = null,
  source = 'online',
  masterId,
  serviceIds,
  date,
  startTime,
  clientName,
  clientPhone,
  note = '',
  leadTimeMin = MIN_LEAD_TIME_MIN,
  status = BOOKING_STATUS.PENDING,
}) {
  const startMin = toMin(startTime);
  const today = todayStr();

  assertBookableDate(date, today);

  const { master, salon, services, totalDuration, totalPrice } = await loadContext({
    masterId,
    serviceIds,
  });

  if (userId) {
    await assertClientLimits({ userId, salonId: salon._id, date });
  }

  // ── 1-qatlam
  const availability = await getAvailableSlots({
    masterId,
    dateStr: date,
    serviceIds,
    leadTimeMin,
  });

  if (!availability.isWorkingDay) {
    throw ApiError.conflict(availability.reason || 'Bu kun ish kuni emas', ERROR_CODES.SLOT_TAKEN);
  }

  if (!availability.slots.some((slot) => slot.startMin === startMin)) {
    throw ApiError.conflict(
      'Kechirasiz, bu vaqt allaqachon band qilingan. Boshqa vaqtni tanlang',
      ERROR_CODES.SLOT_TAKEN,
    );
  }

  const doc = {
    client: userId,
    source,
    salon: salon._id,
    master: master._id,
    items: services.map((s) => ({
      service: s._id,
      name: s.name,
      price: s.price,
      durationMin: s.durationMin,
    })),
    date,
    startMin,
    endMin: startMin + totalDuration,
    totalPrice,
    totalDuration,
    clientName,
    clientPhone,
    note,
    status,
    confirmedAt: status === BOOKING_STATUS.CONFIRMED ? new Date() : null,
  };

  // ── 2-qatlam
  // ⚠️ Bu yerda 11000 IKKI sababdan chiqadi: slot band (uniq_active_slot) yoki
  // kod takrorlandi. Ikkinchisi foydalanuvchi xatosi emas — jim qayta urinamiz.
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
    try {
      const booking = await Booking.create({ ...doc, code: generateBookingCode() });
      await Salon.updateOne({ _id: salon._id }, { $inc: { bookingCount: 1 } });
      return serializeBooking(booking.toObject(), { salon, master });
    } catch (err) {
      if (err.code !== 11000) throw err;

      const duplicatedCode = Boolean(err.keyPattern?.code || err.keyValue?.code);
      if (!duplicatedCode) {
        throw ApiError.conflict(
          'Kechirasiz, bu vaqtni sizdan oldin band qilishdi',
          ERROR_CODES.SLOT_TAKEN,
        );
      }
    }
  }

  throw ApiError.internal("Yozuv kodini yaratib bo'lmadi. Qayta urinib ko'ring");
}

/** Spam va tasodifiy takroriy yozuvlardan himoya */
async function assertClientLimits({ userId, salonId, date }) {
  const [sameDay, activeTotal] = await Promise.all([
    Booking.countDocuments({
      client: userId,
      salon: salonId,
      date,
      status: { $in: ACTIVE_BOOKING_STATUSES },
    }),
    Booking.countDocuments({
      client: userId,
      status: { $in: ACTIVE_BOOKING_STATUSES },
      date: { $gte: todayStr() },
    }),
  ]);

  if (sameDay) {
    throw ApiError.conflict(
      'Shu kunda shu salonda yozuvingiz bor. Avval uni bekor qiling',
      ERROR_CODES.DUPLICATE_BOOKING,
    );
  }

  if (activeTotal >= MAX_ACTIVE_BOOKINGS) {
    throw ApiError.tooMany(
      `Bir vaqtda ko'pi bilan ${MAX_ACTIVE_BOOKINGS} ta faol yozuv bo'lishi mumkin`,
      ERROR_CODES.TOO_MANY_ACTIVE,
    );
  }
}

// ── Mijoz kabineti ──────────────────────────────────────────────

export function serializeBooking(booking, { salon, master } = {}) {
  const salonDoc = booking.salon?._id ? booking.salon : salon;
  const masterDoc = booking.master?._id ? booking.master : master;

  return {
    id: String(booking._id),
    code: booking.code,
    status: booking.status,
    date: booking.date,
    start: toHHMM(booking.startMin),
    end: toHHMM(booking.endMin),
    startMin: booking.startMin,
    totalPrice: booking.totalPrice,
    totalDuration: booking.totalDuration,
    items: booking.items.map((i) => ({
      name: i.name,
      price: i.price,
      durationMin: i.durationMin,
    })),
    clientName: booking.clientName,
    clientPhone: booking.clientPhone,
    note: booking.note || '',
    cancelReason: booking.cancelReason ?? null,
    createdAt: booking.createdAt,
    salon: salonDoc
      ? {
          id: String(salonDoc._id),
          name: salonDoc.name,
          slug: salonDoc.slug,
          phone: salonDoc.phone,
          district: salonDoc.district,
          address: salonDoc.address ?? '',
        }
      : null,
    master: masterDoc ? { id: String(masterDoc._id), fullName: masterDoc.fullName } : null,
  };
}

export async function listMyBookings({ userId, upcoming, status }) {
  const filter = { client: userId };

  if (status) filter.status = status;
  if (upcoming) {
    filter.date = { $gte: todayStr() };
    filter.status = { $in: ACTIVE_BOOKING_STATUSES };
  }

  const bookings = await Booking.find(filter)
    .sort(upcoming ? { date: 1, startMin: 1 } : { date: -1, startMin: -1 })
    .limit(100)
    .populate({ path: 'salon', select: 'name slug phone district address' })
    .populate({ path: 'master', select: 'fullName' })
    .lean();

  return bookings.map((b) => serializeBooking(b));
}

export async function getMyBooking({ userId, id }) {
  const booking = await Booking.findOne({ _id: id, client: userId })
    .populate({ path: 'salon', select: 'name slug phone district address' })
    .populate({ path: 'master', select: 'fullName' })
    .lean();

  if (!booking) throw ApiError.notFound('Yozuv topilmadi');
  return serializeBooking(booking);
}

/**
 * Mijoz o'zi bekor qiladi.
 * Boshlanishiga 2 soatdan kam qolganda bekor qilib bo'lmaydi: usta o'sha vaqtga
 * boshqa mijozni ololmaydi va kuni buziladi. Bunday holatda salonga qo'ng'iroq.
 */
export async function cancelByClient({ userId, id, reason = '' }) {
  const booking = await Booking.findOne({ _id: id, client: userId });
  if (!booking) throw ApiError.notFound('Yozuv topilmadi');

  if (!ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
    throw ApiError.badRequest("Bu yozuvni bekor qilib bo'lmaydi", ERROR_CODES.INVALID_STATUS);
  }

  const today = todayStr();

  if (booking.date < today) {
    throw ApiError.badRequest("O'tgan yozuvni bekor qilib bo'lmaydi", ERROR_CODES.TOO_LATE);
  }

  if (booking.date === today && booking.startMin - nowMin() < CANCEL_LIMIT_MIN) {
    throw ApiError.badRequest(
      "Boshlanishiga 2 soatdan kam qoldi. Bekor qilish uchun salonga qo'ng'iroq qiling",
      ERROR_CODES.TOO_LATE,
    );
  }

  booking.status = BOOKING_STATUS.CANCELLED;
  booking.cancelledBy = 'client';
  booking.cancelReason = reason || null;
  await booking.save();

  // Slot avtomatik bo'shaydi — partial index 'cancelled' ni hisoblamaydi
  return getMyBooking({ userId, id });
}

export default {
  getAvailableSlots,
  getMonthAvailability,
  createBooking,
  listMyBookings,
  getMyBooking,
  cancelByClient,
  serializeBooking,
  serializeService,
};
