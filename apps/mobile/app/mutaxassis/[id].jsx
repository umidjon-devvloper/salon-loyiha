import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, MapPin, Star } from 'lucide-react-native';

import { formatPrice, formatServicePrice } from '@gozal/shared/utils/format';
import { formatDurationUz, WEEKDAYS_UZ } from '@gozal/shared/utils/time';

import { api, queryKeys } from '../../lib/api';
import { Button, Card, ErrorState, Spinner } from '../../components/ui';

export default function MasterScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selected, setSelected] = useState([]);

  const {
    data: master,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.master(id),
    queryFn: () => api.catalog.master(id),
  });

  if (isPending) return <Spinner className="flex-1 bg-white" />;
  if (isError) {
    return (
      <View className="flex-1 justify-center bg-white">
        <ErrorState message="Mutaxassisni yuklab bo'lmadi" onRetry={refetch} />
      </View>
    );
  }

  const services = master.serviceGroups.flatMap((g) => g.services);
  const chosen = services.filter((s) => selected.includes(s.id));
  const totalPrice = chosen.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = chosen.reduce((sum, s) => sum + s.durationMin, 0);

  const toggle = (serviceId) =>
    setSelected((prev) =>
      prev.includes(serviceId) ? prev.filter((x) => x !== serviceId) : [...prev, serviceId],
    );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: chosen.length ? 120 : insets.bottom + 24,
        }}
      >
        <View className="flex-row items-center px-4 pb-2">
          <Pressable onPress={() => router.back()} accessibilityLabel="Orqaga" className="p-1">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
        </View>

        <View className="items-center px-4">
          <View className="h-24 w-24 overflow-hidden rounded-2xl bg-brand-50">
            {master.photo ? (
              <Image
                source={{ uri: master.photo }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                cachePolicy="disk"
              />
            ) : (
              <View className="h-full items-center justify-center">
                <Text className="text-3xl font-semibold text-brand-400">{master.fullName[0]}</Text>
              </View>
            )}
          </View>

          <Text className="mt-3 text-xl font-bold text-gray-900">{master.fullName}</Text>

          {master.salon && (
            <Pressable
              onPress={() => router.push(`/salon/${master.salon.slug}`)}
              className="mt-1 flex-row items-center gap-1.5"
            >
              <MapPin size={14} color="#9CA3AF" />
              <Text className="text-brand-700">
                {master.salon.name} · {master.salon.district}
              </Text>
            </Pressable>
          )}

          <View className="mt-2 flex-row items-center gap-4">
            {master.experienceYears > 0 && (
              <Text className="text-gray-500">{master.experienceYears} yil tajriba</Text>
            )}
            {master.rating > 0 && (
              <View className="flex-row items-center gap-1">
                <Star size={14} color="#FBBF24" fill="#FBBF24" />
                <Text className="text-gray-600">{master.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>

        <View className="px-4">
          {master.bio ? <Text className="mt-4 leading-6 text-gray-600">{master.bio}</Text> : null}

          <Text className="mb-3 mt-6 text-base font-semibold text-gray-900">Xizmatlar</Text>

          {services.map((service) => {
            const active = selected.includes(service.id);

            return (
              <Pressable
                key={service.id}
                onPress={() => toggle(service.id)}
                className={`mb-2 min-h-[64px] flex-row items-center rounded-xl border p-3 ${
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

                <View className="flex-1 pr-2">
                  <Text className="font-medium text-gray-900">{service.name}</Text>
                  <Text className="mt-0.5 text-sm text-gray-500">
                    {formatDurationUz(service.durationMin)}
                  </Text>
                </View>

                <Text className="text-sm font-semibold text-brand-700">
                  {formatServicePrice(service)}
                </Text>
              </Pressable>
            );
          })}

          <Text className="mb-2 mt-4 text-base font-semibold text-gray-900">Ish vaqti</Text>

          <Card>
            {/* Ustaning o'z jadvali bo'lmasa salonniki ko'rsatiladi —
                booking dvijogi ham aynan shu qoidaga amal qiladi */}
            {!master.hasOwnSchedule && (
              <Text className="mb-2 text-sm text-gray-400">Salon jadvali bo&apos;yicha</Text>
            )}

            {master.workingHours.map((day) => (
              <View key={day.weekday} className="flex-row justify-between py-1">
                <Text className="text-gray-600">{WEEKDAYS_UZ[day.weekday]}</Text>
                <Text className={day.isOpen ? 'text-gray-700' : 'text-gray-400'}>
                  {day.isOpen ? `${day.start}–${day.end}` : 'Dam olish'}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>

      {chosen.length > 0 && (
        <View
          className="absolute inset-x-0 bottom-0 flex-row items-center gap-3 border-t border-brand-100 bg-white px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <View className="flex-1">
            <Text className="text-sm text-gray-500">
              {chosen.length} ta xizmat · {formatDurationUz(totalDuration)}
            </Text>
            <Text className="text-base font-semibold text-brand-700">
              {formatPrice(totalPrice)}
            </Text>
          </View>

          <Button
            onPress={() =>
              router.push({
                pathname: `/band-qilish/${master.id}`,
                params: { services: selected.join(',') },
              })
            }
          >
            Band qilish
          </Button>
        </View>
      )}
    </>
  );
}
