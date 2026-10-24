import Razorpay from 'razorpay';
import { db, handler, HttpError, requireUser } from './_lib.js';
import { priceCart } from './_pricing.js';

/**
 * Step 1 of checkout: price the cart on the server and create a Razorpay order.
 * The priced cart is parked in `pendingOrders` (no client access) until payment is verified.
 */
export default handler('POST', async (req) => {
  const caller = await requireUser(req);
  if (caller.role === 'admin') throw new HttpError(403, 'Admins cannot place orders');
  const { items: lines, address } = req.body ?? {};
  if (!address?.line1 || !address?.pincode || !address?.phone) throw new HttpError(400, 'Delivery address required');

  const priced = await priceCart(caller, lines);

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new HttpError(503, 'Razorpay is not configured on the server');

  const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const rzpOrder = await rzp.orders.create({
    amount: priced.total * 100,
    currency: 'INR',
    receipt: `rcpt_${Date.now()}`,
    notes: { uid: caller.uid },
  });

  await db.doc(`pendingOrders/${rzpOrder.id}`).set({
    uid: caller.uid,
    ...priced,
    address,
    customerName: caller.name,
    customerEmail: caller.email,
    createdAt: Date.now(),
  });

  return { razorpayOrderId: rzpOrder.id, amount: priced.total, keyId, ...priced };
});
