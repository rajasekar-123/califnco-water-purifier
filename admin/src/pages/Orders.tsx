import { useMemo, useState } from 'react';
import { useCollection } from '../hooks/useCollection';
import { adminAction } from '../services/api';
import { ConfirmDialog, Empty, PageHeader, SearchInput, Select, StatusBadge, Table, Td, Th, fmtDate, inr } from '../components/ui';
import type { Order, OrderStatus } from '../types';

const NEXT: OrderStatus[] = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const { data, loading, error } = useCollection<Order>('orders');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [pending, setPending] = useState<{ order: Order; status: OrderStatus } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const rows = useMemo(
    () =>
      data
        .filter((o) => (!status || o.status === status) && (!type || o.type === type))
        .filter((o) => `${o.id} ${o.customerName} ${o.customerEmail}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.createdAt - a.createdAt),
    [data, q, status, type],
  );

  const apply = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await adminAction({ action: 'order-status', orderId: pending.order.id, status: pending.status });
      setMsg(`Order #${pending.order.id.slice(-8)} → ${pending.status}`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  return (
    <>
      <PageHeader title="Orders">
        <SearchInput value={q} onChange={setQ} placeholder="Search id, name, email" />
        <Select value={type} onChange={setType} options={['retail', 'wholesale']} all="All types" />
        <Select value={status} onChange={setStatus} options={[...NEXT]} all="All statuses" />
      </PageHeader>
      {msg && <p className="mb-3 rounded-lg bg-aqua-50 px-3 py-2 text-sm text-aqua-600">{msg}</p>}
      <Table>
        <thead><tr><Th>Order</Th><Th>Customer</Th><Th>Type</Th><Th>Items</Th><Th>Total</Th><Th>Payment</Th><Th>Status</Th><Th>Date</Th><Th>Update</Th></tr></thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}>
              <Td className="font-mono text-xs">#{o.id.slice(-8)}</Td>
              <Td>{o.customerName}<div className="text-xs text-slate-400">{o.customerEmail}</div></Td>
              <Td className="capitalize">{o.type}</Td>
              <Td>{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ').slice(0, 60)}</Td>
              <Td>{inr(o.total)}</Td>
              <Td><StatusBadge status={o.paymentStatus} /></Td>
              <Td><StatusBadge status={o.status} /></Td>
              <Td>{fmtDate(o.createdAt)}</Td>
              <Td>
                <select
                  value={o.status}
                  onChange={(e) => setPending({ order: o, status: e.target.value as OrderStatus })}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs capitalize"
                >
                  {NEXT.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Empty loading={loading} error={error} count={rows.length} />
      <ConfirmDialog
        open={!!pending}
        busy={busy}
        danger={pending?.status === 'cancelled'}
        title="Update order status"
        message={pending ? `Mark order #${pending.order.id.slice(-8)} as ${pending.status}? The customer will be notified.` : ''}
        onConfirm={apply}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
