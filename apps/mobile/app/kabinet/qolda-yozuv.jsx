import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';

import { formatPrice } from '@gozal/shared/utils/format';
import { formatDateUz, formatDurationUz } from '@gozal/shared/utils/time';

import { api, queryKeys } from '../../lib/api';
import { SlotGrid, SlotGridSkeleton } from '../../components/booking/SlotGrid';
import { Button, Card, Input, PhoneInput, Spinner } from '../../components/ui';

/**
 * ⭐ Telefon orqali kelgan mijozni qo'lda kiritish.
 *
 * Bu funksiyasiz platforma ishlamaydi: salonlarning mijozlari hali ham
 * asosan qo'ng'iroq qiladi. Egasi ularni kiritmasa, tizim o'sha vaqtni
 * bo'sh deb ko'rsatadi va ikki mijoz bir vaqtda kelib qoladi.
 *
 * Slotlar backenddan so'raladi — egasi qo'lda ham ustma-ust yozuv
 * qo'sha olmasligi uchun.
 */
export default function ManualBookingScreen() {
  const { date } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [masterId, setMasterId] = useState('');
  const [serviceIds, setServiceIds] = useState([]);
  const [slot, setSlot] = useState(null);
  const [form, setForm] = useState({ clientName: '', clientPhone: '', note: '' });

  const mastersQuery = useQuery({ queryKey: queryKeys.ownerMasters, queryFn: api.owner.masters });
  const servicesQuery = useQuery({
    queryKey: queryKeys.ownerServices,
    queryFn: api.owner.services,
  });

  const masters = (mastersQuery.data || []).filter((m) => m.isActive);
  const activeMaster = masterId || masters[0]?.id || '';

  // Xizmatning `masters` massivi bo'sh bo'lsa — hamma usta bajaradi
  const services = useMemo(
    () =>
      (servicesQuery.data || []).filter(
        (s) => s.isActive && (!s.masters?.length || s.masters.includes(activeMaster)),
      ),
    [servicesQuery.data, activeMaster],
  );

  const slotsQuery = useQuery({
    queryKey: queryKeys.availability({ masterId: activeMaster, date, serviceIds }),
    queryFn: () => api.booking.availability({ masterId: activeMaster, date, serviceIds }),
    enabled: Boolean(activeMaster) && serviceIds.length > 0,
  });

  const chosen = services.filter((s) => serviceIds.includes(s.id));
  const totalPrice = chosen.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = chosen.reduce((sum, s) => sum + s.durationMin, 0);

  const create = useMutation({
    mutationFn: () =>
      api.owner.manualBooking({
        masterId: activeMaster,
        serviceIds,
        date: String(date),
        startTime: slot.start,
        ...form,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['availability-days'] });
      router.back();
    },

    onError: (error) => Alert.alert('Xatolik', error.message),
  });

  const canSubmit =
    activeMaster &&
    serviceIds.length > 0 &&
    slot &&
    form.clientName.trim().length >= 2 &&
    form.clientPhone;

  if (mastersQuery.isPending || servicesQuery.isPending) {
    return <Spinner className="flex-1 bg-white" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center gap-2 px-4 pb-2">
          <Pressable onPress={() => router.back()} accessibilityLabel="Orqaga" className="p-1">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">Qo&apos;lda yozuv</Text>
            <Text className="text-sm text-gray-500">{formatDateUz(String(date))}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {masters.length > 1 && (
            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700">Mutaxassis</Text>
              <View className="flex-row flex-wrap gap-2">
                {masters.map((master) => {
                  const active = master.id === activeMaster;

                  return (
                    <Pressable
                      key={master.id}
                      onPress={() => {
                        setMasterId(master.id);
                        setSlot(null);
                      }}
                      className={`min-h-[44px] justify-center rounded-xl px-3 ${
                        active ? 'bg-brand-600' : 'border border-gray-200 bg-white'
                      }`}
                    >
                      <Text className={active ? 'font-medium text-white' : 'text-gray-700'}>
                        {master.fullName}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View>
            <Text className="mb-2 text-sm font-medium text-gray-700">Xizmatlar</Text>

            {services.length === 0 ? (
              <Text className="text-sm text-gray-500">
                Avval saytda xizmat qo&apos;shing — davomiyligisiz vaqtni hisoblab bo&apos;lmaydi.
              </Text>
            ) : (
              services.map((service) => {
                const active = serviceIds.includes(service.id);

                return (
                  <Pressable
                    key={service.id}
                    onPress={() => {
                      setSlot(null);
                      setServiceIds((prev) =>
                        prev.includes(service.id)
                          ? prev.filter((x) => x !== service.id)
                          : [...prev, service.id],
                      );
                    }}
                    className={`mb-2 min-h-[56px] flex-row items-center rounded-xl border p-3 ${
                      active ? 'border-brand-600 bg-brand-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <View
                      className={`mr-3 h-6 w-6 items-center justify-center rounded-md border-2 ${
                        active ? 'border-brand-600 bg-brand-600' : 'border-gray-300'
                      }`}
                    >
                      {active && <Text className="text-xs font-bold text-white">✓</Text>}
                    </View>

                    <Text className="flex-1 text-gray-900">{service.name}</Text>
                    <Text className="text-sm text-gray-500">
                      {formatDurationUz(service.durationMin)}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>

          {serviceIds.length > 0 && (
            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700">Bo&apos;sh vaqtlar</Text>

              {slotsQuery.isPending ? (
                <SlotGridSkeleton />
              ) : !slotsQuery.data?.slots?.length ? (
                <Text className="text-sm text-gray-500">
                  {slotsQuery.data?.reason || 'Bu kunda bo\u2019sh vaqt yo\u2019q'}
                </Text>
              ) : (
                <SlotGrid slots={slotsQuery.data.slots} value={slot?.startMin} onChange={setSlot} />
              )}
            </View>
          )}

          <Input
            label="Mijoz ismi"
            value={form.clientName}
            onChangeText={(clientName) => setForm({ ...form, clientName })}
          />

          <PhoneInput
            value={form.clientPhone}
            onChangeText={(clientPhone) => setForm({ ...form, clientPhone })}
          />

          <Input
            label="Izoh"
            value={form.note}
            onChangeText={(note) => setForm({ ...form, note })}
          />

          {chosen.length > 0 && (
            <Card>
              <Text className="text-gray-700">
                {chosen.length} ta xizmat · {formatDurationUz(totalDuration)} ·{' '}
                <Text className="font-semibold text-brand-700">{formatPrice(totalPrice)}</Text>
              </Text>
            </Card>
          )}
        </ScrollView>

        <View
          className="border-t border-brand-100 px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Button
            fullWidth
            disabled={!canSubmit}
            loading={create.isPending}
            onPress={() => create.mutate()}
          >
            Qo&apos;shish
          </Button>
        </View>
      </View>
    </>
  );
}
