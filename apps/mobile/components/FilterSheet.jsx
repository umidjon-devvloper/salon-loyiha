import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react-native';

import { api, queryKeys } from '../lib/api';
import { Button, Input } from './ui';

/**
 * Filtr — pastdan chiqadigan oyna (bottom sheet).
 *
 * Web'da yon panel, mobilda esa pastdan: bir qo'l bilan ushlab turgan
 * odam ekranning yuqorisiga yeta olmaydi, tugmalar pastda bo'lishi kerak.
 *
 * ⚠️ Qiymatlar DARHOL qo'llanmaydi. Har tanlovda so'rov yuborilsa,
 * oyna ochiq turganda 5–6 marta yuklanadi va ro'yxat ostida "sakraydi".
 * Foydalanuvchi "Ko'rsatish" ni bosgandagina qo'llanadi.
 */
function Chip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={`min-h-[40px] justify-center rounded-xl px-3 ${
        active ? 'bg-brand-600' : 'border border-gray-200 bg-white'
      }`}
    >
      <Text className={active ? 'font-medium text-white' : 'text-gray-700'}>{label}</Text>
    </Pressable>
  );
}

export function FilterSheet({ open, value, onClose, onApply }) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value || {});

  // Oyna har ochilganda tashqi qiymatdan boshlanadi
  useEffect(() => {
    if (open) setDraft(value || {});
  }, [open, value]);

  const cities = useQuery({
    queryKey: queryKeys.cities,
    queryFn: api.catalog.cities,
    staleTime: Infinity,
    enabled: open,
  });

  const categories = useQuery({
    queryKey: queryKeys.categories,
    queryFn: api.catalog.categories,
    staleTime: 5 * 60_000,
    enabled: open,
  });

  const districts = (cities.data || []).find((c) => c.name === draft.city)?.districts || [];

  const set = (patch) => setDraft({ ...draft, ...patch });

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />

      <View
        className="max-h-[85%] rounded-t-2xl bg-white"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
          <Text className="text-lg font-semibold text-gray-900">Filtr</Text>
          <Pressable onPress={onClose} accessibilityLabel="Yopish" className="p-1">
            <X size={22} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView className="px-4" contentContainerStyle={{ paddingVertical: 16, gap: 20 }}>
          <View>
            <Text className="mb-2 text-sm font-medium text-gray-700">Kategoriya</Text>
            <View className="flex-row flex-wrap gap-2">
              {(categories.data || []).map((category) => (
                <Chip
                  key={category.slug}
                  label={category.name}
                  active={draft.category === category.slug}
                  onPress={() =>
                    set({ category: draft.category === category.slug ? '' : category.slug })
                  }
                />
              ))}
            </View>
          </View>

          <View>
            <Text className="mb-2 text-sm font-medium text-gray-700">Shahar</Text>
            <View className="flex-row flex-wrap gap-2">
              {(cities.data || []).map((city) => (
                <Chip
                  key={city.name}
                  label={city.name}
                  active={draft.city === city.name}
                  onPress={() =>
                    set({ city: draft.city === city.name ? '' : city.name, district: '' })
                  }
                />
              ))}
            </View>
          </View>

          {districts.length > 0 && (
            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700">Tuman</Text>
              <View className="flex-row flex-wrap gap-2">
                {districts.map((district) => (
                  <Chip
                    key={district}
                    label={district}
                    active={draft.district === district}
                    onPress={() => set({ district: draft.district === district ? '' : district })}
                  />
                ))}
              </View>
            </View>
          )}

          <View>
            <Text className="mb-2 text-sm font-medium text-gray-700">Narx, so&apos;m</Text>
            <View className="flex-row items-center gap-2">
              <Input
                className="flex-1"
                keyboardType="number-pad"
                placeholder="dan"
                value={String(draft.minPrice ?? '')}
                onChangeText={(v) => set({ minPrice: v.replace(/\D/g, '') })}
              />
              <Text className="text-gray-400">—</Text>
              <Input
                className="flex-1"
                keyboardType="number-pad"
                placeholder="gacha"
                value={String(draft.maxPrice ?? '')}
                onChangeText={(v) => set({ maxPrice: v.replace(/\D/g, '') })}
              />
            </View>
          </View>
        </ScrollView>

        <View className="flex-row gap-3 border-t border-gray-100 px-4 pt-3">
          <Button variant="secondary" onPress={() => setDraft({})}>
            Tozalash
          </Button>
          <View className="flex-1">
            <Button
              fullWidth
              onPress={() => {
                onApply(draft);
                onClose();
              }}
            >
              Ko&apos;rsatish
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default FilterSheet;
