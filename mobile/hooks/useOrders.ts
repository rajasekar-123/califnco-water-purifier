import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { watchAddresses, watchNotifications, watchOrders } from '@/services/userDataService';
import type { Address, AppNotification, Order } from '@/types';

function useLive<T>(subscribe: (uid: string, cb: (d: T[]) => void, err: (e: Error) => void) => () => void) {
  const uid = useAuthStore((s) => s.uid);
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    return subscribe(
      uid,
      (d) => { setData(d); setLoading(false); setError(null); },
      (e) => { setError(e.message); setLoading(false); },
    );
  }, [uid, subscribe]);
  return { data, loading, error };
}

export function useOrders() {
  const { data, loading, error } = useLive<Order>(watchOrders);
  return { orders: data, loading, error };
}
export function useAddresses() {
  const { data, loading, error } = useLive<Address>(watchAddresses);
  return { addresses: data, loading, error };
}
export function useNotifications() {
  const { data, loading, error } = useLive<AppNotification>(watchNotifications);
  return { notifications: data, loading, error };
}
