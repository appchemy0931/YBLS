import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard, Calendar, Wallet, Gift, Users, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { imageUrl } from '../utils/image';
import LanguageSwitcher from './LanguageSwitcher';
import YBLSLogo from '../assets/YBLS-Logo.png';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUserMenu(false);
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/services', label: t('nav.services') },
    { to: '/products', label: t('nav.products') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-blue-900/90 backdrop-blur-md border-b border-rose-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center gap-2 mb-4 mt-5">
              <img src={YBLSLogo} alt="YBLS" className="w-25 h-25 rounded-full object-cover" />
            </div>
            <span className="text-xl lg:text-2xl font-bold text-gradient-gold" style={{ fontFamily: 'Playfair Display, serif' }}>
              YBLS
            </span>
            
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-white hover:text-green-500 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/cart" className="relative p-2 text-white hover:text-green-400 transition-colors">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-deep text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-rose-soft transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-rose-deep to-gold-400 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                    {user.profileImage ? (
                      <img src={imageUrl(user.profileImage)} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-white">{user.name.split(' ')[0]}</span>
                </button>
                {userMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-rose-soft py-2 z-50 animate-[scale-in_0.2s_ease-out]">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                        <p className="text-xs text-gold-600 mt-1">{t('nav.walletBalance')}: RM{((user.walletBalance || 0) + (user.walletBonus || 0)).toFixed(2)}</p>
                      </div>
                      {user.role === 'admin' ? (
                        <Link to="/admin" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-rose-50 transition-colors">
                          <LayoutDashboard size={16} /> {t('nav.adminDashboard')}
                        </Link>
                      ) : (
                        <>
                          <Link to="/dashboard" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-rose-50 transition-colors">
                            <LayoutDashboard size={16} /> {t('nav.dashboard')}
                          </Link>
                          <Link to="/bookings" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-rose-50 transition-colors">
                            <Calendar size={16} /> {t('nav.myBookings')}
                          </Link>
                          <Link to="/wallet" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-rose-50 transition-colors">
                            <Wallet size={16} /> {t('nav.wallet')}
                          </Link>
                          <Link to="/orders" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-rose-50 transition-colors">
                            <ShoppingBag size={16} /> {t('nav.orders')}
                          </Link>
                          <Link to="/coupons" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-rose-50 transition-colors">
                            <Gift size={16} /> {t('nav.coupons')}
                          </Link>
                          <Link to="/referral" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-rose-50 transition-colors">
                            <Users size={16} /> {t('nav.referralCenter')}
                          </Link>
                          <Link to="/profile" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-rose-50 transition-colors">
                            <User size={16} /> {t('nav.profile')}
                          </Link>
                        </>
                      )}
                      <div className="border-t border-gray-100 mt-1">
                        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full">
                          <LogOut size={16} /> {t('common.logout')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-white hover:text-green-500 transition-colors px-4 py-2 rounded-full hover:bg-blue-600">
                  {t('common.login')}
                </Link>
                <Link to="/register" className="bg-linear-to-r from-rose-deep to-rose-medium text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-green-500 hover:from-green-500 hover:to-green-600 transition-all">
                  {t('common.signUp')}
                </Link>
              </div>
            )}

            <button onClick={() => setOpen(!open)} className="lg:hidden p-2 text-white">
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden py-4 border-t border-rose-soft animate-[slide-up_0.3s_ease-out]">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="block py-3 text-sm font-medium text-white hover:text-green-500 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <div className="px-2 py-3 mb-2 border-b border-rose-soft/50">
                  <div className="flex items-center gap-3">
                    {user.profileImage ? (
                      <img src={imageUrl(user.profileImage)} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-rose-deep to-gold-400 flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-300 truncate">{user.email}</p>
                      <p className="text-xs text-gold-400 mt-0.5">{t('nav.walletBalance')}: RM{((user.walletBalance || 0) + (user.walletBonus || 0)).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                {user.role === 'admin' ? (
                  <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 py-3 text-sm font-medium text-white hover:text-green-500 transition-colors">
                    <LayoutDashboard size={16} /> {t('nav.adminDashboard')}
                  </Link>
                ) : (
                  <>
                    <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 py-3 text-sm font-medium text-white hover:text-green-500 transition-colors">
                      <LayoutDashboard size={16} /> {t('nav.dashboard')}
                    </Link>
                    <Link to="/bookings" onClick={() => setOpen(false)} className="flex items-center gap-3 py-3 text-sm font-medium text-white hover:text-green-500 transition-colors">
                      <Calendar size={16} /> {t('nav.myBookings')}
                    </Link>
                    <Link to="/wallet" onClick={() => setOpen(false)} className="flex items-center gap-3 py-3 text-sm font-medium text-white hover:text-green-500 transition-colors">
                      <Wallet size={16} /> {t('nav.wallet')}
                    </Link>
                    <Link to="/orders" onClick={() => setOpen(false)} className="flex items-center gap-3 py-3 text-sm font-medium text-white hover:text-green-500 transition-colors">
                      <ShoppingBag size={16} /> {t('nav.orders')}
                    </Link>
                    <Link to="/coupons" onClick={() => setOpen(false)} className="flex items-center gap-3 py-3 text-sm font-medium text-white hover:text-green-500 transition-colors">
                      <Gift size={16} /> {t('nav.coupons')}
                    </Link>
                    <Link to="/referral" onClick={() => setOpen(false)} className="flex items-center gap-3 py-3 text-sm font-medium text-white hover:text-green-500 transition-colors">
                      <Users size={16} /> {t('nav.referralCenter')}
                    </Link>
                    <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 py-3 text-sm font-medium text-white hover:text-green-500 transition-colors">
                      <User size={16} /> {t('nav.profile')}
                    </Link>
                  </>
                )}
                <button onClick={handleLogout} className="flex items-center gap-3 py-3 text-sm font-medium text-red-400 w-full text-left">
                  <LogOut size={16} /> {t('common.logout')}
                </button>
              </>
            ) : (
              <div className="flex gap-3 pt-3">
                <Link to="/login" onClick={() => setOpen(false)} className="flex-1 text-center border-2 border-rose-deep text-white py-2.5 rounded-full text-sm font-medium hover:bg-blue-600 hover:border-blue-600 transition-colors">{t('common.login')}</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="flex-1 text-center bg-rose-deep text-white py-2.5 rounded-full text-sm font-medium hover:bg-green-500 transition-colors">{t('common.signUp')}</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
