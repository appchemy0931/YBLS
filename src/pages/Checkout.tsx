import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, CreditCard, Wallet, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { orderAPI, walletAPI } from '../api';
import { useCart, itemPrice } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';
import ConfirmModal from '../components/ConfirmModal';

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [address, setAddress] = useState('');
  const [payFromWallet, setPayFromWallet] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { t } = useTranslation();

  const createOrder = useMutation({
    mutationFn: () =>
      orderAPI.create({
        items: cart.map((item) => ({ productId: item.product._id, qty: item.qty, weightLabel: item.weightVariant?.label })),
        shippingAddress: address,
        payFromWallet,
      }),
    onSuccess: async (res) => {
      toast.success(t('checkout.orderPlaced'));
      if (payFromWallet && res.data.order.paidFromWallet) {
        const { data } = await walletAPI.getBalance();
        updateUser({ walletBalance: data.walletBalance, walletBonus: data.walletBonus });
      }
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-history'] });
      clearCart();
      navigate('/orders');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (payFromWallet && (user!.walletBalance || 0) + (user!.walletBonus || 0) < cartTotal) {
      toast.error(t('checkout.insufficientBalance'));
      return;
    }
    setShowConfirm(true);
  };

  const confirmOrder = () => createOrder.mutate();

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>{t('checkout.pageTitle')}</h1>
      <p className="text-gray-500 mb-8">{t('checkout.pageIntro')}</p>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 card-shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('checkout.shippingAddress')}</h2>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              required
              placeholder={t('checkout.addressPlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep transition-colors resize-none"
            />
          </div>

          <div className="bg-white rounded-2xl p-6 card-shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('checkout.paymentMethod')}</h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${payFromWallet ? 'border-rose-deep bg-rose-soft' : 'border-gray-200'}`}>
                <input type="radio" checked={payFromWallet} onChange={() => setPayFromWallet(true)} className="text-rose-deep" />
                <Wallet size={20} className="text-rose-deep" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{t('checkout.payFromWallet')}</p>
                  <p className="text-xs text-gray-400">{t('checkout.available', { amount: ((user?.walletBalance || 0) + (user?.walletBonus || 0)).toFixed(2) })}</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${!payFromWallet ? 'border-rose-deep bg-rose-soft' : 'border-gray-200'}`}>
                <input type="radio" checked={!payFromWallet} onChange={() => setPayFromWallet(false)} className="text-rose-deep" />
                <CreditCard size={20} className="text-gray-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{t('checkout.cashOnDelivery')}</p>
                  <p className="text-xs text-gray-400">{t('checkout.payWhenReceive')}</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 card-shadow h-fit">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('checkout.orderSummary')}</h2>
          <div className="space-y-2 mb-4">
            {cart.map((item) => {
              const wLabel = item.weightVariant?.label;
              const price = itemPrice(item);
              return (
                <div key={`${item.product._id}-${wLabel || 'default'}`} className="flex justify-between text-sm text-gray-500">
                  <span className="truncate mr-2">{item.product.name}{wLabel ? ` (${wLabel})` : ''} × {item.qty}</span>
                  <span>RM{(price * item.qty).toFixed(2)}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-gray-100 pt-4 mb-5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">{t('checkout.total')}</span>
              <span className="text-2xl font-bold text-rose-deep">RM{cartTotal.toFixed(2)}</span>
            </div>
          </div>
          <Button type="submit" disabled={createOrder.isPending} className="w-full" size="lg">
            {createOrder.isPending ? t('checkout.placingOrder') : (
              <span className="flex items-center justify-center gap-2"><Check size={18} /> {t('checkout.placeOrder')}</span>
            )}
          </Button>
        </div>
      </form>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmOrder}
        title={t('confirmModal.order.title')}
        message={t('confirmModal.order.message')}
        icon={<ShoppingBag size={22} className="text-rose-deep" />}
        confirmLabel={t('confirmModal.order.confirm')}
        cancelLabel={t('confirmModal.cancel')}
        processingLabel={t('confirmModal.processing')}
        isLoading={createOrder.isPending}
        details={[
          {
            label: t('confirmModal.items'),
            value: cart.map((i) => `${i.product.name}${i.weightVariant?.label ? ` (${i.weightVariant.label})` : ''} × ${i.qty}`).join(', '),
          },
          {
            label: t('confirmModal.shippingAddress'),
            value: address || '—',
          },
          {
            label: t('confirmModal.paymentMethod'),
            value: payFromWallet ? t('confirmModal.payFromWallet') : t('checkout.cashOnDelivery'),
          },
          {
            label: t('confirmModal.total'),
            value: <span className="text-rose-deep font-bold">RM{cartTotal.toFixed(2)}</span>,
          },
        ]}
      />
    </div>
  );
}
