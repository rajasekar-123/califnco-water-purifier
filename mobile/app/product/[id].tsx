import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Header } from '@/components/Header';
import { ProductImage } from '@/components/ProductCard';
import { Button, EmptyState, QtyStepper } from '@/components/ui';
import { colors, inr, radius, shadow } from '@/constants/theme';
import { usePrice } from '@/hooks/usePrice';
import { useCartStore } from '@/store/cartStore';
import { useCatalogStore } from '@/store/catalogStore';

/** Pinch-to-zoom + double-tap reset image viewer (bonus feature). */
function ZoomViewer({ uri, onClose }: { uri: string; onClose: () => void }) {
  const scale = useSharedValue(1);
  const saved = useSharedValue(1);
  const pinch = Gesture.Pinch()
    .onUpdate((e) => { scale.value = Math.min(Math.max(saved.value * e.scale, 1), 5); })
    .onEnd(() => { saved.value = scale.value; });
  const dbl = Gesture.Tap().numberOfTaps(2).onEnd(() => {
    const target = scale.value > 1 ? 1 : 2.5;
    scale.value = withTiming(target);
    saved.value = target;
  });
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
        <GestureDetector gesture={Gesture.Simultaneous(pinch, dbl)}>
          <Animated.View style={style}><Image source={{ uri }} style={{ width: '100%', aspectRatio: 1 }} contentFit="contain" /></Animated.View>
        </GestureDetector>
        <Pressable onPress={onClose} style={s.close}><Ionicons name="close" size={28} color="#fff" /></Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useCatalogStore((st) => st.products[id]);
  const { unitPrice, minQty, wholesale } = usePrice(id);
  const add = useCartStore((st) => st.add);
  const inCart = useCartStore((st) => st.lines.find((l) => l.productId === id)?.qty ?? 0);
  const [qty, setQty] = useState(0);
  const [zoom, setZoom] = useState(false);
  const q = qty || minQty;

  if (!product) {
    return <View style={{ flex: 1 }}><Header title="Product" /><EmptyState icon="alert-circle-outline" title="Product not found" /></View>;
  }
  const out = product.stock <= 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title=""
        right={<Pressable hitSlop={8} onPress={() => router.push('/(tabs)/cart')}><Ionicons name="cart-outline" size={24} color={colors.navy} />{inCart > 0 && <View style={s.dot} />}</Pressable>}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        <Pressable onPress={() => product.image && setZoom(true)}>
          <ProductImage uri={product.image} category={product.category} />
          {!!product.image && <View style={s.zoomHint}><Ionicons name="expand" size={14} color="#fff" /><Text style={s.zoomText}>Tap to zoom</Text></View>}
        </Pressable>
        <View style={s.body}>
          <Text style={s.brand}>{product.brand} · {product.category}</Text>
          <Text style={s.name}>{product.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <Ionicons name="star" size={16} color={colors.warning} />
            <Text style={{ fontWeight: '700', color: colors.navy }}>{product.rating.toFixed(1)}</Text>
            <Text style={{ color: colors.muted }}>({product.ratingCount} ratings)</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 12 }}>
            <Text style={s.price}>{inr(unitPrice)}</Text>
            {wholesale && <Text style={s.was}>{inr(product.price)}</Text>}
            {wholesale && <View style={s.tag}><Text style={s.tagText}>Dealer price</Text></View>}
          </View>
          <Text style={{ color: out ? colors.danger : product.stock < 10 ? colors.warning : colors.success, fontWeight: '700', marginTop: 6 }}>
            {out ? 'Out of stock' : product.stock < 10 ? `Only ${product.stock} left` : 'In stock'}
          </Text>
          {wholesale && minQty > 1 && <Text style={{ color: colors.muted, marginTop: 4 }}>Minimum wholesale quantity: {minQty}</Text>}

          <Text style={s.section}>About this product</Text>
          <Text style={s.desc}>{product.description}</Text>

          <Text style={s.section}>Specifications</Text>
          <View style={s.specs}>
            {Object.entries(product.specs).map(([k, v], i) => (
              <View key={k} style={[s.specRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={s.specKey}>{k}</Text><Text style={s.specVal}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={s.bar}>
        <QtyStepper qty={q} min={minQty} max={product.stock} onChange={(n) => setQty(Math.max(n, minQty))} />
        <Button
          style={{ flex: 1 }}
          title={out ? 'Out of stock' : `Add to cart · ${inr(unitPrice * q)}`}
          disabled={out}
          onPress={() => { add(product.id, q, minQty); router.push('/(tabs)/cart'); }}
        />
      </SafeAreaView>
      {zoom && <ZoomViewer uri={product.image} onClose={() => setZoom(false)} />}
    </View>
  );
}

const s = StyleSheet.create({
  body: { backgroundColor: colors.bg, padding: 16, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  brand: { color: colors.aquaDark, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  name: { fontSize: 22, fontWeight: '800', color: colors.navy, marginTop: 4 },
  price: { fontSize: 28, fontWeight: '800', color: colors.navy },
  was: { fontSize: 16, color: colors.muted, textDecorationLine: 'line-through' },
  tag: { backgroundColor: colors.aquaSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { color: colors.aquaDark, fontWeight: '700', fontSize: 12 },
  section: { fontSize: 17, fontWeight: '800', color: colors.navy, marginTop: 22, marginBottom: 8 },
  desc: { color: colors.text, lineHeight: 22 },
  specs: { backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 14, ...shadow },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  specKey: { color: colors.muted }, specVal: { color: colors.navy, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  bar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#fff', ...shadow },
  dot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
  zoomHint: { position: 'absolute', right: 12, bottom: 32, flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: 'rgba(10,31,68,0.6)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  zoomText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  close: { position: 'absolute', top: 50, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});
