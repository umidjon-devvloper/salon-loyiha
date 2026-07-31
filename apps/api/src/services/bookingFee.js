/**
 * Band qilish to'lovini hisoblash.
 *
 * QAROR: qat'iy 5 000 so'm (`mode: 'fixed'`). Foiz rejimi kodda bor, lekin
 * hozir ishlatilmaydi — bozor reaksiyasiga qarab admin panelda o'zgartiriladi.
 */
export function calcBookingFee(settings, totalPrice) {
  const fee = settings?.bookingFee;

  if (!fee?.enabled) return 0;

  if (fee.mode === 'fixed') {
    return Math.max(0, Math.round(fee.fixedAmount));
  }

  const raw = Math.round((totalPrice * fee.percent) / 100);
  const min = fee.minAmount ?? 0;
  const max = fee.maxAmount ?? Number.MAX_SAFE_INTEGER;

  return Math.min(Math.max(raw, min), max);
}

export default calcBookingFee;
