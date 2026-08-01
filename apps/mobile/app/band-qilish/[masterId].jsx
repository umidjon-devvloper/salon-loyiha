import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarX, ChevronLeft } from 'lucide-react-native';

import { formatPrice } from '@gozal/shared/utils/format';
import {
  currentMonth,
  formatDateUz,
  formatDurationUz,
  monthOf,
  todayStr,
} from '@gozal/shared/utils/time';

import { api, queryKeys } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { DateStrip } from '../../components/booking/DateStrip';
import { SlotGrid, SlotGridSkeleton } from '../../components/booking/SlotGrid';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PhoneInput,
  Spinner,
} from '../../components/ui';

/**
 * Band qilish oqimi.
 *
 * ⚠️ Web'da 4 qadamli wizard, mobilda 2 ta ekran:
 *   1. Vaqt tanlash (kunlar lentasi + slotlar)
 *   2. Ma'lumot va tasdiq
 *
 * Xizmatlar oldingi ekranda (salon yoki usta) tanlangan va URL orqali
 * keladi. Telefon ekranida 4 ta qadam juda uzun — har qadamda odam
 * yo'qoladi, ayniqsa "mutaxassis tanlash" bitta usta bo'lganda.
 */
export default function BookingScreen() {
  const { masterId, services: servicesParam } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isHydrated, requireAuth } = useAuth();

  const serviceIds = useMemo(
    () =>
      String(servicesParam || '')
        .split(',')
        .filter(Boolean),
    [servicesParam],
  );

  const [step, setStep] = useState(1);
  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState(null);
  const [form, setForm] = useState({ clientName: '', clientPhone: '', note: '' });

  // Kirgan foydalanuvchining ma'lumotlari oldindan to'ldiriladi
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        clientName: prev.clientName || user.fullName || '',
        clientPhone: prev.clientPhone || user.phone || '',
        note: prev.note,
      }));
    }
  }, [user]);

  const month = date ? monthOf(date) : currentMonth();

  const daysQuery = useQuery({
    queryKey: queryKeys.availabilityDays({ masterId, month, serviceIds }),
    queryFn: () => api.booking.availabilityDays({ masterId, month, serviceIds }),
    enabled: serviceIds.length > 0,
  });

  const slotsQuery = useQuery({
    queryKey: queryKeys.availability({ masterId, date, serviceIds }),
    queryFn: () => api.booking.availability({ masterId, date, serviceIds }),
    enabled: Boolean(date) && serviceIds.length > 0,
    // Slot tez o'zgaradi
    staleTime: 30_000,
  });

  const feeQuery = useQuery({
    queryKey: queryKeys.settings,
    queryFn: api.catalog.settings,
    staleTime: 10 * 60_000,
  });

  const fee = feeQuery.data?.bookingFee ?? 0;

  const create = useMutation({
    mutationFn: () =>
      api.booking.create({
        masterId,
        serviceIds,
        date,
        startTime: slot.start,
        ...form,
      }),

    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });

      // To'lov kerak bo'lsa Payme sahifasiga
      if (booking.payment?.required && booking.payment.checkoutUrl) {
        router.replace({
          pathname: '/band-qilish/tolov',
          params: { id: booking.id, url: booking.payment.checkoutUrl },
        });
        return;
      }

      router.replace({ pathname: '/band-qilish/tasdiq', params: { id: booking.id } });
    },

    onError: (error) => {
      // Slotni kimdir oldin olib qo'ygan bo'lsa — vaqt qadamiga qaytamiz
      // va bo'sh vaqtlarni qaytadan so'raymiz
      if (error.code === 'SLOT_TAKEN') {
        queryClient.invalidateQueries({ queryKey: ['availability'] });
        queryClient.invalidateQueries({ queryKey: ['availability-days'] });
        setSlot(null);
        setStep(1);
      }

      Alert.alert('Xatolik', error.message || 'Band qilib bo\u2019lmadi');
    },
  });

  if (!isHydrated) return <Spinner className="flex-1 bg-white" />;

  if (serviceIds.length === 0) {
    return (
      <View className="flex-1 justify-center bg-white">
        <EmptyState
          icon={CalendarX}
          title="Xizmat tanlanmagan"
          description="Avval salon sahifasidan xizmatlarni tanlang."
          action={<Button onPress={() => router.back()}>Orqaga</Button>}
        />
      </View>
    );
  }

  const totalDuration = slotsQuery.data?.totalDuration ?? 0;
  const canContinue =
    step === 1 ? Boolean(slot) : form.clientName.trim().length >= 2 && form.clientPhone;

  const onPrimaryPress = () => {
    if (step === 1) {
      // Auth faqat SHU YERDA so'raladi: odam avval bo'sh vaqtni ko'rsin,
      // keyin ro'yxatdan o'tsin — teskarisi ko'proq odamni yo'qotadi
      if (
        !isAuthenticated &&
        !requireAuth(`/band-qilish/${masterId}?services=${serviceIds.join(',')}`)
      ) {
        return;
      }
      setStep(2);
      return;
    }

    create.mutate();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center gap-2 px-4 pb-2">
          <Pressable
            onPress={() => (step === 2 ? setStep(1) : router.back())}
            accessibilityLabel="Orqaga"
            className="p-1"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="flex-1 text-xl font-bold text-gray-900">
            {step === 1 ? 'Vaqtni tanlang' : 'Tasdiqlash'}
          </Text>
          <Text className="text-sm text-gray-400">{step}/2</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? (
            <>
              {daysQuery.isPending ? (
                <Spinner />
              ) : daysQuery.isError ? (
                <ErrorState onRetry={daysQuery.refetch} />
              ) : (
                <DateStrip
                  value={date}
                  onChange={(next) => {
                    setSlot(null);
                    setDate(next);
                  }}
                  days={daysQuery.data?.days || {}}
                  from={todayStr()}
                />
              )}

              <View className="px-4 pt-5">
                {!date ? (
                  <Text className="text-center text-gray-400">Kunni tanlang</Text>
                ) : slotsQuery.isPending ? (
                  <SlotGridSkeleton />
                ) : slotsQuery.isError ? (
                  <ErrorState onRetry={slotsQuery.refetch} />
                ) : slotsQuery.data.slots.length === 0 ? (
                  <EmptyState
                    icon={CalendarX}
                    title="Bu kunda bo'sh vaqt yo'q"
                    description={slotsQuery.data.reason || 'Boshqa kunni tanlang.'}
                  />
                ) : (
                  <>
                    <Text className="mb-2 font-medium text-gray-900">{formatDateUz(date)}</Text>
                    <SlotGrid
                      slots={slotsQuery.data.slots}
                      value={slot?.startMin}
                      onChange={setSlot}
                    />
                  </>
                )}
              </View>
            </>
          ) : (
            <View className="gap-4 px-4 pt-2">
              <Card>
                <View className="flex-row justify-between py-1">
                  <Text className="text-gray-500">Vaqt</Text>
                  <Text className="font-medium text-gray-900">
                    {formatDateUz(date)}, {slot?.start}–{slot?.end}
                  </Text>
                </View>
                <View className="flex-row justify-between py-1">
                  <Text className="text-gray-500">Davomiyligi</Text>
                  <Text className="font-medium text-gray-900">
                    {formatDurationUz(totalDuration)}
                  </Text>
                </View>

                {/* To'lov summasi TASDIQDAN OLDIN ko'rinadi: Payme sahifasida
                    kutilmagan summani ko'rgan odam to'lamaydi */}
                {fee > 0 && (
                  <View className="mt-1 flex-row justify-between border-t border-brand-50 pt-2">
                    <Text className="text-gray-500">Hozir band qilish uchun</Text>
                    <Text className="font-semibold text-brand-700">{formatPrice(fee)}</Text>
                  </View>
                )}
              </Card>

              <Input
                label="Ismingiz"
                value={form.clientName}
                onChangeText={(clientName) => setForm({ ...form, clientName })}
              />

              <PhoneInput
                value={form.clientPhone}
                onChangeText={(clientPhone) => setForm({ ...form, clientPhone })}
                hint="Salon shu raqamga qo'ng'iroq qilib tasdiqlaydi"
              />

              <Input
                label="Izoh"
                placeholder="Masalan: qisqa naxun"
                value={form.note}
                onChangeText={(note) => setForm({ ...form, note })}
              />
            </View>
          )}
        </ScrollView>

        <View
          className="border-t border-brand-100 px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Button
            fullWidth
            disabled={!canContinue}
            loading={create.isPending}
            onPress={onPrimaryPress}
          >
            {step === 1 ? 'Davom etish' : fee > 0 ? "To'lash va band qilish" : 'Band qilish'}
          </Button>
        </View>
      </View>
    </>
  );
}
