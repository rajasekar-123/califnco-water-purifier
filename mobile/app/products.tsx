import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { ProductGrid } from '@/components/ProductGrid';
import { Button, Chip } from '@/components/ui';
import { colors } from '@/constants/theme';
import { filterAndSort, useProductList, type SortKey } from '@/hooks/useCatalog';
import { useCatalogStore } from '@/store/catalogStore';
import { useIsApprovedDealer } from '@/store/authStore';
import { unitPriceFor } from '@/store/cartLogic';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'priceAsc', label: 'Price: Low to High' },
  { key: 'priceDesc', label: 'Price: High to Low' },
  { key: 'rating', label: 'Top rated' },
];
const PRICE_CAPS = [0, 5000, 10000, 15000, 20000];

export default function Products() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const all = useProductList();
  const pricing = useCatalogStore((s) => s.pricing);
  const wholesale = useIsApprovedDealer();
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>('relevance');
  const [brand, setBrand] = useState('');
  const [maxPrice, setMaxPrice] = useState(0);
  const [inStockOnly, setInStock] = useState(false);

  const inCategory = useMemo(() => all.filter((p) => !category || p.category === category), [all, category]);
  const brands = useMemo(() => [...new Set(inCategory.map((p) => p.brand))].sort(), [inCategory]);
  const priceOf = useMemo(() => (p: (typeof all)[number]) => unitPriceFor(p, wholesale, pricing[p.id]), [wholesale, pricing]);
  const data = useMemo(
    () => filterAndSort(inCategory, { brand, maxPrice, inStockOnly, sort }, priceOf),
    [inCategory, brand, maxPrice, inStockOnly, sort, priceOf],
  );
  const activeFilters = Number(!!brand) + Number(!!maxPrice) + Number(inStockOnly) + Number(sort !== 'relevance');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title={category ?? 'All products'}
        right={
          <Pressable hitSlop={8} onPress={() => setOpen(true)}>
            <Ionicons name="options-outline" size={24} color={colors.navy} />
            {activeFilters > 0 && <View style={s.badge}><Text style={s.badgeText}>{activeFilters}</Text></View>}
          </Pressable>
        }
      />
      <Text style={s.count}>{data.length} products</Text>
      <ProductGrid data={data} />

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Filter & sort</Text>
              <Pressable onPress={() => setOpen(false)}><Ionicons name="close" size={24} color={colors.navy} /></Pressable>
            </View>
            <ScrollView>
              <Text style={s.group}>Sort by</Text>
              <View style={s.wrap}>{SORTS.map((o) => <Chip key={o.key} label={o.label} active={sort === o.key} onPress={() => setSort(o.key)} />)}</View>
              <Text style={s.group}>Brand</Text>
              <View style={s.wrap}>
                <Chip label="All" active={!brand} onPress={() => setBrand('')} />
                {brands.map((b) => <Chip key={b} label={b} active={brand === b} onPress={() => setBrand(b)} />)}
              </View>
              <Text style={s.group}>Max price</Text>
              <View style={s.wrap}>
                {PRICE_CAPS.map((c) => <Chip key={c} label={c ? `Up to ₹${c.toLocaleString('en-IN')}` : 'Any'} active={maxPrice === c} onPress={() => setMaxPrice(c)} />)}
              </View>
              <View style={s.switchRow}>
                <Text style={s.group}>In stock only</Text>
                <Switch value={inStockOnly} onValueChange={setInStock} trackColor={{ true: colors.aquaDark }} />
              </View>
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <Button style={{ flex: 1 }} variant="outline" title="Reset" onPress={() => { setSort('relevance'); setBrand(''); setMaxPrice(0); setInStock(false); }} />
              <Button style={{ flex: 1 }} title="Apply" onPress={() => setOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  count: { color: colors.muted, paddingHorizontal: 16, paddingVertical: 8, fontWeight: '600' },
  badge: { position: 'absolute', top: -6, right: -6, backgroundColor: colors.danger, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: 'rgba(10,31,68,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '80%' },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.navy },
  group: { fontWeight: '700', color: colors.navy, marginTop: 18, marginBottom: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
