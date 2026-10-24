export const CATEGORIES = [
  'RO Water Purifiers',
  'UV Water Purifiers',
  'UF Water Purifiers',
  'Water Dispensers',
  'Water Pumps',
  'RO Membranes',
  'Water Filters',
  'Replacement Cartridges',
  'Spare Parts',
  'Accessories',
] as const;

export const ORDER_STATUSES = [
  'pending_payment',
  'placed',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export const FREE_SHIPPING_THRESHOLD = 5000;
export const SHIPPING_FEE = 199;
