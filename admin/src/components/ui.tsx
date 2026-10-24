import type { ReactNode } from 'react';
import { X } from 'lucide-react';

const BADGE: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-amber-100 text-amber-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  requested: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
  paid: 'bg-emerald-100 text-emerald-700',
  unpaid: 'bg-slate-100 text-slate-600',
};

export const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${BADGE[status] ?? 'bg-slate-100 text-slate-600'}`}>
    {status.replace('_', ' ')}
  </span>
);

export function KpiCard({ label, value, icon, hint }: { label: string; value: string | number; icon: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className="rounded-xl bg-aqua-50 p-2 text-aqua-600">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-navy-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', danger, busy, onConfirm, onCancel,
}: {
  open: boolean; title: string; message: string; confirmLabel?: string; danger?: boolean; busy?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-navy-900">{title}</h3>
          <button onClick={onCancel} aria-label="Close"><X size={18} /></button>
        </div>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
          <button
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-aqua-600 hover:bg-aqua-500'}`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export const PageHeader = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
    <h1 className="text-xl font-bold text-navy-900">{title}</h1>
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);

export const Table = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
    <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
  </div>
);
export const Th = ({ children }: { children?: ReactNode }) => (
  <th className="whitespace-nowrap bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</th>
);
export const Td = ({ children, className = '' }: { children?: ReactNode; className?: string }) => (
  <td className={`border-t border-slate-100 px-4 py-3 ${className}`}>{children}</td>
);

export const Empty = ({ loading, error, count }: { loading: boolean; error: string | null; count: number }) => {
  if (loading) return <p className="p-6 text-center text-sm text-slate-400">Loading…</p>;
  if (error) return <p className="p-6 text-center text-sm text-rose-600">Error: {error}</p>;
  if (!count) return <p className="p-6 text-center text-sm text-slate-400">Nothing to show.</p>;
  return null;
};

export const SearchInput = (p: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <input
    value={p.value}
    onChange={(e) => p.onChange(e.target.value)}
    placeholder={p.placeholder ?? 'Search…'}
    className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-aqua-500"
  />
);

export const Select = (p: { value: string; onChange: (v: string) => void; options: string[]; all?: string }) => (
  <select
    value={p.value}
    onChange={(e) => p.onChange(e.target.value)}
    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize outline-none focus:border-aqua-500"
  >
    {p.all && <option value="">{p.all}</option>}
    {p.options.map((o) => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
  </select>
);

export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
export const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
