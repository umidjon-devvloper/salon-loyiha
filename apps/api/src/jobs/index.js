import cron from 'node-cron';

import env from '../config/env.js';
import { expireTop } from './expireTop.js';
import { autoComplete } from './autoComplete.js';

/**
 * Cron ishlari. Vaqt mintaqasi — Asia/Tashkent, aks holda "har kuni 01:00"
 * server UTC vaqtida bajarilib, Toshkentda 06:00 bo'lib qoladi.
 *
 * ⚠️ Ikkinchi PM2 instansi qo'shilsa, ishlar IKKI marta bajariladi.
 * Shuning uchun cron faqat `INSTANCE_ID` 0 bo'lgan (yoki umuman
 * berilmagan) jarayonda ishga tushadi.
 */
const JOBS = [
  { name: 'autoComplete', schedule: '0 1 * * *', run: autoComplete },
  { name: 'expireTop', schedule: '5 0 * * *', run: expireTop },
];

async function runSafely(job) {
  try {
    const result = await job.run();
    console.log(`⏱  ${job.name}:`, result);
  } catch (err) {
    // Cron xatosi butun jarayonni yiqitmasin
    console.error(`❌ ${job.name} bajarilmadi:`, err.message);
  }
}

export function startJobs() {
  const instance = process.env.NODE_APP_INSTANCE ?? process.env.INSTANCE_ID ?? '0';

  if (instance !== '0') {
    console.log(`⏱  Cron o'tkazib yuborildi (instansiya ${instance})`);
    return [];
  }

  return JOBS.map((job) => {
    const task = cron.schedule(job.schedule, () => runSafely(job), {
      timezone: env.TIMEZONE,
    });

    console.log(`⏱  ${job.name} rejalashtirildi: ${job.schedule} (${env.TIMEZONE})`);
    return task;
  });
}

export { expireTop, autoComplete, JOBS };
export default startJobs;
