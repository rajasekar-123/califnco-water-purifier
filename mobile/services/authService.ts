import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { DealerProfile, UserProfile } from '@/types';

export function friendlyAuthError(e: unknown): string {
  const code = (e as { code?: string }).code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/user-not-found': 'No account found for this email.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
  };
  return map[code] ?? (e as Error).message ?? 'Something went wrong.';
}

function referralCode(uid: string) {
  return `CAL${uid.slice(0, 5).toUpperCase()}`;
}

export async function registerCustomer(name: string, email: string, password: string, phone: string) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const profile: Omit<UserProfile, 'uid'> = {
    name: name.trim(), email: email.trim(), phone: phone.trim(), role: 'customer',
    referralCode: referralCode(cred.user.uid), createdAt: Date.now(),
  };
  await setDoc(doc(db, 'users', cred.user.uid), profile);
}

export async function registerDealer(
  d: { name: string; email: string; password: string; phone: string; businessName: string; gstNumber: string; city: string },
) {
  const cred = await createUserWithEmailAndPassword(auth, d.email.trim(), d.password);
  const uid = cred.user.uid;
  await setDoc(doc(db, 'users', uid), {
    name: d.name.trim(), email: d.email.trim(), phone: d.phone.trim(), role: 'dealer', createdAt: Date.now(),
  });
  const dealer: Omit<DealerProfile, 'uid'> = {
    businessName: d.businessName.trim(), gstNumber: d.gstNumber.trim() || undefined,
    contactName: d.name.trim(), phone: d.phone.trim(), city: d.city.trim(),
    status: 'pending', createdAt: Date.now(),
  };
  await setDoc(doc(db, 'dealers', uid), JSON.parse(JSON.stringify(dealer)));
}

export const login = (email: string, password: string) => signInWithEmailAndPassword(auth, email.trim(), password);
export const logout = () => signOut(auth);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim());

export async function fetchProfile(uid: string) {
  const [u, d] = await Promise.all([getDoc(doc(db, 'users', uid)), getDoc(doc(db, 'dealers', uid))]);
  return {
    profile: u.exists() ? ({ ...u.data(), uid } as UserProfile) : null,
    dealer: d.exists() ? ({ ...d.data(), uid } as DealerProfile) : null,
  };
}

export const updateProfile = (uid: string, patch: Partial<Pick<UserProfile, 'name' | 'phone' | 'fcmToken'>>) =>
  updateDoc(doc(db, 'users', uid), patch);
