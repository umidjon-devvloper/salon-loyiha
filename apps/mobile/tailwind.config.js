const tokens = require('@gozal/shared/tokens');

/**
 * NativeWind konfiguratsiyasi.
 *
 * ⭐ Ranglar `packages/shared/src/tokens.cjs` dan olinadi — web bilan AYNI
 * manba. Brend rangi o'zgarsa bir joyda o'zgaradi, ikki ilovada emas.
 *
 * JSON o'qilishining sababi: bu fayl CommonJS, `shared` esa ESM paket —
 * `require('@gozal/shared/theme')` ishlamaydi.
 *
 * Radiuslar px'da: React Native'da `rem` tushunchasi yo'q.
 */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: tokens.colors,
      borderRadius: tokens.borderRadius.px,
    },
  },
  plugins: [],
};
