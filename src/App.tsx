import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';

import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import PromotionDetail from './pages/PromotionDetail';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyBookings from './pages/MyBookings';
import CalendarPage from './pages/CalendarPage';
import Wallet from './pages/Wallet';
import Coupons from './pages/Coupons';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Referral from './pages/Referral';
import Profile from './pages/Profile';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminServices from './pages/admin/AdminServices';
import AdminPromotions from './pages/admin/AdminPromotions';
import AdminBookings from './pages/admin/AdminBookings';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminWallet from './pages/admin/AdminWallet';
import AdminReferrals from './pages/admin/AdminReferrals';
import AdminRanking from './pages/admin/AdminRanking';
import AdminReport from './pages/admin/AdminReport';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ScrollToTop />
        <BackToTop />
        <Routes>
          {/* Public + Customer routes (share PublicLayout with Outlet) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/promotions/:id" element={<PromotionDetail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/coupons" element={<ProtectedRoute><Coupons /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/referral" element={<ProtectedRoute><ErrorBoundary><Referral /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Route>

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><ErrorBoundary><AdminLayout /></ErrorBoundary></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="wallet" element={<AdminWallet />} />
            <Route path="referrals" element={<AdminReferrals />} />
            <Route path="rankings" element={<AdminRanking />} />
            <Route path="report" element={<AdminReport />} />
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
