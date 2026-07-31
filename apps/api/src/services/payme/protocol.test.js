import test from 'node:test';
import assert from 'node:assert/strict';

import {
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
  TRANSACTION_TIMEOUT_MS,
} from './protocol.js';
import { calcBookingFee } from '../bookingFee.js';

// ── Summa ───────────────────────────────────────────────────────

test('summa tiyinga aylanadi — eng ko\u2019p uchraydigan xato shu', () => {
  assert.equal(toTiyin(5000), 500_000);
  assert.equal(toTiyin(30_000), 3_000_000);
  assert.equal(toSum(500_000), 5000);
});

test('aylantirish teskari yo\u2019nalishda ham to\u2019g\u2019ri', () => {
  for (const sum of [1, 999, 5000, 123_456]) {
    assert.equal(toSum(toTiyin(sum)), sum);
  }
});

// ── Muddat ──────────────────────────────────────────────────────

test('12 soatdan oshgan tranzaksiya muddati o\u2019tgan hisoblanadi', () => {
  const now = Date.now();
  assert.equal(isExpired(now - 60_000, now), false);
  assert.equal(isExpired(now - TRANSACTION_TIMEOUT_MS + 1000, now), false);
  assert.equal(isExpired(now - TRANSACTION_TIMEOUT_MS - 1000, now), true);
});

// ── Avtorizatsiya ───────────────────────────────────────────────

const authHeader = (login, password) =>
  `Basic ${Buffer.from(`${login}:${password}`, 'utf8').toString('base64')}`;

test('to\u2019g\u2019ri kalit qabul qilinadi', () => {
  assert.equal(checkAuth(authHeader('Paycom', 'secret'), 'secret'), true);
});

test('noto\u2019g\u2019ri login yoki kalit rad etiladi', () => {
  assert.equal(checkAuth(authHeader('Paycom', 'wrong'), 'secret'), false);
  assert.equal(checkAuth(authHeader('admin', 'secret'), 'secret'), false);
  assert.equal(checkAuth('Basic ???', 'secret'), false);
  assert.equal(checkAuth(undefined, 'secret'), false);
  assert.equal(checkAuth(authHeader('Paycom', 'secret'), ''), false);
});

test('kalitda ikki nuqta bo\u2019lsa ham to\u2019g\u2019ri ajratiladi', () => {
  assert.equal(checkAuth(authHeader('Paycom', 'a:b:c'), 'a:b:c'), true);
});

// ── Account ─────────────────────────────────────────────────────

test('yozuv kodi account maydonidan olinadi', () => {
  assert.equal(accountCode({ account: { booking_id: 'ga-4821' } }), 'GA-4821');
  assert.equal(accountCode({ account: { booking_id: '  GA-4821 ' } }), 'GA-4821');
});

test('account bo\u2019sh bo\u2019lsa null qaytadi', () => {
  assert.equal(accountCode({}), null);
  assert.equal(accountCode({ account: {} }), null);
  assert.equal(accountCode({ account: { booking_id: '' } }), null);
  assert.equal(accountCode({ account: { booking_id: 42 } }), null);
});

// ── Checkout URL ────────────────────────────────────────────────

test('checkout URL base64 ichida summa TIYINDA bo\u2019ladi', () => {
  const url = checkoutUrl({
    baseUrl: 'https://checkout.paycom.uz',
    merchantId: 'M1',
    accountField: 'booking_id',
    code: 'GA-4821',
    amountTiyin: 500_000,
    returnUrl: 'https://gozal.uz/tasdiq',
  });

  const decoded = Buffer.from(url.split('/').pop(), 'base64').toString('utf8');

  assert.match(decoded, /m=M1/);
  assert.match(decoded, /ac\.booking_id=GA-4821/);
  assert.match(decoded, /a=500000/);
  assert.match(decoded, /c=https:\/\/gozal\.uz\/tasdiq/);
});

// ── JSON-RPC formati ────────────────────────────────────────────

test('muvaffaqiyatli javob JSON-RPC formatida', () => {
  assert.deepEqual(rpcResult(7, { allow: true }), {
    jsonrpc: '2.0',
    id: 7,
    result: { allow: true },
  });
});

test('xato javobi uch tilda bo\u2019ladi — Payme talabi', () => {
  const body = rpcError(7, new PaymeError(PAYME_ERRORS.BOOKING_NOT_FOUND));

  assert.equal(body.error.code, -31050);
  assert.deepEqual(Object.keys(body.error.message).sort(), ['en', 'ru', 'uz']);
});

test('barcha xato kodlari uch tilli va manfiy', () => {
  for (const [name, error] of Object.entries(PAYME_ERRORS)) {
    assert.ok(error.code < 0, `${name}: kod manfiy bo'lsin`);
    assert.deepEqual(
      Object.keys(error.message).sort(),
      ['en', 'ru', 'uz'],
      `${name}: til yetishmaydi`,
    );
  }
});

test('maxsus xatolar Payme ajratgan oraliqda', () => {
  const custom = [
    PAYME_ERRORS.BOOKING_NOT_FOUND,
    PAYME_ERRORS.BOOKING_EXPIRED,
    PAYME_ERRORS.BOOKING_ALREADY_PAID,
    PAYME_ERRORS.BOOKING_CANCELLED,
    PAYME_ERRORS.INVALID_ACCOUNT,
  ];

  for (const error of custom) {
    assert.ok(error.code <= -31050 && error.code >= -31099, `${error.code} oraliqdan chiqdi`);
  }
});

// ── Band qilish to'lovi ─────────────────────────────────────────

const fixed = { bookingFee: { enabled: true, mode: 'fixed', fixedAmount: 5000 } };

test('qat\u2019iy tarif xizmat narxiga bog\u2019liq emas', () => {
  assert.equal(calcBookingFee(fixed, 50_000), 5000);
  assert.equal(calcBookingFee(fixed, 500_000), 5000);
});

test('o\u2019chirilgan bo\u2019lsa to\u2019lov olinmaydi', () => {
  assert.equal(
    calcBookingFee({ bookingFee: { enabled: false, mode: 'fixed', fixedAmount: 5000 } }, 100_000),
    0,
  );
  assert.equal(calcBookingFee({}, 100_000), 0);
});

test('foiz rejimi min va max bilan cheklanadi', () => {
  const percent = {
    bookingFee: { enabled: true, mode: 'percent', percent: 20, minAmount: 3000, maxAmount: 50_000 },
  };

  assert.equal(calcBookingFee(percent, 100_000), 20_000);
  assert.equal(calcBookingFee(percent, 5000), 3000); // 1000 → min
  assert.equal(calcBookingFee(percent, 1_000_000), 50_000); // 200 000 → max
});
