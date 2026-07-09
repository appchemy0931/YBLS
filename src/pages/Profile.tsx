import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Mail, Phone, Lock, Save, Key, Camera, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { authAPI, uploadAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';
import { imageUrl } from '../utils/image';
import DoubleConfirmModal from '../components/DoubleConfirmModal';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwSection, setShowPwSection] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [showRemoveAvatarConfirm, setShowRemoveAvatarConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const avatarMutation = useMutation({
    mutationFn: (profileImage: string) => authAPI.updateProfile({ profileImage }),
    onSuccess: (res) => {
      updateUser(res.data as any);
      toast.success(t('profile.avatarUpdated'));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleProfile = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowSaveConfirm(true);
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
    setShowPwConfirm(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      const { data } = await uploadAPI.uploadAvatar(file);
      await avatarMutation.mutateAsync(data.image);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('profile.avatarUpdateFailed'));
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setShowRemoveAvatarConfirm(true);
  };

  const avatarSrc = imageUrl(user?.profileImage);
  const avatarKey = user?.profileImage || 'default';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>{t('profile.pageTitle')}</h1>
      <p className="text-gray-500 mb-8">{t('profile.pageIntro')}</p>

      <div className="bg-white rounded-2xl p-6 card-shadow mb-6">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-rose-deep to-gold-400 flex items-center justify-center text-white text-3xl font-bold overflow-hidden ring-2 ring-rose-soft">
              {avatarSrc ? (
                <img key={avatarKey} src={avatarSrc} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar || avatarMutation.isPending}
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-rose-deep text-white flex items-center justify-center shadow-lg hover:bg-rose-medium transition-colors disabled:opacity-50"
              aria-label={t('profile.changeAvatar')}
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-semibold text-gray-800">{user?.name}</h1>
              {uploadingAvatar && <span className="text-xs text-gold-600">{t('profile.uploadingAvatar')}</span>}
              {avatarMutation.isPending && !uploadingAvatar && <span className="text-xs text-gold-600">{t('profile.saving')}</span>}
            </div>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <p className="text-xs text-gold-600 mt-1">{t('profile.referralCode', { code: user?.referralCode })}</p>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar || avatarMutation.isPending}
                className="text-xs font-medium text-rose-deep hover:text-rose-medium disabled:opacity-50"
              >
                {avatarSrc ? t('profile.changeAvatar') : t('profile.uploadAvatar')}
              </button>
              {avatarSrc && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarMutation.isPending}
                  className="text-xs font-medium text-red-400 hover:text-red-500 inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <Trash2 size={12} /> {t('profile.removeAvatar')}
                </button>
              )}
            </div>
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

      <DoubleConfirmModal
        open={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={() => updateMutation.mutate()}
        title={t('profile.doubleConfirm.saveProfile.title')}
        message={t('profile.doubleConfirm.saveProfile.message')}
        finalWarning={t('profile.doubleConfirm.saveProfile.finalWarning')}
        confirmLabel={t('profile.doubleConfirm.saveProfile.confirm')}
        cancelLabel={t('confirmModal.cancel')}
        continueLabel={t('profile.doubleConfirm.continue')}
        processingLabel={t('profile.saving')}
        isLoading={updateMutation.isPending}
        confirmVariant="gold"
        details={[
          { label: t('profile.fullName'), value: form.name },
          { label: t('profile.phoneNumber'), value: form.phone || '-' },
        ]}
      />

      <DoubleConfirmModal
        open={showPwConfirm}
        onClose={() => setShowPwConfirm(false)}
        onConfirm={() => pwMutation.mutate()}
        title={t('profile.doubleConfirm.updatePassword.title')}
        message={t('profile.doubleConfirm.updatePassword.message')}
        finalWarning={t('profile.doubleConfirm.updatePassword.finalWarning')}
        confirmLabel={t('profile.doubleConfirm.updatePassword.confirm')}
        cancelLabel={t('confirmModal.cancel')}
        continueLabel={t('profile.doubleConfirm.continue')}
        processingLabel={t('profile.updating')}
        isLoading={pwMutation.isPending}
        confirmVariant="primary"
      />

      <DoubleConfirmModal
        open={showRemoveAvatarConfirm}
        onClose={() => setShowRemoveAvatarConfirm(false)}
        onConfirm={() => avatarMutation.mutate('')}
        title={t('profile.doubleConfirm.removeAvatar.title')}
        message={t('profile.doubleConfirm.removeAvatar.message')}
        finalWarning={t('profile.doubleConfirm.removeAvatar.finalWarning')}
        confirmLabel={t('profile.doubleConfirm.removeAvatar.confirm')}
        cancelLabel={t('confirmModal.cancel')}
        continueLabel={t('profile.doubleConfirm.continue')}
        processingLabel={t('profile.saving')}
        isLoading={avatarMutation.isPending}
        confirmVariant="danger"
      />
    </div>
  );
}
