import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Mail, Phone, Lock, Save, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwSection, setShowPwSection] = useState(false);
  const { t } = useTranslation();

  const updateMutation = useMutation({
    mutationFn: () => authAPI.updateProfile(form),
    onSuccess: (res) => {
      updateUser(res.data as any);
      toast.success(t('profile.profileUpdated'));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pwMutation = useMutation({
    mutationFn: () => authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    onSuccess: () => {
      toast.success(t('profile.passwordChanged'));
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleProfile = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const handlePassword = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error(t('profile.passwordsDoNotMatch'));
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error(t('profile.passwordMinLength'));
      return;
    }
    pwMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>{t('profile.pageTitle')}</h1>
      <p className="text-gray-500 mb-8">{t('profile.pageIntro')}</p>

      <div className="bg-white rounded-2xl p-6 card-shadow mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-rose-deep to-gold-400 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{user?.name}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <p className="text-xs text-gold-600 mt-1">{t('profile.referralCode', { code: user?.referralCode })}</p>
          </div>
        </div>

        <form onSubmit={handleProfile} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">{t('profile.personalInformation')}</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.fullName')}</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.emailCannotChange')}</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" value={user?.email || ''} disabled
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.phoneNumber')}</label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep transition-colors" />
            </div>
          </div>
          <Button type="submit" disabled={updateMutation.isPending} variant="gold">
            <Save size={16} className="inline mr-1" /> {updateMutation.isPending ? t('profile.saving') : t('profile.saveChanges')}
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-2xl p-6 card-shadow">
        <button onClick={() => setShowPwSection(!showPwSection)} className="flex items-center gap-2 text-lg font-semibold text-gray-800 w-full">
          <Key size={20} className="text-rose-deep" /> {t('profile.changePassword')}
        </button>
        {showPwSection && (
          <form onSubmit={handlePassword} className="space-y-4 mt-4 animate-[slide-up_0.3s_ease-out]">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.currentPassword')}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.newPassword')}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.confirmNewPassword')}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep transition-colors" />
              </div>
            </div>
            <Button type="submit" disabled={pwMutation.isPending}>
              {pwMutation.isPending ? t('profile.updating') : t('profile.updatePassword')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
