import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Brain,
  Camera,
  Dumbbell,
  Ellipsis,
  Footprints,
  Hand,
  HeartHandshake,
  Palette,
  Scissors,
  Smile,
  Sparkles,
  Wand,
} from 'lucide-react-native';

import { colors } from '@gozal/shared/theme';

/** Web'dagi CategoryIcon bilan bir xil xarita — ikonka nomlari bazadan keladi */
const ICONS = {
  sparkles: Sparkles,
  hand: Hand,
  footprints: Footprints,
  wand: Wand,
  smile: Smile,
  'heart-handshake': HeartHandshake,
  brain: Brain,
  palette: Palette,
  scissors: Scissors,
  dumbbell: Dumbbell,
  camera: Camera,
  ellipsis: Ellipsis,
};

/** Mobilda 3 ustun — maketdagidek */
export function CategoryGrid({ categories = [], loading = false }) {
  const router = useRouter();

  if (loading) {
    return (
      <View className="flex-row flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} className="w-1/3 p-1">
            <View className="h-24 rounded-2xl bg-gray-100" />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap">
      {categories.map((category) => {
        const Icon = ICONS[category.icon] || Sparkles;

        return (
          <View key={category.slug} className="w-1/3 p-1">
            <Pressable
              onPress={() => router.push(`/kategoriya/${category.slug}`)}
              className="items-center gap-2 rounded-2xl border border-brand-100 bg-white p-3 active:bg-brand-50"
            >
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                <Icon size={20} color={colors.brand[500]} />
              </View>
              <Text className="text-center text-xs font-medium text-gray-700" numberOfLines={2}>
                {category.name}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

export default CategoryGrid;
