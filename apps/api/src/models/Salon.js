import mongoose from 'mongoose';
import { SALON_STATUS, SALON_STATUS_VALUES, DEFAULT_CITY } from '../config/constants.js';
import { workingDaySchema, defaultWeek } from './workingDay.schema.js';

const { Schema } = mongoose;

const salonSchema = new Schema(
  {
    // v1: bir egaga bitta salon → unique
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '', maxlength: 2000 },

    categories: [{ type: Schema.Types.ObjectId, ref: 'Category', index: true }],

    city: { type: String, required: true, default: DEFAULT_CITY },
    district: { type: String, required: true },
    address: { type: String, default: '', maxlength: 300 },
    phone: { type: String, required: true },
    telegram: { type: String, default: null },
    instagram: { type: String, default: null },

    cover: { type: String, default: null },
    images: [{ type: String }],

    workingHours: { type: [workingDaySchema], default: defaultWeek },

    // Narx filtri uchun keshlanadi — xizmat qo'shilganda/o'zgarganda qayta hisoblanadi
    minPrice: { type: Number, default: 0, index: true },
    maxPrice: { type: Number, default: 0 },

    // v1: admin qo'lda kiritadi. Sharh tizimi v2 da
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },

    isTop: { type: Boolean, default: false },
    topUntil: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },

    status: {
      type: String,
      enum: SALON_STATUS_VALUES,
      default: SALON_STATUS.DRAFT,
    },
    rejectReason: { type: String, default: null },

    bookingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Katalog saralashi: sort=top → isTop, rating, createdAt
salonSchema.index({ status: 1, isTop: -1, rating: -1, createdAt: -1 });
// Filtr: shahar + tuman + kategoriya
salonSchema.index({ status: 1, city: 1, district: 1 });
// Qidiruv
salonSchema.index({ name: 'text', description: 'text' });
// expireTop cron
salonSchema.index({ isTop: 1, topUntil: 1 });

export const Salon = mongoose.model('Salon', salonSchema);
export default Salon;
