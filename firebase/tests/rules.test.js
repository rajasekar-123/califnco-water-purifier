import { before, after, beforeEach, describe, it } from 'node:test';
import fs from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where } from 'firebase/firestore';

let env;
const ctx = (uid) => env.authenticatedContext(uid).firestore();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-califnco',
    firestore: { rules: fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8181 },
  });
});
after(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await setDoc(doc(db, 'users/admin1'), { role: 'admin', name: 'Admin' });
    await setDoc(doc(db, 'users/cust1'), { role: 'customer', name: 'Cust' });
    await setDoc(doc(db, 'users/cust2'), { role: 'customer', name: 'Other' });
    await setDoc(doc(db, 'users/dealerP'), { role: 'dealer', name: 'Pending' });
    await setDoc(doc(db, 'dealers/dealerP'), { status: 'pending', businessName: 'P Co' });
    await setDoc(doc(db, 'users/dealerA'), { role: 'dealer', name: 'Approved' });
    await setDoc(doc(db, 'dealers/dealerA'), { status: 'approved', businessName: 'A Co' });
    await setDoc(doc(db, 'products/p1'), { name: 'RO', price: 15000, stock: 5, active: true });
    await setDoc(doc(db, 'dealerPricing/p1'), { dealerPrice: 11000, minQty: 2 });
    await setDoc(doc(db, 'orders/o1'), { uid: 'cust1', status: 'placed', total: 100 });
    await setDoc(doc(db, 'orders/o2'), { uid: 'cust2', status: 'placed', total: 200 });
    await setDoc(doc(db, 'addresses/a2'), { uid: 'cust2', line1: 'x' });
    await setDoc(doc(db, 'notifications/n1'), { uid: 'cust1', title: 'T', body: 'B', read: false });
    await setDoc(doc(db, 'serviceBookings/s1'), { uid: 'cust1', status: 'requested' });
    await setDoc(doc(db, 'automationLogs/2026-01-01'), { status: 'success' });
    await setDoc(doc(db, 'pendingOrders/rzp1'), { uid: 'cust1', total: 100 });
  });
});

describe('catalogue & wholesale pricing', () => {
  it('anyone can read products (retail only)', async () => {
    await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), 'products/p1')));
  });
  it('customers cannot read dealer pricing', async () => {
    await assertFails(getDoc(doc(ctx('cust1'), 'dealerPricing/p1')));
    await assertFails(getDocs(collection(ctx('cust1'), 'dealerPricing')));
  });
  it('pending dealers cannot read dealer pricing', async () => {
    await assertFails(getDoc(doc(ctx('dealerP'), 'dealerPricing/p1')));
  });
  it('approved dealers and admins can read dealer pricing', async () => {
    await assertSucceeds(getDoc(doc(ctx('dealerA'), 'dealerPricing/p1')));
    await assertSucceeds(getDoc(doc(ctx('admin1'), 'dealerPricing/p1')));
  });
  it('only admins can write products and pricing', async () => {
    await assertFails(updateDoc(doc(ctx('cust1'), 'products/p1'), { price: 1 }));
    await assertFails(updateDoc(doc(ctx('dealerA'), 'dealerPricing/p1'), { dealerPrice: 1 }));
    await assertSucceeds(updateDoc(doc(ctx('admin1'), 'products/p1'), { price: 14000, stock: 9 }));
  });
});

describe('roles cannot be escalated', () => {
  it('cannot register as admin', async () => {
    await assertFails(setDoc(doc(ctx('newbie'), 'users/newbie'), { role: 'admin', name: 'x' }));
    await assertSucceeds(setDoc(doc(ctx('newbie'), 'users/newbie'), { role: 'customer', name: 'x' }));
  });
  it('cannot change own role', async () => {
    await assertFails(updateDoc(doc(ctx('cust1'), 'users/cust1'), { role: 'admin' }));
    await assertSucceeds(updateDoc(doc(ctx('cust1'), 'users/cust1'), { name: 'New Name' }));
  });
  it('cannot read another user profile', async () => {
    await assertFails(getDoc(doc(ctx('cust1'), 'users/cust2')));
    await assertSucceeds(getDoc(doc(ctx('admin1'), 'users/cust2')));
  });
});

describe('dealer approval workflow', () => {
  it('dealer application must start as pending', async () => {
    await assertFails(setDoc(doc(ctx('d3'), 'dealers/d3'), { status: 'approved', businessName: 'x' }));
    await assertSucceeds(setDoc(doc(ctx('d3'), 'dealers/d3'), { status: 'pending', businessName: 'x' }));
  });
  it('dealers cannot approve themselves', async () => {
    await assertFails(updateDoc(doc(ctx('dealerP'), 'dealers/dealerP'), { status: 'approved' }));
    await assertSucceeds(updateDoc(doc(ctx('dealerP'), 'dealers/dealerP'), { city: 'Chennai' }));
  });
  it('customers cannot read or change dealer applications', async () => {
    await assertFails(getDoc(doc(ctx('cust1'), 'dealers/dealerP')));
    await assertFails(updateDoc(doc(ctx('cust1'), 'dealers/dealerP'), { status: 'approved' }));
  });
  it('admin can approve and reject', async () => {
    await assertSucceeds(updateDoc(doc(ctx('admin1'), 'dealers/dealerP'), { status: 'approved' }));
    await assertSucceeds(updateDoc(doc(ctx('admin1'), 'dealers/dealerA'), { status: 'rejected' }));
  });
  it('approval immediately unlocks wholesale pricing', async () => {
    await assertFails(getDoc(doc(ctx('dealerP'), 'dealerPricing/p1')));
    await env.withSecurityRulesDisabled((c) => updateDoc(doc(c.firestore(), 'dealers/dealerP'), { status: 'approved' }));
    await assertSucceeds(getDoc(doc(ctx('dealerP'), 'dealerPricing/p1')));
  });
});

describe('orders & payments', () => {
  it('clients cannot create, delete or forge orders', async () => {
    await assertFails(setDoc(doc(ctx('cust1'), 'orders/fake'), { uid: 'cust1', status: 'placed', paymentStatus: 'paid', total: 1 }));
    await assertFails(setDoc(doc(ctx('admin1'), 'orders/fake'), { uid: 'cust1', total: 1 }));
    await assertFails(deleteDoc(doc(ctx('cust1'), 'orders/o1')));
  });
  it('customers cannot edit their orders (status / payment)', async () => {
    await assertFails(updateDoc(doc(ctx('cust1'), 'orders/o1'), { paymentStatus: 'paid' }));
    await assertFails(updateDoc(doc(ctx('cust1'), 'orders/o1'), { status: 'delivered' }));
  });
  it('customers read only their own orders', async () => {
    await assertSucceeds(getDoc(doc(ctx('cust1'), 'orders/o1')));
    await assertFails(getDoc(doc(ctx('cust1'), 'orders/o2')));
    await assertSucceeds(getDocs(query(collection(ctx('cust1'), 'orders'), where('uid', '==', 'cust1'))));
    await assertFails(getDocs(collection(ctx('cust1'), 'orders')));
  });
  it('admin reads all orders and updates status', async () => {
    await assertSucceeds(getDocs(collection(ctx('admin1'), 'orders')));
    await assertSucceeds(updateDoc(doc(ctx('admin1'), 'orders/o1'), { status: 'shipped' }));
  });
  it('pendingOrders are server-only', async () => {
    await assertFails(getDoc(doc(ctx('cust1'), 'pendingOrders/rzp1')));
    await assertFails(getDoc(doc(ctx('admin1'), 'pendingOrders/rzp1')));
    await assertFails(setDoc(doc(ctx('cust1'), 'pendingOrders/x'), { uid: 'cust1' }));
  });
});

describe('addresses, carts, services, notifications', () => {
  it('addresses are private to the owner', async () => {
    await assertSucceeds(addDoc(collection(ctx('cust1'), 'addresses'), { uid: 'cust1', line1: 'a' }));
    await assertFails(addDoc(collection(ctx('cust1'), 'addresses'), { uid: 'cust2', line1: 'a' }));
    await assertFails(getDoc(doc(ctx('cust1'), 'addresses/a2')));
    await assertFails(deleteDoc(doc(ctx('cust1'), 'addresses/a2')));
  });
  it('carts are private', async () => {
    await assertSucceeds(setDoc(doc(ctx('cust1'), 'carts/cust1'), { lines: [] }));
    await assertFails(setDoc(doc(ctx('cust1'), 'carts/cust2'), { lines: [] }));
  });
  it('service bookings: create as requested, admin updates', async () => {
    await assertSucceeds(addDoc(collection(ctx('cust1'), 'serviceBookings'), { uid: 'cust1', status: 'requested' }));
    await assertFails(addDoc(collection(ctx('cust1'), 'serviceBookings'), { uid: 'cust1', status: 'completed' }));
    await assertFails(updateDoc(doc(ctx('cust1'), 'serviceBookings/s1'), { status: 'completed' }));
    await assertSucceeds(updateDoc(doc(ctx('admin1'), 'serviceBookings/s1'), { status: 'scheduled' }));
  });
  it('notifications: owner may only mark as read', async () => {
    await assertSucceeds(updateDoc(doc(ctx('cust1'), 'notifications/n1'), { read: true }));
    await assertFails(updateDoc(doc(ctx('cust1'), 'notifications/n1'), { title: 'hacked' }));
    await assertFails(getDoc(doc(ctx('cust2'), 'notifications/n1')));
    await assertFails(addDoc(collection(ctx('cust1'), 'notifications'), { uid: 'cust1', title: 'x' }));
  });
  it('automation logs: admin read only', async () => {
    await assertSucceeds(getDoc(doc(ctx('admin1'), 'automationLogs/2026-01-01')));
    await assertFails(getDoc(doc(ctx('cust1'), 'automationLogs/2026-01-01')));
    await assertFails(setDoc(doc(ctx('admin1'), 'automationLogs/x'), { status: 'x' }));
  });
});
