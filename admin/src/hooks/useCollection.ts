import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, type QueryConstraint } from 'firebase/firestore';
import { db } from '../firebase';

/** Live Firestore collection with loading + error state. */
export function useCollection<T>(name: string, ...constraints: QueryConstraint[]) {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, name), ...constraints);
    return onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ ...(d.data() as T), id: d.id })));
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
    // constraints are static per call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  return { data, loading, error };
}
