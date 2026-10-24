import type { Product } from '@/types';

export type SortKey = 'relevance' | 'priceAsc' | 'priceDesc' | 'rating';

export function filterAndSort(
  list: Product[],
  o: { q?: string; category?: string; brand?: string; maxPrice?: number; inStockOnly?: boolean; sort?: SortKey },
  priceOf: (p: Product) => number,
): Product[] {
  const q = o.q?.trim().toLowerCase();
  const out = list.filter(
    (p) =>
      (!o.category || p.category === o.category) &&
      (!o.brand || p.brand === o.brand) &&
      (!o.inStockOnly || p.stock > 0) &&
      (!o.maxPrice || priceOf(p) <= o.maxPrice) &&
      (!q || `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q)),
  );
  if (o.sort === 'priceAsc') out.sort((a, b) => priceOf(a) - priceOf(b));
  else if (o.sort === 'priceDesc') out.sort((a, b) => priceOf(b) - priceOf(a));
  else if (o.sort === 'rating') out.sort((a, b) => b.rating - a.rating);
  return out;
}
