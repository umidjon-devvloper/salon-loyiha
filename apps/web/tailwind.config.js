import { colors, borderRadius, fontFamily } from '@gozal/shared/theme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors,
      borderRadius,
      fontFamily,
    },
  },
  plugins: [],
};
