/**
 * Design tokens — single source of truth.
 *
 * The values live in `tokens.cjs`, not here: the mobile `tailwind.config.js`
 * is CommonJS and cannot `require` an ESM package. A .cjs file is readable
 * from both sides, so web and mobile share one file instead of drifting.
 *
 * Never hardcode brand colors anywhere else.
 */
import tokens from './tokens.cjs';

export const colors = tokens.colors;

/** Web uses rem; React Native has no rem, so mobile reads `borderRadiusPx` */
export const borderRadius = tokens.borderRadius.rem;
export const borderRadiusPx = tokens.borderRadius.px;

export const fontFamily = tokens.fontFamily;

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
