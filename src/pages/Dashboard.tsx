import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Wallet, Gift, Users, ShoppingBag, ArrowRight, TrendingUp, Clock, Star, Crown, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { bookingAPI, walletAPI, referralAPI, rankingAPI } from '../api';
import { Spinner, Badge, Button } from '../components/ui';
import ConfirmModal from '../components/ConfirmModal';
import type { RankingTier, RankingPurchase } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showRequests, setShowRequests] = useState(false);
  const [confirmTier, setConfirmTier] = useState<RankingTier | null>(null);

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingAPI.getMy().then((r) => r.data),
  });
  const { data: walletData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletAPI.getBalance().then((r) => r.data),
  });
  const { data: referralData } = useQuery({
    queryKey: ['referral-info'],
    queryFn: () => referralAPI.getInfo().then((r) => r.data),
  });
  const { data: rankingData } = useQuery({
    queryKey: ['ranking-info'],
    queryFn: () => rankingAPI.getInfo().then((r) => r.data),
  });

  const requestMutation = useMutation({
    mutationFn: (tier: number) => rankingAPI.requestPurchase(tier),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['ranking-info'] });
      setConfirmTier(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const currentRanking = rankingData?.currentRanking ?? user?.customerRanking ?? 0;
  const tiers = rankingData?.tiers ?? [];
  const myRequests = rankingData?.myRequests ?? [];
  const pendingTiers = new Set(myRequests.filter((r) => r.status === 'Pending').map((r) => r.tier));

  const stats = [
    { icon: Calendar, label: t('dashboard.totalBookings'), value: (bookingsData?.bookings || []).length, color: 'from-rose-soft to-rose-medium', link: '/bookings' },
    { icon: Wallet, label: t('dashboard.walletBalance'), value: `RM${(walletData?.walletBalance ?? user?.walletBalance ?? 0).toFixed(2)}`, color: 'from-gold-100 to-gold-300', link: '/wallet' },
    { icon: Users, label: t('dashboard.referrals'), value: referralData?.stats.totalReferrals || 0, color: 'from-blush-100 to-blush-300', link: '/referral' },
    { icon: Gift, label: t('dashboard.bonusBalance'), value: `RM${(walletData?.walletBonus ?? user?.walletBonus ?? 0).toFixed(2)}`, color: 'from-rose-medium to-rose-deep', link: '/wallet' },
  ];

  const upcomingBookings = (bookingsData?.bookings || []).filter(
    (b) => (b.status === 'Pending' || b.status === 'Confirmed') && new Date(b.bookingDate) >= new Date(new Date().toDateString())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
          {t('dashboard.welcome', { name: user?.name?.split(' ')[0] })}
        </h1>
        <p className="text-gray-500 mt-1">{t('dashboard.overview')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <Link key={i} to={stat.link} className="bg-white rounded-2xl p-5 card-shadow card-shadow-hover animate-[slide-up_0.4s_ease-out]" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon size={24} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 card-shadow mb-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-linear-to-br from-gold-100 to-gold-300 flex items-center justify-center">
              <Crown size={22} className="text-gold-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{t('dashboard.customerRanking')}</h2>
              <p className="text-sm text-gray-500">{t('dashboard.rankingDesc')}</p>
            </div>
          </div>
          <Badge variant={currentRanking > 0 ? 'info' : 'default'}>
            {currentRanking > 0 ? t('dashboard.currentRanking', { tier: currentRanking }) : t('dashboard.noRanking')}
          </Badge>
        </div>

        {tiers.length === 0 ? (
          <Spinner className="py-10" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {tiers.map((tier: RankingTier) => {
              const isCurrent = tier.tier === currentRanking;
              const isNext = tier.tier === currentRanking + 1;
              const isPending = pendingTiers.has(tier.tier);
              const loading = requestMutation.isPending && requestMutation.variables === tier.tier;
              return (
                <div
                  key={tier.tier}
                  className={`rounded-2xl p-5 border transition-all flex flex-col ${
                    isCurrent
                      ? 'border-gold-400 bg-linear-to-br from-gold-50 to-blush-50 ring-2 ring-gold-300'
                      : 'border-gray-200 bg-white card-shadow-hover'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          className={i < tier.stars ? 'text-gold-400 fill-gold-400 animate-blink' : 'text-gray-200 fill-gray-200'}
                        />
                      ))}
                    </div>
                    {isCurrent && <Badge variant="info">{t('dashboard.current')}</Badge>}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{tier.name}</h3>
                  <p className="text-xs text-gray-400 mb-3">{t('dashboard.starMember', { stars: tier.stars })}</p>
                  <div className="mt-auto">
                    <p className="text-2xl font-bold text-rose-deep">RM{tier.price}</p>
                    <p className="text-xs text-gold-600 mb-3">{t('dashboard.addedToWallet', { price: tier.price })}</p>
                    {isPending ? (
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        {t('dashboard.pendingApproval')}
                      </Button>
                    ) : (
                      <Button
                        variant={isNext ? 'gold' : 'primary'}
                        size="sm"
                        className="w-full"
                        disabled={loading}
                        onClick={() => setConfirmTier(tier)}
                      >
                        {loading ? t('dashboard.submitting') : isNext ? t('dashboard.requestUpgrade') : t('dashboard.requestPurchase')}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {myRequests.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={() => setShowRequests((v) => !v)}
              className="flex items-center justify-between w-full mb-3 text-left"
            >
              <h3 className="text-sm font-semibold text-gray-700">{t('dashboard.myRequests')}</h3>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform duration-200 ${showRequests ? 'rotate-180' : ''}`}
              />
            </button>
            {showRequests && (
              <div className="space-y-2">
                {myRequests.map((r: RankingPurchase) => (
                  <div key={r._id} className="flex items-center gap-3 p-3 rounded-xl bg-blush-50/60">
                    <div className="flex items-center gap-1 shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < r.tier ? 'text-gold-400 fill-gold-400 animate-blink' : 'text-gray-200 fill-gray-200'} />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{r.tierName} · RM{r.price}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                        {r.status === 'Rejected' && r.rejectionReason ? ` · ${r.rejectionReason}` : ''}
                      </p>
                    </div>
                    <Badge variant={r.status === 'Approved' ? 'success' : r.status === 'Rejected' ? 'danger' : 'warning'}>
                      {t('status.' + r.status.toLowerCase())}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 card-shadow">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-gray-800">{t('dashboard.upcomingBookings')}</h2>
            <Link to="/bookings" className="text-sm text-rose-deep hover:text-gold-500 transition-colors flex items-center gap-1">
              {t('dashboard.viewAll')} <ArrowRight size={16} />
            </Link>
          </div>
          {bookingsLoading ? (
            <Spinner className="py-12" />
          ) : upcomingBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">{t('dashboard.noUpcomingBookings')}</p>
              <Link to="/services" className="text-sm text-rose-deep hover:underline mt-2 inline-block">{t('dashboard.bookAService')}</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.slice(0, 5).map((b) => (
                <div key={b._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-blush-50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-rose-soft flex items-center justify-center shrink-0">
                    <Clock size={20} className="text-rose-deep" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{b.serviceName}</p>
                    <p className="text-sm text-gray-400">{b.bookingDate} at {b.bookingTime}</p>
                  </div>
                  <Badge variant={b.status === 'Confirmed' ? 'success' : 'warning'}>{t('status.' + b.status.toLowerCase())}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-linear-to-br from-[#3a2a2a] to-[#2a1f1f] rounded-2xl p-6 text-white">
          <TrendingUp size={28} className="text-gold-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('dashboard.referralProgram')}</h2>
          <p className="text-sm text-gray-300 mb-4">{t('dashboard.referralProgramDesc')}</p>
          <div className="space-y-2 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('dashboard.totalReferrals')}</span>
              <span className="font-medium">{referralData?.stats.totalReferrals || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('dashboard.totalRewards')}</span>
              <span className="font-medium text-gold-400">RM{(referralData?.stats.totalReward || 0).toFixed(2)}</span>
            </div>
          </div>
          <Link to="/referral" className="block text-center bg-linear-to-r from-gold-500 to-gold-400 py-2.5 rounded-xl font-medium hover:shadow-xl transition-all">
            {t('dashboard.inviteFriends')}
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { to: '/services', icon: Calendar, label: t('dashboard.bookAppointment') },
          { to: '/products', icon: ShoppingBag, label: t('dashboard.shopProducts') },
          { to: '/wallet', icon: Wallet, label: t('dashboard.topUpWallet') },
          { to: '/coupons', icon: Gift, label: t('dashboard.buyCoupons') },
        ].map((q, i) => (
          <Link key={i} to={q.to} className="bg-white rounded-xl p-5 card-shadow card-shadow-hover flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-soft flex items-center justify-center">
              <q.icon size={18} className="text-rose-deep" />
            </div>
            <span className="text-sm font-medium text-gray-700">{q.label}</span>
          </Link>
        ))}
      </div>

      <ConfirmModal
        open={!!confirmTier}
        onClose={() => setConfirmTier(null)}
        onConfirm={() => confirmTier && requestMutation.mutate(confirmTier.tier)}
        title={t('confirmModal.ranking.title')}
        message={t('confirmModal.ranking.message')}
        icon={<Crown size={22} className="text-gold-500" />}
        confirmLabel={t('confirmModal.ranking.confirm')}
        cancelLabel={t('confirmModal.cancel')}
        processingLabel={t('confirmModal.processing')}
        isLoading={requestMutation.isPending}
        confirmVariant={confirmTier?.tier === (currentRanking + 1) ? 'gold' : 'primary'}
        details={
          confirmTier
            ? [
                { label: t('confirmModal.tier'), value: confirmTier.name },
                { label: t('dashboard.customerRanking'), value: t('dashboard.starMember', { stars: confirmTier.stars }) },
                {
                  label: t('confirmModal.total'),
                  value: <span className="text-rose-deep font-bold">RM{confirmTier.price}</span>,
                },
              ]
            : []
        }
      />
    </div>
  );
}
