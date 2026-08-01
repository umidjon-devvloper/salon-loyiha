import { useState } from 'react';
import { Alert, FlatList, Linking, Pressable, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarX, ChevronLeft, ChevronRight, Phone, Plus } from 'lucide-react-native';

import tokens from '@gozal/shared/tokens';
import { formatPhone, formatPrice } from '@gozal/shared/utils/format';
import { addDays, formatDateUz, formatDurationUz, todayStr } from '@gozal/shared/utils/time';

import { api, queryKeys } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Button, Card, EmptyState, ErrorState, Spinner } from '../../components/ui';

const STATUS = {
  awaiting_payment: { label: "To'lov kutilmoqda", bg: 'bg-gray-100', text: 'text-gray-600' },
  pending: { label: 'Kutilmoqda', bg: 'bg-amber-50', text: 'text-amber-700' },
  confirmed: { label: 'Tasdiqlangan', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  completed: { label: 'Yakunlangan', bg: 'bg-gray-100', text: 'text-gray-600' },
  cancelled: { label: 'Bekor qilingan', bg: 'bg-rose-50', text: 'text-rose-700' },
  no_show: { label: 'Kelmadi', bg: 'bg-rose-50', text: 'text-rose-700' },
};

/**
 * Salon egasi kabineti — QISQARTIRILGAN.
 *
 * Mobilda faqat kunlik ish: yozuvlarni ko'rish, tasdiqlash, bekor qilish
 * va telefon orqali kelgan mijozni kiritish. Jadval, xizmatlar va salon
 * profili webda qoladi.
 */
function BookingRow({ booking, onStatus }) {
  const status = STATUS[booking.status] || STATUS.pending;

  return (
    <Card>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900">
            {booking.start}–{booking.end}
            <Text className="font-normal text-gray-500">
              {'  '}
              {formatDurationUz(booking.totalDuration)}
            </Text>
          </Text>
          <Text className="mt-0.5 text-sm text-gray-500">{booking.master?.fullName}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          {booking.source === 'manual' && (
            <View className="rounded-lg bg-gray-100 px-2 py-1">
              <Text className="text-xs text-gray-600">Qo&apos;lda</Text>
            </View>
          )}
          <View className={`rounded-lg px-2 py-1 ${status.bg}`}>
            <Text className={`text-xs font-medium ${status.text}`}>{status.label}</Text>
          </View>
        </View>
      </View>

      {/* Mijoz raqami — tasdiqlash telefonda bo'ladi */}
      <Pressable
        onPress={() => Linking.openURL(`tel:${booking.clientPhone}`)}
        className="mt-3 rounded-xl bg-brand-50/60 px-3 py-2.5 active:bg-brand-100"
      >
        <Text className="font-medium text-gray-900">{booking.clientName}</Text>
        <View className="mt-0.5 flex-row items-center gap-1.5">
          <Phone size={13} color={tokens.colors.brand[700]} />
          <Text className="text-brand-700">{formatPhone(booking.clientPhone)}</Text>
        </View>
        {booking.note ? <Text className="mt-1 text-sm text-gray-600">{booking.note}</Text> : null}
      </Pressable>

      <View className="mt-3 gap-1">
        {booking.items.map((item, i) => (
          <View key={i} className="flex-row justify-between">
            <Text className="flex-1 text-sm text-gray-600" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-sm text-gray-600">{formatPrice(item.price)}</Text>
          </View>
        ))}
      </View>

      {booking.status === 'pending' && (
        <View className="mt-3 flex-row gap-2 border-t border-brand-50 pt-3">
          <View className="flex-1">
            <Button fullWidth onPress={() => onStatus(booking, 'confirmed')}>
              Tasdiqlash
            </Button>
          </View>
          <Button variant="ghost" onPress={() => onStatus(booking, 'cancelled')}>
            Bekor qilish
          </Button>
        </View>
      )}

      {booking.status === 'confirmed' && (
        <View className="mt-3 flex-row gap-2 border-t border-brand-50 pt-3">
          <View className="flex-1">
            <Button variant="secondary" fullWidth onPress={() => onStatus(booking, 'completed')}>
              Yakunlandi
            </Button>
          </View>
          <Button variant="ghost" onPress={() => onStatus(booking, 'no_show')}>
            Kelmadi
          </Button>
        </View>
      )}
    </Card>
  );
}

export default function CabinetScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role, isHydrated } = useAuth();

  const [date, setDate] = useState(todayStr());

  const params = { date };

  const {
    data: bookings = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.ownerBookings(params),
    queryFn: () => api.owner.bookings(params),
    enabled: role === 'owner' || role === 'admin',
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status, cancelReason }) =>
      api.owner.setBookingStatus(id, { status, cancelReason: cancelReason || '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['owner-summary'] });
      // Bekor qilinganda slot bo'shaydi
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['availability-days'] });
    },
    onError: (error) => Alert.alert('Xatolik', error.message),
  });

  const handleStatus = (booking, status) => {
    if (status === 'cancelled') {
      // Sabab majburiy — mijozga aynan shu matn ko'rinadi.
      // Alert.prompt faqat iOS'da bor, shuning uchun tayyor variantlar
      Alert.alert('Bekor qilish sababi', 'Mijozga shu sabab ko\u2019rinadi', [
        { text: 'Yopish', style: 'cancel' },
        {
          text: 'Usta band',
          onPress: () =>
            setStatus.mutate({
              id: booking.id,
              status,
              cancelReason: 'Usta band bo\u2019lib qoldi',
            }),
        },
        {
          text: 'Salon yopiq',
          onPress: () =>
            setStatus.mutate({ id: booking.id, status, cancelReason: 'Salon bu kuni ishlamaydi' }),
        },
      ]);
      return;
    }

    if (status === 'no_show') {
      Alert.alert('Mijoz kelmadimi?', 'Buni keyin qaytarib bo\u2019lmaydi.', [
        { text: 'Yo\u2019q', style: 'cancel' },
        {
          text: 'Ha, kelmadi',
          style: 'destructive',
          onPress: () => setStatus.mutate({ id: booking.id, status }),
        },
      ]);
      return;
    }

    setStatus.mutate({ id: booking.id, status });
  };

  if (!isHydrated) return <Spinner className="flex-1 bg-white" />;

  if (role !== 'owner' && role !== 'admin') {
    return (
      <View className="flex-1 justify-center bg-white">
        <EmptyState
          title="Bu bo'lim salon egalari uchun"
          description="Salon qo'shish uchun saytdan ro'yxatdan o'ting."
          action={<Button onPress={() => router.back()}>Orqaga</Button>}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center gap-2 px-4 pb-2">
          <Pressable onPress={() => router.back()} accessibilityLabel="Orqaga" className="p-1">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="flex-1 text-xl font-bold text-gray-900">Yozuvlar</Text>

          <Pressable
            onPress={() => router.push({ pathname: '/kabinet/qolda-yozuv', params: { date } })}
            accessibilityLabel="Qo'lda yozuv"
            className="h-11 w-11 items-center justify-center rounded-xl bg-brand-600 active:bg-brand-700"
          >
            <Plus size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Kun tanlash */}
        <View className="flex-row items-center justify-between px-4 pb-3">
          <Pressable
            onPress={() => setDate(addDays(date, -1))}
            accessibilityLabel="Oldingi kun"
            className="h-11 w-11 items-center justify-center rounded-xl border border-gray-200"
          >
            <ChevronLeft size={18} color="#374151" />
          </Pressable>

          <Pressable onPress={() => setDate(todayStr())} className="flex-1 items-center">
            <Text className="font-medium text-gray-900">{formatDateUz(date)}</Text>
            {date !== todayStr() && <Text className="text-xs text-brand-700">Bugunga qaytish</Text>}
          </Pressable>

          <Pressable
            onPress={() => setDate(addDays(date, 1))}
            accessibilityLabel="Keyingi kun"
            className="h-11 w-11 items-center justify-center rounded-xl border border-gray-200"
          >
            <ChevronRight size={18} color="#374151" />
          </Pressable>
        </View>

        {isError ? (
          <ErrorState onRetry={refetch} />
        ) : isPending ? (
          <Spinner />
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 12 }}
            showsVerticalScrollIndicator={false}
            refreshing={setStatus.isPending}
            onRefresh={refetch}
            renderItem={({ item }) => <BookingRow booking={item} onStatus={handleStatus} />}
            ListEmptyComponent={
              <EmptyState
                icon={CalendarX}
                title="Bu kunda yozuv yo'q"
                description="Telefon orqali kelgan mijozni qo'lda kiritishingiz mumkin."
                action={
                  <Button
                    onPress={() =>
                      router.push({ pathname: '/kabinet/qolda-yozuv', params: { date } })
                    }
                  >
                    Qo&apos;lda yozuv
                  </Button>
                }
              />
            }
          />
        )}
      </View>
    </>
  );
}
