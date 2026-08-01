import test from 'node:test';
import assert from 'node:assert/strict';

import { checkAuth } from '../services/payme/protocol.js';

/**
 * Xavfsizlik tekshiruvlari — topshirish shartining tegishli bandi uchun.
 * Marshrut himoyasi `routes/guards.test.js` da.
 */

// ── Payme avtorizatsiyasi ───────────────────────────────────────

test('bo\u2019sh kalit bilan hech kim kira olmaydi', () => {
  // .env to'ldirilmagan bo'lsa webhook OCHIQ qolib ketmasligi kerak
  const header = `Basic ${Buffer.from('Paycom:', 'utf8').toString('base64')}`;

  assert.equal(checkAuth(header, ''), false);
  assert.equal(checkAuth(header, undefined), false);
  assert.equal(checkAuth(header, null), false);
});

test('Basic bo\u2019lmagan sxema rad etiladi', () => {
  assert.equal(checkAuth('Bearer secret', 'secret'), false);
  assert.equal(checkAuth('secret', 'secret'), false);
});

// ── Parol siyosati ──────────────────────────────────────────────

test('parol hech qachon javobda qaytmaydi', async () => {
  const { User } = await import('../models/index.js');
  const path = User.schema.path('passwordHash');

  assert.ok(path, 'passwordHash maydoni yo\u2019q');
  // select: false — populate va lean so'rovlarida ham chiqmaydi
  assert.equal(path.options.select, false);
});

test('telefon unique — bir raqamga ikkita hisob ochilmaydi', async () => {
  const { User } = await import('../models/index.js');
  assert.equal(User.schema.path('phone').options.unique, true);
});
