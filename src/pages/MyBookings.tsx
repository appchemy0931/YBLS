import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { bookingAPI } from '../api';
import { Spinner, Button, Badge, EmptyState, PromotionIndicator } from '../components/ui';
import type { Booking } from '../types';

const statusVariant = (status: string) => {
  switch (status) {
    case 'Confirmed': return 'success';
    case 'Completed': return 'info';
    case 'Cancelled': return 'danger';
    default: return 'warning';
  }
};

const bookingImage = (b: Booking): string => {
  if (b.promotionId && typeof b.promotionId === 'object' && b.promotionId.image) return b.promotionId.image;
  if (b.serviceId && typeof b.serviceId === 'object' && b.serviceId.image) return b.serviceId.image;
  return '';
};

const walletDiscountInfo = (b: Booking) => {
  if (!b.paidFromWallet || (b.paidFromBonus || 0) > 0) return null;
  const paid = b.paidFromBalance || 0;
  if (paid >= b.price) return null;
  const discount = +(b.price - paid).toFixed(2);
  const percent = Math.round((discount / b.price) * 100);
  return { paid, discount, percent };
};

export default function MyBookings() {
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingAPI.getMy().then((r) => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => bookingAPI.cancel(id, reason),
    onSuccess: () => {
      toast.success(t('bookings.bookingCancelled'));
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setCancelTarget(null);
      setCancelReason('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const bookings = [...(data?.bookings || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>{t('bookings.pageTitle')}</h1>
      <p className="text-gray-500 mb-8">{t('bookings.pageIntro')}</p>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : bookings.length === 0 ? (
        <EmptyState icon={Calendar} title={t('bookings.noBookings')} message={t('bookings.noBookingsMsg')} />
      ) : (
        <div className="space-y-4">
          {bookings.map((b: Booking) => {
            const discount = walletDiscountInfo(b);
            return (
            <div key={b._id} className="bg-white rounded-2xl p-5 card-shadow">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-rose-soft">
                  {bookingImage(b) ? (
                    <img src={bookingImage(b)} alt={b.serviceName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar size={24} className="text-rose-deep" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-800">{b.serviceName}</h3>
                        {b.bookingType === 'promotion' && <PromotionIndicator />}
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {(b.status === 'Pending' || b.status === 'Confirmed') ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-soft/60 border border-rose-200">
                            <span className="h-2 w-2 rounded-full bg-rose-deep animate-blink"></span>
                            <span className="text-xs font-semibold text-rose-deep animate-blink">{t('bookings.myAppointments')}</span>
                            <span className="flex items-center gap-1 text-xs font-medium text-gray-600"><Calendar size={12} /> {b.bookingDate}</span>
                            <span className="text-rose-200">·</span>
                            <span className="flex items-center gap-1 text-xs font-medium text-gray-600"><Clock size={12} /> {b.bookingTime}</span>
                          </span>
                        ) : (
                          <>
                            <span className="flex items-center gap-1 text-sm text-gray-500"><Calendar size={14} /> {b.bookingDate}</span>
                            <span className="flex items-center gap-1 text-sm text-gray-500"><Clock size={14} /> {b.bookingTime}</span>
                          </>
                        )}
                      </div>
                      {b.createdAt && (
                        <p className="mt-1.5 text-xs text-gray-400">{t('bookings.bookedOn', { datetime: new Date(b.createdAt).toLocaleString() })}</p>
                      )}
                    </div>
                    <Badge variant={statusVariant(b.status)}>{t('status.' + b.status.toLowerCase())}</Badge>
                  </div>
                  {b.notes && (
                    <p className="mt-2 text-sm text-gray-500 italic">{t('bookings.notes', { notes: b.notes })}</p>
                  )}
                  {b.status === 'Cancelled' && (b.cancellationReason || b.cancelledBy) && (
                    <div className="mt-3 text-xs text-gray-400 space-y-0.5">
                      {b.cancellationReason && <p className="italic">{t('bookings.reason', { reason: b.cancellationReason })}</p>}
                      {b.cancelledBy && typeof b.cancelledBy === 'object' && (
                        <p>{t('bookings.cancelledBy', { name: b.cancelledBy.name + (b.cancelledByRole ? ` (${b.cancelledByRole})` : '') })}</p>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      {discount ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-gray-400 line-through">RM{b.price.toFixed(2)}</span>
                          <span className="text-lg font-bold text-rose-deep">RM{discount.paid.toFixed(2)}</span>
                          <span className="text-xs text-gold-600 bg-gold-50 px-2 py-0.5 rounded-full">{t('bookings.walletDiscountBadge', { percent: discount.percent })}</span>
                        </div>
                      ) : (
                        <>
                           <span className="text-lg font-bold text-rose-deep">RM{b.price}</span>
                           {b.paidFromWallet ? (
                             <span className="text-xs text-green-500 ml-2">{(b.paidFromBalance || 0) > 0 && (b.paidFromBonus || 0) > 0 ? t('bookings.paidFiftyFifty') : t('bookings.paidViaWallet')}</span>
                           ) : b.paymentMethod === 'wallet' ? (
                             <span className="text-xs text-blue-500 ml-2">{t('bookings.walletOnCompletion')}</span>
                           ) : b.paymentMethod === 'split' ? (
                             <span className="text-xs text-blue-500 ml-2">{t('bookings.splitOnCompletion')}</span>
                           ) : null}
                         </>
                      )}
                    </div>
                    {(b.status === 'Pending' || b.status === 'Confirmed') && (
                      <button
                        onClick={() => { setCancelTarget(b); setCancelReason(''); }}
                        disabled={cancelMutation.isPending}
                        className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition-colors"
                      >
                        <X size={16} /> {t('bookings.cancel')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {cancelTarget && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => { setCancelTarget(null); setCancelReason(''); }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{t('bookings.cancelBooking')}</h2>
              <button onClick={() => { setCancelTarget(null); setCancelReason(''); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {t('bookings.cancellingMsg', { name: cancelTarget.serviceName, date: cancelTarget.bookingDate, time: cancelTarget.bookingTime })}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!cancelReason.trim()) {
                  toast.error(t('bookings.provideCancelReason'));
                  return;
                }
                cancelMutation.mutate({ id: cancelTarget._id, reason: cancelReason });
              }}
            >
              <label className="text-xs text-gray-500">{t('bookings.reasonForCancellation')} <span className="text-red-500">*</span></label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                required
                placeholder={t('bookings.cancelPlaceholder')}
                className="w-full mt-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep resize-none"
              />
              <div className="flex gap-2 mt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setCancelTarget(null); setCancelReason(''); }}>
                  {t('bookings.cancel')}
                </Button>
                <Button type="submit" variant="danger" className="flex-1" disabled={cancelMutation.isPending}>
                  {cancelMutation.isPending ? t('bookings.cancelling') : t('bookings.confirmCancel')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
