import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, ChevronLeft, MapPin, Phone, Star } from 'lucide-react-native';

import tokens from '@gozal/shared/tokens';
import { formatPhone, formatPrice, formatServicePrice } from '@gozal/shared/utils/format';
import { formatDurationUz, WEEKDAYS_UZ } from '@gozal/shared/utils/time';

import { api, queryKeys } from '../../lib/api';
import { Button, Card, ErrorState, Spinner } from '../../components/ui';

const brand = tokens.colors.brand;

/** Bugungi kun jadvalda ajratib ko'rsatiladi */
const todayWeekday = () => new Date().getDay();

export default function SalonScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selected, setSelected] = useState([]);

  const {
    data: salon,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.salon(slug),
    queryFn: () => api.catalog.salon(slug),
  });

  if (isPending) return <Spinner className="flex-1 bg-white" />;
  if (isError) {
    return (
      <View className="flex-1 justify-center bg-white">
        <ErrorState message="Salonni yuklab bo'lmadi" onRetry={refetch} />
      </View>
    );
  }

  const allServices = salon.serviceGroups.flatMap((g) => g.services);
  const chosen = allServices.filter((s) => selected.includes(s.id));
  const totalPrice = chosen.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = chosen.reduce((sum, s) => sum + s.durationMin, 0);

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ paddingBottom: chosen.length ? 120 : insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="h-56 bg-brand-50">
          {salon.cover ? (
            <Image
              source={{ uri: salon.cover }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="disk"
              transition={200}
            />
          ) : (
            <View className="h-full items-center justify-center">
              <Text className="text-5xl font-semibold text-brand-400">{salon.name[0]}</Text>
            </View>
          )}

          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Orqaga"
            className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-white/90"
            style={{ top: insets.top + 8 }}
          >
            <ChevronLeft size={22} color="#374151" />
          </Pressable>
        </View>

        <View className="p-4">
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 text-xl font-bold text-gray-900">{salon.name}</Text>
            {salon.isVerified && <BadgeCheck size={18} color="#10B981" />}
          </View>

          <View className="mt-1.5 flex-row items-center gap-1.5">
            <MapPin size={14} color="#9CA3AF" />
            <Text className="flex-1 text-gray-500">
              {salon.city}, {salon.district}
              {salon.address ? ` · ${salon.address}` : ''}
            </Text>
          </View>

          {salon.reviewCount > 0 && (
            <View className="mt-1.5 flex-row items-center gap-1">
              <Star size={14} color="#FBBF24" fill="#FBBF24" />
              <Text className="text-gray-600">
                {salon.rating.toFixed(1)} ({salon.reviewCount} baho)
              </Text>
            </View>
          )}

          <View className="mt-4">
            <Button variant="secondary" onPress={() => Linking.openURL(`tel:${salon.phone}`)}>
              {formatPhone(salon.phone)}
            </Button>
          </View>

          {salon.description ? (
            <Text className="mt-4 leading-6 text-gray-600">{salon.description}</Text>
          ) : null}

          {/* ── Xizmatlar ── */}
          <Text className="mb-3 mt-6 text-base font-semibold text-gray-900">Xizmatlar</Text>

          {salon.serviceGroups.map((group) => (
            <View key={group.slug} className="mb-4">
              <Text className="mb-2 text-sm text-gray-500">{group.name}</Text>

              {group.services.map((service) => {
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
            </View>
          ))}

          {/* ── Mutaxassislar ── */}
          <Text className="mb-3 mt-2 text-base font-semibold text-gray-900">Mutaxassislar</Text>

          {salon.masters.map((master) => (
            <Pressable
              key={master.id}
              onPress={() => router.push(`/mutaxassis/${master.id}`)}
              className="mb-2 min-h-[64px] flex-row items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 active:bg-brand-50"
            >
              <View className="h-12 w-12 overflow-hidden rounded-xl bg-brand-50">
                {master.photoThumb ? (
                  <Image
                    source={{ uri: master.photoThumb }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    cachePolicy="disk"
                  />
                ) : (
                  <View className="h-full items-center justify-center">
                    <Text className="text-lg font-semibold text-brand-400">
                      {master.fullName[0]}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-1">
                <Text className="font-medium text-gray-900">{master.fullName}</Text>
                {master.experienceYears > 0 && (
                  <Text className="text-sm text-gray-500">
                    {master.experienceYears} yil tajriba
                  </Text>
                )}
              </View>
            </Pressable>
          ))}

          {/* ── Ish vaqti ── */}
          <Text className="mb-2 mt-6 text-base font-semibold text-gray-900">Ish vaqti</Text>

          <Card>
            {salon.workingHours.map((day) => (
              <View key={day.weekday} className="flex-row justify-between py-1">
                <Text
                  className={
                    day.weekday === todayWeekday()
                      ? 'font-semibold text-brand-700'
                      : 'text-gray-600'
                  }
                >
                  {WEEKDAYS_UZ[day.weekday]}
                </Text>
                <Text className={day.isOpen ? 'text-gray-700' : 'text-gray-400'}>
                  {day.isOpen ? `${day.start}–${day.end}` : 'Dam olish'}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>

      {/* Tanlangan xizmatlar — pastda yopishib turadi */}
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
                pathname: `/band-qilish/${salon.masters[0]?.id}`,
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
