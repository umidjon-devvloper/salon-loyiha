import mongoose from 'mongoose';

import env from '../config/env.js';
import { METHODS } from '../services/payme/merchant.service.js';
import {
  PAYME_ERRORS,
  PaymeError,
  checkAuth,
  rpcError,
  rpcResult,
} from '../services/payme/protocol.js';

/**
 * Payme webhooki.
 *
 * ⚠️ Bu endpoint loyihaning boshqa qismidan BOSHQACHA ishlaydi:
 *  - javob formati JSON-RPC 2.0, bizning { success, data } emas
 *  - xato bo'lganda ham HTTP 200 qaytadi, xato JSON ichida bo'ladi
 *  - xato xabari uch tilda ({ uz, ru, en }) — Payme talabi
 *
 * Shu sababli u umumiy errorHandler'ga tushmaydi va o'z ichida yopiladi.
 */
export async function paymeCallback(req, res) {
  const { id, method, params } = req.body || {};

  // Baza yiqilgan bo'lsa 10 sekund kutib o'tirmaymiz: Payme uchun tizim xatosi
  // darhol qaytadi va u qayta urinadi
  if (mongoose.connection.readyState !== 1) {
    return res.json(rpcError(id, PAYME_ERRORS.SYSTEM_ERROR));
  }

  const key = env.isProd ? env.PAYME_KEY : env.PAYME_KEY_TEST || env.PAYME_KEY;

  if (!checkAuth(req.headers.authorization, key)) {
    return res.json(rpcError(id, PAYME_ERRORS.UNAUTHORIZED));
  }

  const handler = METHODS[method];
  if (!handler) {
    return res.json(rpcError(id, PAYME_ERRORS.METHOD_NOT_FOUND));
  }

  try {
    const result = await handler(params || {});
    return res.json(rpcResult(id, result));
  } catch (err) {
    if (err instanceof PaymeError) {
      return res.json(rpcError(id, err));
    }

    // Kutilmagan xato: Payme uchun tizim xatosi, bizga log
    console.error('❌ Payme callback xatosi:', method, err);
    return res.json(rpcError(id, PAYME_ERRORS.SYSTEM_ERROR));
  }
}

export default paymeCallback;
