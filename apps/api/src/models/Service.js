import mongoose from 'mongoose';

const { Schema } = mongoose;

const serviceSchema = new Schema(
  {
    salon: { type: Schema.Types.ObjectId, ref: 'Salon', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },

    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 1000 },

    price: { type: Number, required: true, min: 0 }, // so'mda
    priceTo: { type: Number, default: null, min: 0 }, // narx oralig'i bo'lsa
    isPriceFrom: { type: Boolean, default: false }, // "100 000 so'mdan"

    // ⭐ Slot hisoblashning asosi
    durationMin: { type: Number, required: true, min: 10, max: 600 },
    bufferMin: { type: Number, default: 0, min: 0, max: 120 }, // tozalash vaqti

    // Bu xizmatni qaysi ustalar bajaradi. Bo'sh massiv = hammasi
    masters: [{ type: Schema.Types.ObjectId, ref: 'Master' }],

    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

serviceSchema.index({ salon: 1, isActive: 1, order: 1 });
serviceSchema.index({ name: 'text' });

serviceSchema.pre('validate', function () {
  if (this.priceTo !== null && this.priceTo !== undefined && this.priceTo <= this.price) {
    throw new Error('Yuqori narx quyi narxdan katta bo\'lishi kerak');
  }
});

export const Service = mongoose.model('Service', serviceSchema);
export default Service;
