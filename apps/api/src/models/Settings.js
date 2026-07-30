import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Bitta hujjatli kolleksiya (`key: 'global'`).
 * Admin panelda tahrirlanadi — bozor reaksiyasiga qarab raqamlar o'zgaradi,
 * har safar kod o'zgartirilmasin.
 */
const settingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },

    bookingFee: {
      enabled: { type: Boolean, default: true },
      mode: { type: String, enum: ['fixed', 'percent'], default: 'fixed' },
      fixedAmount: { type: Number, default: 5000, min: 0 }, // ✅ QAROR: 5 000 so'm
      percent: { type: Number, default: 20, min: 0, max: 100 }, // hozir ishlatilmaydi
      minAmount: { type: Number, default: 3000, min: 0 },
      maxAmount: { type: Number, default: 50000, min: 0 },
    },

    /** To'lov kutilayotganda slot necha daqiqa ushlab turiladi */
    holdMinutes: { type: Number, default: 15, min: 1, max: 30 },

    topPrices: {
      week: { type: Number, default: 50000, min: 0 },
      month: { type: Number, default: 150000, min: 0 },
    },

    /** Bosh sahifadagi statik "maxsus takliflar" matni (v1 — aksiya tizimi yo'q) */
    promoText: { type: String, default: '' },
  },
  { timestamps: true },
);

/** Sozlamalarni olish — bo'lmasa standart qiymatlar bilan yaratiladi */
settingsSchema.statics.getGlobal = async function () {
  const existing = await this.findOne({ key: 'global' });
  if (existing) return existing;
  return this.create({ key: 'global' });
};

export const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
