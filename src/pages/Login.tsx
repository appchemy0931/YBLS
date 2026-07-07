import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/dashboard';
  const { t } = useTranslation();

  const loginMutation = useMutation({
    mutationFn: () => authAPI.login({ email, password }),
    onSuccess: (res) => {
      login(res.data as any);
      toast.success(t('auth.welcomeBackToast'));
      navigate(res.data?.role === 'admin' ? '/admin' : from);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('auth.fillAllFields'));
      return;
    }
    loginMutation.mutate();
  };

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
          <h1 className="text-2xl font-bold text-gray-800">{t('auth.welcomeBack')}</h1>
          <p className="text-gray-500 mt-2">{t('auth.signInToAccount')}</p>
        </div>

        <div className="bg-white rounded-2xl card-shadow p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.emailAddress')}</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.password')}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-linear-to-r from-rose-deep to-rose-medium text-white py-3.5 rounded-xl font-medium hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? <Spinner className="min-h-0! [&>div]:w-5 [&>div]:h-5 [&>div]:border-t-white" /> : t('auth.signIn')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-rose-deep font-medium hover:underline">{t('common.signUp')}</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          {t('auth.demo')}
        </p>
      </div>
    </div>
  );
}
