export interface User {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  walletBalance: number;
  walletBonus: number;
  customerRanking: number;
  referralCode: string;
  referredBy?: string | null;
  profileImage?: string;
  token: string;
}

export interface Service {
  _id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  price: number;
  image: string;
  status: 'active' | 'inactive';
}

export interface Promotion {
  _id: string;
  title: string;
  description: string;
  image: string;
  discount: number;
  originalPrice: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
}

export interface Booking {
  _id: string;
  userId: string;
  serviceId: Service | string;
  promotionId?: Promotion | string;
  bookingType?: 'service' | 'promotion';
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  price: number;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  paidFromWallet: boolean;
  paidFromBalance?: number;
  paidFromBonus?: number;
  paymentMethod?: 'cash' | 'wallet' | 'split';
  notes?: string;
  cancellationReason?: string;
  cancelledBy?: { _id: string; name: string; userId: string } | string | null;
  cancelledByRole?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface WeightVariant {
  label: string;
  stock: number;
  price: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  category: 'Skincare' | 'Beauty Product' | 'Treatment Product';
  status: 'active' | 'inactive';
  weights?: WeightVariant[];
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  weightLabel?: string;
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled';
  paidFromWallet: boolean;
  shippingAddress?: string;
  cancellationReason?: string;
  cancelledBy?: { _id: string; name: string; userId: string } | string | null;
  cancelledByRole?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface Coupon {
  _id: string;
  name: string;
  image: string;
  amount: number;
  price: number;
  expiryDate: string;
  status: 'active' | 'expired';
  isExpired?: boolean;
}

export interface WalletTransaction {
  _id: string;
  userId: string;
  type: 'TOPUP' | 'BOOKING_PAYMENT' | 'PRODUCT_PAYMENT' | 'REFUND' | 'REFERRAL_BONUS' | 'COUPON_PURCHASE' | 'RANKING_PURCHASE' | 'RANKING_BONUS' | 'SIGNUP_BONUS';
  amount: number;
  description: string;
  balanceAfter?: number;
  date: string;
}

export interface Referral {
  _id: string;
  inviterUserId: string;
  newUserId: { _id: string; name: string; userId: string } | string;
  referralCode: string;
  level: number;
  reward: number;
  createdAt: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface RankingTier {
  tier: number;
  stars: number;
  price: number;
  name: string;
}

export interface RankingPurchase {
  _id: string;
  userId: string | { _id: string; name: string; userId: string; email: string; phone: string };
  tier: number;
  price: number;
  tierName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  reviewedBy?: { _id: string; name: string; userId: string } | string | null;
  reviewedAt?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  qty: number;
  weightVariant?: WeightVariant;
}

export interface Testimonial {
  _id: string;
  image: string;
  status: 'active' | 'inactive';
  createdAt?: string;
}
