import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Payme Merchant API tranzaksiyasi.
 *
 * Idempotentlik majburiy: takroriy CreateTransaction / PerformTransaction /
 * CancelTransaction so'rovlariga BIRINCHI javobning aynan o'zi qaytarilishi kerak.
 * Shu sababli tranzaksiya bazada saqlanadi — xotirada emas.
 */
export const PAYME_STATE = {
  CREATED: 1, // yaratilgan, to'lov kutilmoqda
  PAID: 2, // to'langan
  CANCELLED: -1, // to'lashdan oldin bekor qilingan
  REFUNDED: -2, // to'langandan keyin bekor qilingan
};

const paymeTransactionSchema = new Schema(
  {
    paymeId: { type: String, required: true, unique: true }, // Payme tranzaksiya id
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },

    amount: { type: Number, required: true, min: 0 }, // ⚠️ TIYINDA: 5 000 so'm = 500000
    state: { type: Number, required: true, default: PAYME_STATE.CREATED },

    createTime: { type: Number, default: 0 }, // Payme timestamp (ms)
    performTime: { type: Number, default: 0 },
    cancelTime: { type: Number, default: 0 },
    reason: { type: Number, default: null },

    /** Nizo chiqsa yagona dalil. Saqlash arzon, keyin juda asqotadi */
    rawRequests: { type: [Object], default: [] },
  },
  { timestamps: true },
);

// Bitta bookingga bir vaqtda faqat bitta FAOL tranzaksiya bo'lishi kerak
// (Payme sandbox aynan shuni tekshiradi → -31008)
paymeTransactionSchema.index(
  { booking: 1 },
  {
    unique: true,
    partialFilterExpression: { state: PAYME_STATE.CREATED },
    name: 'uniq_active_payme_tx',
  },
);

export const PaymeTransaction = mongoose.model('PaymeTransaction', paymeTransactionSchema);
export default PaymeTransaction;
