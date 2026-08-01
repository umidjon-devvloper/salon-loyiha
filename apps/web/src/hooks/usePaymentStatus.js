import { useEffect, useRef, useState } from 'react';

import { bookingApi } from '../api/booking.api';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30_000;

/**
 * To'lovdan qaytgach yozuv holatini backenddan so'raydi.
 *
 * ⚠️ Brauzer qaytganiga ISHONILMAYDI: mijoz to'lamasdan ham "orqaga" bosib
 * qaytishi mumkin. Yagona haqiqat manbai — Payme webhooki (`PerformTransaction`),
 * shuning uchun faqat backend holatini o'qiymiz.
 *
 * Webhook bir necha sekund kechikishi mumkin, shuning uchun so'rov
 * takrorlanadi: har 2 sekundda, 30 sekundgacha.
 */
export function usePaymentStatus(bookingId, { enabled = true } = {}) {
  const [state, setState] = useState('checking'); // checking | paid | pending | failed
  const [booking, setBooking] = useState(null);
  const timedOut = useRef(false);

  useEffect(() => {
    if (!enabled || !bookingId) return undefined;

    let stopped = false;
    const startedAt = Date.now();

    const poll = async () => {
      if (stopped) return;

      try {
        const data = await bookingApi.myBooking(bookingId);
        if (stopped) return;

        setBooking(data);

        if (data.status !== 'awaiting_payment') {
          setState(data.status === 'cancelled' ? 'failed' : 'paid');
          return;
        }

        // Hold tugagan bo'lsa kutishning ma'nosi yo'q — slot bo'shab ketgan
        if (data.holdUntil && new Date(data.holdUntil) < new Date()) {
          setState('failed');
          return;
        }

        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          timedOut.current = true;
          setState('pending');
          return;
        }

        setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (!stopped) setState('failed');
      }
    };

    poll();
    return () => {
      stopped = true;
    };
  }, [bookingId, enabled]);

  return { state, booking, timedOut: timedOut.current };
}

export default usePaymentStatus;
