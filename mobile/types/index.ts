// Shared domain models used by mobile, admin and the serverless API.
export type Role = 'customer' | 'dealer' | 'admin';
export type DealerStatus = 'pending' | 'approved' | 'rejected';

export type OrderStatus =
  | 'pending_payment'
  | 'placed'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid' | 'failed';
export type ServiceStatus = 'requested' | 'scheduled' | 'completed' | 'cancelled';
export type OrderType = 'retail' | 'wholesale';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  fcmToken?: string;
  referralCode?: string;
  createdAt: number;
}

export interface DealerProfile {
  uid: string;
  businessName: string;
  gstNumber?: string;
  contactName: string;
  phone: string;
  city: string;
  status: DealerStatus;
  createdAt: number;
  reviewedAt?: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  /** Customer (retail) price in INR. */
  price: number;
  image: string;
  stock: number;
  specs: Record<string, string>;
  rating: number;
  ratingCount: number;
  active: boolean;
}

/** Stored in `dealerPricing/{productId}`, readable only by approved dealers and admins. */
export interface DealerPricing {
  productId: string;
  dealerPrice: number;
  minQty: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  qty: number;
  unitPrice: number;
}

export interface Address {
  id: string;
  uid: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

export interface Order {
  id: string;
  uid: string;
  type: OrderType;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  address: Omit<Address, 'id' | 'uid'>;
  customerName: string;
  customerEmail: string;
  createdAt: number;
  updatedAt: number;
}

export interface CartLine {
  productId: string;
  qty: number;
}

export interface ServiceBooking {
  id: string;
  uid: string;
  customerName: string;
  phone: string;
  serviceType: 'installation' | 'repair' | 'maintenance' | 'filter_change';
  productName?: string;
  preferredDate: string;
  notes?: string;
  address: string;
  status: ServiceStatus;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  uid: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
}
