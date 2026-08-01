/**
 * Dizayn tokenlari — YAGONA manba.
 *
 * ⚠️ Nima uchun `.cjs`, `.js` yoki `.json` emas:
 *  - mobil `tailwind.config.js` — CommonJS, ESM paketni `require` qila olmaydi
 *  - `.json` ni ESM tomondan o'qish `with { type: 'json' }` talab qiladi,
 *    uni esa ESLint hali tushunmaydi
 *  - `.cjs` ni ikkala tomon ham o'qiydi: Node ESM `import` qiladi,
 *    CommonJS `require` qiladi, Vite va Metro esa interop bilan yig'adi
 *
 * Brend rangini boshqa hech qayerda qattiq yozmang.
 */
module.exports = {
  colors: {
    brand: {
      50: '#FFF1F5',
      100: '#FFE4EC',
      200: '#FFC9DA',
      300: '#FF9EBE',
      400: '#FF6B9D',
      500: '#F4407D', // asosiy
      600: '#DB2777', // tugmalar
      700: '#BE185D', // sarlavhalar
    },
  },

  borderRadius: {
    // Web: rem. React Native'da `rem` tushunchasi yo'q, shuning uchun px ham
    rem: { xl: '0.875rem', '2xl': '1.25rem' },
    px: { xl: 14, '2xl': 20 },
  },

  fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
};
