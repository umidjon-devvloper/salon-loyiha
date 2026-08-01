import { useState } from 'react';
import { Alert, FlatList, Linking, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarX, Phone, User } from 'lucide-react-native';

import tokens from '@gozal/shared/tokens';
import { formatPhone, formatPrice } from '@gozal/shared/utils/format';
import { formatDateUz, formatDurationUz } from '@gozal/shared/utils/time';

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

/** Faqat shu holatlardagi yozuvni mijoz bekor qila oladi */
const CANCELLABLE = ['pending', 'confirmed', 'awaiting_payment'];

const TABS = [
  { key: 'upcoming', label: 'Kelgusi' },
  { key: 'all', label: 'Hammasi' },
];

function BookingCard({ booking, onCancel }) {
  const status = STATUS[booking.status] || STATUS.pending;

  return (
    <Card>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900">
            {formatDateUz(booking.date)} · {booking.start}
          </Text>
          <Text className="mt-0.5 text-gray-600" numberOfLines={1}>
            {booking.salon?.name}
          </Text>
        </View>

        <View className={`rounded-lg px-2 py-1 ${status.bg}`}>
          <Text className={`text-xs font-medium ${status.text}`}>{status.label}</Text>
        </View>
      </View>

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

      <View className="mt-3 flex-row items-center justify-between border-t border-brand-50 pt-3">
        <Text className="text-sm text-gray-500">
          {booking.master?.fullName} · {formatDurationUz(booking.totalDuration)}
        </Text>
        <Text className="font-semibold text-brand-700">{formatPrice(booking.totalPrice)}</Text>
      </View>

      {booking.cancelReason ? (
        <View className="mt-3 rounded-xl bg-rose-50 px-3 py-2">
          <Text className="text-sm text-rose-700">Bekor qilindi: {booking.cancelReason}</Text>
        </View>
      ) : null}

      <View className="mt-3 flex-row items-center gap-2">
        <Text className="flex-1 text-xs text-gray-400">Kod: {booking.code}</Text>

        {booking.salon?.phone && (
          <Pressable
            onPress={() => Linking.openURL(`tel:${booking.salon.phone}`)}
            hitSlop={8}
            accessibilityLabel="Salonga qo'ng'iroq"
            className="min-h-[44px] flex-row items-center gap-1.5 rounded-xl border border-brand-200 px-3"
          >
            <Phone size={14} color={tokens.colors.brand[700]} />
            <Text className="text-sm text-brand-700">{formatPhone(booking.salon.phone)}</Text>
          </Pressable>
        )}

        {CANCELLABLE.includes(booking.status) && (
          <Button variant="ghost" onPress={() => onCancel(booking)}>
            Bekor qilish
          </Button>
        )}
      </View>
    </Card>
  );
}

export default function MyBookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isHydrated } = useAuth();

  const [tab, setTab] = useState('upcoming');
  const params = tab === 'upcoming' ? { upcoming: true } : {};

  const {
    data: bookings = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.myBookings(params),
    queryFn: () => api.booking.mine(params),
    enabled: isAuthenticated,
  });

  const cancel = useMutation({
    mutationFn: (id) => api.booking.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      // Bo'shagan slot boshqa mijozga darhol ko'rinsin
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['availability-days'] });
    },
    onError: (error) => Alert.alert('Xatolik', error.message),
  });

  const confirmCancel = (booking) =>
    Alert.alert(
      'Yozuvni bekor qilasizmi?',
      `${formatDateUz(booking.date)}, ${booking.start} — ${booking.salon?.name}.\n\nBoshlanishiga 2 soatdan kam qolgan bo'lsa, salonga qo'ng'iroq qilish kerak bo'ladi.`,
      [
        { text: 'Yo\u2019q', style: 'cancel' },
        {
          text: 'Ha, bekor qilaman',
          style: 'destructive',
          onPress: () => cancel.mutate(booking.id),
        },
      ],
    );

  if (!isHydrated) return <Spinner className="flex-1 bg-white" />;

  if (!isAuthenticated) {
    return (
      <View className="flex-1 justify-center bg-white" style={{ paddingTop: insets.top }}>
        <EmptyState
          icon={User}
          title="Hisobingizga kiring"
          description="Yozuvlaringizni ko'rish uchun kirish kerak."
          action={<Button onPress={() => router.push('/(auth)/kirish')}>Kirish</Button>}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <Text className="px-4 pb-3 text-xl font-bold text-gray-900">Yozuvlarim</Text>

      <View className="flex-row gap-2 px-4 pb-3">
        {TABS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setTab(item.key)}
            className={`min-h-[40px] justify-center rounded-xl px-4 ${
              tab === item.key ? 'bg-brand-600' : 'border border-gray-200 bg-white'
            }`}
          >
            <Text className={tab === item.key ? 'font-medium text-white' : 'text-gray-700'}>
              {item.label}
            </Text>
          </Pressable>
        ))}
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
          refreshing={cancel.isPending}
          onRefresh={refetch}
          renderItem={({ item }) => <BookingCard booking={item} onCancel={confirmCancel} />}
          ListEmptyComponent={
            <EmptyState
              icon={CalendarX}
              title={tab === 'upcoming' ? 'Kelgusi yozuvingiz yo\u2019q' : 'Hali yozuv yo\u2019q'}
              description="Katalogdan salon tanlab, bo'sh vaqtga yoziling."
              action={
                <Button onPress={() => router.push('/(tabs)/qidiruv')}>
                  Salonlarni ko&apos;rish
                </Button>
              }
            />
          }
        />
      )}
    </View>
  );
}
