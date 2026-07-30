import bcrypt from 'bcryptjs';
import { User, Booking } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES, ACTIVE_BOOKING_STATUSES, ROLES } from '../config/constants.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  expiryOf,
} from './token.service.js';

const BCRYPT_ROUNDS = 10;
const MAX_SESSIONS = 5; // bir foydalanuvchida ochiq sessiyalar chegarasi

// ── Ichki yordamchilar ──────────────────────────────────────────

function publicUser(user) {
  return {
    id: String(user._id),
    phone: user.phone,
    fullName: user.fullName,
    role: user.role,
    avatar: user.avatar,
    city: user.city,
  };
}

/** Eskirgan sessiyalarni tozalab, yangi refresh tokenni yozadi */
async function issueTokens(user, userAgent = '') {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const now = new Date();

  const kept = (user.refreshTokens || [])
    .filter((t) => t.expiresAt > now)
    .slice(-(MAX_SESSIONS - 1));

  user.refreshTokens = [
    ...kept,
    {
      tokenHash: hashToken(refreshToken),
      expiresAt: expiryOf(refreshToken),
      userAgent: String(userAgent).slice(0, 200),
      createdAt: now,
    },
  ];

  await user.save();
  return { user: publicUser(user), accessToken, refreshToken };
}

// ── Endpointlar uchun ───────────────────────────────────────────

export async function register({ phone, password, fullName, role, userAgent }) {
  const exists = await User.exists({ phone });
  if (exists) {
    throw ApiError.conflict(
      'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan',
      ERROR_CODES.PHONE_TAKEN,
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ phone, passwordHash, fullName, role });

  // `create` dan keyin select:false maydonlar hujjatda bor — qayta o'qish shart emas
  return issueTokens(user, userAgent);
}

export async function login({ phone, password, userAgent }) {
  const user = await User.findOne({ phone }).select('+passwordHash +refreshTokens');

  // Telefon topilmadi va parol xato — BIR XIL xabar.
  // Aks holda qaysi raqamlar ro'yxatdan o'tganini aniqlab olish mumkin.
  const invalid = ApiError.unauthorized(
    'Telefon raqam yoki parol noto\'g\'ri',
    ERROR_CODES.INVALID_CREDENTIALS,
  );

  if (!user || user.deletedAt) throw invalid;

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw invalid;

  if (!user.isActive) {
    throw ApiError.forbidden('Hisobingiz bloklangan. Administratorga murojaat qiling');
  }

  user.lastLoginAt = new Date();
  return issueTokens(user, userAgent);
}

/**
 * Refresh token ROTATSIYA qilinadi: eskisi darhol bekor bo'ladi.
 * O'g'irlangan token ikkinchi marta ishlamaydi.
 */
export async function refresh({ refreshToken, userAgent }) {
  const payload = verifyRefreshToken(refreshToken);

  const user = await User.findById(payload.sub).select('+refreshTokens');
  if (!user || !user.isActive || user.deletedAt) {
    throw ApiError.unauthorized('Sessiya yaroqsiz', ERROR_CODES.TOKEN_INVALID);
  }

  const hash = hashToken(refreshToken);
  const index = (user.refreshTokens || []).findIndex((t) => t.tokenHash === hash);

  if (index === -1) {
    // Token imzosi to'g'ri, lekin bazada yo'q → logout qilingan yoki qayta ishlatilmoqda
    throw ApiError.unauthorized('Sessiya yaroqsiz. Qaytadan kiring', ERROR_CODES.TOKEN_INVALID);
  }

  user.refreshTokens.splice(index, 1);
  return issueTokens(user, userAgent);
}

export async function logout({ userId, refreshToken }) {
  const user = await User.findById(userId).select('+refreshTokens');
  if (!user) return;

  if (refreshToken) {
    const hash = hashToken(refreshToken);
    user.refreshTokens = (user.refreshTokens || []).filter((t) => t.tokenHash !== hash);
  } else {
    user.refreshTokens = []; // token berilmasa — hamma qurilmadan chiqish
  }
  await user.save();
}

export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user || user.deletedAt) throw ApiError.notFound('Foydalanuvchi topilmadi');
  return publicUser(user);
}

export async function updateMe(userId, data) {
  const user = await User.findById(userId);
  if (!user || user.deletedAt) throw ApiError.notFound('Foydalanuvchi topilmadi');

  if (data.fullName !== undefined) user.fullName = data.fullName;
  if (data.city !== undefined) user.city = data.city;
  if (data.avatar !== undefined) user.avatar = data.avatar;

  await user.save();
  return publicUser(user);
}

/** Parol o'zgarganda BARCHA sessiyalar yopiladi */
export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash +refreshTokens');
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) {
    throw ApiError.badRequest('Joriy parol noto\'g\'ri', ERROR_CODES.INVALID_CREDENTIALS);
  }

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  user.refreshTokens = [];
  await user.save();
}

/** v1 da faqat saqlanadi — push yuborish v2 da */
export async function savePushToken(userId, { token, platform, deviceId }) {
  const user = await User.findById(userId).select('+pushTokens');
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');

  const list = (user.pushTokens || []).filter((t) => t.token !== token);
  list.push({ token, platform, deviceId, updatedAt: new Date() });
  user.pushTokens = list.slice(-5);

  await user.save();
}

/**
 * ⚠️ Apple App Store talabi: foydalanuvchi hisobini ilova ichidan o'chira olishi shart.
 *
 * Hujjat O'CHIRILMAYDI — anonimlashtiriladi. Sabab: yozuvlar va Payme
 * tranzaksiyalari buxgalteriya uchun saqlanishi kerak, ular esa `client` ga bog'langan.
 */
export async function deleteAccount(userId, { password }) {
  const user = await User.findById(userId).select('+passwordHash +refreshTokens +pushTokens');
  if (!user || user.deletedAt) throw ApiError.notFound('Foydalanuvchi topilmadi');

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw ApiError.badRequest('Parol noto\'g\'ri', ERROR_CODES.INVALID_CREDENTIALS);
  }

  if (user.role === ROLES.OWNER) {
    throw ApiError.badRequest(
      'Salon egasi hisobini o\'chirish uchun administratorga murojaat qiling',
      ERROR_CODES.FORBIDDEN,
    );
  }

  // Kelgusi faol yozuvlarni bekor qilamiz — salonlar bo'sh o'tirmasin
  await Booking.updateMany(
    { client: user._id, status: { $in: ACTIVE_BOOKING_STATUSES } },
    {
      $set: {
        status: 'cancelled',
        cancelledBy: 'client',
        cancelReason: 'Foydalanuvchi hisobini o\'chirdi',
      },
    },
  );

  const stamp = Date.now();
  user.phone = `deleted_${stamp}_${String(user._id).slice(-6)}`;
  user.fullName = 'O\'chirilgan foydalanuvchi';
  user.passwordHash = await bcrypt.hash(`deleted_${stamp}_${Math.random()}`, BCRYPT_ROUNDS);
  user.avatar = null;
  user.isActive = false;
  user.deletedAt = new Date();
  user.refreshTokens = [];
  user.pushTokens = [];

  await user.save();
}
