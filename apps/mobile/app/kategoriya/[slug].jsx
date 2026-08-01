import { FlatList, Pressable, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, SearchX } from 'lucide-react-native';

import { api, queryKeys } from '../../lib/api';
import { SalonCard, SalonCardSkeleton } from '../../components/SalonCard';
import { EmptyState, ErrorState } from '../../components/ui';

/** Kategoriya bo'yicha salonlar. Filtr bu yerda yo'q — qidiruv tabida bor */
export default function CategoryScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const categories = useQuery({
    queryKey: queryKeys.categories,
    queryFn: api.catalog.categories,
    staleTime: 5 * 60_000,
  });

  const params = { category: slug, sort: 'top', page: 1, limit: 20 };

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.salons(params),
    queryFn: () => api.catalog.salons(params),
  });

  const name = (categories.data || []).find((c) => c.slug === slug)?.name || 'Salonlar';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center gap-2 px-4 pb-3">
          <Pressable onPress={() => router.back()} accessibilityLabel="Orqaga" className="p-1">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="flex-1 text-xl font-bold text-gray-900">{name}</Text>
        </View>

        {isError ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <FlatList
            data={data?.items || []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 12 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <SalonCard salon={item} />}
            ListEmptyComponent={
              isPending ? (
                <View className="gap-3">
                  {[0, 1, 2].map((i) => (
                    <SalonCardSkeleton key={i} />
                  ))}
                </View>
              ) : (
                <EmptyState
                  icon={SearchX}
                  title="Bu kategoriyada salon yo'q"
                  description="Boshqa kategoriyani ko'rib chiqing."
                />
              )
            }
          />
        )}
      </View>
    </>
  );
}
