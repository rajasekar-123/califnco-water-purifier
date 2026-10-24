import { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { colors } from '@/constants/theme';
import { ONBOARDED_KEY } from '@/constants/storage';

const SLIDES = [
  { icon: 'water', title: 'Pure water, every day', body: 'RO, UV and UF purifiers from trusted brands, picked for your home or office.' },
  { icon: 'construct', title: 'Parts & service, sorted', body: 'Membranes, cartridges and spares in one place — and book a technician in a few taps.' },
  { icon: 'storefront', title: 'Dealers get wholesale', body: 'Register as a dealer, get approved, and order in bulk at dealer prices.' },
] as const;

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList>(null);

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, '1').catch(() => {});
    router.replace('/(auth)/login');
  };
  const next = () => (index === SLIDES.length - 1 ? finish() : ref.current?.scrollToIndex({ index: index + 1 }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        ref={ref}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.title}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[s.slide, { width }]}>
            <View style={s.badge}><Ionicons name={item.icon} size={72} color={colors.aquaDark} /></View>
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.body}>{item.body}</Text>
          </View>
        )}
      />
      <View style={s.footer}>
        <View style={s.dots}>
          {SLIDES.map((_, i) => <View key={i} style={[s.dot, i === index && s.dotActive]} />)}
        </View>
        <Button title={index === SLIDES.length - 1 ? 'Get started' : 'Next'} onPress={next} />
        {index < SLIDES.length - 1 && <Button title="Skip" variant="ghost" onPress={finish} />}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  slide: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  badge: { width: 168, height: 168, borderRadius: 84, backgroundColor: colors.aquaSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  title: { fontSize: 26, fontWeight: '800', color: colors.navy, textAlign: 'center' },
  body: { fontSize: 16, color: colors.muted, textAlign: 'center', marginTop: 12, lineHeight: 23 },
  footer: { padding: 24, gap: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border, marginHorizontal: 4 },
  dotActive: { width: 24, backgroundColor: colors.aquaDark },
});
