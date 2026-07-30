/**
 * Formatlash utilitalari — web va mobil uchun bir xil.
 * Barcha matnlar o'zbek tilida.
 */

// ── Narx ────────────────────────────────────────────────────────

const priceFmt = new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 });

/** 100000 → '100 000' */
export function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  // Ba'zi muhitlarda uz-UZ ajratgichi NBSP bo'ladi — oddiy probelga keltiramiz
  return priceFmt.format(Math.round(n)).replace(/\u00A0|\u202F/g, ' ');
}

/** 100000 → '100 000 so'm' */
export function formatPrice(value) {
  return `${formatNumber(value)} so'm`;
}

/**
 * Xizmat narxini ko'rsatish qoidasi (02-database.md):
 *   price=100000                          → '100 000 so'm'
 *   price=100000, isPriceFrom=true        → '100 000 so'mdan'
 *   price=100000, priceTo=180000          → '100 000 – 180 000 so'm'
 */
export function formatServicePrice({ price, priceTo = null, isPriceFrom = false } = {}) {
  if (priceTo && priceTo > price) {
    return `${formatNumber(price)} – ${formatNumber(priceTo)} so'm`;
  }
  return isPriceFrom ? `${formatNumber(price)} so'mdan` : formatPrice(price);
}

// ── Telefon ─────────────────────────────────────────────────────

/**
 * Har qanday ko'rinishni bazaga yoziladigan formatga keltiradi:
 *   '90 123 45 67'      → '+998901234567'
 *   '+998 (90) 123-45-67' → '+998901234567'
 *   '998901234567'      → '+998901234567'
 * Aylantirib bo'lmasa `null` qaytadi.
 */
export function normalizePhone(input) {
  if (typeof input !== 'string') return null;
  let digits = input.replace(/\D/g, '');

  if (digits.length === 9) digits = `998${digits}`;
  if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`;
  return null;
}

export function isValidPhone(input) {
  return normalizePhone(input) !== null;
}

/** '+998901234567' → '+998 90 123 45 67' */
export function formatPhone(phone) {
  const n = normalizePhone(phone);
  if (!n) return phone ?? '';
  const d = n.slice(4); // 998 dan keyin
  return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}

// ── Matn ────────────────────────────────────────────────────────

/** 'Go'zallik Saloni' → 'gozallik-saloni' (lotin + kirill translit) */
export function slugify(input) {
  const map = {
    ʻ: '',
    ʼ: '',
    '\u2018': '',
    '\u2019': '',
    "'": '',
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'yo',
    ж: 'j',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'x',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'sh',
    ъ: '',
    ы: 'i',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
    ў: 'o',
    қ: 'q',
    ғ: 'g',
    ҳ: 'h',
  };

  return String(input)
    .toLowerCase()
    .split('')
    .map((ch) => (ch in map ? map[ch] : ch))
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Uzun matnni qisqartirish */
export function truncate(text, max = 120) {
  const s = String(text ?? '');
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

/** 'Dildora Karimova' → 'DK' (avatar o'rniga) */
export function initials(fullName) {
  return String(fullName ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ── Yozuv kodi ──────────────────────────────────────────────────

/** 'GA-4821' — mijoz telefonda aytadigan kod */
export function formatBookingCode(code) {
  return String(code ?? '').toUpperCase();
}
