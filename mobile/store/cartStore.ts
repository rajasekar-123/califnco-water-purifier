import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartLine } from '@/types';
import { addLine, setLineQty } from './cartLogic';

interface CartState {
  lines: CartLine[];
  add: (productId: string, qty?: number, startQty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (productId, qty = 1, startQty = 1) => set((s) => ({ lines: addLine(s.lines, productId, qty, startQty) })),
      setQty: (productId, qty) => set((s) => ({ lines: setLineQty(s.lines, productId, qty) })),
      remove: (productId) => set((s) => ({ lines: setLineQty(s.lines, productId, 0) })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'califnco-cart', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
