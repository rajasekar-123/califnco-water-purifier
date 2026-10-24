import { db, HttpError, type Caller } from './_lib.js';

export interface RequestedLine {
  productId: string;
  qty: number;
}

const FREE_SHIPPING_THRESHOLD = 5000;
const SHIPPING_FEE = 199;

/**
 * Server-side pricing. Prices come from Firestore, never from the client.
 * Dealers get wholesale pricing only when their dealer doc is `approved`.
 */
export async function priceCart(caller: Caller, lines: RequestedLine[]) {
  if (!Array.isArray(lines) || lines.length === 0) throw new HttpError(400, 'Cart is empty');
  if (lines.length > 50) throw new HttpError(400, 'Too many line items');

  let wholesale = false;
  if (caller.role === 'dealer') {
    const dealer = await db.doc(`dealers/${caller.uid}`).get();
    if (dealer.data()?.status !== 'approved') throw new HttpError(403, 'Dealer account is not approved');
    wholesale = true;
  }

  const items = [];
  for (const line of lines) {
    const qty = Math.floor(Number(line.qty));
    if (!line.productId || !Number.isFinite(qty) || qty < 1 || qty > 500) {
      throw new HttpError(400, 'Invalid quantity');
    }
    const [p, dp] = await Promise.all([
      db.doc(`products/${line.productId}`).get(),
      wholesale ? db.doc(`dealerPricing/${line.productId}`).get() : Promise.resolve(null),
    ]);
    if (!p.exists || p.data()!.active === false) throw new HttpError(400, `Product unavailable: ${line.productId}`);
    const product = p.data()!;
    if (product.stock < qty) throw new HttpError(409, `Only ${product.stock} left of ${product.name}`);
    let unitPrice = product.price as number;
    if (wholesale) {
      const pricing = dp?.data();
      if (!pricing) throw new HttpError(400, `No wholesale price for ${product.name}`);
      if (qty < pricing.minQty) throw new HttpError(400, `${product.name}: minimum wholesale quantity is ${pricing.minQty}`);
      unitPrice = pricing.dealerPrice;
    }
    items.push({ productId: p.id, name: product.name, image: product.image, qty, unitPrice });
  }

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const shipping = wholesale || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  return { items, subtotal, shipping, total: subtotal + shipping, type: wholesale ? 'wholesale' : 'retail' } as const;
}
