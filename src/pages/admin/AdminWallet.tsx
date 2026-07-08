import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, TrendingUp, TrendingDown, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { walletAPI } from '../../api';
import { Spinner, EmptyState } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal';
import type { WalletTransaction } from '../../types';

const typeLabels: Record<string, string> = {
  RANKING_PURCHASE: 'Ranking Purchase',
  REFERRAL_BONUS: 'Referral Bonus',
  REFUND: 'Refund',
  BOOKING_PAYMENT: 'Booking Payment',
  PRODUCT_PAYMENT: 'Product Payment',
  COUPON_PURCHASE: 'Coupon Purchase',
  RANKING_BONUS: 'Ranking Bonus',
};

export default function AdminWallet() {
  const [type, setType] = useState('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', type, from, to],
    queryFn: () => walletAPI.getAllTransactions({ type, from: from || undefined, to: to || undefined }).then((r) => r.data),
  });

  const deleteTransactions = useMutation({
    mutationFn: (ids: string[]) => walletAPI.deleteTransactions(ids),
    onSuccess: () => {
      toast.success('Selected transactions deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      setSelectedIds([]);
      setConfirmDelete(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const transactions = data?.transactions || [];
  const types = ['All', 'RANKING_PURCHASE', 'RANKING_BONUS', 'BOOKING_PAYMENT', 'PRODUCT_PAYMENT', 'REFUND', 'REFERRAL_BONUS', 'COUPON_PURCHASE'];

  const filteredTransactions = transactions.filter((tx: WalletTransaction) => {
    const q = search.toLowerCase();
    const user = typeof tx.userId === 'object' && tx.userId ? (tx.userId as any).name : '';
    return (
      user.toLowerCase().includes(q) ||
      tx.type.toLowerCase().includes(q) ||
      (typeLabels[tx.type] || '').toLowerCase().includes(q) ||
      tx.description.toLowerCase().includes(q)
    );
  });

  const selectedSet = new Set(selectedIds);
  const allSelected = filteredTransactions.length > 0 && filteredTransactions.every((t) => selectedSet.has(t._id));
  const someSelected = selectedIds.length > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleSelectAll = () => {
    if (allSelected) {
      const inView = new Set(filteredTransactions.map((t) => t._id));
      setSelectedIds((prev) => prev.filter((id) => !inView.has(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredTransactions.map((t) => t._id)])));
    }
  };

  const totalIn = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Wallet Transactions</h1>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-rose-deep w-64" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <TrendingUp size={24} className="text-green-500 mb-2" />
          <p className="text-sm text-gray-500">Total Inflow</p>
          <p className="text-2xl font-bold text-green-600">RM{totalIn.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <TrendingDown size={24} className="text-red-500 mb-2" />
          <p className="text-sm text-gray-500">Total Outflow</p>
          <p className="text-2xl font-bold text-red-500">RM{totalOut.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-gray-800">All Transactions</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {someSelected && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
            >
              <Trash2 size={16} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-1.5">
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setSelectedIds([]); }}
              max={to || undefined}
              className="text-sm text-gray-600 focus:outline-none"
              aria-label="From date"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setSelectedIds([]); }}
              min={from || undefined}
              className="text-sm text-gray-600 focus:outline-none"
              aria-label="To date"
            />
            {(from || to) && (
              <button
                onClick={() => { setFrom(''); setTo(''); setSelectedIds([]); }}
                className="text-xs text-red-500 hover:text-red-600 ml-1"
              >
                Clear
              </button>
            )}
          </div>
          <select value={type} onChange={(e) => { setType(e.target.value); setSelectedIds([]); }} className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-rose-deep">
            {types.map((t) => <option key={t} value={t}>{t === 'All' ? 'All Types' : typeLabels[t] || t}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? <Spinner className="py-20" /> : filteredTransactions.length === 0 ? (
        <EmptyState icon={Wallet} title={search ? 'No results found' : 'No transactions'} message={search ? `No transactions match "${search}".` : 'No wallet transactions found.'} />
      ) : (
        <div className="bg-white rounded-2xl card-shadow overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded text-rose-deep focus:ring-rose-deep"
                    aria-label="Select all transactions"
                  />
                </th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Balance After</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map((tx: WalletTransaction) => (
                <tr key={tx._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(tx._id)}
                      onChange={() => toggleSelect(tx._id)}
                      className="rounded text-rose-deep focus:ring-rose-deep"
                      aria-label="Select transaction"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {typeof tx.userId === 'object' && tx.userId ? (tx.userId as any).name : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{typeLabels[tx.type] || tx.type}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{tx.description}</td>
                  <td className={`px-4 py-3 font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.amount > 0 ? '+' : ''}{['SIGNUP_BONUS', 'RANKING_BONUS', 'REFERRAL_BONUS'].includes(tx.type) ? '' : 'RM'}{tx.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{tx.balanceAfter !== undefined ? `RM${tx.balanceAfter.toFixed(2)}` : '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteTransactions.mutate(selectedIds)}
        title="Delete Transactions"
        message="Delete the selected transaction(s)? This action cannot be undone."
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        processingLabel="Deleting..."
        isLoading={deleteTransactions.isPending}
        confirmVariant="danger"
        details={[
          { label: 'Selected', value: `${selectedIds.length} transaction(s)` },
        ]}
      />
    </div>
  );
}
