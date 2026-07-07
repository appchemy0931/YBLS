
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { orderAPI } from '../api';
import { Spinner, Badge, EmptyState } from '../components/ui';
import type { Order } from '../types';
import { imageUrl } from '../utils/image';

const statusVariant = (status: string) => {
  switch (status) {
    case 'Paid': return 'success';
    case 'Shipped': return 'info';
    case 'Delivered': return 'success';
    case 'Cancelled': return 'danger';
    default: return 'warning';
  }
};

export default function Orders() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderAPI.getMy().then((r) => r.data),
  });

  const orders = data?.orders || [];
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>{t('orders.pageTitle')}</h1>
      <p className="text-gray-500 mb-8">{t('orders.pageIntro')}</p>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title={t('orders.noOrders')} message={t('orders.noOrdersMsg')} />
      ) : (
        <div className="space-y-4">
          {orders.map((order: Order) => (
            <div key={order._id} className="bg-white rounded-2xl p-5 card-shadow">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <p className="text-sm text-gray-400">{t('orders.orderId', { id: order._id.slice(-8).toUpperCase() })}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge variant={statusVariant(order.status)}>{t('status.' + order.status.toLowerCase())}</Badge>
              </div>
              {order.status === 'Cancelled' && (order.cancellationReason || order.cancelledBy) && (
                <div className="mb-3 text-xs text-gray-400 space-y-0.5">
                  {order.cancellationReason && <p className="italic">{t('orders.reason', { reason: order.cancellationReason })}</p>}
                  {order.cancelledBy && typeof order.cancelledBy === 'object' && (
                    <p>{t('orders.cancelledBy', { name: order.cancelledBy.name + (order.cancelledByRole ? ` (${order.cancelledByRole})` : '') })}</p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img src={imageUrl(item.image)} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{t('orders.qty', { qty: item.qty, price: item.price.toFixed(2) })}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-600">RM{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {order.shippingAddress && (
                <div className="border-t border-gray-100 mt-3 pt-3">
                  <p className="text-xs text-gray-400 mb-0.5">{t('orders.shippingAddress')}</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.shippingAddress}</p>
                </div>
              )}
              <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
                <span className="text-sm text-gray-500">{order.paidFromWallet ? t('orders.paidViaWallet') : t('orders.cashOnDelivery')}</span>
                <span className="text-lg font-bold text-rose-deep">RM{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
