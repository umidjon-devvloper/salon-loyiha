import test from 'node:test';
import assert from 'node:assert/strict';

import { compareVersions, isUpdateRequired } from './version.js';

test('teng versiyalar 0 qaytaradi', () => {
  assert.equal(compareVersions('1.0.0', '1.0.0'), 0);
  assert.equal(compareVersions('2.3.4', '2.3.4'), 0);
});

test('katta versiya 1, kichigi -1 qaytaradi', () => {
  assert.equal(compareVersions('1.1.0', '1.0.9'), 1);
  assert.equal(compareVersions('1.0.9', '1.1.0'), -1);
  assert.equal(compareVersions('2.0.0', '1.9.9'), 1);
});

test('⭐ ikki xonali raqam to\u2019g\u2019ri solishtiriladi', () => {
  // String solishtirishda '1.2.10' < '1.2.9' chiqadi — eng klassik xato
  assert.equal(compareVersions('1.2.10', '1.2.9'), 1);
  assert.equal(compareVersions('1.10.0', '1.9.0'), 1);
  assert.equal(compareVersions('10.0.0', '9.0.0'), 1);
});

test('turli uzunlikdagi versiyalar', () => {
  assert.equal(compareVersions('1.0', '1.0.0'), 0);
  assert.equal(compareVersions('1.0.1', '1.0'), 1);
  assert.equal(compareVersions('1', '1.0.1'), -1);
});

test('buzuq versiya ilovani bloklamaydi', () => {
  // Noto'g'ri qiymat kelsa 0 deb qaraladi, foydalanuvchi to'silmaydi
  assert.equal(compareVersions('1.0.0', 'abc'), 1);
  assert.doesNotThrow(() => compareVersions(undefined, '1.0.0'));
});

test('yangilanish faqat minVersion dan past bo\u2019lganda talab qilinadi', () => {
  assert.equal(isUpdateRequired('1.0.0', '1.2.0'), true);
  assert.equal(isUpdateRequired('1.2.0', '1.2.0'), false);
  assert.equal(isUpdateRequired('1.3.0', '1.2.0'), false);
});

test('minVersion bo\u2019lmasa hech kim to\u2019silmaydi', () => {
  assert.equal(isUpdateRequired('1.0.0', null), false);
  assert.equal(isUpdateRequired('1.0.0', undefined), false);
});
