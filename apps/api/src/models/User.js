import mongoose from 'mongoose';
import { ROLE_VALUES, ROLES, DEFAULT_CITY } from '../config/constants.js';

const { Schema } = mongoose;

/** Refresh token'lar hash ko'rinishida saqlanadi — o'g'irlansa ham ishlatib bo'lmaydi */
const refreshTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

/** Mobil ilova uchun push token (v1 da to'planadi, v2 da ishlatiladi) */
const pushTokenSchema = new Schema(
  {
    token: { type: String, required: true },
    platform: { type: String, enum: ['ios', 'android'], required: true },
    deviceId: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    // Login = telefon. Har doim '+998XXXXXXXXX' ko'rinishida normallashtirilgan
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },

    role: { type: String, enum: ROLE_VALUES, default: ROLES.CLIENT, index: true },

    avatar: { type: String, default: null },
    city: { type: String, default: DEFAULT_CITY },

    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },

    refreshTokens: { type: [refreshTokenSchema], default: [], select: false },
    pushTokens: { type: [pushTokenSchema], default: [], select: false },

    // Apple talabi: hisobni ilova ichidan o'chirish (DELETE /api/auth/me).
    // Foydalanuvchi anonimlashtiriladi, hujjat o'chirilmaydi — buxgalteriya uchun
    // yozuvlar va tranzaksiyalar saqlanib qolishi kerak.
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.refreshTokens;
        delete ret.pushTokens;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.index({ fullName: 'text' });

userSchema.virtual('isDeleted').get(function () {
  return this.deletedAt !== null;
});

export const User = mongoose.model('User', userSchema);
export default User;
