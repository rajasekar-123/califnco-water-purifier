import { useMemo, useState } from 'react';
import { useCollection } from '../hooks/useCollection';
import { adminAction } from '../services/api';
import { ConfirmDialog, Empty, PageHeader, SearchInput, Select, StatusBadge, Table, Td, Th, fmtDate } from '../components/ui';
import type { ServiceBooking, ServiceStatus } from '../types';

const STATUSES: ServiceStatus[] = ['requested', 'scheduled', 'completed', 'cancelled'];

export default function ServiceDesk() {
  const { data, loading, error } = useCollection<ServiceBooking>('serviceBookings');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState<{ b: ServiceBooking; status: ServiceStatus } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const rows = useMemo(
    () =>
      data
        .filter((b) => !status || b.status === status)
        .filter((b) => `${b.customerName} ${b.phone} ${b.serviceType} ${b.address}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.createdAt - a.createdAt),
    [data, q, status],
  );

  const apply = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await adminAction({ action: 'service-status', bookingId: pending.b.id, status: pending.status });
      setMsg(`Booking updated to ${pending.status}.`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  return (
    <>
      <PageHeader title={`Service Desk (${rows.length})`}>
        <SearchInput value={q} onChange={setQ} placeholder="Search customer, phone, type" />
        <Select value={status} onChange={setStatus} options={[...STATUSES]} all="All statuses" />
      </PageHeader>
      {msg && <p className="mb-3 rounded-lg bg-aqua-50 px-3 py-2 text-sm text-aqua-600">{msg}</p>}
      <Table>
        <thead><tr><Th>Customer</Th><Th>Service</Th><Th>Product</Th><Th>Preferred date</Th><Th>Address</Th><Th>Notes</Th><Th>Status</Th><Th>Update</Th></tr></thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id}>
              <Td>{b.customerName}<div className="text-xs text-slate-400">{b.phone}</div></Td>
              <Td className="capitalize">{b.serviceType.replace('_', ' ')}</Td>
              <Td>{b.productName ?? '—'}</Td>
              <Td>{b.preferredDate}<div className="text-xs text-slate-400">Booked {fmtDate(b.createdAt)}</div></Td>
              <Td className="max-w-48">{b.address}</Td>
              <Td className="max-w-48">{b.notes ?? '—'}</Td>
              <Td><StatusBadge status={b.status} /></Td>
              <Td>
                <select value={b.status} onChange={(e) => setPending({ b, status: e.target.value as ServiceStatus })}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs capitalize">
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Empty loading={loading} error={error} count={rows.length} />
      <ConfirmDialog
        open={!!pending} busy={busy} danger={pending?.status === 'cancelled'}
        title="Update service booking"
        message={pending ? `Set this booking to ${pending.status}? The customer will be notified.` : ''}
        onConfirm={apply} onCancel={() => setPending(null)}
      />
    </>
  );
}
