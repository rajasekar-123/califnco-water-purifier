import { addLine, minQtyFor, priceCart, setLineQty, unitPriceFor } from '@/store/cartLogic';
import { validate } from '@/constants/validation';
import { filterAndSort } from '@/store/catalogFilter';
import type { DealerPricing, Product } from '@/types';

const product = (over: Partial<Product> = {}): Product => ({
  id: 'p1', name: 'AquaPure Elite RO', brand: 'AquaPure', category: 'RO Water Purifiers', description: '',
  price: 15000, image: '', stock: 5, specs: {}, rating: 4.5, ratingCount: 10, active: true, ...over,
});
const pricing: DealerPricing = { productId: 'p1', dealerPrice: 11000, minQty: 2 };

describe('pricing', () => {
  it('shows retail price to customers and wholesale to approved dealers', () => {
    expect(unitPriceFor(product(), false, pricing)).toBe(15000);
    expect(unitPriceFor(product(), true, pricing)).toBe(11000);
  });
  it('never uses dealer price when pricing is unavailable (e.g. unapproved dealer)', () => {
    expect(unitPriceFor(product(), true, undefined)).toBe(15000);
  });
  it('applies min quantity only to wholesale', () => {
    expect(minQtyFor(false, pricing)).toBe(1);
    expect(minQtyFor(true, pricing)).toBe(2);
  });
});

describe('cart', () => {
  it('adds, merges and removes lines', () => {
    let lines = addLine([], 'p1', 1);
    lines = addLine(lines, 'p1', 2);
    expect(lines).toEqual([{ productId: 'p1', qty: 3 }]);
    expect(setLineQty(lines, 'p1', 0)).toEqual([]);
  });
  it('honours the starting quantity for a new wholesale line', () => {
    expect(addLine([], 'p1', 1, 10)).toEqual([{ productId: 'p1', qty: 10 }]);
  });
  it('charges shipping under the free threshold and not above', () => {
    const cheap = product({ id: 'c', price: 400 });
    const low = priceCart([{ productId: 'c', qty: 1 }], { c: cheap }, false, {});
    expect(low.shipping).toBe(199);
    expect(low.total).toBe(599);
    const high = priceCart([{ productId: 'p1', qty: 1 }], { p1: product() }, false, {});
    expect(high.shipping).toBe(0);
    expect(high.total).toBe(15000);
  });
  it('prices a wholesale cart with no shipping', () => {
    const c = priceCart([{ productId: 'p1', qty: 3 }], { p1: product() }, true, { p1: pricing });
    expect(c.subtotal).toBe(33000);
    expect(c.shipping).toBe(0);
  });
  it('skips products that no longer exist', () => {
    expect(priceCart([{ productId: 'gone', qty: 1 }], {}, false, {}).lines).toHaveLength(0);
  });
});

describe('validation', () => {
  it('accepts valid and rejects invalid values', () => {
    expect(validate({ email: 'a@b.co', phone: '9876543210', password: 'secret1' }, ['email', 'phone', 'password'])).toEqual({});
    const errs = validate({ email: 'nope', phone: '12345', password: '123' }, ['email', 'phone', 'password']);
    expect(Object.keys(errs)).toEqual(['email', 'phone', 'password']);
  });
  it('validates 6-digit pincodes', () => {
    expect(validate({ pincode: '600001' }, ['pincode'])).toEqual({});
    expect(validate({ pincode: '6000' }, ['pincode']).pincode).toBeTruthy();
  });
});

describe('filterAndSort', () => {
  const list = [
    product({ id: 'a', name: 'Alpha RO', price: 9000, rating: 4.0 }),
    product({ id: 'b', name: 'Beta UV', category: 'UV Water Purifiers', brand: 'PureFlow', price: 5000, rating: 4.8 }),
    product({ id: 'c', name: 'Gamma RO', price: 12000, rating: 4.4, stock: 0 }),
  ];
  const priceOf = (p: Product) => p.price;
  it('filters by text, category, stock and price', () => {
    expect(filterAndSort(list, { q: 'beta' }, priceOf).map((p) => p.id)).toEqual(['b']);
    expect(filterAndSort(list, { category: 'RO Water Purifiers' }, priceOf)).toHaveLength(2);
    expect(filterAndSort(list, { inStockOnly: true }, priceOf)).toHaveLength(2);
    expect(filterAndSort(list, { maxPrice: 9000 }, priceOf).map((p) => p.id)).toEqual(['a', 'b']);
  });
  it('sorts by price and rating', () => {
    expect(filterAndSort(list, { sort: 'priceAsc' }, priceOf).map((p) => p.id)).toEqual(['b', 'a', 'c']);
    expect(filterAndSort(list, { sort: 'priceDesc' }, priceOf).map((p) => p.id)).toEqual(['c', 'a', 'b']);
    expect(filterAndSort(list, { sort: 'rating' }, priceOf).map((p) => p.id)).toEqual(['b', 'c', 'a']);
  });
});
