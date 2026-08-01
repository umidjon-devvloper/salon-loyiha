import { Pressable, Text, View } from 'react-native';

/**
 * Bo'sh vaqtlar.
 *
 * Mobilda 3 ustun (web'da 6): 360px kenglikda 6 ustun har biri ~55px
 * bo'ladi va "09:15" matni sig'maydi. Har katak balandligi 48px —
 * barmoq uchun eng kichik qulay o'lcham.
 */
export function SlotGrid({ slots = [], value, onChange }) {
  return (
    <View className="flex-row flex-wrap">
      {slots.map((slot) => {
        const active = value === slot.startMin;

        return (
          <View key={slot.startMin} className="w-1/3 p-1">
            <Pressable
              onPress={() => onChange(slot)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={`min-h-[48px] items-center justify-center rounded-xl border ${
                active ? 'border-brand-600 bg-brand-600' : 'border-gray-200 bg-white'
              }`}
            >
              <Text className={`text-base font-medium ${active ? 'text-white' : 'text-gray-800'}`}>
                {slot.start}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

export function SlotGridSkeleton() {
  return (
    <View className="flex-row flex-wrap">
      {Array.from({ length: 9 }).map((_, i) => (
        <View key={i} className="w-1/3 p-1">
          <View className="h-12 rounded-xl bg-gray-100" />
        </View>
      ))}
    </View>
  );
}

export default SlotGrid;
