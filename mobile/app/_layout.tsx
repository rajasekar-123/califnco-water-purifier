import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useCatalogLoader } from '@/hooks/useCatalog';
import { registerForPush } from '@/services/pushService';
import { saveCart } from '@/services/userDataService';
import { colors } from '@/constants/theme';

const PUBLIC_ROUTES = ['(auth)', 'onboarding', 'index', undefined];

function useSessionEffects() {
  const { init, uid, ready, profile, dealer } = useAuthStore();
  const segments = useSegments();
  const lines = useCartStore((s) => s.lines);

  useEffect(() => init(), [init]);
  useCatalogLoader();

  // Route guard: signed-out users go to login; unapproved dealers are held on the status screen.
  useEffect(() => {
    if (!ready) return;
    const top = segments[0] as string | undefined;
    if (!uid) {
      if (!PUBLIC_ROUTES.includes(top)) router.replace('/(auth)/login');
      return;
    }
    if (profile?.role === 'dealer' && dealer?.status !== 'approved' && top !== 'dealer-status') {
      router.replace('/dealer-status');
    }
  }, [ready, uid, profile, dealer, segments]);

  // Push token registration after sign-in.
  useEffect(() => {
    if (uid) registerForPush(uid);
  }, [uid]);

  // Open notifications screen when a push is tapped.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => router.push('/notifications'));
    return () => sub.remove();
  }, []);

  // Mirror the cart to Firestore (debounced) so it follows the account.
  useEffect(() => {
    if (!uid) return;
    const t = setTimeout(() => saveCart(uid, lines).catch(() => {}), 800);
    return () => clearTimeout(t);
  }, [uid, lines]);
}

export default function RootLayout() {
  useSessionEffects();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
