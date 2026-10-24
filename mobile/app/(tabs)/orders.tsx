import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, EmptyState, ErrorState, Skeleton, StatusPill } from '@/components/ui';
import { colors, inr, radius, shadow } from '@/constants/theme';
import { useOrders } from '@/hooks/useOrders';

export default function Orders() {
  const { orders, loading, error } = useOrders();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Text style={s.title}>My orders</Text>
      {loading ? (
        <View style={{ padding: 12, gap: 12 }}>{[0, 1, 2].map((i) => <Skeleton key={i} height={110} />)}</View>
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 90 }}
          ListEmptyComponent={
            <EmptyState icon="receipt-outline" title="No orders yet" hint="Your orders will appear here."
              action={<Button title="Start shopping" onPress={() => router.push('/products')} />} />
          }
          renderItem={({ item: o }) => (
            <View style={s.card}>
              <View style={s.head}>
                <Text style={s.id}>#{o.id.slice(-8)}</Text>
                <StatusPill status={o.status} />
              </View>
              <Text style={s.items} numberOfLines={2}>{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</Text>
              <View style={s.head}>
                <Text style={s.date}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}{o.type === 'wholesale' ? ' · Wholesale' : ''}</Text>
                <Text style={s.total}>{inr(o.total)}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: colors.navy, padding: 16, paddingBottom: 4 },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 14, marginBottom: 12, ...shadow },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { fontWeight: '800', color: colors.navy },
  items: { color: colors.text, marginVertical: 8 },
  date: { color: colors.muted, fontSize: 12 },
  total: { fontWeight: '800', color: colors.navy, fontSize: 16 },
});
