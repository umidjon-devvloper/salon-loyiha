import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { loginSchema } from '@gozal/shared/schemas/auth.schema';

import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, PhoneInput } from '../../components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ phone: '', password: '' });
  const [errors, setErrors] = useState({});

  const login = useMutation({
    mutationFn: async () => {
      // Backend bilan AYNI sxema — qoidalar ikki joyda ajralib ketmaydi
      const parsed = loginSchema.safeParse(form);

      if (!parsed.success) {
        const fieldErrors = {};
        for (const issue of parsed.error.issues) fieldErrors[issue.path[0]] = issue.message;
        setErrors(fieldErrors);
        throw new Error('validation');
      }

      setErrors({});
      return api.auth.login(parsed.data);
    },

    onSuccess: async (data) => {
      await setAuth(data);
      // Kirish ekraniga orqaga qaytib bo'lmasin
      router.replace(redirect || '/(tabs)');
    },

    onError: (error) => {
      if (error.message === 'validation') return;
      setErrors({ form: error.message || 'Kirishda xatolik' });
    },
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-bold text-gray-900">Kirish</Text>
        <Text className="mt-1 text-gray-500">Telefon raqamingiz va parolingiz bilan</Text>

        <View className="mt-8 gap-4">
          <PhoneInput
            value={form.phone}
            onChangeText={(phone) => setForm({ ...form, phone })}
            error={errors.phone}
          />

          <Input
            label="Parol"
            value={form.password}
            onChangeText={(password) => setForm({ ...form, password })}
            secureTextEntry
            textContentType="password"
            error={errors.password}
          />

          {errors.form && (
            <View className="rounded-xl bg-rose-50 px-3 py-2">
              <Text className="text-sm text-rose-700">{errors.form}</Text>
            </View>
          )}

          <Button fullWidth loading={login.isPending} onPress={() => login.mutate()}>
            Kirish
          </Button>

          {/* SMS orqali tiklash yo'q — foydalanuvchi buni oldindan bilsin */}
          <Text className="text-center text-sm text-gray-400">
            Parolni unutsangiz, administratorga murojaat qiling
          </Text>
        </View>

        <View className="mt-8 flex-row justify-center gap-1">
          <Text className="text-gray-500">Hisobingiz yo&apos;qmi?</Text>
          <Link href="/(auth)/royxat" className="font-semibold text-brand-700">
            Ro&apos;yxatdan o&apos;tish
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
