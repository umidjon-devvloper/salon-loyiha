import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CircleAlert, CircleCheck, Clock } from 'lucide-react-native';

import { api } from '../../lib/api';
import { Button, Spinner } from '../../components/ui';

/**
 * Payme to'lovi.
 *
 * ⚠️ ILOVA QAYTGANIGA ISHONILMAYDI. Mijoz to'lamasdan ham brauzerni
 * yopib ilovaga qaytishi mumkin. Yagona haqiqat manbai — Payme webhooki
 * (`PerformTransaction`), shuning uchun holat faqat BACKENDDAN so'raladi.
 *
 * Webhook bir necha sekund kechikishi mumkin: har 2 sekundda, 30 sekundgacha.
 */
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30_000;

export default function PaymentScreen() {
  const { id, url } = useLocalSearchParams();
  const router = useRouter();

  const [state, setState] = useState('opening'); // opening | checking | paid | pending | failed
  const stopped = useRef(false);

  useEffect(() => {
    stopped.current = false;

    async function run() {
      try {
        // Deep link orqali ilovaga qaytadi: gozalayol://band-qilish/tolov
        const returnUrl = Linking.createURL('/band-qilish/tolov');
        await WebBrowser.openAuthSessionAsync(String(url), returnUrl);
      } catch {
        // Brauzer ochilmasa ham holatni tekshiramiz — to'lov boshqa
        // qurilmada yoki Payme ilovasida bajarilgan bo'lishi mumkin
      }

      if (stopped.current) return;
      setState('checking');

      const startedAt = Date.now();

      const poll = async () => {
        if (stopped.current) return;

        try {
          const booking = await api.booking.one(String(id));
          if (stopped.current) return;

          if (booking.status !== 'awaiting_payment') {
            setState(booking.status === 'cancelled' ? 'failed' : 'paid');
            return;
          }

          // Hold tugagan — slot boshqa mijozga ochilgan, kutishning ma'nosi yo'q
          if (booking.holdUntil && new Date(booking.holdUntil) < new Date()) {
            setState('failed');
            return;
          }

          if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
            setState('pending');
            return;
          }

          setTimeout(poll, POLL_INTERVAL_MS);
        } catch {
          if (!stopped.current) setState('failed');
        }
      };

      poll();
    }

    run();

    return () => {
      stopped.current = true;
    };
  }, [id, url]);

  if (state === 'opening' || state === 'checking') {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Spinner />
        <Text className="mt-2 text-center text-gray-500">
          {state === 'opening' ? "To'lov sahifasi ochilmoqda" : "To'lov tekshirilmoqda"}
        </Text>
      </View>
    );
  }

  const views = {
    paid: {
      icon: CircleCheck,
      color: '#059669',
      bg: 'bg-emerald-50',
      title: "To'lov qabul qilindi",
      text: 'Salon tez orada qo\u2019ng\u2019iroq qilib tasdiqlaydi.',
    },
    pending: {
      icon: Clock,
      color: '#D97706',
      bg: 'bg-amber-50',
      title: "To'lov tasdiqlanmoqda",
      // Pul yechilgan bo'lishi mumkin — "to'lanmadi" deb ayta olmaymiz
      text: "To'lov tizimidan javob kechikmoqda. Agar pul yechilgan bo'lsa, yozuv bir necha daqiqada tasdiqlanadi.",
    },
    failed: {
      icon: CircleAlert,
      color: '#E11D48',
      bg: 'bg-rose-50',
      title: "To'lov amalga oshmadi",
      text: 'Vaqt band qilinmadi. Qayta urinib ko\u2019rishingiz mumkin.',
    },
  };

  const view = views[state];
  const Icon = view.icon;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 items-center justify-center bg-white px-8">
        <View className={`h-16 w-16 items-center justify-center rounded-2xl ${view.bg}`}>
          <Icon size={32} color={view.color} />
        </View>

        <Text className="mt-4 text-lg font-semibold text-gray-900">{view.title}</Text>
        <Text className="mt-2 text-center leading-6 text-gray-600">{view.text}</Text>

        <View className="mt-8 w-full gap-3">
          {state === 'paid' ? (
            <Button
              fullWidth
              onPress={() => router.replace({ pathname: '/band-qilish/tasdiq', params: { id } })}
            >
              Yozuvni ko&apos;rish
            </Button>
          ) : (
            <Button fullWidth onPress={() => router.replace('/(tabs)/yozuvlarim')}>
              Yozuvlarim
            </Button>
          )}

          <Button variant="ghost" fullWidth onPress={() => router.replace('/(tabs)')}>
            Bosh sahifa
          </Button>
        </View>
      </View>
    </>
  );
}
