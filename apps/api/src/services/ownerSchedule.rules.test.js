import test from 'node:test';
import assert from 'node:assert/strict';

import { daysToMinutes, isAllClosed } from './ownerSchedule.service.js';
import { canTransition, ALLOWED_TRANSITIONS } from './ownerBooking.service.js';

// ── Jadval konvertatsiyasi ──────────────────────────────────────

const openDay = (weekday, extra = {}) => ({
  weekday,
  isOpen: true,
  start: '09:00',
  end: '19:00',
  breaks: [],
  ...extra,
});

test("'HH:MM' daqiqaga aylanadi", () => {
  const [day] = daysToMinutes([openDay(1)]);
  assert.equal(day.startMin, 540);
  assert.equal(day.endMin, 1140);
});

test('tanaffuslar ham aylanadi', () => {
  const [day] = daysToMinutes([openDay(1, { breaks: [{ start: '13:00', end: '14:00' }] })]);
  assert.deepEqual(day.breaks, [{ startMin: 780, endMin: 840 }]);
});

test('yopiq kunda vaqt saqlanmaydi, lekin kun tushib qolmaydi', () => {
  const [day] = daysToMinutes([{ weekday: 0, isOpen: false }]);
  assert.equal(day.weekday, 0);
  assert.equal(day.isOpen, false);
  assert.deepEqual(day.breaks, []);
});

test('kunlar hafta tartibida saqlanadi', () => {
  const days = daysToMinutes([openDay(5), openDay(0), openDay(3)]);
  assert.deepEqual(
    days.map((d) => d.weekday),
    [0, 3, 5],
  );
});

test('hamma kun yopiq jadval aniqlanadi', () => {
  assert.equal(isAllClosed([{ isOpen: false }, { isOpen: false }]), true);
  assert.equal(isAllClosed([{ isOpen: false }, { isOpen: true }]), false);
});

// ── Status o'tishlari ───────────────────────────────────────────

test('kutilayotgan yozuv tasdiqlanadi yoki bekor qilinadi', () => {
  assert.equal(canTransition('pending', 'confirmed'), true);
  assert.equal(canTransition('pending', 'cancelled'), true);
  assert.equal(canTransition('pending', 'completed'), false);
  assert.equal(canTransition('pending', 'no_show'), false);
});

test('tasdiqlangan yozuv yakunlanadi, bekor bo\'ladi yoki "kelmadi" bo\'ladi', () => {
  assert.equal(canTransition('confirmed', 'completed'), true);
  assert.equal(canTransition('confirmed', 'no_show'), true);
  assert.equal(canTransition('confirmed', 'cancelled'), true);
});

test("yakuniy holatlardan qaytish yo'q", () => {
  for (const status of ['completed', 'cancelled', 'no_show']) {
    assert.deepEqual(ALLOWED_TRANSITIONS[status], [], `${status} dan qaytish ochiq qolgan`);
  }
});

test("to'lov kutilayotgan yozuvni faqat bekor qilish mumkin", () => {
  assert.deepEqual(ALLOWED_TRANSITIONS.awaiting_payment, ['cancelled']);
  assert.equal(canTransition('awaiting_payment', 'confirmed'), false);
});

test("noma'lum holat rad etiladi", () => {
  assert.equal(canTransition("yo'q-holat", 'confirmed'), false);
});
