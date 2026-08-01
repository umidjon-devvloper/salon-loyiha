import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Search, SearchX, SlidersHorizontal } from 'lucide-react-native';

import tokens from '@gozal/shared/tokens';
import { formatServicePrice } from '@gozal/shared/utils/format';
import { formatDurationUz } from '@gozal/shared/utils/time';

import { api, queryKeys } from '../../lib/api';
import { SalonCard, SalonCardSkeleton } from '../../components/SalonCard';
import { FilterSheet } from '../../components/FilterSheet';
import { EmptyState, ErrorState } from '../../components/ui';
import { useDebounce } from '../../hooks/useDebounce';

const PER_PAGE = 20;

/**
 * Qidiruv va katalog bitta ekranda.
 *
 * Web'da bular alohida sahifa (/qidiruv va /salonlar), mobilda esa bitta:
 * telefon ekranida ikkita o'xshash ro'yxat orasida sakrash chalkashtiradi.
 * Qidiruv maydoni bo'sh bo'lsa — butun katalog, to'ldirilsa — natijalar.
 */
export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [term, setTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [page, setPage] = useState(1);

  const q = useDebounce(term.trim(), 350);

  // Filtr yoki qidiruv o'zgarsa birinchi sahifaga qaytamiz
  useEffect(() => setPage(1), [q, filters]);

  const params = { ...filters, q: q || undefined, page, limit: PER_PAGE };

  const salons = useQuery({
    queryKey: queryKeys.salons(params),
    queryFn: () => api.catalog.salons(params),
    placeholderData: (previous) => previous,
  });

  // Xizmat nomi bo'yicha ham qidiramiz — mijoz "gel qoplama" deb yozadi,
  // salon nomini emas
  const services = useQuery({
    queryKey: queryKeys.search({ q, limit: 5 }),
    queryFn: () => api.catalog.search({ q, limit: 5 }),
    enabled: q.length >= 2,
  });

  const activeFilters = ['city', 'district', 'minPrice', 'maxPrice', 'category'].filter(
    (key) => filters[key],
  ).length;

  const items = salons.data?.items || [];
  const meta = salons.data?.meta;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-2 px-4 pb-3">
        <View className="min-h-[48px] flex-1 flex-row items-center rounded-xl border border-gray-200 bg-white px-3.5">
          <Search size={18} color="#9CA3AF" />
          <TextInput
            value={term}
            onChangeText={setTerm}
            placeholder="Xizmat, salon yoki mutaxassis"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            className="ml-2 flex-1 text-base text-gray-900"
          />
        </View>

        <Pressable
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Filtr"
          className="h-12 w-12 items-center justify-center rounded-xl border border-brand-200 bg-white active:bg-brand-50"
        >
          <SlidersHorizontal size={18} color={tokens.colors.brand[600]} />
          {activeFilters > 0 && (
            <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1">
              <Text className="text-[11px] font-semibold text-white">{activeFilters}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {salons.isError ? (
        <ErrorState onRetry={salons.refetch} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 12 }}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <SalonCard salon={item} />}
          // Sahifani skroll oxirida yuklaymiz — mobilda "keyingi sahifa"
          // tugmasi noqulay
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (meta && page < meta.pages && !salons.isFetching) setPage(page + 1);
          }}
          ListHeaderComponent={
            services.data?.services?.length ? (
              <View className="mb-2">
                <Text className="mb-2 text-sm font-medium text-gray-500">Xizmatlar</Text>

                {services.data.services.map((service) => (
                  <Pressable
                    key={service.id}
                    onPress={() => service.salon && router.push(`/salon/${service.salon.slug}`)}
                    className="mb-1 flex-row items-center justify-between rounded-xl bg-brand-50/60 px-3 py-2.5 active:bg-brand-100"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="font-medium text-gray-900" numberOfLines={1}>
                        {service.name}
                      </Text>
                      <Text className="text-sm text-gray-500" numberOfLines={1}>
                        {service.salon?.name} · {formatDurationUz(service.durationMin)}
                      </Text>
                    </View>
                    <Text className="text-sm font-semibold text-brand-700">
                      {formatServicePrice(service)}
                    </Text>
                  </Pressable>
                ))}

                <Text className="mb-1 mt-4 text-sm font-medium text-gray-500">Salonlar</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            salons.isPending ? (
              <View className="gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <SalonCardSkeleton key={i} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon={SearchX}
                title="Hech narsa topilmadi"
                description="Boshqacha yozib ko'ring yoki filtrni kengaytiring."
              />
            )
          }
        />
      )}

      <FilterSheet
        open={sheetOpen}
        value={filters}
        onClose={() => setSheetOpen(false)}
        onApply={setFilters}
      />
    </View>
  );
}
