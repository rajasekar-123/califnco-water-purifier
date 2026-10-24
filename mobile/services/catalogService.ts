import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { DealerPricing, Product } from '@/types';

export async function fetchProducts(): Promise<Product[]> {
  const snap = await getDocs(collection(db, 'products'));
  return snap.docs.map((d) => ({ ...(d.data() as Product), id: d.id })).filter((p) => p.active !== false);
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const s = await getDoc(doc(db, 'products', id));
  return s.exists() ? ({ ...(s.data() as Product), id: s.id }) : null;
}

/** Rules only allow approved dealers/admins to read this; others get permission-denied. */
export async function fetchDealerPricing(): Promise<Record<string, DealerPricing>> {
  const snap = await getDocs(collection(db, 'dealerPricing'));
  return Object.fromEntries(snap.docs.map((d) => [d.id, { ...(d.data() as DealerPricing), productId: d.id }]));
}
