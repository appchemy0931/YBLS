import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Users, Scissors, Calendar, Package, Gift,
  Wallet, Users2, Menu, X, LogOut, ShoppingBag, Crown, Tag, FileText, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import YBLSLogo from '../assets/YBLS-Logo.png';

export default function AdminLayout() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const adminLinks = [
    { to: '/admin', label: t('admin.layout.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: t('admin.layout.users'), icon: Users },
    { to: '/admin/services', label: t('admin.layout.services'), icon: Scissors },
    { to: '/admin/bookings', label: t('admin.layout.bookings'), icon: Calendar },
    { to: '/admin/products', label: t('admin.layout.products'), icon: Package },
    { to: '/admin/orders', label: t('admin.layout.orders'), icon: ShoppingBag },
    { to: '/admin/coupons', label: t('admin.layout.coupons'), icon: Gift },
    { to: '/admin/promotions', label: t('admin.layout.promotions'), icon: Tag },
    { to: '/admin/wallet', label: t('admin.layout.transactions'), icon: Wallet },
    { to: '/admin/referrals', label: t('admin.layout.referrals'), icon: Users2 },
    { to: '/admin/rankings', label: t('admin.layout.rankings'), icon: Crown },
    { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
    { to: '/admin/report', label: t('admin.layout.report'), icon: FileText },
  ];
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-linear-to-b from-[#3a2a2a] to-[#2a1f1f] text-gray-300 z-50 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <div className="flex items-center gap-2 mb-4">
              <img src={YBLSLogo} alt="YBLS" className="w-20 h-20 rounded-full object-cover" />
            </div>
            <span className="text-xl font-bold text-gradient-gold" style={{ fontFamily: 'Playfair Display, serif' }}>
              {t('admin.layout.yblsAdmin')}
            </span>
          </Link>

          <nav className="space-y-1">
            {adminLinks.map((link) => {
              const isActive = link.end ? location.pathname === link.to : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-rose-deep/20 text-gold-400 border-l-2 border-gold-400'
                      : 'hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 overflow-x-hidden">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-gray-600">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="text-lg font-semibold text-gray-800 hidden lg:block">{t('admin.layout.adminPanel')}</h1>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-400">{t('admin.layout.administrator')}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-rose-deep to-gold-400 flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button onClick={handleLogout} title={t('common.logout')} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
