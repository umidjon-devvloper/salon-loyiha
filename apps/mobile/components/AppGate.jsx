import { Linking, Platform, Text, View } from 'react-native';
import { ArrowUpCircle, Wrench } from 'lucide-react-native';

import { useAppVersion } from '../hooks/useAppVersion';
import { Button } from './ui';

/**
 * Ilovaga kirishdan oldingi to'siq.
 *
 * Ikki holatda ekran ko'rsatiladi va oldinga o'tkazilmaydi:
 *  - versiya juda eski (`minVersion`)
 *  - texnik ish (`maintenance`)
 *
 * Qolgan hollarda hech narsa qilmaydi — tarmoq yo'q bo'lsa ham ilova
 * ochilaveradi, aks holda internetsiz joyda ilova umuman ishlamay qoladi.
 */
export function AppGate({ children }) {
  const { updateRequired, maintenance, maintenanceMessage, updateUrl } = useAppVersion();

  if (maintenance) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
          <Wrench size={30} color="#D97706" />
        </View>
        <Text className="mt-4 text-lg font-semibold text-gray-900">Texnik ishlar</Text>
        <Text className="mt-2 text-center leading-6 text-gray-600">
          {maintenanceMessage || "Bir ozdan keyin urinib ko'ring"}
        </Text>
      </View>
    );
  }

  if (updateRequired) {
    const url = Platform.OS === 'ios' ? updateUrl?.ios : updateUrl?.android;

    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
          <ArrowUpCircle size={30} color="#F4407D" />
        </View>

        <Text className="mt-4 text-lg font-semibold text-gray-900">Ilovani yangilang</Text>
        <Text className="mt-2 text-center leading-6 text-gray-600">
          Ushbu versiya endi qo&apos;llab-quvvatlanmaydi. Davom etish uchun yangi versiyani
          o&apos;rnating.
        </Text>

        {url && (
          <View className="mt-6 w-full">
            <Button fullWidth onPress={() => Linking.openURL(url)}>
              Yangilash
            </Button>
          </View>
        )}
      </View>
    );
  }

  return children;
}

export default AppGate;
