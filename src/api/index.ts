import api from './axios';
import type {
  User,
  Service,
  Promotion,
  Booking,
  Product,
  Order,
  Coupon,
  WalletTransaction,
  Referral,
  TimeSlot,
  RankingTier,
  RankingPurchase,
  Testimonial,
} from '../types';

export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<{ success: boolean; image: string }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<{ success: boolean; image: string }>('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const authAPI = {
  register: (data: { name: string; email: string; phone: string; password: string; referralCode?: string }) =>
    api.post<{ success: boolean; token: string; _id: string; userId: string; name: string; email: string; phone: string; role: string; walletBalance: number; walletBonus: number; referralCode: string }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<Partial<User>>('/auth/login', data),
  getProfile: () => api.get<Partial<User>>('/auth/profile'),
  updateProfile: (data: Partial<User>) => api.put<Partial<User>>('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/password', data),
};

export const serviceAPI = {
  getAll: (category?: string) => api.get<{ services: Service[]; categories: string[] }>('/services', { params: { category } }),
  getById: (id: string) => api.get<{ service: Service }>(`/services/${id}`),
  create: (data: Partial<Service>) => api.post<{ service: Service }>('/services', data),
  update: (id: string, data: Partial<Service>) => api.put<{ service: Service }>(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

export const promotionAPI = {
  getAll: () => api.get<{ promotions: Promotion[] }>('/promotions'),
  getById: (id: string) => api.get<{ promotion: Promotion }>(`/promotions/${id}`),
  create: (data: Partial<Promotion>) => api.post<{ promotion: Promotion }>('/promotions', data),
  update: (id: string, data: Partial<Promotion>) => api.put<{ promotion: Promotion }>(`/promotions/${id}`, data),
  delete: (id: string) => api.delete(`/promotions/${id}`),
};

export const bookingAPI = {
  getSlots: (date: string) => api.get<{ slots: TimeSlot[] }>('/bookings/slots', { params: { date } }),
  create: (data: { serviceId?: string; promotionId?: string; bookingDate: string; bookingTime: string; notes?: string; payFromWallet?: boolean; splitPayment?: boolean }) =>
    api.post<{ booking: Booking }>('/bookings', data),
  getMy: () => api.get<{ bookings: Booking[] }>('/bookings/my'),
  cancel: (id: string, reason: string) => api.put<{ booking: Booking }>(`/bookings/${id}/cancel`, { reason }),
  getAll: (params?: { status?: string; date?: string }) => api.get<{ bookings: Booking[] }>('/bookings', { params }),
  updateStatus: (id: string, status: string, reason?: string) => api.put<{ booking: Booking }>(`/bookings/${id}/status`, { status, reason }),
  delete: (id: string) => api.delete(`/bookings/${id}`),
};

export const productAPI = {
  getAll: (category?: string) => api.get<{ products: Product[]; categories: string[] }>('/products', { params: { category } }),
  getAllAdmin: () => api.get<{ products: Product[]; categories: string[] }>('/products/admin/all'),
  getById: (id: string) => api.get<{ product: Product }>(`/products/${id}`),
  create: (data: Partial<Product>) => api.post<{ product: Product }>('/products', data),
  update: (id: string, data: Partial<Product>) => api.put<{ product: Product }>(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const orderAPI = {
  create: (data: { items: { productId: string; qty: number; weightLabel?: string }[]; shippingAddress?: string; payFromWallet?: boolean }) =>
    api.post<{ order: Order }>('/orders', data),
  getMy: () => api.get<{ orders: Order[] }>('/orders/my'),
  getById: (id: string) => api.get<{ order: Order }>(`/orders/${id}`),
  getAll: (status?: string) => api.get<{ orders: Order[] }>('/orders', { params: { status } }),
  update: (id: string, data: Partial<{ status: string; shippingAddress: string; totalAmount: number; items: { productId: string; name: string; price: number; qty: number; image: string }[]; reason: string }>) =>
    api.put<{ order: Order }>(`/orders/${id}`, data),
  updateStatus: (id: string, status: string, reason?: string) => api.put<{ order: Order }>(`/orders/${id}/status`, { status, reason }),
  delete: (id: string) => api.delete<{ success: boolean; message: string }>(`/orders/${id}`),
};

export const walletAPI = {
  getBalance: () => api.get<{ walletBalance: number; walletBonus: number }>('/wallet/balance'),
  topUp: (data: { amount: number; method?: string }) => api.post('/wallet/topup', data),
  getHistory: (type?: string) => api.get<{ transactions: WalletTransaction[] }>('/wallet/history', { params: { type } }),
  getAllTransactions: (params: { type?: string; from?: string; to?: string } = {}) =>
    api.get<{ transactions: WalletTransaction[] }>('/wallet/transactions', { params }),
  deleteTransactions: (ids: string[]) =>
    api.delete<{ success: boolean; message: string; deletedCount: number }>('/wallet/transactions', { data: { ids } }),
};

export const couponAPI = {
  getAll: () => api.get<{ coupons: Coupon[] }>('/coupons'),
  getById: (id: string) => api.get<{ coupon: Coupon }>(`/coupons/${id}`),
  purchase: (couponId: string) => api.post('/coupons/purchase', { couponId }),
  create: (data: Partial<Coupon>) => api.post<{ coupon: Coupon }>('/coupons', data),
  update: (id: string, data: Partial<Coupon>) => api.put<{ coupon: Coupon }>(`/coupons/${id}`, data),
  delete: (id: string) => api.delete(`/coupons/${id}`),
};

export const referralAPI = {
  getInfo: () => api.get<{
    referralCode: string;
    referralUrl: string;
    stats: { level1: number; level2: number; level3: number; totalReferrals: number; totalReward: number };
    referrals: Referral[];
  }>('/referral'),
  getQRCode: () => api.get<{ referralUrl: string; qrCode: string; referralCode: string }>('/referral/qrcode'),
  getAll: () => api.get<{ referrals: Referral[] }>('/referral/all'),
};

export const rankingAPI = {
  getInfo: () => api.get<{ currentRanking: number; tiers: RankingTier[]; myRequests: RankingPurchase[] }>('/ranking'),
  requestPurchase: (tier: number) => api.post<{ message: string; request: RankingPurchase }>('/ranking/purchase', { tier }),
  getRequests: (status?: string) => api.get<{ requests: RankingPurchase[] }>('/ranking/requests', { params: { status } }),
  approveRequest: (id: string) => api.put<{ message: string; request: RankingPurchase }>(`/ranking/requests/${id}/approve`),
  rejectRequest: (id: string, reason?: string) => api.put<{ message: string; request: RankingPurchase }>(`/ranking/requests/${id}/reject`, { reason }),
};

export const adminAPI = {
  getStats: (range?: { from?: string; to?: string }) => api.get('/admin/stats', { params: range }),
  getUsers: (role?: string) => api.get('/admin/users', { params: { role } }),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  updateUser: (id: string, data: Record<string, unknown>) => api.put(`/admin/users/${id}`, data),
  changeUserPassword: (id: string, data: { newPassword: string }) => api.put(`/admin/users/${id}/password`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getReport: (range?: { from?: string; to?: string }) => api.get('/admin/report', { params: range }),
};

export const testimonialAPI = {
  getAll: () => api.get<{ testimonials: Testimonial[] }>('/testimonials'),
  getAllAdmin: () => api.get<{ testimonials: Testimonial[] }>('/testimonials/admin/all'),
  getById: (id: string) => api.get<{ testimonial: Testimonial }>(`/testimonials/${id}`),
  create: (data: Partial<Testimonial>) => api.post<{ testimonial: Testimonial }>('/testimonials', data),
  update: (id: string, data: Partial<Testimonial>) => api.put<{ testimonial: Testimonial }>(`/testimonials/${id}`, data),
  delete: (id: string) => api.delete(`/testimonials/${id}`),
};
