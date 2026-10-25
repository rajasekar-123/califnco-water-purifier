import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakeDb, mockRes } from './fakeDb';

// ---- mocks: replace Firebase Admin + Razorpay; keep the real handler/pricing logic ----
const h = vi.hoisted(() => ({ db: null as any, caller: null as any, fetchPayment: vi.fn(), createOrder: vi.fn() }));

vi.mock('../_lib.js', async () => {
  class HttpError extends Error { constructor(public status: number, m: string) { super(m); } }
  return {
    get db() { return h.db; },
    HttpError,
    requireUser: async () => h.caller,
    requireAdmin: async () => { if (h.caller.role !== 'admin') throw new HttpError(403, 'Admin only'); return h.caller; },
    notifyUser: vi.fn(async (uid: string, title: string) => { h.db.store.set(`notifications/${uid}-${title}`, { uid, title }); }),
    handler: (_m: string, fn: any) => async (req: any, res: any) => {
      try { const r = await fn(req, res); if (!res.writableEnded) res.status(200).json(r ?? { ok: true }); }
      catch (e: any) { if (e instanceof HttpError) return res.status(e.status).json({ error: e.message }); throw e; }
    },
  };
});
vi.mock('razorpay', () => ({
  default: class { orders = { create: h.createOrder }; payments = { fetch: h.fetchPayment }; },
}));
vi.mock('../_notify.js', () => ({ sendOrderEmail: vi.fn(), sendOrderSms: vi.fn() }));

import createOrder from '../create-order';
import verifyPayment from '../verify-payment';
import adminAction from '../admin-action';

const SECRET = 'test_secret';
process.env.RAZORPAY_KEY_ID = 'rzp_test_x';
process.env.RAZORPAY_KEY_SECRET = SECRET;

const address = { line1: '12 Lake Rd', pincode: '600001', phone: '9876543210', city: 'Chennai' };
const seed = () => ({
  'products/p1': { name: 'AquaPure Elite', price: 15000, stock: 5, active: true, image: '' },
  'products/p2': { name: 'Cartridge', price: 220, stock: 100, active: true, image: '' },
  'dealerPricing/p1': { dealerPrice: 11000, minQty: 2 },
  'dealerPricing/p2': { dealerPrice: 150, minQty: 10 },
  'dealers/dealerA': { status: 'approved' },
  'dealers/dealerP': { status: 'pending' },
});
const asCustomer = { uid: 'cust1', role: 'customer', name: 'Cust', email: 'c@x.com' };
const asDealerA = { uid: 'dealerA', role: 'dealer', name: 'Deal', email: 'd@x.com' };
const asDealerP = { uid: 'dealerP', role: 'dealer', name: 'Pend', email: 'p@x.com' };
const asAdmin = { uid: 'admin1', role: 'admin', name: 'Adm', email: 'a@x.com' };

const call = async (fn: any, caller: any, body: any) => {
  h.caller = caller;
  const res = mockRes();
  await fn({ body, method: 'POST', headers: {} }, res);
  return res;
};

beforeEach(() => {
  h.db = createFakeDb(seed());
  h.createOrder.mockReset().mockImplementation(async (o: any) => ({ id: 'order_ABC12345', ...o }));
  h.fetchPayment.mockReset();
});

describe('create-order (server-side pricing)', () => {
  it('prices customers at retail and charges shipping under ₹5,000', async () => {
    const res = await call(createOrder, asCustomer, { items: [{ productId: 'p2', qty: 3 }], address });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ subtotal: 660, shipping: 199, total: 859, type: 'retail' });
    expect(h.createOrder.mock.calls[0][0].amount).toBe(85900); // paise
  });
  it('ignores any client-supplied price', async () => {
    const res = await call(createOrder, asCustomer, { items: [{ productId: 'p1', qty: 1, unitPrice: 1, price: 1 }], address });
    expect(res.body.total).toBe(15000);
  });
  it('gives approved dealers wholesale price, no shipping', async () => {
    const res = await call(createOrder, asDealerA, { items: [{ productId: 'p1', qty: 2 }], address });
    expect(res.body).toMatchObject({ subtotal: 22000, shipping: 0, total: 22000, type: 'wholesale' });
  });
  it('enforces wholesale minimum quantity', async () => {
    const res = await call(createOrder, asDealerA, { items: [{ productId: 'p2', qty: 5 }], address });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/minimum/i);
  });
  it('blocks pending dealers entirely', async () => {
    const res = await call(createOrder, asDealerP, { items: [{ productId: 'p1', qty: 2 }], address });
    expect(res.statusCode).toBe(403);
    expect(h.createOrder).not.toHaveBeenCalled();
  });
  it('blocks admins, empty carts, bad quantities, unknown products, oversell', async () => {
    expect((await call(createOrder, asAdmin, { items: [{ productId: 'p1', qty: 1 }], address })).statusCode).toBe(403);
    expect((await call(createOrder, asCustomer, { items: [], address })).statusCode).toBe(400);
    expect((await call(createOrder, asCustomer, { items: [{ productId: 'p1', qty: -2 }], address })).statusCode).toBe(400);
    expect((await call(createOrder, asCustomer, { items: [{ productId: 'nope', qty: 1 }], address })).statusCode).toBe(400);
    expect((await call(createOrder, asCustomer, { items: [{ productId: 'p1', qty: 6 }], address })).statusCode).toBe(409);
  });
  it('requires a delivery address and parks the priced cart server-side', async () => {
    expect((await call(createOrder, asCustomer, { items: [{ productId: 'p2', qty: 1 }] })).statusCode).toBe(400);
    await call(createOrder, asCustomer, { items: [{ productId: 'p2', qty: 1 }], address });
    expect(h.db.store.get('pendingOrders/order_ABC12345')).toMatchObject({ uid: 'cust1', total: 419 });
  });
});

describe('verify-payment', () => {
  const sign = (o: string, p: string) => crypto.createHmac('sha256', SECRET).update(`${o}|${p}`).digest('hex');
  const pend = (over = {}) => h.db.store.set('pendingOrders/order_1', {
    uid: 'cust1', type: 'retail', total: 15000, subtotal: 15000, shipping: 0, address, customerName: 'Cust', customerEmail: 'c@x.com',
    items: [{ productId: 'p1', name: 'AquaPure Elite', qty: 1, unitPrice: 15000, image: '' }], ...over,
  });
  const body = (over = {}) => ({ razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: sign('order_1', 'pay_1'), ...over });

  it('rejects a forged signature and creates nothing', async () => {
    pend();
    const res = await call(verifyPayment, asCustomer, body({ razorpay_signature: 'deadbeef' }));
    expect(res.statusCode).toBe(400);
    expect(h.db.store.has('orders/order_1')).toBe(false);
    expect(h.fetchPayment).not.toHaveBeenCalled();
  });
  it('rejects when Razorpay reports a different amount', async () => {
    pend();
    h.fetchPayment.mockResolvedValue({ order_id: 'order_1', amount: 100, status: 'captured' });
    const res = await call(verifyPayment, asCustomer, body());
    expect(res.statusCode).toBe(400);
    expect(h.db.store.has('orders/order_1')).toBe(false);
  });
  it('rejects a payment that is not captured/authorized', async () => {
    pend();
    h.fetchPayment.mockResolvedValue({ order_id: 'order_1', amount: 1500000, status: 'failed' });
    expect((await call(verifyPayment, asCustomer, body())).statusCode).toBe(402);
  });
  it("won't let another user claim someone else's pending order", async () => {
    pend();
    h.fetchPayment.mockResolvedValue({ order_id: 'order_1', amount: 1500000, status: 'captured' });
    expect((await call(verifyPayment, { ...asCustomer, uid: 'cust2' }, body())).statusCode).toBe(404);
  });
  it('creates a paid order, decrements stock, clears pending, notifies', async () => {
    pend();
    h.fetchPayment.mockResolvedValue({ order_id: 'order_1', amount: 1500000, status: 'captured' });
    const res = await call(verifyPayment, asCustomer, body());
    expect(res.statusCode).toBe(200);
    expect(h.db.store.get('orders/order_1')).toMatchObject({ uid: 'cust1', status: 'placed', paymentStatus: 'paid', total: 15000, razorpayPaymentId: 'pay_1' });
    expect(h.db.store.get('products/p1')!.stock).toBe(4);
    expect(h.db.store.has('pendingOrders/order_1')).toBe(false);
    expect([...h.db.store.keys()].some((k: string) => k.startsWith('notifications/'))).toBe(true);
  });
  it('is idempotent: a retry does not double-decrement stock', async () => {
    pend();
    h.fetchPayment.mockResolvedValue({ order_id: 'order_1', amount: 1500000, status: 'captured' });
    await call(verifyPayment, asCustomer, body());
    const again = await call(verifyPayment, asCustomer, body());
    expect(again.statusCode).toBe(200);
    expect(h.db.store.get('products/p1')!.stock).toBe(4);
  });
  it('fails atomically if stock ran out meanwhile (no order, stock untouched)', async () => {
    pend();
    h.db.store.set('products/p1', { ...h.db.store.get('products/p1'), stock: 0 });
    h.fetchPayment.mockResolvedValue({ order_id: 'order_1', amount: 1500000, status: 'captured' });
    const res = await call(verifyPayment, asCustomer, body());
    expect(res.statusCode).toBe(409);
    expect(h.db.store.has('orders/order_1')).toBe(false);
  });
});

describe('admin-action', () => {
  it('non-admins are refused', async () => {
    expect((await call(adminAction, asCustomer, { action: 'dealer-decision', dealerUid: 'dealerP', decision: 'approved' })).statusCode).toBe(403);
    expect(h.db.store.get('dealers/dealerP')!.status).toBe('pending');
  });
  it('admin approves a dealer, who can then order at wholesale price', async () => {
    const r = await call(adminAction, asAdmin, { action: 'dealer-decision', dealerUid: 'dealerP', decision: 'approved' });
    expect(r.statusCode).toBe(200);
    expect(h.db.store.get('dealers/dealerP')!.status).toBe('approved');
    const o = await call(createOrder, asDealerP, { items: [{ productId: 'p1', qty: 2 }], address });
    expect(o.statusCode).toBe(200);
    expect(o.body.type).toBe('wholesale');
  });
  it('admin rejection keeps the dealer locked out', async () => {
    await call(adminAction, asAdmin, { action: 'dealer-decision', dealerUid: 'dealerA', decision: 'rejected' });
    expect((await call(createOrder, asDealerA, { items: [{ productId: 'p1', qty: 2 }], address })).statusCode).toBe(403);
  });
  it('updates order status, validates input, notifies the customer', async () => {
    h.db.store.set('orders/o1', { uid: 'cust1', status: 'placed' });
    expect((await call(adminAction, asAdmin, { action: 'order-status', orderId: 'o1', status: 'bogus' })).statusCode).toBe(400);
    expect((await call(adminAction, asAdmin, { action: 'order-status', orderId: 'o1', status: 'shipped' })).statusCode).toBe(200);
    expect(h.db.store.get('orders/o1')!.status).toBe('shipped');
    expect(h.db.store.has('notifications/cust1-Order update')).toBe(true);
  });
  it('updates service bookings; unknown actions are rejected', async () => {
    h.db.store.set('serviceBookings/s1', { uid: 'cust1', serviceType: 'repair', status: 'requested' });
    expect((await call(adminAction, asAdmin, { action: 'service-status', bookingId: 's1', status: 'scheduled' })).statusCode).toBe(200);
    expect(h.db.store.get('serviceBookings/s1')!.status).toBe('scheduled');
    expect((await call(adminAction, asAdmin, { action: 'drop-database' })).statusCode).toBe(400);
  });
});
