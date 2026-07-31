import app from './app.js';
import env from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { startJobs } from './jobs/index.js';

let server;
let jobs = [];

async function start() {
  await connectDB();

  // Cron faqat baza ulangandan keyin: ishlar birinchi daqiqadayoq
  // bo'sh ulanishga urinmasin
  jobs = startJobs();

  server = app.listen(env.PORT, () => {
    console.log(`🚀 API ishga tushdi: http://localhost:${env.PORT}/api  (${env.NODE_ENV})`);
  });
}

async function shutdown(signal) {
  console.log(`\n${signal} — to'xtatilmoqda...`);
  jobs.forEach((job) => job.stop());

  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log('🔌 HTTP server yopildi');
  }
  await disconnectDB();
  process.exit(0);
}

['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));

process.on('unhandledRejection', (reason) => {
  console.error('❌ Ushlanmagan Promise rad etildi:', reason);
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  console.error('❌ Ushlanmagan xato:', err);
  process.exit(1);
});

start();
