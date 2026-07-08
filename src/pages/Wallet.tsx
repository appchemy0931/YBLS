import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet as WalletIcon, TrendingUp, TrendingDown, Crown, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { walletAPI, rankingAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Spinner, Button, EmptyState, Badge } from '../components/ui';
import ConfirmModal from '../components/ConfirmModal';
import type { WalletTransaction, RankingTier } from '../types';

export default function Wallet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('All');
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [confirmTier, setConfirmTier] = useState<RankingTier | null>(null);
  const { t } = useTranslation();
  const typeLabels: Record<string, string> = {
    TOPUP: t('wallet.topup'),
    REFERRAL_BONUS: t('wallet.referralBonus'),
    REFUND: t('wallet.refund'),
    BOOKING_PAYMENT: t('wallet.bookingPayment'),
    PRODUCT_PAYMENT: t('wallet.productPayment'),
    COUPON_PURCHASE: t('wallet.couponPurchase'),
    RANKING_PURCHASE: t('wallet.rankingPurchase'),
    RANKING_BONUS: t('wallet.rankingBonus'),
    SIGNUP_BONUS: t('wallet.signupBonus'),
  };

  const { data: txData, isLoading } = useQuery({
    queryKey: ['wallet-history', filter],
    queryFn: () => walletAPI.getHistory(filter).then((r) => r.data),
  });

  const { data: balanceData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletAPI.getBalance().then((r) => r.data),
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
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-history'] });
      setConfirmTier(null);
      setShowRankingModal(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const walletBalance = balanceData?.walletBalance ?? user?.walletBalance ?? 0;
  const walletBonus = balanceData?.walletBonus ?? user?.walletBonus ?? 0;

  const transactions = txData?.transactions || [];
  const types = ['All', 'TOPUP', 'BOOKING_PAYMENT', 'PRODUCT_PAYMENT', 'REFUND', 'REFERRAL_BONUS', 'COUPON_PURCHASE', 'RANKING_PURCHASE', 'RANKING_BONUS', 'SIGNUP_BONUS'];

  const currentRanking = rankingData?.currentRanking ?? user?.customerRanking ?? 0;
  const tiers = rankingData?.tiers ?? [];
  const myRequests = rankingData?.myRequests ?? [];
  const pendingTiers = new Set(myRequests.filter((r) => r.status === 'Pending').map((r) => r.tier));
  const currentTier = tiers.find((tr) => tr.tier === currentRanking);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>{t('wallet.pageTitle')}</h1>
      <p className="text-gray-500 mb-8">{t('wallet.pageIntro')}</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-linear-to-br from-[#3a2a2a] to-[#2a1f1f] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <WalletIcon size={24} className="text-gold-400" />
            <Button size="sm" variant="gold" onClick={() => setShowRankingModal(true)}>
              <Crown size={16} className="inline mr-1" /> {t('wallet.upgradeRanking')}
            </Button>
          </div>
          <p className="text-sm text-gray-300">{t('wallet.walletBalance')}</p>
          <p className="text-4xl font-bold mt-1">RM{walletBalance.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{t('wallet.totalSpendable', { amount: (walletBalance + walletBonus).toFixed(2) })}</p>
        </div>
        <div className="bg-linear-to-br from-rose-soft to-gold-100 rounded-2xl p-6">
          <TrendingUp size={24} className="text-rose-deep mb-4" />
          <p className="text-sm text-gray-600">{t('wallet.bonusBalance')}</p>
          <p className="text-4xl font-bold mt-1 text-rose-deep">{walletBonus.toFixed(2)}</p>
        </div>
        <div className="bg-linear-to-br from-gold-100 to-blush-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <Crown size={24} className="text-gold-600" />
            <Badge variant={currentRanking > 0 ? 'info' : 'default'}>
              {currentRanking > 0 ? t('dashboard.currentRanking', { tier: currentRanking }) : t('dashboard.noRanking')}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{t('wallet.yourRanking')}</p>
          <div className="flex items-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={24}
                className={i < currentRanking ? 'text-gold-400 fill-gold-400 animate-blink' : 'text-gray-200 fill-gray-200'}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {currentTier ? t('dashboard.starMember', { stars: currentTier.stars }) : t('dashboard.noRanking')}
          </p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowRankingModal(true)}>
            {t('wallet.upgradeRanking')}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 card-shadow">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-xl font-semibold text-gray-800">{t('wallet.transactionHistory')}</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-rose-deep">
            {types.map((ty) => <option key={ty} value={ty}>{ty === 'All' ? t('wallet.allTypes') : typeLabels[ty] || ty}</option>)}
          </select>
        </div>

        {isLoading ? (
          <Spinner className="py-12" />
        ) : transactions.length === 0 ? (
          <EmptyState icon={WalletIcon} title={t('wallet.noTransactions')} message={t('wallet.noTransactionsMsg')} />
        ) : (
          <div className="space-y-2">
            {transactions.map((tx: WalletTransaction) => (
              <div key={tx._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-blush-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {tx.amount > 0 ? <TrendingUp size={18} className="text-green-600" /> : <TrendingDown size={18} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{typeLabels[tx.type] || tx.type}</p>
                  <p className="text-xs text-gray-400 truncate">{tx.description}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.amount > 0 ? '+' : ''}{['SIGNUP_BONUS', 'RANKING_BONUS', 'REFERRAL_BONUS'].includes(tx.type) ? '' : 'RM'}{tx.amount.toFixed(2)}
                  </p>
                  {tx.balanceAfter !== undefined && <p className="text-xs text-gray-400">{t('wallet.bal', { amount: tx.balanceAfter.toFixed(2) })}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showRankingModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]"
          onClick={() => setShowRankingModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-[scale-in_0.25s_ease-out] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <Crown size={22} className="text-gold-500" />
                <h2 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {t('wallet.rankingModalTitle')}
                </h2>
              </div>
              <button onClick={() => setShowRankingModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="close">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-gray-500 mb-4">{t('wallet.selectTierUpgrade')}</p>

              {tiers.length === 0 ? (
                <Spinner className="py-8" />
              ) : (
                <div className="space-y-3">
                  {tiers.map((tier: RankingTier) => {
                    const isCurrent = tier.tier === currentRanking;
                    const isNext = tier.tier === currentRanking + 1;
                    const isPending = pendingTiers.has(tier.tier);
                    const loading = requestMutation.isPending && confirmTier?.tier === tier.tier;
                    return (
                      <div
                        key={tier.tier}
                        className={`rounded-xl p-4 border transition-all ${
                          isCurrent
                            ? 'border-gold-400 bg-linear-to-br from-gold-50 to-blush-50 ring-1 ring-gold-300'
                            : 'border-gray-200 bg-white hover:border-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={14}
                                    className={i < tier.stars ? 'text-gold-400 fill-gold-400 animate-blink' : 'text-gray-200 fill-gray-200'}
                                  />
                                ))}
                              </div>
                              {isCurrent && <Badge variant="info">{t('dashboard.current')}</Badge>}
                            </div>
                            <h3 className="text-sm font-semibold text-gray-800">{tier.name}</h3>
                            <p className="text-xs text-gray-400">{t('dashboard.starMember', { stars: tier.stars })}</p>
                            <p className="text-sm font-bold text-rose-deep mt-1">RM{tier.price}</p>
                            <p className="text-[11px] text-gold-600">{t('dashboard.addedToWallet', { price: tier.price })}</p>
                          </div>
                          <div className="shrink-0">
                            {isCurrent ? (
                              <Button variant="outline" size="sm" disabled>
                                {t('dashboard.current')}
                              </Button>
                            ) : isPending ? (
                              <Button variant="outline" size="sm" disabled>
                                {t('dashboard.pendingApproval')}
                              </Button>
                            ) : (
                              <Button
                                variant={isNext ? 'gold' : 'primary'}
                                size="sm"
                                disabled={loading}
                                onClick={() => setConfirmTier(tier)}
                              >
                                {isNext ? t('dashboard.requestUpgrade') : t('dashboard.requestPurchase')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
        confirmVariant={confirmTier?.tier === currentRanking + 1 ? 'gold' : 'primary'}
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
