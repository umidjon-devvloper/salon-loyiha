import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { api, queryKeys } from '../../lib/api';
import { CategoryGrid } from '../../components/CategoryGrid';
import { SalonCard, SalonCardSkeleton } from '../../components/SalonCard';

/** Bosh sahifa — maketga muvofiq: banner, kategoriyalar, TOP salonlar */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const categories = useQuery({
    queryKey: queryKeys.categories,
    queryFn: api.catalog.categories,
    staleTime: 5 * 60_000,
  });

  const topParams = { sort: 'top', page: 1, limit: 6 };
  const topSalons = useQuery({
    queryKey: queryKeys.salons(topParams),
    queryFn: () => api.catalog.salons(topParams),
  });

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4">
        <Text className="text-2xl font-bold text-gray-900">
          O&apos;z go&apos;zalligingizni kashf eting
        </Text>
        <Text className="mt-1 text-gray-500">
          Bo&apos;sh vaqtni ko&apos;ring va navbatingizni band qiling
        </Text>
      </View>

      <View className="mt-6 px-4">
        <Text className="mb-3 text-base font-semibold text-gray-900">Kategoriyalar</Text>
        <CategoryGrid categories={categories.data || []} loading={categories.isPending} />
      </View>

      <View className="mt-6 px-4">
        <Text className="mb-3 text-base font-semibold text-gray-900">Tavsiya etamiz</Text>

        {topSalons.isPending ? (
          <View className="gap-3">
            {[0, 1, 2].map((i) => (
              <SalonCardSkeleton key={i} />
            ))}
          </View>
        ) : (
          <View className="gap-3">
            {(topSalons.data?.items || []).map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
