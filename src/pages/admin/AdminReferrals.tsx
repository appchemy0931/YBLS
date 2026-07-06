import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users2, Award, Search } from 'lucide-react';
import { referralAPI } from '../../api';
import { useTranslation } from 'react-i18next';
import { Spinner, Badge, EmptyState } from '../../components/ui';
import type { Referral } from '../../types';

export default function AdminReferrals() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-referrals'],
    queryFn: () => referralAPI.getAll().then((r) => r.data),
  });

  const allReferrals = data?.referrals || [];
  const referrals = allReferrals.filter((r: Referral) => {
    const q = search.toLowerCase();
    const inviter = typeof r.inviterUserId === 'object' && r.inviterUserId ? (r.inviterUserId as any).name : '';
    const newUser = typeof r.newUserId === 'object' && r.newUserId ? (r.newUserId as any).name : '';
    return (
      inviter.toLowerCase().includes(q) ||
      newUser.toLowerCase().includes(q) ||
      r.referralCode.toLowerCase().includes(q)
    );
  });
  const totalReward = allReferrals.reduce((s, r) => s + r.reward, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800">{t('admin.referrals.pageTitle')}</h1>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search referrals..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-rose-deep w-64" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t('admin.referrals.totalReferrals'), value: allReferrals.length, color: 'from-rose-soft to-rose-medium' },
          { label: t('admin.referrals.level1'), value: allReferrals.filter((r) => r.level === 1).length, color: 'from-gold-100 to-gold-300' },
          { label: t('admin.referrals.level2'), value: allReferrals.filter((r) => r.level === 2).length, color: 'from-blush-100 to-blush-300' },
          { label: t('admin.referrals.totalRewards'), value: `RM${totalReward.toFixed(2)}`, color: 'from-rose-medium to-rose-deep' },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 card-shadow">
            <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${c.color} flex items-center justify-center mb-2`}>
              <Award size={20} className="text-white" />
            </div>
            <p className="text-xl font-bold text-gray-800">{c.value}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? <Spinner className="py-20" /> : referrals.length === 0 ? (
        <EmptyState
          icon={Users2}
          title={search ? 'No results found' : t('admin.referrals.noReferrals')}
          message={search ? `No referrals match "${search}".` : t('admin.referrals.noReferralsMsg')}
        />
      ) : (
        <div className="bg-white rounded-2xl card-shadow overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">{t('admin.referrals.inviter')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.referrals.newUser')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.referrals.referralCode')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.referrals.level')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.referrals.reward')}</th>
                <th className="px-4 py-3 font-medium">{t('common.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {referrals.map((r: Referral) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {typeof r.inviterUserId === 'object' && r.inviterUserId ? (r.inviterUserId as any).name : t('common.na')}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {typeof r.newUserId === 'object' && r.newUserId ? (r.newUserId as any).name : t('common.na')}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.referralCode}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.level === 1 ? 'success' : r.level === 2 ? 'info' : 'warning'}>{t('admin.referrals.levelBadge', { n: r.level })}</Badge>
                  </td>
                  <td className="px-4 py-3 font-bold text-green-600">+RM{r.reward.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
