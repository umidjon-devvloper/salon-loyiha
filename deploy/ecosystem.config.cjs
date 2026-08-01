/**
 * PM2 konfiguratsiyasi.
 *
 * ⚠️ `instances: 1` ATAYLAB. Cluster rejimida cron ishlari har bir
 * instansiyada takrorlanadi. Kodda himoya bor (`NODE_APP_INSTANCE !== '0'`
 * bo'lsa cron o'tkazib yuboriladi), lekin v1 yuklamasi uchun bitta jarayon
 * mutlaqo yetarli — murakkablik qo'shishning ma'nosi yo'q.
 */
module.exports = {
  apps: [
    {
      name: 'gozalayol-api',
      cwd: '/var/www/gozalayol/api',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',

      env: { NODE_ENV: 'production' },

      // Xotira oqib ketsa qayta ishga tushadi
      max_memory_restart: '400M',

      // Cheksiz qayta urinish serverni band qilmasin
      max_restarts: 10,
      min_uptime: '30s',
      restart_delay: 3000,

      error_file: '/var/log/gozalayol/api-error.log',
      out_file: '/var/log/gozalayol/api-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
