import { useMemo, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCollection } from '../hooks/useCollection';
import { Empty, PageHeader, SearchInput, Select, Table, Td, Th, inr } from '../components/ui';
import type { DealerPricing, Product } from '../types';

const CATEGORIES = [
  'RO Water Purifiers', 'UV Water Purifiers', 'UF Water Purifiers', 'Water Dispensers', 'Water Pumps',
  'RO Membranes', 'Water Filters', 'Replacement Cartridges', 'Spare Parts', 'Accessories',
];

export default function Products() {
  const products = useCollection<Product>('products');
  const pricing = useCollection<DealerPricing>('dealerPricing');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [edit, setEdit] = useState<{ p: Product; stock: string; price: string; dealer: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const dealerPrice = useMemo(() => new Map(pricing.data.map((d) => [d.id, d.dealerPrice])), [pricing.data]);
  const rows = useMemo(
    () =>
      products.data
        .filter((p) => (!cat || p.category === cat) && `${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.id.localeCompare(b.id)),
    [products.data, q, cat],
  );

  const save = async () => {
    if (!edit) return;
    const stock = Number(edit.stock), price = Number(edit.price), dealer = Number(edit.dealer);
    if (![stock, price, dealer].every((n) => Number.isFinite(n) && n >= 0) || dealer > price) {
      setErr('Enter valid numbers; dealer price cannot exceed customer price.');
      return;
    }
    setBusy(true);
    try {
      await updateDoc(doc(db, 'products', edit.p.id), { stock, price });
      await updateDoc(doc(db, 'dealerPricing', edit.p.id), { dealerPrice: dealer });
      setEdit(null);
      setErr('');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = (p: Product) => updateDoc(doc(db, 'products', p.id), { active: !p.active });

  return (
    <>
      <PageHeader title={`Products (${rows.length})`}>
        <SearchInput value={q} onChange={setQ} placeholder="Search name or brand" />
        <Select value={cat} onChange={setCat} options={CATEGORIES} all="All categories" />
      </PageHeader>
      <Table>
        <thead><tr><Th>Product</Th><Th>Category</Th><Th>Customer ₹</Th><Th>Dealer ₹</Th><Th>Stock</Th><Th>Active</Th><Th /></tr></thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <Td>
                <div className="flex items-center gap-3">
                  {p.image ? <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-slate-100" />}
                  <div><div className="font-medium">{p.name}</div><div className="text-xs text-slate-400">{p.brand}</div></div>
                </div>
              </Td>
              <Td>{p.category}</Td>
              <Td>{inr(p.price)}</Td>
              <Td>{dealerPrice.has(p.id) ? inr(dealerPrice.get(p.id)!) : '—'}</Td>
              <Td className={p.stock < 10 ? 'font-semibold text-rose-600' : ''}>{p.stock}</Td>
              <Td>
                <button onClick={() => toggle(p)} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                  {p.active ? 'Active' : 'Hidden'}
                </button>
              </Td>
              <Td>
                <button
                  onClick={() => setEdit({ p, stock: String(p.stock), price: String(p.price), dealer: String(dealerPrice.get(p.id) ?? 0) })}
                  className="text-sm font-semibold text-aqua-600 hover:underline"
                >Edit</button>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Empty loading={products.loading} error={products.error} count={rows.length} />

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 font-semibold text-navy-900">{edit.p.name}</h3>
            {(['stock', 'price', 'dealer'] as const).map((k) => (
              <label key={k} className="mb-3 block text-sm text-slate-600">
                {k === 'stock' ? 'Stock' : k === 'price' ? 'Customer price (₹)' : 'Dealer price (₹)'}
                <input type="number" min={0} value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
              </label>
            ))}
            {err && <p className="mb-2 text-sm text-rose-600">{err}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEdit(null); setErr(''); }} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button disabled={busy} onClick={save} className="rounded-lg bg-aqua-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
