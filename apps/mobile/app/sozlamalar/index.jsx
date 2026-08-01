import { Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, FileText, Shield, Trash2 } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

const SITE = 'https://gozalayol.uz';

function Row({ icon: Icon, label, danger = false, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="min-h-[56px] flex-row items-center gap-3 border-b border-gray-100 px-4 active:bg-gray-50"
    >
      <Icon size={18} color={danger ? '#E11D48' : '#6B7280'} />
      <Text className={`flex-1 text-base ${danger ? 'text-rose-600' : 'text-gray-900'}`}>
        {label}
      </Text>
      <ChevronRight size={18} color="#D1D5DB" />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center gap-2 px-4 pb-3">
          <Pressable onPress={() => router.back()} accessibilityLabel="Orqaga" className="p-1">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="flex-1 text-xl font-bold text-gray-900">Sozlamalar</Text>
        </View>

        <View className="mt-2">
          <Row
            icon={FileText}
            label="Ommaviy oferta"
            onPress={() => WebBrowser.openBrowserAsync(`${SITE}/oferta`)}
          />
          <Row
            icon={Shield}
            label="Maxfiylik siyosati"
            onPress={() => WebBrowser.openBrowserAsync(`${SITE}/maxfiylik`)}
          />
        </View>

        {/* ⚠️ Apple talabi: ro'yxatdan o'tish bo'lgan ilovada foydalanuvchi
            hisobini ILOVA ICHIDAN o'chira olishi shart. Yo'q bo'lsa ilova
            App Store'da rad etiladi */}
        <View className="mt-8">
          <Row
            icon={Trash2}
            label="Hisobni o'chirish"
            danger
            onPress={() => router.push('/sozlamalar/hisobni-ochirish')}
          />
        </View>

        <Text className="mt-8 text-center text-sm text-gray-400">Versiya {version}</Text>
      </ScrollView>
    </>
  );
}
