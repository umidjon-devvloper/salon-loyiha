import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, MapPin, Star } from 'lucide-react-native';

import tokens from '@gozal/shared/tokens';
import { formatPrice } from '@gozal/shared/utils/format';

import { useFavoritesStore } from '../store/favoritesStore';

/**
 * Salon kartochkasi.
 *
 * Web'da vertikal (grid), mobilda GORIZONTAL: telefon ekranida ro'yxat
 * bo'ylab skroll qilinadi va bir qarashda ko'proq salon ko'rinadi.
 *
 * `expo-image` ishlatiladi — u diskka keshlaydi, `Image` esa har safar
 * qaytadan yuklaydi.
 */
export function SalonCard({ salon }) {
  const router = useRouter();

  const isFavorite = useFavoritesStore((s) => s.items.some((i) => i.id === salon.id));
  const toggle = useFavoritesStore((s) => s.toggle);

  return (
    <Pressable
      onPress={() => router.push(`/salon/${salon.slug}`)}
      className="flex-row overflow-hidden rounded-2xl border border-brand-100 bg-white active:opacity-80"
    >
      <View className="h-28 w-28 bg-brand-50">
        {salon.coverThumb ? (
          <Image
            source={{ uri: salon.coverThumb }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={150}
            cachePolicy="disk"
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Text className="text-3xl font-semibold text-brand-400">{salon.name[0]}</Text>
          </View>
        )}
      </View>

      <View className="flex-1 justify-center p-3">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 font-semibold text-gray-900" numberOfLines={1}>
            {salon.name}
          </Text>
          {salon.isTop && (
            <View className="rounded-lg bg-brand-600 px-1.5 py-0.5">
              <Text className="text-[10px] font-semibold text-white">TOP</Text>
            </View>
          )}
        </View>

        <View className="mt-1 flex-row items-center gap-1">
          <MapPin size={13} color="#9CA3AF" />
          <Text className="flex-1 text-sm text-gray-500" numberOfLines={1}>
            {salon.district}
          </Text>
        </View>

        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-brand-700">
            {salon.minPrice > 0 ? `${formatPrice(salon.minPrice)}dan` : 'Narx kelishilgan'}
          </Text>

          <View className="flex-row items-center gap-3">
            {salon.reviewCount > 0 && (
              <View className="flex-row items-center gap-1">
                <Star size={13} color="#FBBF24" fill="#FBBF24" />
                <Text className="text-sm text-gray-600">{salon.rating.toFixed(1)}</Text>
              </View>
            )}

            {/* Kartochka bosilganda salon ochilmasin — hitSlop bilan
                barmoq uchun yetarli maydon beriladi */}
            <Pressable
              onPress={() => toggle(salon)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? 'Sevimlilardan olish' : 'Sevimlilarga qo\u2019shish'}
            >
              <Heart
                size={18}
                color={isFavorite ? tokens.colors.brand[500] : '#D1D5DB'}
                fill={isFavorite ? tokens.colors.brand[500] : 'transparent'}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function SalonCardSkeleton() {
  return (
    <View className="h-28 flex-row overflow-hidden rounded-2xl border border-brand-100 bg-white">
      <View className="h-28 w-28 bg-gray-100" />
      <View className="flex-1 justify-center gap-2 p-3">
        <View className="h-4 w-3/4 rounded bg-gray-100" />
        <View className="h-3 w-1/2 rounded bg-gray-100" />
        <View className="h-4 w-1/3 rounded bg-gray-100" />
      </View>
    </View>
  );
}

export default SalonCard;
