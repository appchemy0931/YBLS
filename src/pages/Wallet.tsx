import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet as WalletIcon, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { walletAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Spinner, Button, EmptyState } from '../components/ui';
import type { WalletTransaction } from '../types';

export default function Wallet() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('All');
  const [showTopUp, setShowTopUp] = useState(false);
  const [amount, setAmount] = useState(50);
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
  };

  const { data: txData, isLoading } = useQuery({
    queryKey: ['wallet-history', filter],
    queryFn: () => walletAPI.getHistory(filter).then((r) => r.data),
  });

  const topUpMutation = useMutation({
    mutationFn: () => walletAPI.topUp({ amount, method: 'bank transfer' }),
    onSuccess: (res) => {
      toast.success(t('wallet.topUpToast', { amount }));
      updateUser({ walletBalance: res.data.walletBalance });
      queryClient.invalidateQueries({ queryKey: ['wallet-history'] });
      setShowTopUp(false);
      setAmount(50);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const transactions = txData?.transactions || [];
  const types = ['All', 'TOPUP', 'BOOKING_PAYMENT', 'PRODUCT_PAYMENT', 'REFUND', 'REFERRAL_BONUS', 'COUPON_PURCHASE', 'RANKING_PURCHASE', 'RANKING_BONUS'];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>{t('wallet.pageTitle')}</h1>
      <p className="text-gray-500 mb-8">{t('wallet.pageIntro')}</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-linear-to-br from-[#3a2a2a] to-[#2a1f1f] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <WalletIcon size={24} className="text-gold-400" />
            <Button size="sm" variant="gold" onClick={() => setShowTopUp(!showTopUp)}>
              <Plus size={16} className="inline mr-1" /> {t('wallet.topUp')}
            </Button>
          </div>
          <p className="text-sm text-gray-300">{t('wallet.walletBalance')}</p>
          <p className="text-4xl font-bold mt-1">RM{(user?.walletBalance || 0).toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{t('wallet.totalSpendable', { amount: ((user?.walletBalance || 0) + (user?.walletBonus || 0)).toFixed(2) })}</p>
        </div>
        <div className="bg-linear-to-br from-rose-soft to-gold-100 rounded-2xl p-6">
          <TrendingUp size={24} className="text-rose-deep mb-4" />
          <p className="text-sm text-gray-600">{t('wallet.bonusBalance')}</p>
          <p className="text-4xl font-bold mt-1 text-rose-deep">RM{(user?.walletBonus || 0).toFixed(2)}</p>
        </div>
      </div>

      {showTopUp && (
        <div className="bg-white rounded-2xl p-6 card-shadow mb-6 animate-[scale-in_0.3s_ease-out]">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('wallet.topUpWallet')}</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            {[50, 100, 200, 500].map((amt) => (
              <button key={amt} onClick={() => setAmount(amt)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${amount === amt ? 'bg-rose-deep text-white' : 'bg-blush-50 text-gray-600 hover:bg-rose-soft'}`}>
                RM{amt}
              </button>
            ))}
          </div>
          <Button onClick={() => topUpMutation.mutate()} disabled={topUpMutation.isPending} variant="gold">
            {topUpMutation.isPending ? t('common.processing') : t('wallet.topUpAmount', { amount })}
          </Button>
        </div>
      )}

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
                    {tx.amount > 0 ? '+' : ''}RM{tx.amount.toFixed(2)}
                  </p>
                  {tx.balanceAfter !== undefined && <p className="text-xs text-gray-400">{t('wallet.bal', { amount: tx.balanceAfter.toFixed(2) })}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
