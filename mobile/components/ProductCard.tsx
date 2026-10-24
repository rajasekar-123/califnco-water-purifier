import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, inr, radius, shadow } from '@/constants/theme';
import { usePrice } from '@/hooks/usePrice';
import { useCartStore } from '@/store/cartStore';
import type { Product } from '@/types';

export function ProductImage({ uri, size, category }: { uri?: string; size?: number; category?: string }) {
  const box = size ? { width: size, height: size } : { width: '100%' as const, aspectRatio: 1 };
  if (!uri) {
    return (
      <LinearGradient colors={[colors.aquaSoft, '#CDEFF5']} style={[box, s.placeholder]}>
        <Ionicons name="water" size={(size ?? 120) / 3} color={colors.aquaDark} />
        {category && size === undefined && <Text style={s.phText}>{category}</Text>}
      </LinearGradient>
    );
  }
  return <Image source={{ uri }} style={box} contentFit="cover" transition={200} />;
}

function ProductCardBase({ product }: { product: Product }) {
  const { unitPrice, minQty, wholesale } = usePrice(product.id);
  const add = useCartStore((st) => st.add);
  const out = product.stock <= 0;
  return (
    <Pressable style={s.card} onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}>
      <View style={s.imgWrap}>
        <ProductImage uri={product.image} category={product.category} />
        {out && <View style={s.outBadge}><Text style={s.outText}>Out of stock</Text></View>}
      </View>
      <View style={{ padding: 10 }}>
        <Text style={s.brand}>{product.brand}</Text>
        <Text numberOfLines={2} style={s.name}>{product.name}</Text>
        <View style={s.rating}>
          <Ionicons name="star" size={12} color={colors.warning} />
          <Text style={s.ratingText}>{product.rating.toFixed(1)}</Text>
        </View>
        <View style={s.bottom}>
          <View>
            <Text style={s.price}>{inr(unitPrice)}</Text>
            {wholesale && <Text style={s.was}>{inr(product.price)}</Text>}
          </View>
          <Pressable
            disabled={out}
            onPress={() => add(product.id, minQty, minQty)}
            hitSlop={6}
            style={[s.addBtn, out && { opacity: 0.4 }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export const ProductCard = memo(ProductCardBase);

const s = StyleSheet.create({
  card: { flex: 1, margin: 6, backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden', ...shadow },
  imgWrap: { backgroundColor: colors.aquaSoft },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  phText: { color: colors.aquaDark, fontSize: 11, marginTop: 4, fontWeight: '600' },
  outBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.danger, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  outText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  brand: { fontSize: 11, color: colors.muted, fontWeight: '600', textTransform: 'uppercase' },
  name: { fontSize: 14, fontWeight: '700', color: colors.navy, marginTop: 2, minHeight: 38 },
  rating: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { marginLeft: 4, fontSize: 12, color: colors.muted, fontWeight: '600' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  price: { fontSize: 16, fontWeight: '800', color: colors.navy },
  was: { fontSize: 11, color: colors.muted, textDecorationLine: 'line-through' },
  addBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.aquaDark, alignItems: 'center', justifyContent: 'center' },
});
