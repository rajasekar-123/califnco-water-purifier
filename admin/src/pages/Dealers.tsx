import { useMemo, useState } from 'react';
import { useCollection } from '../hooks/useCollection';
import { adminAction } from '../services/api';
import { ConfirmDialog, Empty, PageHeader, SearchInput, Select, StatusBadge, Table, Td, Th, fmtDate } from '../components/ui';
import type { DealerProfile } from '../types';

/** `pendingOnly` renders the Dealer Approval Requests queue; otherwise the full dealer directory. */
export default function Dealers({ pendingOnly = false }: { pendingOnly?: boolean }) {
  const { data, loading, error } = useCollection<DealerProfile>('dealers');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [target, setTarget] = useState<{ d: DealerProfile & { id: string }; decision: 'approved' | 'rejected' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const rows = useMemo(
    () =>
      data
        .filter((d) => (pendingOnly ? d.status === 'pending' : !status || d.status === status))
        .filter((d) => `${d.businessName} ${d.contactName} ${d.city} ${d.gstNumber ?? ''}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.createdAt - a.createdAt),
    [data, q, status, pendingOnly],
  );

  const decide = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await adminAction({ action: 'dealer-decision', dealerUid: target.d.id, decision: target.decision });
      setMsg(`${target.d.businessName} ${target.decision}.`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
      setTarget(null);
    }
  };

  return (
    <>
      <PageHeader title={pendingOnly ? `Dealer approval requests (${rows.length})` : `Dealers (${rows.length})`}>
        <SearchInput value={q} onChange={setQ} placeholder="Search business, city, GST" />
        {!pendingOnly && <Select value={status} onChange={setStatus} options={['pending', 'approved', 'rejected']} all="All statuses" />}
      </PageHeader>
      {msg && <p className="mb-3 rounded-lg bg-aqua-50 px-3 py-2 text-sm text-aqua-600">{msg}</p>}
      <Table>
        <thead><tr><Th>Business</Th><Th>Contact</Th><Th>Phone</Th><Th>City</Th><Th>GST</Th><Th>Applied</Th><Th>Status</Th><Th /></tr></thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id}>
              <Td className="font-medium">{d.businessName}</Td><Td>{d.contactName}</Td><Td>{d.phone}</Td>
              <Td>{d.city}</Td><Td>{d.gstNumber ?? '—'}</Td><Td>{fmtDate(d.createdAt)}</Td>
              <Td><StatusBadge status={d.status} /></Td>
              <Td>
                <div className="flex gap-2">
                  {d.status !== 'approved' && (
                    <button onClick={() => setTarget({ d, decision: 'approved' })} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700">Approve</button>
                  )}
                  {d.status !== 'rejected' && (
                    <button onClick={() => setTarget({ d, decision: 'rejected' })} className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700">Reject</button>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Empty loading={loading} error={error} count={rows.length} />
      <ConfirmDialog
        open={!!target}
        busy={busy}
        danger={target?.decision === 'rejected'}
        title={target?.decision === 'approved' ? 'Approve dealer' : 'Reject dealer'}
        message={target ? `${target.decision === 'approved' ? 'Enable wholesale ordering for' : 'Reject the application of'} ${target.d.businessName}?` : ''}
        confirmLabel={target?.decision === 'approved' ? 'Approve' : 'Reject'}
        onConfirm={decide}
        onCancel={() => setTarget(null)}
      />
    </>
  );
}
