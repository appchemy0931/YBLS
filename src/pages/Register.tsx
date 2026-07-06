import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, User, Phone, Eye, EyeOff, Sparkles, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', referralCode: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  useEffect(() => {
    const ref = searchParams.get('ref');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialize form from URL referral param
    if (ref) setForm((prev) => ({ ...prev, referralCode: ref }));
  }, [searchParams]);

  const registerMutation = useMutation({
    mutationFn: () => authAPI.register(form),
    onSuccess: (res) => {
      login(res.data as any);
      toast.success(t('auth.accountCreated'));
      navigate('/dashboard');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) {
      toast.error(t('auth.fillAllRequired'));
      return;
    }
    if (form.password.length < 6) {
      toast.error(t('auth.passwordMinLength'));
      return;
    }
    registerMutation.mutate();
  };

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blush-50 via-cream to-rose-soft px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-rose-deep to-gold-400 flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <span className="text-3xl font-bold text-gradient-gold" style={{ fontFamily: 'Playfair Display, serif' }}>YBLS</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{t('auth.createAccount')}</h1>
          <p className="text-gray-500 mt-2">{t('auth.joinYBLS')}</p>
        </div>

        {form.referralCode && (
          <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 mb-4 flex items-center gap-3 animate-[scale-in_0.3s_ease-out]">
            <Gift size={20} className="text-gold-600" />
            <div>
              <p className="text-sm font-medium text-gold-700">{t('auth.referralApplied')}</p>
              <p className="text-xs text-gold-600">{t('auth.referralBonusMsg')}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl card-shadow p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.fullName')}</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Jane Doe"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.emailAddress')}</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.phoneNumber')}</label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0123456789"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.password')}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min 6 characters"
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.referralCodeOptional')}</label>
              <div className="relative">
                <Gift size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={form.referralCode} onChange={(e) => set('referralCode', e.target.value.toUpperCase())} placeholder="BEAUTY888"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep transition-colors" />
              </div>
            </div>

            <button type="submit" disabled={registerMutation.isPending}
              className="w-full bg-linear-to-r from-rose-deep to-rose-medium text-white py-3.5 rounded-xl font-medium hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {registerMutation.isPending ? <Spinner className="!min-h-0 [&>div]:w-5 [&>div]:h-5 [&>div]:border-t-white" /> : t('auth.createAccount')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-rose-deep font-medium hover:underline">{t('common.login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
