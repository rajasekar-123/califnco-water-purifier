import { useMemo, useState } from 'react';
import { useCollection } from '../hooks/useCollection';
import { Empty, PageHeader, SearchInput, Table, Td, Th, fmtDate, inr } from '../components/ui';
import type { Order, UserProfile } from '../types';

export default function Customers() {
  const users = useCollection<UserProfile>('users');
  const orders = useCollection<Order>('orders');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const spend = new Map<string, { n: number; total: number }>();
    for (const o of orders.data) {
      const s = spend.get(o.uid) ?? { n: 0, total: 0 };
      s.n += 1;
      if (o.paymentStatus === 'paid') s.total += o.total;
      spend.set(o.uid, s);
    }
    return users.data
      .filter((u) => u.role === 'customer')
      .filter((u) => `${u.name} ${u.email} ${u.phone ?? ''}`.toLowerCase().includes(q.toLowerCase()))
      .map((u) => ({ ...u, ...(spend.get(u.id) ?? { n: 0, total: 0 }) }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [users.data, orders.data, q]);

  return (
    <>
      <PageHeader title={`Customers (${rows.length})`}>
        <SearchInput value={q} onChange={setQ} placeholder="Search name, email, phone" />
      </PageHeader>
      <Table>
        <thead><tr><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Orders</Th><Th>Total spent</Th><Th>Joined</Th></tr></thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id}>
              <Td className="font-medium">{u.name}</Td><Td>{u.email}</Td><Td>{u.phone ?? '—'}</Td>
              <Td>{u.n}</Td><Td>{inr(u.total)}</Td><Td>{fmtDate(u.createdAt)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Empty loading={users.loading} error={users.error} count={rows.length} />
    </>
  );
}
