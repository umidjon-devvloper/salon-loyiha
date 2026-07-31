import { Master, TimeOff, Booking } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { serializeWorkingDay } from '../utils/serialize.js';
import { toMin, toHHMM, todayStr, addDays } from '@gozal/shared/utils/time';
import { ACTIVE_BOOKING_STATUSES, ERROR_CODES } from '../config/constants.js';

/**
 * Ish vaqti va bloklangan kunlar.
 *
 * ⭐ Bu ikkisi butun booking dvijogining kirish ma'lumoti:
 * jadval bo'lmasa bo'sh slot ham bo'lmaydi. Shuning uchun bu yerdagi
 * xato xabarlari salon egasiga TUSHUNARLI bo'lishi kerak — u texnik odam emas.
 */

// ── Toza yordamchilar (testlanadi) ──────────────────────────────

/** 'HH:MM' li kunlarni bazadagi daqiqa ko'rinishiga o'giradi */
export function daysToMinutes(days) {
  return days
    .map((day) =>
      day.isOpen
        ? {
            weekday: day.weekday,
            isOpen: true,
            startMin: toMin(day.start),
            endMin: toMin(day.end),
            breaks: (day.breaks || []).map((b) => ({
              startMin: toMin(b.start),
              endMin: toMin(b.end),
            })),
          }
        : { weekday: day.weekday, isOpen: false, startMin: 540, endMin: 1140, breaks: [] },
    )
    .sort((a, b) => a.weekday - b.weekday);
}

/** Hamma kun yopiq jadval — salon katalogda ko'rinsa ham hech kim yozila olmaydi */
export function isAllClosed(days) {
  return days.every((day) => !day.isOpen);
}

// ── Jadval ──────────────────────────────────────────────────────

export async function getSchedule(salon, masterId = null) {
  if (!masterId) {
    return {
      target: 'salon',
      masterId: null,
      days: (salon.workingHours || []).map(serializeWorkingDay),
    };
  }

  const master = await Master.findOne({ _id: masterId, salon: salon._id }).lean();
  if (!master) throw ApiError.notFound('Mutaxassis topilmadi');

  return {
    target: 'master',
    masterId: String(master._id),
    // Bo'sh bo'lsa — usta salon jadvali bo'yicha ishlaydi
    hasOwnSchedule: Boolean(master.workingHours?.length),
    days: (master.workingHours?.length ? master.workingHours : salon.workingHours || []).map(
      serializeWorkingDay,
    ),
  };
}

export async function updateSchedule(salon, { target, masterId, days }) {
  const workingHours = daysToMinutes(days);

  if (isAllClosed(workingHours)) {
    throw ApiError.badRequest(
      "Kamida bitta ish kuni ochiq bo'lishi kerak, aks holda hech kim yozila olmaydi",
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  if (target === 'salon') {
    salon.workingHours = workingHours;
    await salon.save();
    return getSchedule(salon);
  }

  const master = await Master.findOne({ _id: masterId, salon: salon._id });
  if (!master) throw ApiError.notFound('Mutaxassis topilmadi');

  master.workingHours = workingHours;
  await master.save();

  return getSchedule(salon, master._id);
}

/** Ustaning shaxsiy jadvalini o'chirish → u salon jadvaliga qaytadi */
export async function resetMasterSchedule(salon, masterId) {
  const master = await Master.findOne({ _id: masterId, salon: salon._id });
  if (!master) throw ApiError.notFound('Mutaxassis topilmadi');

  master.workingHours = [];
  await master.save();

  return getSchedule(salon, master._id);
}

// ── Dam olish kunlari ───────────────────────────────────────────

function serializeTimeOff(timeOff) {
  return {
    id: String(timeOff._id),
    masterId: timeOff.master ? String(timeOff.master) : null,
    dateFrom: timeOff.dateFrom,
    dateTo: timeOff.dateTo,
    allDay: timeOff.allDay,
    start: timeOff.startMin === null ? null : toHHMM(timeOff.startMin),
    end: timeOff.endMin === null ? null : toHHMM(timeOff.endMin),
    reason: timeOff.reason || '',
  };
}

export async function listTimeOffs(salon, { from, to } = {}) {
  const filter = { salon: salon._id };

  // Standart oyna: bugundan 90 kun oldinga. O'tgan ta'tillar kerak emas
  const start = from || todayStr();
  const end = to || addDays(start, 90);

  filter.dateTo = { $gte: start };
  filter.dateFrom = { $lte: end };

  const items = await TimeOff.find(filter).sort({ dateFrom: 1 }).lean();
  return items.map(serializeTimeOff);
}

/**
 * ⚠️ Bloklanayotgan oraliqda faol yozuv bo'lsa — 409.
 *
 * Ularni avtomatik bekor qilish xavfli: mijozlar hech narsa bilmay salonga
 * kelib qoladi. Egasi avval kalendardan ularni ko'radi, mijozga qo'ng'iroq
 * qiladi va o'zi bekor qiladi.
 */
async function assertNoActiveBookings({ salonId, masterId, dateFrom, dateTo, startMin, endMin }) {
  const filter = {
    salon: salonId,
    date: { $gte: dateFrom, $lte: dateTo },
    status: { $in: ACTIVE_BOOKING_STATUSES },
  };

  if (masterId) filter.master = masterId;

  const bookings = await Booking.find(filter).select('date startMin endMin').lean();

  // Kun bo'yi emas bo'lsa — faqat kesishadigan yozuvlar to'sqinlik qiladi
  const blocking =
    startMin === undefined || startMin === null
      ? bookings
      : bookings.filter((b) => b.startMin < endMin && b.endMin > startMin);

  if (blocking.length) {
    throw ApiError.conflict(
      `Bu oraliqda ${blocking.length} ta faol yozuv bor. Avval ularni bekor qiling yoki mijozlarga qo'ng'iroq qiling`,
      ERROR_CODES.HAS_ACTIVE_BOOKINGS,
    );
  }
}

export async function createTimeOff(salon, data) {
  if (data.masterId) {
    const master = await Master.findOne({ _id: data.masterId, salon: salon._id }).select('_id');
    if (!master) throw ApiError.notFound('Mutaxassis topilmadi');
  }

  const startMin = data.allDay ? null : toMin(data.start);
  const endMin = data.allDay ? null : toMin(data.end);

  await assertNoActiveBookings({
    salonId: salon._id,
    masterId: data.masterId,
    dateFrom: data.dateFrom,
    dateTo: data.dateTo,
    startMin,
    endMin,
  });

  const timeOff = await TimeOff.create({
    salon: salon._id,
    master: data.masterId,
    dateFrom: data.dateFrom,
    dateTo: data.dateTo,
    allDay: data.allDay,
    startMin,
    endMin,
    reason: data.reason,
  });

  return serializeTimeOff(timeOff.toObject());
}

export async function deleteTimeOff(salon, id) {
  const timeOff = await TimeOff.findOneAndDelete({ _id: id, salon: salon._id });
  if (!timeOff) throw ApiError.notFound('Yozuv topilmadi');

  return { id: String(timeOff._id) };
}

export default {
  getSchedule,
  updateSchedule,
  resetMasterSchedule,
  listTimeOffs,
  createTimeOff,
  deleteTimeOff,
  daysToMinutes,
  isAllClosed,
};
