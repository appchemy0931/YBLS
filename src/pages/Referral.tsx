import { useQuery } from '@tanstack/react-query';
import { Users, Copy, Share2, Award, TrendingUp, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { referralAPI } from '../api';
import { Spinner, EmptyState } from '../components/ui';

export default function Referral() {
  const { data: infoData, isLoading: infoLoading } = useQuery({
    queryKey: ['referral-info'],
    queryFn: () => referralAPI.getInfo().then((r) => r.data),
  });
  const { data: qrData, isLoading: qrLoading } = useQuery({
    queryKey: ['referral-qrcode'],
    queryFn: () => referralAPI.getQRCode().then((r) => r.data),
  });

  const { t } = useTranslation();

  if (infoLoading || qrLoading) return <Spinner className="min-h-[60vh]" />;

  const referralUrl = `${window.location.origin}/register?ref=${infoData?.referralCode || ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    toast.success(t('referral.linkCopied'));
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: t('referral.shareTitle'), text: t('referral.shareText'), url: referralUrl });
      } catch { /* user cancelled share */ }
    } else {
      copyLink();
    }
  };

  const stats = [
    { label: t('referral.level1'), value: infoData?.stats.level1 || 0, color: 'bg-rose-soft' },
    { label: t('referral.level2'), value: infoData?.stats.level2 || 0, color: 'bg-gold-100' },
    { label: t('referral.level3'), value: infoData?.stats.level3 || 0, color: 'bg-blush-100' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>{t('referral.pageTitle')}</h1>
      <p className="text-gray-500 mb-8">{t('referral.pageIntro')}</p>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-linear-to-br from-[#3a2a2a] to-[#2a1f1f] rounded-2xl p-6 text-white">
          <Award size={28} className="text-gold-400 mb-3" />
          <h2 className="text-lg font-semibold mb-1">{t('referral.totalRewardsEarned')}</h2>
          <p className="text-4xl font-bold text-gold-400">{(infoData?.stats.totalReward || 0).toFixed(2)}</p>
          <p className="text-sm text-gray-300 mt-2">{t('referral.totalReferralsCount', { count: infoData?.stats.totalReferrals || 0 })}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 card-shadow">
          <TrendingUp size={28} className="text-rose-deep mb-3" />
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('referral.referralLevels')}</h2>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className={`w-14 h-14 mx-auto rounded-full ${s.color} flex items-center justify-center mb-2`}>
                  <span className="text-xl font-bold text-rose-deep">{s.value}</span>
                </div>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 card-shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">{t('referral.yourReferralCode')}</h2>
          <div className="bg-linear-to-r from-rose-soft to-gold-50 rounded-xl p-4 text-center mb-4">
            <p className="text-3xl font-bold text-rose-deep tracking-wider">{infoData?.referralCode}</p>
          </div>
          <div className="bg-blush-50 rounded-xl p-3 mb-4">
            <p className="text-sm text-gray-500 break-all">{referralUrl}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyLink} className="flex-1 flex items-center justify-center gap-2 bg-rose-deep text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all">
              <Copy size={18} /> {t('referral.copyLink')}
            </button>
            <button onClick={shareLink} className="flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-gold-500 to-gold-400 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all">
              <Share2 size={18} /> {t('referral.share')}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 card-shadow text-center">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('referral.scanQRCode')}</h2>
          {qrData?.qrCode && (
            <div className="inline-block p-4 bg-white rounded-2xl border-2 border-rose-soft">
              <img src={qrData.qrCode} alt="Referral QR Code" className="w-48 h-48" />
            </div>
          )}
          <p className="text-sm text-gray-500 mt-4">{t('referral.qrDesc')}</p>
          {qrData?.qrCode && (
            <a href={qrData.qrCode} download="ybls-referral-qr.png" className="inline-flex items-center gap-2 text-sm text-rose-deep hover:underline mt-3">
              <Download size={16} /> {t('referral.downloadQR')}
            </a>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 card-shadow mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('referral.howItWorks')}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: t('referral.step1Title'), desc: t('referral.step1Desc') },
            { step: '2', title: t('referral.step2Title'), desc: t('referral.step2Desc') },
            { step: '3', title: t('referral.step3Title'), desc: t('referral.step3Desc') },
          ].map((s) => (
            <div key={s.step} className="text-center p-4 rounded-xl bg-blush-50">
              <div className="w-10 h-10 mx-auto rounded-full bg-rose-deep text-white flex items-center justify-center font-bold mb-2">{s.step}</div>
              <h3 className="font-medium text-gray-800 text-sm mb-1">{s.title}</h3>
              <p className="text-xs text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 card-shadow mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('referral.referralHistory')}</h2>
        {(infoData?.referrals || []).length === 0 ? (
          <EmptyState icon={Users} title={t('referral.noReferrals')} message={t('referral.noReferralsMsg')} />
        ) : (
          <div className="space-y-2">
            {(infoData?.referrals || []).map((r) => (
              <div key={r._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-blush-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-rose-soft flex items-center justify-center">
                  <Users size={18} className="text-rose-deep" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{typeof r.newUserId === 'object' && r.newUserId ? r.newUserId.name : 'User'}</p>
                  <p className="text-xs text-gray-400">{t('referral.level', { level: r.level })} · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="font-bold text-green-600 text-sm">+{r.reward.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
