import { Router } from 'express';
import env from '../config/env.js';

/**
 * Mobil ilova uchun majburiy yangilanish tekshiruvi.
 *
 * Ilova har ochilganda shu manzilni so'raydi. Agar versiyasi `minVersion`
 * dan past bo'lsa — "Yangilash" ekrani ko'rsatiladi va oldinga o'tkazmaydi.
 *
 * ⚠️ v1 web bosqichida qo'yilishining sababi: buni keyin qo'shsangiz,
 * do'konga chiqib ketgan eski versiyalarni to'xtata olmaysiz — ular bu
 * manzilni umuman bilmaydi.
 *
 * Bazaga tegmaydi, shuning uchun `dbReady` dan oldin turadi.
 */
const router = Router();

router.get('/version', (req, res) => {
  res.json({
    success: true,
    data: {
      minVersion: env.APP_MIN_VERSION,
      latestVersion: env.APP_LATEST_VERSION,
      updateUrl: {
        ios: env.APP_STORE_URL || null,
        android: env.PLAY_STORE_URL || null,
      },
      // Texnik ish paytida ilovani vaqtincha to'xtatish uchun
      maintenance: env.APP_MAINTENANCE,
      maintenanceMessage: env.APP_MAINTENANCE
        ? "Texnik ishlar olib borilmoqda. Bir ozdan keyin urinib ko'ring"
        : null,
    },
  });
});

export default router;
