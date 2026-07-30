import mongoose from 'mongoose';
import { workingDaySchema } from './workingDay.schema.js';

const { Schema } = mongoose;

const masterSchema = new Schema(
  {
    salon: { type: Schema.Types.ObjectId, ref: 'Salon', required: true },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    photo: { type: String, default: null },
    specialties: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    experienceYears: { type: Number, default: 0, min: 0, max: 60 },
    bio: { type: String, default: '', maxlength: 1000 },

    // Bo'sh bo'lsa — salonning ish vaqti ishlatiladi
    workingHours: { type: [workingDaySchema], default: [] },

    /**
     * Salon yaratilganda avtomatik yaratiladigan "asosiy usta".
     * Salonda ustalar bo'linmagan bo'lsa, hamma yozuv shunga tushadi —
     * booking logikasi har doim `master` ga bog'lanadi.
     */
    isPrimary: { type: Boolean, default: false },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

masterSchema.index({ salon: 1, isActive: 1, order: 1 });
masterSchema.index({ fullName: 'text' });

export const Master = mongoose.model('Master', masterSchema);
export default Master;
