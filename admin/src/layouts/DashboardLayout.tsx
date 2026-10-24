import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Droplets, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, Store, UserCheck, Users, Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/dealers', label: 'Dealers', icon: Store },
  { to: '/dealer-requests', label: 'Approval Requests', icon: UserCheck },
  { to: '/service', label: 'Service Desk', icon: Wrench },
];

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const { profile, logout } = useAuth();
  return (
    <div className="min-h-screen lg:flex">
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-navy-900 p-4 text-white transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center gap-2 px-2 text-lg font-bold">
          <Droplets className="text-aqua-500" /> Califnco Admin
        </div>
        <nav className="space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${isActive ? 'bg-aqua-600 font-semibold' : 'text-slate-300 hover:bg-white/10'}`}
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Menu /></button>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-slate-600">{profile?.name ?? profile?.email}</span>
            <button onClick={logout} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </header>
        <main className="p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
