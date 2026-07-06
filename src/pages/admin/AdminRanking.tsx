import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Crown, Search, X, Star, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { rankingAPI } from '../../api';
import { Spinner, Button, Badge, EmptyState } from '../../components/ui';
import type { RankingPurchase } from '../../types';

const formatDateTime = (date: string) => new Date(date).toLocaleString();

const statusVariant = (status: string) => {
  switch (status) {
    case 'Approved': return 'success';
    case 'Rejected': return 'danger';
    default: return 'warning';
  }
};

export default function AdminRanking() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('Pending');
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState<RankingPurchase | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ranking-requests', status],
    queryFn: () => rankingAPI.getRequests(status).then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => rankingAPI.approveRequest(id),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['admin-ranking-requests'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => rankingAPI.rejectRequest(id, reason),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['admin-ranking-requests'] });
      setRejectTarget(null);
      setRejectReason('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const requests = (data?.requests || []).filter((r: RankingPurchase) => {
    const q = search.toLowerCase();
    const customer = typeof r.userId === 'object' && r.userId ? (r.userId as any).name : '';
    const email = typeof r.userId === 'object' && r.userId ? (r.userId as any).email : '';
    return (
      r._id.toLowerCase().includes(q) ||
      customer.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      r.tierName.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  });
  const statuses = ['Pending', 'Approved', 'Rejected', 'All'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-gold-100 to-gold-300 flex items-center justify-center">
            <Crown size={22} className="text-gold-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('admin.ranking.pageTitle')}</h1>
            <p className="text-sm text-gray-500">{t('admin.ranking.pageDesc')}</p>
          </div>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search requests..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-rose-deep w-64" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {statuses.map((st) => (
          <button key={st} onClick={() => setStatus(st)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${status === st ? 'bg-rose-deep text-white' : 'bg-white text-gray-600 hover:bg-blush-50'} card-shadow`}>
            {st === 'All' ? t('common.all') : t('status.' + st.toLowerCase())}
          </button>
        ))}
      </div>

      {isLoading ? <Spinner className="py-20" /> : requests.length === 0 ? (
        <EmptyState icon={Crown} title={search ? 'No results found' : t('admin.ranking.noRequests')} message={search ? `No requests match "${search}".` : t('admin.ranking.noRequestsMsg')} />
      ) : (
        <div className="bg-white rounded-2xl card-shadow overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">{t('admin.ranking.requestId')}</th>
                <th className="px-4 py-3 font-medium">{t('common.customer')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.ranking.tier')}</th>
                <th className="px-4 py-3 font-medium">{t('common.price')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.ranking.requested')}</th>
                <th className="px-4 py-3 font-medium">{t('common.status')}</th>
                <th className="px-4 py-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((r: RankingPurchase) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">#{r._id.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3">
                    {typeof r.userId === 'object' && r.userId ? (
                      <div>
                        <p className="font-medium text-gray-800">{r.userId.name}</p>
                        <p className="text-xs text-gray-400">{r.userId.email}</p>
                      </div>
                    ) : t('common.na')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} className={i < r.tier ? 'text-gold-400 fill-gold-400' : 'text-gray-200 fill-gray-200'} />
                        ))}
                      </div>
                      <span className="text-gray-700">{r.tierName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-rose-deep">RM{r.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(r.status)}>{t('status.' + r.status.toLowerCase())}</Badge>
                    {r.status === 'Rejected' && r.rejectionReason && (
                      <p className="mt-1 text-xs text-gray-400 italic max-w-45">{r.rejectionReason}</p>
                    )}
                    {r.status !== 'Pending' && r.reviewedAt && (
                      <p className="mt-1 text-xs text-gray-400">{formatDateTime(r.reviewedAt)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'Pending' ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="gold"
                          disabled={approveMutation.isPending && approveMutation.variables === r._id}
                          onClick={() => approveMutation.mutate(r._id)}
                        >
                          <Check size={14} className="inline mr-1" />
                          {approveMutation.isPending && approveMutation.variables === r._id ? t('admin.ranking.approving') : t('admin.ranking.approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => { setRejectTarget(r); setRejectReason(''); }}
                        >
                          {t('admin.ranking.reject')}
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectTarget && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => { setRejectTarget(null); setRejectReason(''); }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{t('admin.ranking.rejectRequest')}</h2>
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {t('admin.ranking.rejectMsg', { tierName: rejectTarget.tierName, tier: rejectTarget.tier, price: rejectTarget.price.toFixed(2) })}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                rejectMutation.mutate({ id: rejectTarget._id, reason: rejectReason.trim() || undefined });
              }}
            >
              <label className="text-xs text-gray-500">{t('admin.ranking.reasonOptional')}</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder={t('admin.ranking.rejectPlaceholder')}
                className="w-full mt-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep resize-none"
              />
              <div className="flex gap-2 mt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" variant="danger" className="flex-1" disabled={rejectMutation.isPending}>
                  {rejectMutation.isPending ? t('admin.ranking.rejecting') : t('admin.ranking.confirmReject')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
