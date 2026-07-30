import app from './app.js';
import env from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

let server;

async function start() {
  await connectDB();

  server = app.listen(env.PORT, () => {
    console.log(`🚀 API ishga tushdi: http://localhost:${env.PORT}/api  (${env.NODE_ENV})`);
  });
}

async function shutdown(signal) {
  console.log(`\n${signal} — to'xtatilmoqda...`);
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
