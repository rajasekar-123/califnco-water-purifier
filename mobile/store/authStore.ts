import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseConfigured } from '@/services/firebase';
import { fetchProfile } from '@/services/authService';
import type { DealerProfile, UserProfile } from '@/types';

interface AuthState {
  ready: boolean;
  uid: string | null;
  profile: UserProfile | null;
  dealer: DealerProfile | null;
  refresh: () => Promise<void>;
  init: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ready: false,
  uid: null,
  profile: null,
  dealer: null,

  refresh: async () => {
    const uid = auth.currentUser?.uid ?? get().uid;
    if (!uid) return;
    const { profile, dealer } = await fetchProfile(uid);
    set({ uid, profile, dealer, ready: true });
  },

  init: () => {
    if (!firebaseConfigured) {
      set({ ready: true });
      return () => {};
    }
    return onAuthStateChanged(auth, async (u) => {
      if (!u) return set({ ready: true, uid: null, profile: null, dealer: null });
      set({ uid: u.uid });
      try {
        const { profile, dealer } = await fetchProfile(u.uid);
        set({ profile, dealer, ready: true });
      } catch {
        set({ ready: true });
      }
    });
  },
}));

/** True only when the dealer doc says `approved` (server rules enforce the same). */
export const useIsApprovedDealer = () =>
  useAuthStore((s) => s.profile?.role === 'dealer' && s.dealer?.status === 'approved');
export const useIsDealer = () => useAuthStore((s) => s.profile?.role === 'dealer');
