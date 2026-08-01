import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

/**
 * Push token'ni backendga yuboradi.
 *
 * ⚠️ v1 da bildirishnoma YUBORILMAYDI — token faqat saqlanadi.
 * Sabab: keyin qo'shilsa, allaqachon o'rnatilgan ilovalar tokensiz qoladi
 * va ularga birinchi bildirishnomani yuborib bo'lmaydi.
 *
 * `expo-notifications` v1 bog'liqliklarida yo'q, shuning uchun dinamik
 * import: paket qo'shilmagan bo'lsa hook jim o'tib ketadi.
 */
export function usePushToken() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const sent = useRef(false);

  useEffect(() => {
    // Faqat kirgan foydalanuvchi uchun: token hisobga bog'lanadi
    if (!accessToken || sent.current) return;

    let cancelled = false;

    (async () => {
      try {
        const Notifications = await import('expo-notifications').catch(() => null);
        if (!Notifications || cancelled) return;

        const { status: existing } = await Notifications.getPermissionsAsync();
        let status = existing;

        // Ruxsatni ilova ochilishida so'ramaymiz — bu eng ko'p rad etiladigan
        // payt. v2 da yozuv tasdiqlangandan keyin so'raladi
        if (status !== 'granted') return;

        const { data: token } = await Notifications.getExpoPushTokenAsync();
        if (!token || cancelled) return;

        await api.auth.savePushToken({
          token,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
        });

        sent.current = true;
      } catch {
        // Push tokeni ilovaning ishlashiga ta'sir qilmaydi
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);
}

export default usePushToken;
