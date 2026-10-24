import { useEffect, useMemo } from 'react';
import { useCatalogStore } from '@/store/catalogStore';
import { useAuthStore, useIsApprovedDealer } from '@/store/authStore';
import type { Product } from '@/types';

/** Loads the catalogue once the user (and dealer approval) is known; re-loads if approval changes. */
export function useCatalogLoader() {
  const uid = useAuthStore((s) => s.uid);
  const wholesale = useIsApprovedDealer();
  const load = useCatalogStore((s) => s.load);
  useEffect(() => {
    if (uid) load(wholesale);
  }, [uid, wholesale, load]);
}

export function useProductList(): Product[] {
  const products = useCatalogStore((s) => s.products);
  return useMemo(() => Object.values(products).sort((a, b) => a.id.localeCompare(b.id)), [products]);
}

export { filterAndSort, type SortKey } from '@/store/catalogFilter';
