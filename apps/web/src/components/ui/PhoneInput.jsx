import { forwardRef } from 'react';
import { Input } from './Input';

/**
 * Telefon maskasi: +998 90 123 45 67
 *
 * Formaga XOM raqamlar (9 ta) uzatiladi — maska faqat ko'rsatish uchun.
 * Normallashtirishni zod sxemasi bajaradi (backend bilan bir xil kod).
 */
function format(digits) {
  const d = digits.slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return parts.length ? `+998 ${parts.join(' ')}` : '';
}

export const PhoneInput = forwardRef(function PhoneInput({ value = '', onChange, ...props }, ref) {
  const digits = String(value).replace(/\D/g, '').replace(/^998/, '');

  const handleChange = (e) => {
    const next = e.target.value.replace(/\D/g, '').replace(/^998/, '').slice(0, 9);
    onChange?.(next);
  };

  return (
    <Input
      ref={ref}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      placeholder="+998 90 123 45 67"
      value={format(digits)}
      onChange={handleChange}
      {...props}
    />
  );
});

export default PhoneInput;
