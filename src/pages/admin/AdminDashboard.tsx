import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, Crown, ShoppingBag, DollarSign, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../api';
import { useTranslation } from 'react-i18next';
import { Spinner, Badge, Button } from '../../components/ui';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [appliedRange, setAppliedRange] = useState<{ from?: string; to?: string } | undefined>(undefined);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-stats', appliedRange],
    queryFn: () => adminAPI.getStats(appliedRange).then((r) => r.data),
  });

  const applyRange = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedRange({ from: from || undefined, to: to || undefined });
  };

  const clearRange = () => {
    setFrom('');
    setTo('');
    setAppliedRange(undefined);
  };

  if (isLoading) return <Spinner className="py-20" />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('admin.dashboard.failedToLoad')}</h3>
        <p className="text-gray-500 max-w-md mb-4">{error instanceof Error ? error.message : t('admin.dashboard.somethingWentWrong')}</p>
        <Button onClick={() => refetch()}>{t('admin.dashboard.retry')}</Button>
      </div>
    );
  }

  const s = data?.stats;
  const cards = [
    { label: t('admin.dashboard.totalUsers'), value: s?.totalUsers || 0, icon: Users, color: 'from-rose-soft to-rose-medium', filtered: false },
    { label: t('admin.dashboard.totalBookings'), value: s?.totalBookings || 0, icon: Calendar, color: 'from-gold-100 to-gold-300', filtered: true },
    { label: t('admin.dashboard.rankingRevenue'), value: `RM${(s?.rankingRevenue || 0).toFixed(0)}`, icon: Crown, color: 'from-blush-100 to-blush-300', filtered: true },
    { label: t('admin.dashboard.totalOrders'), value: s?.totalOrders || 0, icon: ShoppingBag, color: 'from-rose-medium to-rose-deep', filtered: true },
    { label: t('admin.dashboard.bookingRevenue'), value: `RM${(s?.bookingRevenue || 0).toFixed(0)}`, icon: DollarSign, color: 'from-gold-300 to-gold-500', filtered: true },
    { label: t('admin.dashboard.orderRevenue'), value: `RM${(s?.orderRevenue || 0).toFixed(0)}`, icon: TrendingUp, color: 'from-rose-deep to-rose-medium', filtered: true },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('admin.dashboard.dashboardOverview')}</h1>

      <div className="bg-white rounded-2xl p-4 card-shadow mb-6">
        <form onSubmit={applyRange} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">{t('admin.dashboard.from')}</label>
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-rose-deep focus:outline-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">{t('admin.dashboard.to')}</label>
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-rose-deep focus:outline-none"
            />
          </div>
          <Button type="submit" size="sm">{t('admin.dashboard.apply')}</Button>
          {appliedRange && (
            <Button type="button" variant="outline" size="sm" onClick={clearRange}>{t('admin.dashboard.clear')}</Button>
          )}
          {appliedRange && (
            <span className="text-xs text-gray-400 ml-auto self-center">
              {t('admin.dashboard.filteredRange', { from: appliedRange.from || '…', to: appliedRange.to || '…' })}
            </span>
          )}
        </form>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 card-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${c.color} flex items-center justify-center`}>
                <c.icon size={24} className="text-white" />
              </div>
              {c.filtered && appliedRange && (
                <span className="text-[10px] font-medium text-gold-600 bg-gold-50 px-2 py-0.5 rounded-full">{t('admin.dashboard.filtered')}</span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-800">{c.value}</p>
            <p className="text-sm text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 card-shadow mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">{t('admin.dashboard.totalRevenue')}</h2>
          <span className="text-xs text-gray-400">{t('admin.dashboard.allTime')}</span>
        </div>
        <p className="text-4xl font-bold text-gradient-gold">RM{(s?.totalRevenue || 0).toFixed(2)}</p>
        <div className="flex gap-6 mt-4 text-sm">
          <div><span className="text-gray-400">{t('admin.dashboard.pendingBookings')}</span> <span className="font-medium text-amber-600">{s?.pendingBookings || 0}</span></div>
          <div><span className="text-gray-400">{t('admin.dashboard.confirmed')}</span> <span className="font-medium text-green-600">{s?.confirmedBookings || 0}</span></div>
          <div><span className="text-gray-400">{t('admin.dashboard.completed')}</span> <span className="font-medium text-blue-600">{s?.completedBookings || 0}</span></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 card-shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('admin.dashboard.recentBookings')}</h2>
          <div className="space-y-2">
            {data?.recentBookings?.map((b: any) => (
              <div key={b._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <Clock size={16} className="text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{b.serviceName}</p>
                  <p className="text-xs text-gray-400">{b.userId && typeof b.userId === 'object' ? b.userId.name : t('common.user')} · {b.bookingDate}</p>
                </div>
                <Badge variant={b.status === 'Confirmed' ? 'success' : b.status === 'Completed' ? 'info' : b.status === 'Cancelled' ? 'danger' : 'warning'}>{t('status.' + b.status.toLowerCase())}</Badge>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 card-shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('admin.dashboard.recentOrders')}</h2>
          <div className="space-y-2">
            {data?.recentOrders?.map((o: any) => (
              <div key={o._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <ShoppingBag size={16} className="text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{o.userId && typeof o.userId === 'object' ? o.userId.name : t('common.user')} · {t('admin.dashboard.itemsCount', { count: (o.items?.length || 0) })}</p>
                  <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-bold text-rose-deep">RM{o.totalAmount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
