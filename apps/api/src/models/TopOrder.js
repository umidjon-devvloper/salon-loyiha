import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * TOP e'lon yozuvi.
 * v1 da faqat LOG uchun — admin qo'lda yoqadi, pul platformadan tashqarida olinadi.
 * v2 da Payme qo'shilganda struktura o'zgarmaydi:
 * faqat `paymentMethod: 'payme'` va `transactionId` to'ldiriladi.
 */
const topOrderSchema = new Schema(
  {
    salon: { type: Schema.Types.ObjectId, ref: 'Salon', required: true },
    plan: { type: String, enum: ['week', 'month'], required: true },
    days: { type: Number, required: true, min: 1 }, // 7 yoki 30
    amount: { type: Number, required: true, min: 0 }, // so'mda

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },

    paymentMethod: { type: String, enum: ['manual', 'payme'], default: 'manual' },
    paymentStatus: { type: String, enum: ['paid', 'pending', 'failed'], default: 'paid' },
    transactionId: { type: String, default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }, // admin
    note: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: true },
);

topOrderSchema.index({ salon: 1, createdAt: -1 });

export const TopOrder = mongoose.model('TopOrder', topOrderSchema);
export default TopOrder;
