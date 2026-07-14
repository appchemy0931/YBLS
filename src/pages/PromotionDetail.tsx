import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, Sparkles } from 'lucide-react';
import { promotionAPI, bookingAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Spinner, Button, PromotionIndicator } from '../components/ui';
import ConfirmModal from '../components/ConfirmModal';
import { imageUrl } from '../utils/image';

export default function PromotionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet' | 'split'>('cash');
  const [showConfirm, setShowConfirm] = useState(false);
  const { t } = useTranslation();

  const { data: promoData, isLoading } = useQuery({
    queryKey: ['promotion', id],
    queryFn: () => promotionAPI.getById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: slotsData } = useQuery({
    queryKey: ['slots', selectedDate],
    queryFn: () => bookingAPI.getSlots(selectedDate).then((r) => r.data),
    enabled: !!selectedDate,
  });

  const promotion = promoData?.promotion;
  const discounted = promotion ? +(promotion.originalPrice * (1 - promotion.discount / 100)).toFixed(2) : 0;

  const today = new Date().toISOString().split('T')[0];

  const createBooking = useMutation({
    mutationFn: () =>
      bookingAPI.create({
        promotionId: id!,
        bookingDate: selectedDate,
        bookingTime: selectedTime,
        notes,
        payFromWallet: paymentMethod === 'wallet',
        splitPayment: paymentMethod === 'split',
      }),
    onSuccess: () => {
      toast.success(t('servicesPage.bookingCreated'));
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      navigate('/bookings');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleBook = () => {
    if (!user) {
      toast.error(t('servicesPage.pleaseLoginToBook'));
      navigate('/login');
      return;
    }
    if (!selectedDate || !selectedTime) {
      toast.error(t('servicesPage.selectDateTime'));
      return;
    }
    if (paymentMethod === 'wallet' && (user.walletBalance || 0) < discounted) {
      toast.error(t('servicesPage.insufficientBalance'));
      return;
    }
    if (paymentMethod === 'split') {
      const bonusRate = user?.customerRanking === 1 ? 0.3 : 0.5;
      const bonusCap = discounted * bonusRate;
      if (user?.customerRanking === 1 && (user.walletBonus || 0) < bonusCap) {
        toast.error(t('servicesPage.insufficientBonusSplit'));
        return;
      }
      const fromBonus = Math.min(user.walletBonus || 0, bonusCap);
      const fromBalance = discounted - fromBonus;
      if ((user.walletBalance || 0) < fromBalance) {
        toast.error(t('servicesPage.insufficientBalanceSplit'));
        return;
      }
    }
    setShowConfirm(true);
  };

  const confirmBooking = () => createBooking.mutate();

  if (isLoading) return <Spinner className="min-h-[60vh]" />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/services" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-rose-deep mb-6 transition-colors">
        <ChevronLeft size={16} /> {t('promotionsPage.backToPromotions')}
      </Link>

      <div className="grid lg:grid-cols-1 gap-8">
        <div className="relative rounded-2xl overflow-hidden card-shadow">
          <img
            src={imageUrl(promotion?.image) || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800'}
            alt={promotion?.title}
            className="w-full h-full lg:h-full object-cover"
          />
          {promotion?.discount ? (
            <span className="absolute top-4 right-4 bg-rose-deep text-white text-xl font-bold px-3 py-1.5 rounded-full shadow-lg">
              {promotion.discount}% {t('promotionsPage.off')}
            </span>
          ) : null}
        </div>

        <div>
          <div className="mb-3"><PromotionIndicator /></div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            {promotion?.title}
          </h1>
          <p className="text-gray-600 mb-6 leading-relaxed">{promotion?.description}</p>

          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-rose-deep">RM{discounted.toFixed(2)}</span>
              {promotion?.discount ? <span className="text-lg text-gray-400 line-through">RM{promotion?.originalPrice}</span> : null}
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-400">{t('promotionsPage.validUntil')}</p>
              <p className="text-sm font-medium text-gray-600">{promotion ? new Date(promotion.endDate).toLocaleDateString() : ''}</p>
            </div>
          </div>

          {/* Booking form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('servicesPage.selectDate')}</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep transition-colors"
                />
              </div>
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('servicesPage.availableSlots')}</label>
                <div className="grid grid-cols-4 gap-2">
                  {(slotsData?.slots || []).map((slot) => (
                    <button
                      key={slot.time}
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`py-2.5 px-2 rounded-lg text-sm font-medium transition-all ${
                        !slot.available
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed line-through'
                          : selectedTime === slot.time
                          ? 'bg-rose-deep text-white shadow-lg'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-rose-deep'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('servicesPage.notesOptional')}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={t('servicesPage.notesPlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep transition-colors resize-none"
              />
            </div>

            {user && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">{t('servicesPage.paymentMethod')}</p>
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-rose-deep bg-rose-soft' : 'border-gray-200'}`}>
                  <input type="radio" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="text-rose-deep focus:ring-rose-deep" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t('servicesPage.payOnArrival')}</p>
                    <p className="text-xs text-gray-400">{t('servicesPage.payOnArrivalDesc')}</p>
                  </div>
                </label>
                {/* <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'wallet' ? 'border-rose-deep bg-rose-soft' : 'border-gray-200'}`}>
                  <input type="radio" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} className="text-rose-deep focus:ring-rose-deep" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t('servicesPage.payFromWallet')}</p>
                    <p className="text-xs text-gray-400">{t('servicesPage.available', { amount: (user.walletBalance || 0).toFixed(2) })}</p>
                  </div>
                </label> */}
                {/* <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'split' ? 'border-rose-deep bg-rose-soft' : 'border-gray-200'}`}>
                  <input type="radio" checked={paymentMethod === 'split'} onChange={() => setPaymentMethod('split')} className="text-rose-deep focus:ring-rose-deep" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t('servicesPage.splitPayment')}</p>
                    <p className="text-xs text-gray-400">{t('servicesPage.splitPaymentDesc', { balance: (user.walletBalance || 0).toFixed(2), bonus: (user.walletBonus || 0).toFixed(2) })}</p>
                  </div>
                </label> */}
              </div>
            )}

            <Button
              onClick={handleBook}
              disabled={createBooking.isPending}
              className="w-full"
              size="lg"
            >
              {createBooking.isPending ? t('promotionsPage.purchasing') : t('promotionsPage.purchase')}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmBooking}
        title={t('confirmModal.promotion.title')}
        message={t('confirmModal.promotion.message')}
        icon={<Sparkles size={22} className="text-gold-500" />}
        confirmLabel={t('confirmModal.promotion.confirm')}
        cancelLabel={t('confirmModal.cancel')}
        processingLabel={t('confirmModal.processing')}
        isLoading={createBooking.isPending}
        confirmVariant="gold"
        details={[
          { label: t('confirmModal.service'), value: promotion?.title },
          { label: t('confirmModal.date'), value: selectedDate },
          { label: t('confirmModal.time'), value: selectedTime },
          {
            label: t('confirmModal.paymentMethod'),
            value:
              paymentMethod === 'wallet'
                ? t('confirmModal.payFromWallet')
                : paymentMethod === 'split'
                ? t('confirmModal.splitPayment')
                : t('confirmModal.payOnArrival'),
          },
          {
            label: t('confirmModal.total'),
            value: <span className="text-rose-deep font-bold">RM{discounted.toFixed(2)}</span>,
          },
        ]}
      />
    </div>
  );
}
