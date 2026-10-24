import {
  addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Address, AppNotification, CartLine, Order, ServiceBooking } from '@/types';

type WithId<T> = T & { id: string };
const mapDocs = <T,>(snap: { docs: { id: string; data: () => unknown }[] }) =>
  snap.docs.map((d) => ({ ...(d.data() as T), id: d.id })) as WithId<T>[];

// ---- cart persistence ----
export const saveCart = (uid: string, lines: CartLine[]) => setDoc(doc(db, 'carts', uid), { lines, updatedAt: Date.now() });

// ---- addresses ----
export function watchAddresses(uid: string, cb: (a: Address[]) => void, onErr?: (e: Error) => void) {
  return onSnapshot(
    query(collection(db, 'addresses'), where('uid', '==', uid), orderBy('createdAt', 'desc')),
    (s) => cb(mapDocs<Address>(s)),
    onErr,
  );
}
export const addAddress = (a: Omit<Address, 'id'>) => addDoc(collection(db, 'addresses'), { ...a, createdAt: Date.now() });
export const removeAddress = (id: string) => deleteDoc(doc(db, 'addresses', id));

// ---- orders ----
export function watchOrders(uid: string, cb: (o: Order[]) => void, onErr?: (e: Error) => void) {
  return onSnapshot(
    query(collection(db, 'orders'), where('uid', '==', uid), orderBy('createdAt', 'desc')),
    (s) => cb(mapDocs<Order>(s)),
    onErr,
  );
}

// ---- service bookings ----
export const createServiceBooking = (b: Omit<ServiceBooking, 'id' | 'status' | 'createdAt'>) =>
  addDoc(collection(db, 'serviceBookings'), { ...JSON.parse(JSON.stringify(b)), status: 'requested', createdAt: Date.now() });

export async function fetchServiceBookings(uid: string) {
  const s = await getDocs(query(collection(db, 'serviceBookings'), where('uid', '==', uid), orderBy('createdAt', 'desc')));
  return mapDocs<ServiceBooking>(s);
}

// ---- notifications ----
export function watchNotifications(uid: string, cb: (n: AppNotification[]) => void, onErr?: (e: Error) => void) {
  return onSnapshot(
    query(collection(db, 'notifications'), where('uid', '==', uid), orderBy('createdAt', 'desc')),
    (s) => cb(mapDocs<AppNotification>(s)),
    onErr,
  );
}
export const markNotificationRead = (id: string) => updateDoc(doc(db, 'notifications', id), { read: true });
