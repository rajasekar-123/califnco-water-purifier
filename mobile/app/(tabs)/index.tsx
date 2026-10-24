import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ProductGrid } from '@/components/ProductGrid';
import { Card } from '@/components/ui';
import { CATEGORIES, CATEGORY_META } from '@/constants/categories';
import { colors, inr, radius } from '@/constants/theme';
import { useProductList } from '@/hooks/useCatalog';
import { useAuthStore, useIsApprovedDealer } from '@/store/authStore';
import { useOrders } from '@/hooks/useOrders';

const BANNERS = [
  { title: 'Pure water,\nzero worries', sub: 'RO + UV purifiers from ₹9,800', colors: [colors.navy, colors.aquaDark] as const, category: 'RO Water Purifiers' },
  { title: 'Free shipping\nover ₹5,000', sub: 'On all retail orders', colors: [colors.navy2, '#4F46E5'] as const, category: 'UV Water Purifiers' },
  { title: 'Service in\n48 hours', sub: 'Book installation & repair', colors: ['#0E97AA', '#12A150'] as const, category: '' },
];

function DealerDashboard() {
  const dealer = useAuthStore((s) => s.dealer);
  const { orders } = useOrders();
  const spend = orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
  return (
    <Card style={{ margin: 12, backgroundColor: colors.navy }}>
      <Text style={{ color: 'rgba(255,255,255,0.7)' }}>Dealer dashboard</Text>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginVertical: 4 }}>{dealer?.businessName}</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
        {[['Orders', String(orders.length)], ['Wholesale spend', inr(spend)]].map(([k, v]) => (
          <View key={k} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.md, padding: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{k}</Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{v}</Text>
          </View>
        ))}
      </View>
      <Text style={{ color: colors.aquaSoft, marginTop: 12, fontSize: 12 }}>Wholesale prices shown. Minimum quantities apply per product.</Text>
    </Card>
  );
}

export default function Home() {
  const { width } = useWindowDimensions();
  const products = useProductList();
  const profile = useAuthStore((s) => s.profile);
  const dealerApproved = useIsApprovedDealer();
  const [banner, setBanner] = useState(0);
  const ref = useRef<FlatList>(null);
  const top = useMemo(() => [...products].sort((a, b) => b.rating - a.rating).slice(0, 12), [products]);

  const header = (
    <View>
      <LinearGradient colors={[colors.navy, colors.navy2]} style={s.top}>
        <SafeAreaView edges={['top']}>
          <View style={s.row}>
            <View>
              <Text style={s.hi}>Hello, {profile?.name?.split(' ')[0] ?? 'there'} 👋</Text>
              <Text style={s.sub}>{dealerApproved ? 'Wholesale catalogue' : 'Find your perfect purifier'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable style={s.icon} onPress={() => router.push('/notifications')}><Ionicons name="notifications-outline" size={22} color="#fff" /></Pressable>
              <Pressable style={s.icon} onPress={() => router.push('/service-booking')}><Ionicons name="construct-outline" size={22} color="#fff" /></Pressable>
            </View>
          </View>
          <Pressable style={s.search} onPress={() => router.push('/search')}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <Text style={{ color: colors.muted, marginLeft: 8 }}>Search purifiers, filters, parts…</Text>
          </Pressable>
        </SafeAreaView>
      </LinearGradient>

      {dealerApproved && <DealerDashboard />}

      <FlatList
        ref={ref}
        data={BANNERS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(b) => b.title}
        onMomentumScrollEnd={(e) => setBanner(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ marginTop: 12 }}
        renderItem={({ item }) => (
          <Pressable
            style={{ width, paddingHorizontal: 12 }}
            onPress={() => router.push(item.category ? { pathname: '/products', params: { category: item.category } } : '/service-booking')}
          >
            <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.banner}>
              <View style={{ flex: 1 }}>
                <Text style={s.bannerTitle}>{item.title}</Text>
                <Text style={s.bannerSub}>{item.sub}</Text>
              </View>
              <Ionicons name="water" size={84} color="rgba(255,255,255,0.25)" />
            </LinearGradient>
          </Pressable>
        )}
      />
      <View style={s.dots}>
        {BANNERS.map((_, i) => <View key={i} style={[s.dot, i === banner && s.dotOn]} />)}
      </View>

      <Text style={s.section}>Shop by category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
        {CATEGORIES.map((c, i) => (
          <Animated.View key={c} entering={FadeInDown.delay(i * 40)}>
            <Pressable style={s.cat} onPress={() => router.push({ pathname: '/products', params: { category: c } })}>
              <View style={[s.catIcon, { backgroundColor: CATEGORY_META[c].tint + '1F' }]}>
                <Ionicons name={CATEGORY_META[c].icon} size={24} color={CATEGORY_META[c].tint} />
              </View>
              <Text numberOfLines={2} style={s.catText}>{c.replace(' Water', '')}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={[s.row, { paddingHorizontal: 16, marginTop: 8 }]}>
        <Text style={[s.section, { padding: 0 }]}>Top rated</Text>
        <Pressable onPress={() => router.push('/products')}><Text style={{ color: colors.aquaDark, fontWeight: '700' }}>See all</Text></Pressable>
      </View>
    </View>
  );

  return <View style={{ flex: 1, backgroundColor: colors.bg }}><ProductGrid data={top} header={header} /></View>;
}

const s = StyleSheet.create({
  top: { paddingHorizontal: 16, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  hi: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md, height: 48, paddingHorizontal: 14, marginTop: 16 },
  banner: { borderRadius: radius.lg, padding: 20, flexDirection: 'row', alignItems: 'center', height: 140 },
  bannerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 28 },
  bannerSub: { color: 'rgba(255,255,255,0.85)', marginTop: 6 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border, marginHorizontal: 3 },
  dotOn: { width: 18, backgroundColor: colors.aquaDark },
  section: { fontSize: 18, fontWeight: '800', color: colors.navy, padding: 16, paddingBottom: 10 },
  cat: { width: 84, alignItems: 'center', marginRight: 6 },
  catIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  catText: { fontSize: 11, textAlign: 'center', color: colors.text, fontWeight: '600', marginTop: 6 },
});
