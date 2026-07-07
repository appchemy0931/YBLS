import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { couponAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Spinner, Button, EmptyState } from '../components/ui';
import ConfirmModal from '../components/ConfirmModal';
import type { Coupon } from '../types';
import { imageUrl } from '../utils/image';

export default function Coupons() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [confirmCoupon, setConfirmCoupon] = useState<Coupon | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => couponAPI.getAll().then((r) => r.data),
  });

  const purchaseMutation = useMutation({
    mutationFn: (couponId: string) => couponAPI.purchase(couponId),
    onSuccess: (res) => {
      toast.success(res.data.message);
      updateUser({ walletBalance: res.data.walletBalance });
      queryClient.invalidateQueries({ queryKey: ['wallet-history'] });
      setConfirmCoupon(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const coupons = data?.coupons || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>{t('coupons.pageTitle')}</h1>
      <p className="text-gray-500 mb-2">{t('coupons.pageIntro')}</p>
      <p className="text-sm text-gold-600 mb-8">{t('coupons.walletBalanceLabel', { amount: (user?.walletBalance || 0).toFixed(2) })}</p>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : coupons.length === 0 ? (
        <EmptyState icon={Gift} title={t('coupons.noCoupons')} message={t('coupons.noCouponsMsg')} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((c: Coupon) => {
            const expired = c.isExpired || new Date(c.expiryDate) < new Date();
            const savings = c.amount - c.price;
            return (
              <div key={c._id} className="relative bg-linear-to-br from-rose-soft to-gold-50 rounded-2xl overflow-hidden card-shadow card-shadow-hover">
                {c.image ? (
                  <img src={imageUrl(c.image)} alt={c.name} className="w-full h-34 rounded-2xl object-cover" />
                ) : null}
                <div className="absolute top-4 right-4">
                  {expired ? (
                    <span className="bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full font-medium">{t('coupons.expired')}</span>
                  ) : (
                    <span className="bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full font-medium">{t('coupons.activeLabel')}</span>
                  )}
                </div>
                <div className="p-6">
                  {/* <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4">
                    <Gift size={28} className="text-rose-deep" />
                  </div> */}
                  <h3 className="text-2xl font-bold text-gray-800">{c.name}</h3>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-4xl font-bold text-rose-deep">RM{c.amount}</span>
                    <span className="text-sm text-gray-500">{t('coupons.walletCredit')}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-semibold text-gray-700">RM{c.price}</span>
                    <span className="text-xs bg-gold-100 text-gold-600 px-2 py-0.5 rounded-full">{t('coupons.save', { amount: savings.toFixed(0) })}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">{t('coupons.expires', { date: new Date(c.expiryDate).toLocaleDateString() })}</p>
                  <Button
                    onClick={() => setConfirmCoupon(c)}
                    disabled={expired || purchaseMutation.isPending}
                    variant="gold"
                    className="w-full mt-4"
                  >
                    {purchaseMutation.isPending && purchaseMutation.variables === c._id ? t('common.processing') : expired ? t('coupons.expired') : t('coupons.purchaseCoupon')}
                  </Button>
                </div>
                <div className="border-t-2 border-dashed border-white/50 px-6 py-3 bg-white/20">
                  <p className="text-xs text-gray-500 text-center">{t('coupons.payGet', { price: c.price, amount: c.amount })}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={!!confirmCoupon}
        onClose={() => setConfirmCoupon(null)}
        onConfirm={() => confirmCoupon && purchaseMutation.mutate(confirmCoupon._id)}
        title={t('confirmModal.coupon.title')}
        message={t('confirmModal.coupon.message')}
        icon={<Gift size={22} className="text-gold-500" />}
        confirmLabel={t('confirmModal.coupon.confirm')}
        cancelLabel={t('confirmModal.cancel')}
        processingLabel={t('confirmModal.processing')}
        isLoading={purchaseMutation.isPending}
        confirmVariant="gold"
        details={
          confirmCoupon
            ? [
                { label: t('confirmModal.couponName'), value: confirmCoupon.name },
                { label: t('confirmModal.walletCredit'), value: <span className="text-rose-deep font-bold">RM{confirmCoupon.amount.toFixed(2)}</span> },
                { label: t('confirmModal.purchasePrice'), value: <span className="text-rose-deep font-bold">RM{confirmCoupon.price.toFixed(2)}</span> },
              ]
            : []
        }
      />
    </div>
  );
}
