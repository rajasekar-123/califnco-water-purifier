import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Dealers from './pages/Dealers';
import ServiceDesk from './pages/ServiceDesk';

/** Admin-only gate. Real enforcement is in Firestore rules + the API; this is UX. */
function Protected({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <p className="p-10 text-center text-slate-400">Loading…</p>;
  if (!user || profile?.role !== 'admin') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected><DashboardLayout /></Protected>}>
            <Route index element={<Overview />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="dealers" element={<Dealers />} />
            <Route path="dealer-requests" element={<Dealers pendingOnly />} />
            <Route path="service" element={<ServiceDesk />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
