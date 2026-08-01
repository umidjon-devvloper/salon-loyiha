import { Tabs } from 'expo-router';
import { Calendar, Heart, Home, Search, User } from 'lucide-react-native';

import { colors } from '@gozal/shared/theme';

/**
 * Pastdagi tab bar.
 *
 * Maketda "Xabarlar" tabi bor edi — chat v2 da bo'lgani uchun uning
 * o'rniga "Yozuvlarim" qo'yildi. Salon egasi kirganda tablar boshqacha
 * bo'ladi (keyingi bosqichda `role` bo'yicha almashtiriladi).
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand[600],
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { borderTopColor: colors.brand[100], height: 58, paddingBottom: 6 },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bosh sahifa',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="qidiruv"
        options={{
          title: 'Qidiruv',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="sevimlilar"
        options={{
          title: 'Sevimlilar',
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="yozuvlarim"
        options={{
          title: 'Yozuvlarim',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
