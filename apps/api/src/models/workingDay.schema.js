import mongoose from 'mongoose';
import { MINUTES_IN_DAY } from '@gozal/shared/utils/time';

const { Schema } = mongoose;

/**
 * Bir hafta kunining ish vaqti.
 * Salon va Master ikkalasi ham shu sxemani ishlatadi:
 * ustaning o'z jadvali bo'lmasa (bo'sh massiv) — salonniki qo'llanadi.
 */
const breakSchema = new Schema(
  {
    startMin: { type: Number, required: true, min: 0, max: MINUTES_IN_DAY },
    endMin: { type: Number, required: true, min: 0, max: MINUTES_IN_DAY },
  },
  { _id: false },
);

// Hooklar `next` callback'isiz yozilgan: Mongoose 9 da callback uslubi olib
// tashlangan, `throw` esa 8 va 9 da bir xil ishlaydi.
breakSchema.pre('validate', function () {
  if (this.endMin <= this.startMin) {
    throw new Error("Tanaffus tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak");
  }
});

export const workingDaySchema = new Schema(
  {
    weekday: { type: Number, required: true, min: 0, max: 6 }, // 0 = Yakshanba
    isOpen: { type: Boolean, default: true },
    startMin: { type: Number, default: 540, min: 0, max: MINUTES_IN_DAY }, // 09:00
    endMin: { type: Number, default: 1140, min: 0, max: MINUTES_IN_DAY }, // 19:00
    breaks: { type: [breakSchema], default: [] },
  },
  { _id: false },
);

workingDaySchema.pre('validate', function () {
  if (!this.isOpen) return;

  if (this.endMin <= this.startMin) {
    throw new Error("Ish tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak");
  }

  for (const b of this.breaks || []) {
    if (b.startMin < this.startMin || b.endMin > this.endMin) {
      throw new Error("Tanaffus ish vaqti ichida bo'lishi kerak");
    }
  }
});

/** Yangi salon uchun standart hafta: Du–Sha 09:00–19:00, tanaffus 13:00–14:00, Yak yopiq */
export function defaultWeek() {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    isOpen: weekday !== 0,
    startMin: 540,
    endMin: 1140,
    breaks: weekday === 0 ? [] : [{ startMin: 780, endMin: 840 }],
  }));
}

export default workingDaySchema;
