import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductImage } from '@/components/ProductCard';
import { Button, EmptyState, QtyStepper } from '@/components/ui';
import { colors, inr, radius, shadow } from '@/constants/theme';
import { useIsApprovedDealer } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useCatalogStore } from '@/store/catalogStore';
import { priceCart } from '@/store/cartLogic';

export default function Cart() {
  const lines = useCartStore((s) => s.lines);
  const { setQty, remove } = useCartStore();
  const products = useCatalogStore((s) => s.products);
  const pricing = useCatalogStore((s) => s.pricing);
  const wholesale = useIsApprovedDealer();
  const cart = useMemo(() => priceCart(lines, products, wholesale, pricing), [lines, products, wholesale, pricing]);
  const belowMin = cart.lines.find((l) => l.qty < l.minQty);

  if (!cart.lines.length) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <EmptyState
          icon="cart-outline" title="Your cart is empty" hint="Add a purifier or spare part to get started."
          action={<Button title="Browse products" onPress={() => router.push('/products')} />}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Text style={s.title}>{wholesale ? 'Bulk order cart' : 'Cart'}</Text>
      <FlatList
        data={cart.lines}
        keyExtractor={(l) => l.product.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item: l }) => (
          <View style={s.row}>
            <Pressable onPress={() => router.push({ pathname: '/product/[id]', params: { id: l.product.id } })}>
              <View style={{ borderRadius: radius.md, overflow: 'hidden' }}><ProductImage uri={l.product.image} size={78} /></View>
            </Pressable>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text numberOfLines={2} style={s.name}>{l.product.name}</Text>
              <Text style={s.price}>{inr(l.unitPrice)}</Text>
              {l.qty < l.minQty && <Text style={s.warn}>Minimum {l.minQty} units for wholesale</Text>}
              <View style={s.bottom}>
                <QtyStepper qty={l.qty} max={l.product.stock} onChange={(q) => (q <= 0 ? remove(l.product.id) : setQty(l.product.id, q))} />
                <Text style={s.lineTotal}>{inr(l.lineTotal)}</Text>
              </View>
            </View>
          </View>
        )}
      />
      <View style={s.summary}>
        <View style={s.sumRow}><Text style={s.muted}>Subtotal</Text><Text style={s.val}>{inr(cart.subtotal)}</Text></View>
        <View style={s.sumRow}><Text style={s.muted}>Shipping</Text><Text style={s.val}>{cart.shipping ? inr(cart.shipping) : 'Free'}</Text></View>
        <View style={[s.sumRow, { marginTop: 4 }]}><Text style={s.total}>Total</Text><Text style={s.total}>{inr(cart.total)}</Text></View>
        <Button
          title={belowMin ? `Min ${belowMin.minQty} units of ${belowMin.product.name.slice(0, 20)}…` : 'Proceed to checkout'}
          disabled={!!belowMin}
          onPress={() => router.push('/checkout')}
          style={{ marginTop: 12 }}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: colors.navy, padding: 16, paddingBottom: 4 },
  row: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: radius.lg, padding: 12, marginBottom: 12, ...shadow },
  name: { fontWeight: '700', color: colors.navy },
  price: { color: colors.muted, marginTop: 2 },
  warn: { color: colors.danger, fontSize: 12, marginTop: 2 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  lineTotal: { fontWeight: '800', color: colors.navy, fontSize: 16 },
  summary: { backgroundColor: '#fff', padding: 16, paddingBottom: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...shadow },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  muted: { color: colors.muted },
  val: { fontWeight: '600', color: colors.text },
  total: { fontSize: 18, fontWeight: '800', color: colors.navy },
});
