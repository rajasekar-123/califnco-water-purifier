import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { UserProfile } from '../types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState>(null!);
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u) {
          const snap = await getDoc(doc(db, 'users', u.uid)).catch(() => null);
          setProfile(snap?.exists() ? ({ ...snap.data(), uid: u.uid } as UserProfile) : null);
        } else setProfile(null);
        setLoading(false);
      }),
    [],
  );

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (snap.data()?.role !== 'admin') {
      await signOut(auth);
      throw new Error('This account does not have admin access.');
    }
  };

  return (
    <Ctx.Provider value={{ user, profile, loading, login, logout: () => signOut(auth) }}>
      {children}
    </Ctx.Provider>
  );
}
