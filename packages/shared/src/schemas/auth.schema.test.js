import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  registerSchema,
  loginSchema,
  updateMeSchema,
  changePasswordSchema,
  pushTokenSchema,
} from './auth.schema.js';

const firstError = (result) => result.error.issues[0].message;

describe('registerSchema', () => {
  test('telefon har xil ko\'rinishda kelsa ham normallashadi', () => {
    for (const phone of ['901234567', '90 123 45 67', '+998901234567', '+998 (90) 123-45-67']) {
      const r = registerSchema.safeParse({ phone, password: 'parol123', fullName: 'Dildora' });
      assert.ok(r.success, `${phone} qabul qilinishi kerak`);
      assert.equal(r.data.phone, '+998901234567');
    }
  });

  test('rol berilmasa client bo\'ladi', () => {
    const r = registerSchema.parse({ phone: '901234567', password: 'parol123', fullName: 'Dildora' });
    assert.equal(r.role, 'client');
  });

  test('owner rolini tanlash mumkin', () => {
    const r = registerSchema.parse({
      phone: '901234567',
      password: 'parol123',
      fullName: 'Dildora',
      role: 'owner',
    });
    assert.equal(r.role, 'owner');
  });

  test('⭐ admin rolini ro\'yxatdan o\'tishda tanlab BO\'LMAYDI', () => {
    const r = registerSchema.safeParse({
      phone: '901234567',
      password: 'parol123',
      fullName: 'Dildora',
      role: 'admin',
    });
    assert.equal(r.success, false);
  });

  test('noto\'g\'ri telefon rad etiladi', () => {
    for (const phone of ['12345', '+79001234567', '', 'telefon']) {
      assert.equal(registerSchema.safeParse({ phone, password: 'parol123', fullName: 'A B' }).success, false);
    }
  });

  test('qisqa parol rad etiladi, xabari o\'zbekcha', () => {
    const r = registerSchema.safeParse({ phone: '901234567', password: '123', fullName: 'Dildora' });
    assert.equal(r.success, false);
    assert.match(firstError(r), /kamida 6 belgi/);
  });

  test('ism trim qilinadi', () => {
    const r = registerSchema.parse({ phone: '901234567', password: 'parol123', fullName: '  Dildora  ' });
    assert.equal(r.fullName, 'Dildora');
  });
});

describe('loginSchema', () => {
  test('telefon normallashadi', () => {
    const r = loginSchema.parse({ phone: '90 123 45 67', password: 'x' });
    assert.equal(r.phone, '+998901234567');
  });

  test('login\'da parol uzunligi tekshirilmaydi (faqat bo\'shligi)', () => {
    // Eski, qisqa parolli foydalanuvchilar kira olishi kerak
    assert.equal(loginSchema.safeParse({ phone: '901234567', password: '12' }).success, true);
    assert.equal(loginSchema.safeParse({ phone: '901234567', password: '' }).success, false);
  });
});

describe('updateMeSchema', () => {
  test('bitta maydon yetarli', () => {
    assert.equal(updateMeSchema.safeParse({ fullName: 'Nargiza' }).success, true);
  });

  test('bo\'sh obyekt rad etiladi', () => {
    assert.equal(updateMeSchema.safeParse({}).success, false);
  });

  test('avatar null bo\'lishi mumkin (rasmni o\'chirish)', () => {
    assert.equal(updateMeSchema.safeParse({ avatar: null }).success, true);
  });
});

describe('changePasswordSchema', () => {
  test('to\'g\'ri kirish', () => {
    assert.equal(
      changePasswordSchema.safeParse({ currentPassword: 'eski123', newPassword: 'yangi123' }).success,
      true,
    );
  });

  test('yangi parol eskisi bilan bir xil bo\'lolmaydi', () => {
    const r = changePasswordSchema.safeParse({ currentPassword: 'parol123', newPassword: 'parol123' });
    assert.equal(r.success, false);
    assert.match(firstError(r), /farq qilishi/);
  });

  test('qisqa yangi parol rad etiladi', () => {
    assert.equal(
      changePasswordSchema.safeParse({ currentPassword: 'eski123', newPassword: '123' }).success,
      false,
    );
  });
});

describe('pushTokenSchema', () => {
  test('platform faqat ios yoki android', () => {
    assert.equal(pushTokenSchema.safeParse({ token: 'a'.repeat(20), platform: 'ios' }).success, true);
    assert.equal(pushTokenSchema.safeParse({ token: 'a'.repeat(20), platform: 'web' }).success, false);
  });

  test('deviceId ixtiyoriy', () => {
    const r = pushTokenSchema.parse({ token: 'a'.repeat(20), platform: 'android' });
    assert.equal(r.deviceId, '');
  });
});
