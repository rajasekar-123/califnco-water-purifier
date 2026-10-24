import { db, handler, HttpError, notifyUser, requireAdmin } from './_lib.js';

const ORDER_STATUSES = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const SERVICE_STATUSES = ['requested', 'scheduled', 'completed', 'cancelled'];

/**
 * Privileged admin mutations that also notify the affected user:
 *  { action: 'order-status', orderId, status }
 *  { action: 'dealer-decision', dealerUid, decision: 'approved' | 'rejected' }
 *  { action: 'service-status', bookingId, status }
 */
export default handler('POST', async (req) => {
  await requireAdmin(req);
  const { action, ...p } = req.body ?? {};

  if (action === 'order-status') {
    if (!ORDER_STATUSES.includes(p.status)) throw new HttpError(400, 'Invalid status');
    const ref = db.doc(`orders/${p.orderId}`);
    const order = (await ref.get()).data();
    if (!order) throw new HttpError(404, 'Order not found');
    await ref.update({ status: p.status, updatedAt: Date.now() });
    await notifyUser(order.uid, 'Order update', `Order #${p.orderId.slice(-8)} is now ${p.status}.`);
    return { ok: true };
  }

  if (action === 'dealer-decision') {
    if (!['approved', 'rejected'].includes(p.decision)) throw new HttpError(400, 'Invalid decision');
    const ref = db.doc(`dealers/${p.dealerUid}`);
    if (!(await ref.get()).exists) throw new HttpError(404, 'Dealer not found');
    await ref.update({ status: p.decision, reviewedAt: Date.now() });
    await notifyUser(
      p.dealerUid,
      p.decision === 'approved' ? 'Dealer account approved' : 'Dealer application rejected',
      p.decision === 'approved' ? 'You can now place wholesale orders.' : 'Please contact support for details.',
    );
    return { ok: true };
  }

  if (action === 'service-status') {
    if (!SERVICE_STATUSES.includes(p.status)) throw new HttpError(400, 'Invalid status');
    const ref = db.doc(`serviceBookings/${p.bookingId}`);
    const booking = (await ref.get()).data();
    if (!booking) throw new HttpError(404, 'Booking not found');
    await ref.update({ status: p.status });
    await notifyUser(booking.uid, 'Service update', `Your ${booking.serviceType} request is now ${p.status}.`);
    return { ok: true };
  }

  throw new HttpError(400, 'Unknown action');
});
