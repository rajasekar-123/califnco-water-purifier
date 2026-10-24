import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, user, profile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && profile?.role === 'admin') return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message.replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-900 to-navy-700 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-2 text-xl font-bold text-navy-900">
          <Droplets className="text-aqua-500" /> Califnco Admin
        </div>
        <label className="mb-1 block text-sm text-slate-600">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-aqua-500" />
        <label className="mb-1 block text-sm text-slate-600">Password</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-aqua-500" />
        {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-aqua-600 py-2.5 font-semibold text-white hover:bg-aqua-500 disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
