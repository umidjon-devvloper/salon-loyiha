import { useEffect, useMemo, useRef } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { addDays, todayStr, weekdayOf, WEEKDAYS_UZ } from '@gozal/shared/utils/time';

/**
 * Gorizontal kunlar lentasi.
 *
 * ⚠️ Web'dagi 42 katakli oylik grid mobilda ishlamaydi: 360px kenglikda
 * har katak ~45px bo'ladi va barmoq bilan aniq tegib bo'lmaydi. Shuning
 * uchun mobilda kunlar lenta ko'rinishida — bir barmoq harakati bilan
 * varaqlanadi.
 *
 * `days` — `GET /availability/days` javobi: qaysi kunda joy bor.
 */
const DAY_COUNT = 30;
const ITEM_WIDTH = 62;

export function DateStrip({ value, onChange, days = {}, from = todayStr() }) {
  const listRef = useRef(null);

  const dates = useMemo(
    () => Array.from({ length: DAY_COUNT }, (_, i) => addDays(from, i)),
    [from],
  );

  // Tanlangan kun ko'rinmay qolmasin
  useEffect(() => {
    if (!value) return;
    const index = dates.indexOf(value);
    if (index > 2) listRef.current?.scrollToIndex({ index: index - 2, animated: true });
  }, [value, dates]);

  return (
    <FlatList
      ref={listRef}
      horizontal
      data={dates}
      keyExtractor={(date) => date}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      getItemLayout={(_, index) => ({
        length: ITEM_WIDTH + 8,
        offset: (ITEM_WIDTH + 8) * index,
        index,
      })}
      // Ro'yxat hali o'lchanmagan bo'lsa scrollToIndex yiqilmasin
      onScrollToIndexFailed={() => {}}
      renderItem={({ item: date }) => {
        const info = days[date];
        const disabled = !info?.available;
        const active = date === value;
        const isToday = date === todayStr();

        return (
          <Pressable
            onPress={() => !disabled && onChange(date)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
            className={`h-[72px] items-center justify-center rounded-2xl border ${
              active
                ? 'border-brand-600 bg-brand-600'
                : disabled
                  ? 'border-gray-100 bg-gray-50'
                  : 'border-gray-200 bg-white'
            }`}
            style={{ width: ITEM_WIDTH }}
          >
            <Text
              className={`text-xs ${
                active ? 'text-white/80' : disabled ? 'text-gray-300' : 'text-gray-500'
              }`}
            >
              {WEEKDAYS_UZ[weekdayOf(date)].slice(0, 2)}
            </Text>

            <Text
              className={`mt-0.5 text-lg font-semibold ${
                active ? 'text-white' : disabled ? 'text-gray-300' : 'text-gray-900'
              }`}
            >
              {Number(date.slice(8, 10))}
            </Text>

            {/* Joy bor kunda nuqta — mijoz bo'sh kunni qidirib yurmasin */}
            <View
              className={`mt-0.5 h-1 w-1 rounded-full ${
                disabled ? 'bg-transparent' : active ? 'bg-white' : 'bg-brand-400'
              }`}
            />

            {isToday && !active && (
              <View className="absolute inset-x-2 bottom-1 h-[2px] rounded bg-brand-300" />
            )}
          </Pressable>
        );
      }}
    />
  );
}

export default DateStrip;
