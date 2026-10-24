import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES, CATEGORY_META } from '@/constants/categories';
import { colors, radius, shadow } from '@/constants/theme';
import { useProductList } from '@/hooks/useCatalog';

export default function Categories() {
  const products = useProductList();
  const counts = products.reduce<Record<string, number>>((m, p) => ({ ...m, [p.category]: (m[p.category] ?? 0) + 1 }), {});
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Text style={s.title}>Categories</Text>
      <FlatList
        data={[...CATEGORIES]}
        numColumns={2}
        keyExtractor={(c) => c}
        contentContainerStyle={{ padding: 10, paddingBottom: 90 }}
        renderItem={({ item }) => (
          <Pressable style={s.tile} onPress={() => router.push({ pathname: '/products', params: { category: item } })}>
            <View style={[s.icon, { backgroundColor: CATEGORY_META[item].tint + '1F' }]}>
              <Ionicons name={CATEGORY_META[item].icon} size={28} color={CATEGORY_META[item].tint} />
            </View>
            <Text style={s.name}>{item}</Text>
            <Text style={s.count}>{counts[item] ?? 0} products</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: colors.navy, padding: 16, paddingBottom: 6 },
  tile: { flex: 1, margin: 6, backgroundColor: '#fff', borderRadius: radius.lg, padding: 16, ...shadow },
  icon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name: { fontSize: 15, fontWeight: '700', color: colors.navy, minHeight: 38 },
  count: { color: colors.muted, fontSize: 12, marginTop: 4 },
});
