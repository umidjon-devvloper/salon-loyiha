import { useEffect } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';

import { SalonCard } from '../../components/SalonCard';
import { Button, EmptyState, Spinner } from '../../components/ui';
import { useFavoritesStore } from '../../store/favoritesStore';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const items = useFavoritesStore((s) => s.items);
  const isHydrated = useFavoritesStore((s) => s.isHydrated);
  const hydrate = useFavoritesStore((s) => s.hydrate);

  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [isHydrated, hydrate]);

  if (!isHydrated) return <Spinner className="flex-1 bg-white" />;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <Text className="px-4 pb-3 text-xl font-bold text-gray-900">Sevimlilar</Text>

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Sevimlilar bo'sh"
          description="Yoqqan salonni kartochkasidagi yurak belgisi bilan saqlang."
          action={
            <Button onPress={() => router.push('/(tabs)/qidiruv')}>Salonlarni ko&apos;rish</Button>
          }
        />
      ) : (
        <>
          {/* Qurilmada saqlanishini ochiq aytamiz — boshqa telefonda bo'sh
              ro'yxatni ko'rgan odam buni xato deb o'ylamasin */}
          <Text className="px-4 pb-2 text-sm text-gray-400">
            Sevimlilar shu qurilmada saqlanadi
          </Text>

          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 12 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <SalonCard salon={item} />}
          />
        </>
      )}
    </View>
  );
}
