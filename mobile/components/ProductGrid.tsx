import { FlatList, View } from 'react-native';
import { ProductCard } from './ProductCard';
import { EmptyState, ErrorState, Skeleton } from './ui';
import { useCatalogStore } from '@/store/catalogStore';
import { useAuthStore } from '@/store/authStore';
import type { Product } from '@/types';
import type { ReactElement } from 'react';

export function ProductGrid({ data, header }: { data: Product[]; header?: ReactElement }) {
  const { loading, error, load } = useCatalogStore();
  const role = useAuthStore((s) => s.profile?.role);
  const wholesale = role === 'dealer';

  if (loading) {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 6 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={{ width: '50%', padding: 6 }}><Skeleton height={230} /></View>
        ))}
      </View>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => load(wholesale)} />;

  return (
    <FlatList
      data={data}
      numColumns={2}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <ProductCard product={item} />}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState icon="search" title="No products found" hint="Try different filters or search terms." />}
      contentContainerStyle={{ padding: 6, paddingBottom: 90 }}
      initialNumToRender={8}
      showsVerticalScrollIndicator={false}
    />
  );
}
