import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/theme';
import { ONBOARDED_KEY } from '@/constants/storage';
import { firebaseConfigured } from '@/services/firebase';


export default function Splash() {
  const { ready, uid, profile, dealer } = useAuthStore();

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(async () => {
      const seen = await AsyncStorage.getItem(ONBOARDED_KEY).catch(() => null);
      if (!uid) return router.replace(seen ? '/(auth)/login' : '/onboarding');
      if (profile?.role === 'dealer' && dealer?.status !== 'approved') return router.replace('/dealer-status');
      router.replace('/(tabs)');
    }, 1400);
    return () => clearTimeout(t);
  }, [ready, uid, profile, dealer]);

  return (
    <LinearGradient colors={[colors.navy, colors.navy2, colors.aquaDark]} style={s.root}>
      <Animated.View entering={FadeIn.duration(700)} style={s.logo}>
        <Ionicons name="water" size={56} color="#fff" />
      </Animated.View>
      <Animated.Text entering={FadeInDown.delay(300).duration(600)} style={s.title}>Califnco</Animated.Text>
      <Animated.Text entering={FadeInDown.delay(500).duration(600)} style={s.sub}>Pure water, delivered.</Animated.Text>
      {!firebaseConfigured && (
        <View style={s.warn}><Text style={s.warnText}>Firebase is not configured. Copy .env.example to .env and fill it in.</Text></View>
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 104, height: 104, borderRadius: 52, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 18, letterSpacing: 1 },
  sub: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 6 },
  warn: { position: 'absolute', bottom: 60, marginHorizontal: 24, backgroundColor: 'rgba(0,0,0,0.35)', padding: 12, borderRadius: 12 },
  warnText: { color: '#fff', textAlign: 'center' },
});
