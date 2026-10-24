import { create } from 'zustand';
import { fetchDealerPricing, fetchProducts } from '@/services/catalogService';
import type { DealerPricing, Product } from '@/types';

interface CatalogState {
  products: Record<string, Product>;
  pricing: Record<string, DealerPricing>;
  loading: boolean;
  error: string | null;
  load: (wholesale: boolean) => Promise<void>;
}

export const useCatalogStore = create<CatalogState>((set) => ({
  products: {},
  pricing: {},
  loading: true,
  error: null,
  load: async (wholesale) => {
    set({ loading: true, error: null });
    try {
      const list = await fetchProducts();
      const pricing = wholesale ? await fetchDealerPricing() : {};
      set({ products: Object.fromEntries(list.map((p) => [p.id, p])), pricing, loading: false });
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },
}));
