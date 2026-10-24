import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { IndianRupee, ShoppingCart, Store, Users } from 'lucide-react';
import { useCollection } from '../hooks/useCollection';
import { Empty, KpiCard, PageHeader, StatusBadge, Table, Td, Th, fmtDate, inr } from '../components/ui';
import type { DealerProfile, Order, UserProfile } from '../types';

export default function Overview() {
  const orders = useCollection<Order>('orders');
  const users = useCollection<UserProfile>('users');
  const dealers = useCollection<DealerProfile>('dealers');

  const stats = useMemo(() => {
    const paid = orders.data.filter((o) => o.paymentStatus === 'paid' && o.status !== 'cancelled');
    const revenue = paid.reduce((s, o) => s + o.total, 0);
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (13 - i));
      return { ts: d.getTime(), label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), revenue: 0 };
    });
    for (const o of paid) {
      const day = days.find((d) => o.createdAt >= d.ts && o.createdAt < d.ts + 86_400_000);
      if (day) day.revenue += o.total;
    }
    const recent = [...orders.data].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
    return { revenue, days, recent };
  }, [orders.data]);

  return (
    <>
      <PageHeader title="Overview" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total orders" value={orders.data.length} icon={<ShoppingCart size={18} />} />
        <KpiCard label="Revenue (paid)" value={inr(stats.revenue)} icon={<IndianRupee size={18} />} />
        <KpiCard label="Customers" value={users.data.filter((u) => u.role === 'customer').length} icon={<Users size={18} />} />
        <KpiCard
          label="Dealers"
          value={dealers.data.length}
          hint={`${dealers.data.filter((d) => d.status === 'pending').length} pending approval`}
          icon={<Store size={18} />}
        />
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-4 font-semibold text-navy-900">Revenue — last 14 days</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={stats.days}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v) => inr(Number(v))} />
              <Bar dataKey="revenue" fill="#12b5cb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2 className="mb-3 mt-6 font-semibold text-navy-900">Recent orders</h2>
      <Table>
        <thead><tr><Th>Order</Th><Th>Customer</Th><Th>Type</Th><Th>Total</Th><Th>Status</Th><Th>Date</Th></tr></thead>
        <tbody>
          {stats.recent.map((o) => (
            <tr key={o.id}>
              <Td className="font-mono text-xs">#{o.id.slice(-8)}</Td>
              <Td>{o.customerName}</Td>
              <Td className="capitalize">{o.type}</Td>
              <Td>{inr(o.total)}</Td>
              <Td><StatusBadge status={o.status} /></Td>
              <Td>{fmtDate(o.createdAt)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Empty loading={orders.loading} error={orders.error} count={stats.recent.length} />
    </>
  );
}
