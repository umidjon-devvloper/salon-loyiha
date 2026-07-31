import { Booking, PaymeTransaction, PAYME_STATE } from '../../models/index.js';
import env from '../../config/env.js';
import { BOOKING_STATUS } from '../../config/constants.js';
import {
  PAYME_ERRORS,
  CANCEL_REASON,
  paymeError,
  accountCode,
  isExpired,
  toTiyin,
} from './protocol.js';

/**
 * Payme Merchant API — Payme BIZGA so'rov yuboradi, biz javob qaytaramiz.
 * Karta ma'lumoti bizga umuman tegmaydi (Subscribe API tanlanmagan sabab shu).
 *
 * ⭐ IDEMPOTENTLIK har bir metodda majburiy: takroriy so'rovga birinchi
 * javobning aynan o'zi qaytadi. Payme sandbox aynan shuni tekshiradi.
 */

/** Bookingni `account.booking_id` (kod) bo'yicha topadi */
async function findBooking(params) {
  const code = accountCode(params, env.PAYME_ACCOUNT_FIELD);
  if (!code) throw paymeError(PAYME_ERRORS.INVALID_ACCOUNT);

  const booking = await Booking.findOne({ code });
  if (!booking) throw paymeError(PAYME_ERRORS.BOOKING_NOT_FOUND);

  return booking;
}

/** Summa tiyinda keladi va yozuvdagi to'lov summasiga MOS bo'lishi shart */
function assertAmount(booking, amount) {
  const expected = toTiyin(booking.bookingFee?.amount || 0);
  if (Number(amount) !== expected) throw paymeError(PAYME_ERRORS.INVALID_AMOUNT);
}

/** To'lov qabul qilinishi mumkin bo'lgan yagona holat — awaiting_payment */
function assertPayable(booking) {
  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw paymeError(PAYME_ERRORS.BOOKING_CANCELLED);
  }

  if (booking.bookingFee?.status === 'paid') {
    throw paymeError(PAYME_ERRORS.BOOKING_ALREADY_PAID);
  }

  if (booking.status !== BOOKING_STATUS.AWAITING_PAYMENT) {
    throw paymeError(PAYME_ERRORS.CANNOT_PERFORM);
  }

  // Hold tugagan bo'lsa slot boshqa mijozga ochilgan — pul olib bo'lmaydi
  if (booking.holdUntil && booking.holdUntil.getTime() < Date.now()) {
    throw paymeError(PAYME_ERRORS.BOOKING_EXPIRED);
  }
}

async function logRequest(transaction, method, params) {
  // Nizo chiqsa yagona dalil shu. Saqlash arzon
  transaction.rawRequests.push({ method, params, at: new Date() });
  if (transaction.rawRequests.length > 50) {
    transaction.rawRequests = transaction.rawRequests.slice(-50);
  }
}

// ── 1. CheckPerformTransaction ──────────────────────────────────

export async function checkPerformTransaction(params) {
  const booking = await findBooking(params);
  assertAmount(booking, params.amount);
  assertPayable(booking);

  return { allow: true };
}

// ── 2. CreateTransaction ────────────────────────────────────────

export async function createTransaction(params) {
  const existing = await PaymeTransaction.findOne({ paymeId: params.id });

  // Takroriy so'rov — birinchi javobning aynan o'zi
  if (existing) {
    if (existing.state !== PAYME_STATE.CREATED) {
      throw paymeError(PAYME_ERRORS.CANNOT_PERFORM);
    }

    if (isExpired(existing.createTime)) {
      existing.state = PAYME_STATE.CANCELLED;
      existing.reason = CANCEL_REASON.TIMEOUT;
      existing.cancelTime = Date.now();
      await existing.save();
      throw paymeError(PAYME_ERRORS.CANNOT_PERFORM);
    }

    await logRequest(existing, 'CreateTransaction', params);
    await existing.save();

    return {
      create_time: existing.createTime,
      transaction: String(existing._id),
      state: existing.state,
    };
  }

  const booking = await findBooking(params);
  assertAmount(booking, params.amount);
  assertPayable(booking);

  // Bitta bookingga ikkita faol tranzaksiya bo'lmaydi — sandbox testi
  const active = await PaymeTransaction.findOne({
    booking: booking._id,
    state: PAYME_STATE.CREATED,
  });
  if (active) throw paymeError(PAYME_ERRORS.CANNOT_PERFORM);

  const createTime = params.time || Date.now();

  const transaction = await PaymeTransaction.create({
    paymeId: params.id,
    booking: booking._id,
    amount: params.amount,
    state: PAYME_STATE.CREATED,
    createTime,
    rawRequests: [{ method: 'CreateTransaction', params, at: new Date() }],
  });

  booking.bookingFee.status = 'pending';
  booking.bookingFee.method = 'payme';
  booking.bookingFee.transactionId = params.id;
  await booking.save();

  return {
    create_time: createTime,
    transaction: String(transaction._id),
    state: PAYME_STATE.CREATED,
  };
}

// ── 3. PerformTransaction ───────────────────────────────────────

export async function performTransaction(params) {
  const transaction = await PaymeTransaction.findOne({ paymeId: params.id });
  if (!transaction) throw paymeError(PAYME_ERRORS.TRANSACTION_NOT_FOUND);

  // Allaqachon to'langan — o'sha javobni qaytaramiz
  if (transaction.state === PAYME_STATE.PAID) {
    return {
      transaction: String(transaction._id),
      perform_time: transaction.performTime,
      state: transaction.state,
    };
  }

  if (transaction.state !== PAYME_STATE.CREATED) {
    throw paymeError(PAYME_ERRORS.CANNOT_PERFORM);
  }

  if (isExpired(transaction.createTime)) {
    transaction.state = PAYME_STATE.CANCELLED;
    transaction.reason = CANCEL_REASON.TIMEOUT;
    transaction.cancelTime = Date.now();
    await transaction.save();
    throw paymeError(PAYME_ERRORS.CANNOT_PERFORM);
  }

  const booking = await Booking.findById(transaction.booking);
  if (!booking) throw paymeError(PAYME_ERRORS.BOOKING_NOT_FOUND);

  const performTime = Date.now();

  transaction.state = PAYME_STATE.PAID;
  transaction.performTime = performTime;
  await logRequest(transaction, 'PerformTransaction', params);
  await transaction.save();

  // ⭐ To'lov tasdiqlandi: yozuv salon egasi kabinetiga tushadi
  booking.status = BOOKING_STATUS.PENDING;
  booking.bookingFee.status = 'paid';
  booking.bookingFee.paidAt = new Date();
  booking.holdUntil = null;
  await booking.save();

  return {
    transaction: String(transaction._id),
    perform_time: performTime,
    state: PAYME_STATE.PAID,
  };
}

// ── 4. CancelTransaction ────────────────────────────────────────

export async function cancelTransaction(params) {
  const transaction = await PaymeTransaction.findOne({ paymeId: params.id });
  if (!transaction) throw paymeError(PAYME_ERRORS.TRANSACTION_NOT_FOUND);

  // Allaqachon bekor qilingan — o'sha javob
  if (transaction.state < 0) {
    return {
      transaction: String(transaction._id),
      cancel_time: transaction.cancelTime,
      state: transaction.state,
    };
  }

  const cancelTime = Date.now();
  const paid = transaction.state === PAYME_STATE.PAID;

  transaction.state = paid ? PAYME_STATE.REFUNDED : PAYME_STATE.CANCELLED;
  transaction.cancelTime = cancelTime;
  transaction.reason = params.reason ?? null;
  await logRequest(transaction, 'CancelTransaction', params);
  await transaction.save();

  const booking = await Booking.findById(transaction.booking);

  if (booking) {
    booking.bookingFee.status = paid ? 'refunded' : 'failed';
    if (paid) booking.bookingFee.refundedAt = new Date();

    // To'lanmagan yozuv slotni ushlab turmasin
    if (booking.status === BOOKING_STATUS.AWAITING_PAYMENT) {
      booking.status = BOOKING_STATUS.CANCELLED;
      booking.cancelledBy = 'admin';
      booking.cancelReason = "To'lov amalga oshmadi";
      booking.holdUntil = null;
    }

    await booking.save();
  }

  return {
    transaction: String(transaction._id),
    cancel_time: cancelTime,
    state: transaction.state,
  };
}

// ── 5. CheckTransaction ─────────────────────────────────────────

export async function checkTransaction(params) {
  const transaction = await PaymeTransaction.findOne({ paymeId: params.id });
  if (!transaction) throw paymeError(PAYME_ERRORS.TRANSACTION_NOT_FOUND);

  return {
    create_time: transaction.createTime,
    perform_time: transaction.performTime,
    cancel_time: transaction.cancelTime,
    transaction: String(transaction._id),
    state: transaction.state,
    reason: transaction.reason,
  };
}

// ── 6. GetStatement ─────────────────────────────────────────────

export async function getStatement(params) {
  const transactions = await PaymeTransaction.find({
    createTime: { $gte: params.from, $lte: params.to },
  })
    .populate({ path: 'booking', select: 'code' })
    .lean();

  return {
    transactions: transactions.map((t) => ({
      id: t.paymeId,
      time: t.createTime,
      amount: t.amount,
      account: { [env.PAYME_ACCOUNT_FIELD]: t.booking?.code ?? null },
      create_time: t.createTime,
      perform_time: t.performTime,
      cancel_time: t.cancelTime,
      transaction: String(t._id),
      state: t.state,
      reason: t.reason,
    })),
  };
}

export const METHODS = {
  CheckPerformTransaction: checkPerformTransaction,
  CreateTransaction: createTransaction,
  PerformTransaction: performTransaction,
  CancelTransaction: cancelTransaction,
  CheckTransaction: checkTransaction,
  GetStatement: getStatement,
};

export default METHODS;
