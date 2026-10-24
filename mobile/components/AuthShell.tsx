import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '@/constants/theme';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[colors.navy, colors.navy2]} style={s.top}>
        <SafeAreaView edges={['top']} style={s.topInner}>
          <View style={s.logo}><Ionicons name="water" size={28} color="#fff" /></View>
          <Text style={s.title}>{title}</Text>
          <Text style={s.sub}>{subtitle}</Text>
        </SafeAreaView>
      </LinearGradient>
      <ScrollView style={s.sheet} contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  top: { paddingBottom: 36 },
  topInner: { paddingHorizontal: 24, paddingTop: 16 },
  logo: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 14 },
  sub: { color: 'rgba(255,255,255,0.75)', marginTop: 4, fontSize: 15 },
  sheet: { flex: 1, backgroundColor: colors.bg, marginTop: -20, borderTopLeftRadius: radius.lg + 8, borderTopRightRadius: radius.lg + 8 },
});
