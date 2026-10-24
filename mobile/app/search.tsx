import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductGrid } from '@/components/ProductGrid';
import { colors, radius } from '@/constants/theme';
import { filterAndSort, useProductList } from '@/hooks/useCatalog';
import { useCatalogStore } from '@/store/catalogStore';
import { useIsApprovedDealer } from '@/store/authStore';
import { unitPriceFor } from '@/store/cartLogic';

export default function Search() {
  const [q, setQ] = useState('');
  const all = useProductList();
  const pricing = useCatalogStore((s) => s.pricing);
  const wholesale = useIsApprovedDealer();
  const results = useMemo(
    () => (q.trim() ? filterAndSort(all, { q }, (p) => unitPriceFor(p, wholesale, pricing[p.id])) : []),
    [all, q, wholesale, pricing],
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.bar}>
        <Pressable hitSlop={10} onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.navy} /></Pressable>
        <View style={s.input}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput autoFocus value={q} onChangeText={setQ} placeholder="Search products, brands, categories" placeholderTextColor={colors.muted} style={{ flex: 1, marginLeft: 8, color: colors.text }} returnKeyType="search" />
          {!!q && <Pressable onPress={() => setQ('')}><Ionicons name="close-circle" size={18} color={colors.muted} /></Pressable>}
        </View>
      </View>
      {q.trim() ? <ProductGrid data={results} /> : <Text style={s.hint}>Type to search the catalogue.</Text>}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  input: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md, height: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border },
  hint: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
