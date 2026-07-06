import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { bookingAPI } from '../api';
import { Spinner, Badge, EmptyState } from '../components/ui';
import type { Booking } from '../types';

export default function CalendarPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingAPI.getMy().then((r) => r.data),
  });

  const bookings = data?.bookings || [];
  const activeBookings = bookings.filter((b) => b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'Completed');

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const bookingsByDate = activeBookings.reduce((acc, b) => {
    const dateKey = b.bookingDate;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(b);
    return acc;
  }, {} as Record<string, Booking[]>);

  const goToPrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1);
  };
  const goToNextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'success';
      case 'Completed': return 'info';
      case 'Cancelled': return 'danger';
      default: return 'warning';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>{t('calendar.pageTitle')}</h1>
      <p className="text-gray-500 mb-8">{t('calendar.pageIntro')}</p>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 card-shadow">
            <div className="flex items-center justify-between mb-6">
              <button onClick={goToPrevMonth} className="w-10 h-10 rounded-full hover:bg-blush-50 flex items-center justify-center text-gray-500">‹</button>
              <h2 className="text-lg font-semibold text-gray-800">{t('calendar.months.' + month)} {year}</h2>
              <button onClick={goToNextMonth} className="w-10 h-10 rounded-full hover:bg-blush-50 flex items-center justify-center text-gray-500">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{t('calendar.days.' + d)}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                if (day === null) return <div key={i} />;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayBookings = bookingsByDate[dateStr] || [];
                const today = new Date().toDateString() === new Date(year, month, day).toDateString();
                return (
                  <div key={i} className={`min-h-[60px] p-1.5 rounded-lg border ${today ? 'border-rose-deep bg-rose-soft' : 'border-gray-100'} ${dayBookings.length > 0 ? 'bg-blush-50' : ''}`}>
                    <p className={`text-xs ${today ? 'font-bold text-rose-deep' : 'text-gray-500'}`}>{day}</p>
                    {dayBookings.slice(0, 2).map((b) => (
                      <div key={b._id} className="text-[10px] bg-rose-deep/10 text-rose-deep rounded px-1 py-0.5 mt-0.5 truncate">
                        {b.bookingTime} {b.serviceName.slice(0, 8)}
                      </div>
                    ))}
                    {dayBookings.length > 2 && <p className="text-[10px] text-gray-400 mt-0.5">{t('calendar.more', { count: dayBookings.length - 2 })}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 card-shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('calendar.upcomingAppointments')}</h2>
            {activeBookings.length === 0 ? (
              <EmptyState icon={Calendar} title={t('calendar.noAppointments')} message={t('calendar.noAppointmentsMsg')} />
            ) : (
              <div className="space-y-3">
                {activeBookings.slice(0, 10).map((b) => (
                  <div key={b._id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-blush-50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-rose-soft flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="text-rose-deep" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{b.serviceName}</p>
                      <p className="text-xs text-gray-400">{b.bookingDate} · {b.bookingTime}</p>
                      <Badge variant={statusVariant(b.status)}>{t('status.' + b.status.toLowerCase())}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

