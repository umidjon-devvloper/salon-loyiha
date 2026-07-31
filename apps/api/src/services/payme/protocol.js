/**
 * Payme Merchant API — JSON-RPC 2.0 protokoli.
 *
 * Bu fayl BAZAGA tegmaydi: xato formatlari, summa konvertatsiyasi va
 * vaqt tekshiruvlari toza funksiyalar sifatida turadi va testlanadi.
 * Payme sandbox aynan shu formatlarni belgi-belgi tekshiradi.
 */

/** ⚠️ Summa TIYINDA yuriladi. 5 000 so'm = 500 000 tiyin. Eng ko'p uchraydigan xato */
export const TIYIN = 100;

export const toTiyin = (sum) => Math.round(sum * TIYIN);
export const toSum = (tiyin) => Math.round(tiyin / TIYIN);

/**
 * Payme tranzaksiyani 12 soat ichida yakunlashi kerak.
 * Muddati o'tgan tranzaksiyani "perform" qilib bo'lmaydi — bu sandbox testi.
 */
export const TRANSACTION_TIMEOUT_MS = 12 * 60 * 60 * 1000;

export function isExpired(createTime, now = Date.now()) {
  return now - createTime > TRANSACTION_TIMEOUT_MS;
}

/** Bekor qilish sabablari (Payme belgilagan) */
export const CANCEL_REASON = {
  TIMEOUT: 4, // tranzaksiya muddati o'tdi
  REFUND: 5, // qaytarish
};

/**
 * Xato xabari UCH TILDA bo'lishi shart — Payme talabi.
 * Aks holda sandbox testidan o'tilmaydi.
 */
export const PAYME_ERRORS = {
  INVALID_AMOUNT: {
    code: -31001,
    message: {
      uz: "Summa noto'g'ri",
      ru: 'Неверная сумма',
      en: 'Invalid amount',
    },
  },
  TRANSACTION_NOT_FOUND: {
    code: -31003,
    message: {
      uz: 'Tranzaksiya topilmadi',
      ru: 'Транзакция не найдена',
      en: 'Transaction not found',
    },
  },
  CANNOT_PERFORM: {
    code: -31008,
    message: {
      uz: 'Amalni bajarib bolmaydi',
      ru: 'Невозможно выполнить операцию',
      en: 'Unable to perform operation',
    },
  },
  BOOKING_NOT_FOUND: {
    code: -31050,
    message: {
      uz: 'Yozuv topilmadi',
      ru: 'Заказ не найден',
      en: 'Order not found',
    },
  },
  BOOKING_EXPIRED: {
    code: -31051,
    message: {
      uz: "Yozuv muddati o'tdi, vaqt boshqa mijozga berildi",
      ru: 'Срок брони истёк, время передано другому клиенту',
      en: 'Booking expired, the slot was released',
    },
  },
  BOOKING_ALREADY_PAID: {
    code: -31052,
    message: {
      uz: "Yozuv allaqachon to'langan",
      ru: 'Заказ уже оплачен',
      en: 'Order already paid',
    },
  },
  BOOKING_CANCELLED: {
    code: -31053,
    message: {
      uz: 'Yozuv bekor qilingan',
      ru: 'Заказ отменён',
      en: 'Order is cancelled',
    },
  },
  INVALID_ACCOUNT: {
    code: -31054,
    message: {
      uz: "Yozuv raqami noto'g'ri",
      ru: 'Неверный номер заказа',
      en: 'Invalid order number',
    },
  },
  UNAUTHORIZED: {
    code: -32504,
    message: {
      uz: 'Avtorizatsiya xatosi',
      ru: 'Ошибка авторизации',
      en: 'Authorization error',
    },
  },
  PARSE_ERROR: {
    code: -32700,
    message: { uz: 'JSON xatosi', ru: 'Ошибка JSON', en: 'Parse error' },
  },
  METHOD_NOT_FOUND: {
    code: -32601,
    message: { uz: 'Metod topilmadi', ru: 'Метод не найден', en: 'Method not found' },
  },
  SYSTEM_ERROR: {
    code: -32400,
    message: { uz: 'Tizim xatosi', ru: 'Системная ошибка', en: 'System error' },
  },
};

export class PaymeError extends Error {
  constructor(error, data = null) {
    super(error.message.en);
    this.name = 'PaymeError';
    this.paymeCode = error.code;
    this.paymeMessage = error.message;
    this.data = data;
  }
}

export const paymeError = (error, data) => new PaymeError(error, data);

/** JSON-RPC javob konvertlari */
export function rpcResult(id, result) {
  return { jsonrpc: '2.0', id: id ?? null, result };
}

export function rpcError(id, error, data = null) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: {
      code: error.paymeCode ?? error.code,
      message: error.paymeMessage ?? error.message,
      ...(data || error.data ? { data: data ?? error.data } : {}),
    },
  };
}

/**
 * Basic auth: base64("Paycom:" + KEY).
 * Login har doim 'Paycom' — Payme shunday yuboradi.
 */
export function checkAuth(header, key) {
  if (!header || !header.startsWith('Basic ') || !key) return false;

  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  if (separator === -1) return false;

  const login = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);

  return login === 'Paycom' && password === key;
}

/** `account` maydonidan yozuv kodini olish: { booking_id: 'GA-4821' } */
export function accountCode(params, field = 'booking_id') {
  const value = params?.account?.[field];
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim().toUpperCase();
}

/**
 * Checkout URL: base64(m=...;ac.booking_id=...;a=<tiyin>;c=<return>)
 * Mijoz shu manzilga yo'naltiriladi va karta ma'lumotini Payme sahifasida kiritadi.
 */
export function checkoutUrl({ baseUrl, merchantId, accountField, code, amountTiyin, returnUrl }) {
  const parts = [
    `m=${merchantId}`,
    `ac.${accountField}=${code}`,
    `a=${amountTiyin}`,
    ...(returnUrl ? [`c=${returnUrl}`] : []),
  ];

  return `${baseUrl}/${Buffer.from(parts.join(';'), 'utf8').toString('base64')}`;
}

export default {
  toTiyin,
  toSum,
  isExpired,
  checkAuth,
  accountCode,
  checkoutUrl,
  rpcResult,
  rpcError,
  PAYME_ERRORS,
  PaymeError,
};
