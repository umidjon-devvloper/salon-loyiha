import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarCheck, ChevronRight, Heart, Settings, Store, User } from 'lucide-react-native';

import { formatPhone } from '@gozal/shared/utils/format';
import tokens from '@gozal/shared/tokens';

import { useAuth } from '../../hooks/useAuth';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';

function Row({ icon: Icon, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="mb-2 min-h-[56px] flex-row items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 active:bg-brand-50"
    >
      <Icon size={18} color={tokens.colors.brand[500]} />
      <Text className="flex-1 text-base text-gray-900">{label}</Text>
      <ChevronRight size={18} color="#9CA3AF" />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated, isHydrated, logout, role } = useAuth();

  // Tokenlar SecureStore'dan o'qilgunicha kutamiz, aks holda kirgan
  // foydalanuvchi bir lahzaga "kirmagansiz" ekranini ko'radi
  if (!isHydrated) return <Spinner className="flex-1" />;

  if (!isAuthenticated) {
    return (
      <View className="flex-1 justify-center bg-white" style={{ paddingTop: insets.top }}>
        <EmptyState
          icon={User}
          title="Hisobingizga kiring"
          description="Yozuvlaringizni ko'rish va band qilish uchun kirish kerak."
          action={<Button onPress={() => router.push('/(auth)/kirish')}>Kirish</Button>}
        />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingTop: insets.top + 12, padding: 16 }}
    >
      <Card className="mb-4">
        <Text className="text-lg font-semibold text-gray-900">{user.fullName}</Text>
        <Text className="mt-0.5 text-gray-500">{formatPhone(user.phone)}</Text>
      </Card>

      <Row
        icon={CalendarCheck}
        label="Yozuvlarim"
        onPress={() => router.push('/(tabs)/yozuvlarim')}
      />
      <Row icon={Heart} label="Sevimlilar" onPress={() => router.push('/(tabs)/sevimlilar')} />

      {role === 'owner' && (
        <Row icon={Store} label="Salon kabineti" onPress={() => router.push('/kabinet')} />
      )}

      <Row icon={Settings} label="Sozlamalar" onPress={() => router.push('/sozlamalar')} />

      <View className="mt-6">
        <Button variant="ghost" fullWidth onPress={logout}>
          Chiqish
        </Button>
      </View>
    </ScrollView>
  );
}
