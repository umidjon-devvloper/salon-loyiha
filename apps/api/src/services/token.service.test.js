import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  expiryOf,
} from './token.service.js';
import env from '../config/env.js';

const user = { _id: '65f000000000000000000001', role: 'client' };

describe('token yaratish va tekshirish', () => {
  test('access token o\'qiladi', () => {
    const payload = verifyAccessToken(signAccessToken(user));
    assert.equal(payload.sub, user._id);
    assert.equal(payload.role, 'client');
    assert.equal(payload.typ, 'access');
  });

  test('refresh token o\'qiladi va har safar noyob', () => {
    const a = signRefreshToken(user);
    const b = signRefreshToken(user);
    assert.notEqual(a, b, 'jti tufayli tokenlar farq qilishi kerak');

    const payload = verifyRefreshToken(a);
    assert.equal(payload.typ, 'refresh');
    assert.ok(payload.jti);
  });
});

describe('token turlarini almashtirib bo\'lmaydi', () => {
  test('access tokenni refresh o\'rnida ishlatib bo\'lmaydi', () => {
    const access = signAccessToken(user);
    assert.throws(() => verifyRefreshToken(access), (e) => e.status === 401);
  });

  test('refresh tokenni access o\'rnida ishlatib bo\'lmaydi', () => {
    const refresh = signRefreshToken(user);
    assert.throws(() => verifyAccessToken(refresh), (e) => e.status === 401);
  });

  test('bir xil secret bilan imzolangan, lekin typ\'i boshqa token rad etiladi', () => {
    // typ maydonisiz "qo'lda" yasalgan token
    const forged = jwt.sign({ sub: user._id, role: 'admin' }, env.JWT_ACCESS_SECRET);
    assert.throws(
      () => verifyAccessToken(forged),
      (e) => e.code === 'TOKEN_INVALID',
    );
  });
});

describe('yaroqsiz tokenlar', () => {
  test('buzilgan token → TOKEN_INVALID', () => {
    assert.throws(() => verifyAccessToken('aaa.bbb.ccc'), (e) => e.code === 'TOKEN_INVALID');
  });

  test('boshqa secret bilan imzolangan token → TOKEN_INVALID', () => {
    const foreign = jwt.sign({ sub: user._id, typ: 'access' }, 'boshqa_secret_16_belgi');
    assert.throws(() => verifyAccessToken(foreign), (e) => e.code === 'TOKEN_INVALID');
  });

  test('muddati tugagan token → TOKEN_EXPIRED', () => {
    const expired = jwt.sign({ sub: user._id, role: 'client', typ: 'access' }, env.JWT_ACCESS_SECRET, {
      expiresIn: '-1s',
    });
    assert.throws(
      () => verifyAccessToken(expired),
      (e) => e.code === 'TOKEN_EXPIRED' && e.status === 401,
    );
  });

  test('refresh secret bilan access tokenni tekshirib bo\'lmaydi', () => {
    const refresh = signRefreshToken(user);
    assert.throws(() => jwt.verify(refresh, env.JWT_ACCESS_SECRET));
  });
});

describe('hashToken', () => {
  test('bir xil kirish → bir xil hash, sha256 uzunligi', () => {
    const token = signRefreshToken(user);
    assert.equal(hashToken(token), hashToken(token));
    assert.equal(hashToken(token).length, 64);
  });

  test('turli tokenlar → turli hash', () => {
    assert.notEqual(hashToken(signRefreshToken(user)), hashToken(signRefreshToken(user)));
  });

  test('hash ichida token matni yo\'q', () => {
    const token = signRefreshToken(user);
    assert.ok(!hashToken(token).includes(token.slice(0, 10)));
  });
});

describe('expiryOf', () => {
  test('kelajakdagi sanani qaytaradi', () => {
    const exp = expiryOf(signRefreshToken(user));
    assert.ok(exp instanceof Date);
    assert.ok(exp.getTime() > Date.now());
  });

  test('access tokenning muddati refresh\'nikidan qisqa', () => {
    assert.ok(expiryOf(signAccessToken(user)) < expiryOf(signRefreshToken(user)));
  });
});
