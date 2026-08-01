import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** TODO: keyingi bosqichda to'ldiriladi */
export default function Screen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 items-center justify-center bg-white"
      style={{ paddingTop: insets.top }}
    >
      <Text className="text-gray-400">Tayyorlanmoqda</Text>
    </View>
  );
}
