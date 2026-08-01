import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { registerSchema } from '@gozal/shared/schemas/auth.schema';

import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, PhoneInput } from '../../components/ui';

const ROLES = [
  { value: 'client', label: 'Mijozman', hint: 'Salonlarga yozilaman' },
  { value: 'owner', label: 'Salon egasiman', hint: 'Salonimni qo\u2019shaman' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ fullName: '', phone: '', password: '', role: 'client' });
  const [errors, setErrors] = useState({});

  const register = useMutation({
    mutationFn: async () => {
      const parsed = registerSchema.safeParse(form);

      if (!parsed.success) {
        const fieldErrors = {};
        for (const issue of parsed.error.issues) fieldErrors[issue.path[0]] = issue.message;
        setErrors(fieldErrors);
        throw new Error('validation');
      }

      setErrors({});
      return api.auth.register(parsed.data);
    },

    onSuccess: async (data) => {
      await setAuth(data);
      router.replace('/(tabs)');
    },

    onError: (error) => {
      if (error.message === 'validation') return;
      setErrors({ form: error.message || "Ro'yxatdan o'tishda xatolik" });
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
        <Text className="text-2xl font-bold text-gray-900">Ro&apos;yxatdan o&apos;tish</Text>

        <View className="mt-6 gap-4">
          <View>
            <Text className="mb-1.5 text-sm font-medium text-gray-700">Kim sifatida</Text>
            <View className="flex-row gap-2">
              {ROLES.map((role) => {
                const active = form.role === role.value;

                return (
                  <Pressable
                    key={role.value}
                    onPress={() => setForm({ ...form, role: role.value })}
                    className={`flex-1 rounded-xl border p-3 ${
                      active ? 'border-brand-600 bg-brand-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${active ? 'text-brand-700' : 'text-gray-700'}`}
                    >
                      {role.label}
                    </Text>
                    <Text className="mt-0.5 text-xs text-gray-500">{role.hint}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Input
            label="Ism familiya"
            value={form.fullName}
            onChangeText={(fullName) => setForm({ ...form, fullName })}
            error={errors.fullName}
          />

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
            textContentType="newPassword"
            hint="Kamida 6 belgi. Yozib qo'ying — SMS orqali tiklash yo'q"
            error={errors.password}
          />

          {errors.form && (
            <View className="rounded-xl bg-rose-50 px-3 py-2">
              <Text className="text-sm text-rose-700">{errors.form}</Text>
            </View>
          )}

          <Button fullWidth loading={register.isPending} onPress={() => register.mutate()}>
            Ro&apos;yxatdan o&apos;tish
          </Button>

          <Text className="text-center text-xs leading-5 text-gray-400">
            Davom etish orqali{' '}
            <Link href="/oferta" className="text-brand-700">
              ommaviy oferta
            </Link>{' '}
            va{' '}
            <Link href="/maxfiylik" className="text-brand-700">
              maxfiylik siyosati
            </Link>
            ga rozilik bildirasiz
          </Text>
        </View>

        <View className="mt-8 flex-row justify-center gap-1">
          <Text className="text-gray-500">Hisobingiz bormi?</Text>
          <Link href="/(auth)/kirish" className="font-semibold text-brand-700">
            Kirish
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
