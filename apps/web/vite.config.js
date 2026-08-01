import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,

    rollupOptions: {
      output: {
        /**
         * Vendor kodini alohida chunk'ga ajratamiz.
         *
         * Sabab: React va Router deyarli hech qachon o'zgarmaydi, bizning
         * kodimiz esa har deploy'da o'zgaradi. Bitta faylda bo'lsa,
         * har yangilanishda foydalanuvchi 100 kB ni qaytadan yuklaydi.
         * Ajratilgan bo'lsa — faqat o'zgargan qismini.
         *
         * Foydalanuvchilarning 85%+ mobil internetdan kiradi, shuning uchun
         * bu takroriy tashriflarda sezilarli farq beradi.
         */
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-data': ['@tanstack/react-query', 'axios', 'zustand'],
        },
      },
    },

    // Chunk 250 kB dan oshsa ogohlantirsin — sezdirmay o'sib ketmasin
    chunkSizeWarningLimit: 250,
  },
});
