import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddressForm } from '@/components/AddressForm';
import { Header } from '@/components/Header';
import { Button, Card } from '@/components/ui';
import { colors, inr, radius } from '@/constants/theme';
import { useAddresses } from '@/hooks/useOrders';
import { api } from '@/services/api';
import { useAuthStore, useIsApprovedDealer } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useCatalogStore } from '@/store/catalogStore';
import { priceCart } from '@/store/cartLogic';

interface CreateOrderResponse {
  razorpayOrderId: string;
  amount: number;
  keyId: string;
}

export default function Checkout() {
  const lines = useCartStore((s) => s.lines);
  const products = useCatalogStore((s) => s.products);
  const pricing = useCatalogStore((s) => s.pricing);
  const wholesale = useIsApprovedDealer();
  const profile = useAuthStore((s) => s.profile);
  const { addresses } = useAddresses();
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const cart = useMemo(() => priceCart(lines, products, wholesale, pricing), [lines, products, wholesale, pricing]);
  const address = addresses.find((a) => a.id === selected) ?? addresses[0];
  useEffect(() => { if (!selected && addresses[0]) setSelected(addresses[0].id); }, [addresses, selected]);

  const pay = async () => {
    if (!address) return setError('Choose a delivery address.');
    setBusy(true);
    setError('');
    try {
      const { id, uid, ...addr } = address;
      void id; void uid;
      // The server re-prices the cart from Firestore; client totals are display-only.
      const res = await api<CreateOrderResponse>('create-order', {
        items: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
        address: addr,
      });
      router.push({
        pathname: '/payment',
        params: {
          orderId: res.razorpayOrderId, keyId: res.keyId, amount: String(res.amount),
          name: profile?.name ?? '', email: profile?.email ?? '', phone: address.phone,
        },
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!cart.lines.length) {
    return <View style={{ flex: 1 }}><Header title="Checkout" /><Text style={{ textAlign: 'center', marginTop: 40, color: colors.muted }}>Your cart is empty.</Text></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Checkout" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={s.h}>1 · Delivery address</Text>
        {adding ? (
          <Card><AddressForm onSaved={() => setAdding(false)} /></Card>
        ) : (
          <>
            {addresses.map((a) => (
              <Pressable key={a.id} onPress={() => setSelected(a.id)} style={[s.addr, address?.id === a.id && s.addrOn]}>
                <Ionicons name={address?.id === a.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={colors.aquaDark} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.label}>{a.label} · {a.fullName}</Text>
                  <Text style={s.line}>{a.line1}, {a.city}, {a.state} {a.pincode}</Text>
                  <Text style={s.line}>{a.phone}</Text>
                </View>
              </Pressable>
            ))}
            <Button title="Add new address" icon="add" variant="outline" onPress={() => setAdding(true)} />
          </>
        )}

        <Text style={s.h}>2 · Order summary</Text>
        <Card>
          {cart.lines.map((l) => (
            <View key={l.product.id} style={s.sumRow}>
              <Text style={{ flex: 1, color: colors.text }} numberOfLines={1}>{l.qty}× {l.product.name}</Text>
              <Text style={s.val}>{inr(l.lineTotal)}</Text>
            </View>
          ))}
          <View style={s.divider} />
          <View style={s.sumRow}><Text style={s.muted}>Subtotal</Text><Text style={s.val}>{inr(cart.subtotal)}</Text></View>
          <View style={s.sumRow}><Text style={s.muted}>Shipping</Text><Text style={s.val}>{cart.shipping ? inr(cart.shipping) : 'Free'}</Text></View>
          <View style={s.sumRow}><Text style={s.total}>Total</Text><Text style={s.total}>{inr(cart.total)}</Text></View>
        </Card>

        <Text style={s.h}>3 · Payment</Text>
        <Card><Text style={{ color: colors.text }}>Pay securely with Razorpay (test mode). Your order is created only after the server verifies the payment.</Text></Card>

        {error ? <Text style={{ color: colors.danger, marginTop: 14 }}>{error}</Text> : null}
        <SafeAreaView edges={['bottom']}>
          <Button title={`Pay ${inr(cart.total)}`} icon="lock-closed" onPress={pay} loading={busy} disabled={adding || !address} style={{ marginTop: 18 }} />
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  h: { fontSize: 17, fontWeight: '800', color: colors.navy, marginTop: 20, marginBottom: 10 },
  addr: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: radius.md, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: colors.border },
  addrOn: { borderColor: colors.aquaDark, backgroundColor: colors.aquaSoft },
  label: { fontWeight: '700', color: colors.navy },
  line: { color: colors.text, marginTop: 2 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 12 },
  muted: { color: colors.muted },
  val: { fontWeight: '600', color: colors.text },
  total: { fontSize: 18, fontWeight: '800', color: colors.navy },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
});
