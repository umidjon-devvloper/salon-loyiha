import { Linking, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck } from 'lucide-react-native';

import { formatPhone, formatPrice } from '@gozal/shared/utils/format';
import { formatDateUz, formatDurationUz } from '@gozal/shared/utils/time';

import { api, queryKeys } from '../../lib/api';
import { Button, Card, ErrorState, Spinner } from '../../components/ui';

/**
 * Tasdiq ekrani.
 *
 * Yozuv KODI eng katta qilib ko'rsatiladi: SMS yo'q, mijoz salonga
 * qo'ng'iroq qilganda aytadigan yagona narsa shu.
 */
export default function ConfirmScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const {
    data: booking,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.myBooking(id),
    queryFn: () => api.booking.one(String(id)),
  });

  if (isPending) return <Spinner className="flex-1 bg-white" />;
  if (isError) {
    return (
      <View className="flex-1 justify-center bg-white">
        <ErrorState onRetry={refetch} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 bg-white px-6 pt-16">
        <View className="items-center">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <CalendarCheck size={32} color="#059669" />
          </View>

          <Text className="mt-4 text-lg font-semibold text-gray-900">Yozuvingiz qabul qilindi</Text>
          <Text className="mt-1 text-center text-gray-600">
            Salon tez orada qo&apos;ng&apos;iroq qilib tasdiqlaydi
          </Text>

          <Text className="mt-3 text-3xl font-bold tracking-widest text-brand-700">
            {booking.code}
          </Text>
        </View>

        <Card className="mt-8">
          <View className="flex-row justify-between py-1">
            <Text className="text-gray-500">Salon</Text>
            <Text className="font-medium text-gray-900">{booking.salon?.name}</Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-gray-500">Mutaxassis</Text>
            <Text className="font-medium text-gray-900">{booking.master?.fullName}</Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-gray-500">Vaqt</Text>
            <Text className="font-medium text-gray-900">
              {formatDateUz(booking.date)}, {booking.start}
            </Text>
          </View>
          <View className="mt-1 flex-row justify-between border-t border-brand-50 pt-2">
            <Text className="text-gray-500">Salonda to&apos;laysiz</Text>
            <Text className="font-semibold text-brand-700">
              {formatPrice(booking.totalPrice)} · {formatDurationUz(booking.totalDuration)}
            </Text>
          </View>
        </Card>

        {booking.salon?.phone && (
          <View className="mt-4">
            <Button
              variant="secondary"
              fullWidth
              onPress={() => Linking.openURL(`tel:${booking.salon.phone}`)}
            >
              {formatPhone(booking.salon.phone)}
            </Button>
          </View>
        )}

        <View className="mt-6 gap-3">
          <Button fullWidth onPress={() => router.replace('/(tabs)/yozuvlarim')}>
            Yozuvlarim
          </Button>
          <Button variant="ghost" fullWidth onPress={() => router.replace('/(tabs)')}>
            Bosh sahifa
          </Button>
        </View>
      </View>
    </>
  );
}
