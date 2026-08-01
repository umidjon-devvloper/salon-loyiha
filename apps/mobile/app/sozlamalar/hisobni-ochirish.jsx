import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { ChevronLeft, TriangleAlert } from 'lucide-react-native';

import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Button, Input } from '../../components/ui';

/**
 * Hisobni o'chirish — Apple talabi.
 *
 * ⚠️ Nima bo'lishini OLDINDAN, aniq yozamiz. "Hisob o'chiriladi" degan
 * umumiy gap yetarli emas: odam kelgusi yozuvlari ham bekor bo'lishini
 * bilmasdan bosib yuborishi mumkin.
 *
 * Parol so'raladi — telefonini boshqa odamga bergan foydalanuvchining
 * hisobi bir bosishda yo'q bo'lib ketmasin.
 */
export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const clear = useAuthStore((s) => s.logout);

  const [password, setPassword] = useState('');

  const remove = useMutation({
    mutationFn: () => api.auth.deleteAccount({ password }),

    onSuccess: async () => {
      await clear();
      router.replace('/(tabs)');
      Alert.alert('Hisob o\u2019chirildi', 'Xizmatdan foydalanganingiz uchun rahmat.');
    },

    onError: (error) => Alert.alert('Xatolik', error.message || 'Parol noto\u2019g\u2019ri'),
  });

  const confirm = () =>
    Alert.alert('Hisobni butunlay o\u2019chirasizmi?', 'Bu amalni ortga qaytarib bo\u2019lmaydi.', [
      { text: 'Yo\u2019q', style: 'cancel' },
      { text: 'Ha, o\u2019chirilsin', style: 'destructive', onPress: () => remove.mutate() },
    ]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1 bg-white"
        style={{ paddingTop: insets.top + 8 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-2 px-4 pb-3">
          <Pressable onPress={() => router.back()} accessibilityLabel="Orqaga" className="p-1">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="flex-1 text-xl font-bold text-gray-900">Hisobni o&apos;chirish</Text>
        </View>

        <View className="px-4">
          <View className="flex-row gap-3 rounded-2xl bg-rose-50 p-4">
            <TriangleAlert size={20} color="#E11D48" />
            <Text className="flex-1 leading-6 text-rose-900">
              Bu amalni ortga qaytarib bo&apos;lmaydi.
            </Text>
          </View>

          <Text className="mt-6 font-semibold text-gray-900">
            O&apos;chirilganda nima bo&apos;ladi
          </Text>

          <View className="mt-2 gap-2">
            <Text className="text-gray-600">• Ismingiz va telefon raqamingiz o&apos;chiriladi</Text>
            <Text className="text-gray-600">• Kelgusi yozuvlaringiz bekor qilinadi</Text>
            <Text className="text-gray-600">• Sevimlilar ro&apos;yxati yo&apos;qoladi</Text>
            <Text className="text-gray-600">
              • To&apos;lov yozuvlari buxgalteriya talabi bo&apos;yicha saqlanib qoladi
            </Text>
          </View>

          <Text className="mt-6 text-gray-600">Davom etish uchun parolingizni kiriting.</Text>

          <View className="mt-3">
            <Input
              label="Parol"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />
          </View>

          <View className="mt-6 gap-3">
            <Button
              variant="danger"
              fullWidth
              disabled={password.length < 1}
              loading={remove.isPending}
              onPress={confirm}
            >
              Hisobni o&apos;chirish
            </Button>

            <Button variant="ghost" fullWidth onPress={() => router.back()}>
              Bekor qilish
            </Button>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
