import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { db, handler, HttpError, notifyUser, requireUser } from './_lib.js';
import { sendOrderEmail, sendOrderSms } from './_notify.js';

/**
 * Step 2 of checkout. An order is only written after:
 *  1. the HMAC signature matches (proves the callback came from Razorpay), and
 *  2. Razorpay's own API confirms the payment is captured/authorized for the right amount.
 * The client callback alone never marks anything as paid.
 */
export default handler('POST', async (req) => {
  const caller = await requireUser(req);
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body ?? {};
  if (!orderId || !paymentId || !signature) throw new HttpError(400, 'Missing payment fields');

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!secret || !keyId) throw new HttpError(503, 'Razorpay is not configured on the server');

  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new HttpError(400, 'Invalid payment signature');

  const pendingRef = db.doc(`pendingOrders/${orderId}`);
  const orderRef = db.doc(`orders/${orderId}`);

  // Idempotent: a retried verify returns the existing order.
  const existing = await orderRef.get();
  if (existing.exists) return { orderId, status: existing.data()!.status };

  const pending = (await pendingRef.get()).data();
  if (!pending || pending.uid !== caller.uid) throw new HttpError(404, 'No pending order for this payment');

  const rzp = new Razorpay({ key_id: keyId, key_secret: secret });
  const payment = await rzp.payments.fetch(paymentId);
  if (payment.order_id !== orderId || Number(payment.amount) !== pending.total * 100) {
    throw new HttpError(400, 'Payment does not match order');
  }
  if (!['captured', 'authorized'].includes(payment.status)) throw new HttpError(402, `Payment ${payment.status}`);

  await db.runTransaction(async (tx) => {
    const refs = pending.items.map((i: { productId: string }) => db.doc(`products/${i.productId}`));
    const snaps = await Promise.all(refs.map((r: FirebaseFirestore.DocumentReference) => tx.get(r)));
    snaps.forEach((s, idx) => {
      const need = pending.items[idx].qty;
      if ((s.data()?.stock ?? 0) < need) throw new HttpError(409, `Stock changed for ${pending.items[idx].name}`);
    });
    snaps.forEach((s, idx) => tx.update(s.ref, { stock: s.data()!.stock - pending.items[idx].qty }));
    const now = Date.now();
    tx.set(orderRef, {
      uid: pending.uid,
      type: pending.type,
      items: pending.items,
      subtotal: pending.subtotal,
      shipping: pending.shipping,
      total: pending.total,
      status: 'placed',
      paymentStatus: 'paid',
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      address: pending.address,
      customerName: pending.customerName,
      customerEmail: pending.customerEmail,
      createdAt: now,
      updatedAt: now,
    });
    tx.delete(pendingRef);
  });

  await notifyUser(pending.uid, 'Order confirmed', `Your order #${orderId.slice(-8)} for ₹${pending.total} is confirmed.`);
  await Promise.allSettled([
    sendOrderEmail(pending.customerEmail, pending.customerName, orderId, pending.total),
    sendOrderSms(pending.address.phone, orderId, pending.total),
  ]);
  return { orderId, status: 'placed' };
});
