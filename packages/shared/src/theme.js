/**
 * Design tokens — single source of truth.
 * Consumed by apps/web `tailwind.config.js` and later by apps/mobile (NativeWind).
 * Never hardcode brand colors anywhere else.
 */

export const colors = {
  brand: {
    50: '#FFF1F5',
    100: '#FFE4EC',
    200: '#FFC9DA',
    300: '#FF9EBE',
    400: '#FF6B9D',
    500: '#F4407D', // primary
    600: '#DB2777', // buttons
    700: '#BE185D', // headings
  },
};

export const borderRadius = {
  xl: '0.875rem', // buttons, inputs
  '2xl': '1.25rem', // cards
};

export const fontFamily = {
  sans: ['Inter', 'system-ui', 'sans-serif'],
};

/** Booking status → badge color family */
export const statusColor = {
  awaiting_payment: 'slate',
  pending: 'amber',
  confirmed: 'emerald',
  completed: 'slate',
  cancelled: 'rose',
  no_show: 'rose',
};

export const theme = { colors, borderRadius, fontFamily, statusColor };

export default theme;
