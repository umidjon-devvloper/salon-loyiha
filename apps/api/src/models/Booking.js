import mongoose from 'mongoose';
import { MINUTES_IN_DAY, isValidDateStr } from '@gozal/shared/utils/time';
import {
  BOOKING_STATUS,
  BOOKING_STATUS_VALUES,
  ACTIVE_BOOKING_STATUSES,
} from '../config/constants.js';

const { Schema } = mongoose;

/**
 * Xizmatlar SNAPSHOT ko'rinishida saqlanadi.
 * Salon keyin narxni oshirsa, eski yozuv o'zgarmasligi kerak.
 */
const bookingItemSchema = new Schema(
  {
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    durationMin: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const bookingFeeSchema = new Schema(
  {
    amount: { type: Number, default: 0, min: 0 }, // so'mda
    status: {
      type: String,
      enum: ['none', 'pending', 'paid', 'refunded', 'failed'],
      default: 'none',
    },
    method: { type: String, enum: ['payme', null], default: null },
    transactionId: { type: String, default: null },
    paidAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
  },
  { _id: false },
);

const bookingSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true }, // 'GA-4821'

    /**
     * Onlayn yozuvda — ro'yxatdan o'tgan mijoz.
     * Qo'lda yozuvda (`source: 'manual'`) mijozning akkaunti yo'q → `null`.
     * Aloqa uchun `clientName` va `clientPhone` har doim majburiy.
     */
    client: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    source: { type: String, enum: ['online', 'manual'], default: 'online' },

    salon: { type: Schema.Types.ObjectId, ref: 'Salon', required: true },
    master: { type: Schema.Types.ObjectId, ref: 'Master', required: true },

    items: {
      type: [bookingItemSchema],
      required: true,
      validate: [(v) => v.length > 0, 'Kamida bitta xizmat tanlanishi kerak'],
    },

    // ⚠️ Date obyekti EMAS — string sana + integer daqiqa
    date: {
      type: String,
      required: true,
      validate: [isValidDateStr, "Sana 'YYYY-MM-DD' ko'rinishida bo'lishi kerak"],
    },
    startMin: { type: Number, required: true, min: 0, max: MINUTES_IN_DAY },
    endMin: { type: Number, required: true, min: 0, max: MINUTES_IN_DAY },

    totalPrice: { type: Number, required: true, min: 0 },
    totalDuration: { type: Number, required: true, min: 1 },

    // SMS yo'q — salon egasi o'zi qo'ng'iroq qilib tasdiqlaydi
    clientName: { type: String, required: true, trim: true, maxlength: 100 },
    clientPhone: { type: String, required: true, trim: true },
    note: { type: String, default: '', maxlength: 500 },

    status: {
      type: String,
      enum: BOOKING_STATUS_VALUES,
      default: BOOKING_STATUS.PENDING,
    },
    cancelledBy: { type: String, enum: ['client', 'owner', 'admin', null], default: null },
    cancelReason: { type: String, default: null },
    confirmedAt: { type: Date, default: null },

    bookingFee: { type: bookingFeeSchema, default: () => ({}) },

    /** To'lov jarayonida slotni vaqtincha ushlab turish (awaiting_payment) */
    holdUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

bookingSchema.pre('validate', function () {
  if (this.endMin <= this.startMin) {
    throw new Error("Yozuv tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak");
  }
});

/**
 * ⭐ ENG MUHIM INDEKS — ustma-ust yozuvning ikkinchi qatlam himoyasi.
 *
 * Aynan bir sekundda kelgan ikki so'rovdan biri `11000` xatosi bilan qaytadi
 * → errorHandler uni `409 SLOT_TAKEN` ga aylantiradi.
 *
 * `partialFilterExpression` tufayli bekor qilingan yozuv slotni bo'shatadi.
 *
 * ⚠️ Bu indeks TURLI `startMin` li, lekin KESISHUVCHI intervallarni ushlamaydi
 * (14:00–15:30 va 14:15–15:00). Uni 1-qatlam — `POST /bookings` ichidagi qayta
 * hisoblash to'xtatadi. v1 hajmida yetarli; yuqori yuklamada tranzaksiya kerak.
 */
bookingSchema.index(
  { master: 1, date: 1, startMin: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ACTIVE_BOOKING_STATUSES } },
    name: 'uniq_active_slot',
  },
);

// Ortiqcha bir maydonli indekslar ataylab yo'q: quyidagi compound indekslar
// ularning prefiksi sifatida xizmat qiladi (kamroq indeks = tezroq yozuv).

// Salon egasi kabineti kalendari
bookingSchema.index({ master: 1, date: 1, status: 1 });
bookingSchema.index({ salon: 1, date: 1, status: 1 });
// Mijoz kabineti
bookingSchema.index({ client: 1, createdAt: -1 });
// Cron: autoComplete (o'tgan yozuvlarni yopish)
bookingSchema.index({ status: 1, date: 1 });
// Cron: expireHolds (to'lanmagan yozuvlarni bekor qilish)
bookingSchema.index({ status: 1, holdUntil: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
