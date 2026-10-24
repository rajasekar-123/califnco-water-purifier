import type { CartLine, DealerPricing, Product } from '@/types';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '@/constants/shared';

export interface PricedLine {
  product: Product;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  minQty: number;
}

export function unitPriceFor(product: Product, wholesale: boolean, pricing?: DealerPricing): number {
  return wholesale && pricing ? pricing.dealerPrice : product.price;
}

/** Minimum quantity applies to wholesale orders only. */
export function minQtyFor(wholesale: boolean, pricing?: DealerPricing): number {
  return wholesale ? pricing?.minQty ?? 1 : 1;
}

export function addLine(lines: CartLine[], productId: string, qty: number, startQty = 1): CartLine[] {
  const existing = lines.find((l) => l.productId === productId);
  if (existing) return lines.map((l) => (l.productId === productId ? { ...l, qty: l.qty + qty } : l));
  return [...lines, { productId, qty: Math.max(qty, startQty) }];
}

export function setLineQty(lines: CartLine[], productId: string, qty: number): CartLine[] {
  return qty <= 0 ? lines.filter((l) => l.productId !== productId) : lines.map((l) => (l.productId === productId ? { ...l, qty } : l));
}

export function priceCart(
  lines: CartLine[],
  products: Record<string, Product>,
  wholesale: boolean,
  pricing: Record<string, DealerPricing>,
) {
  const priced: PricedLine[] = [];
  for (const l of lines) {
    const product = products[l.productId];
    if (!product) continue;
    const unitPrice = unitPriceFor(product, wholesale, pricing[l.productId]);
    priced.push({ product, qty: l.qty, unitPrice, lineTotal: unitPrice * l.qty, minQty: minQtyFor(wholesale, pricing[l.productId]) });
  }
  const subtotal = priced.reduce((s, l) => s + l.lineTotal, 0);
  const shipping = wholesale || subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  return { lines: priced, subtotal, shipping, total: subtotal + shipping };
}
