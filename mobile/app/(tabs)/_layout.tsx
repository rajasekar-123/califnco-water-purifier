import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useCartStore } from '@/store/cartStore';

const icon = (name: keyof typeof Ionicons.glyphMap, focused: keyof typeof Ionicons.glyphMap) =>
  ({ color, focused: f, size }: { color: ColorValue; focused: boolean; size: number }) =>
    <Ionicons name={f ? focused : name} size={size} color={color as string} />;

export default function TabsLayout() {
  const count = useCartStore((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.aquaDark,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
        tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6, borderTopWidth: 0, elevation: 12, backgroundColor: '#fff' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="categories" options={{ title: 'Categories', tabBarIcon: icon('grid-outline', 'grid') }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart', tabBarIcon: icon('cart-outline', 'cart'),
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger },
        }}
      />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: icon('receipt-outline', 'receipt') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-outline', 'person') }} />
    </Tabs>
  );
}
