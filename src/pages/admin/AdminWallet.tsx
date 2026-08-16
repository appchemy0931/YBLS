import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Search,
  Trash2,
  Star,
  Receipt,
  X,
  Copy,
  Check,
  User,
  Calendar,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Coins,
  ShieldCheck,
  FileText,
  Phone,
  Mail,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { walletAPI } from '../../api';
import { Spinner, EmptyState, Button } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal';
import OfficialReceiptModal from '../../components/OfficialReceiptModal';
import type { WalletTransaction } from '../../types';

const typeLabels: Record<string, string> = {
  RANKING_PURCHASE: 'Ranking Purchase',
  REFERRAL_BONUS: 'Referral Bonus',
  REFUND: 'Refund',
  BOOKING_PAYMENT: 'Booking Payment',
  PRODUCT_PAYMENT: 'Product Payment',
  COUPON_PURCHASE: 'Coupon Purchase',
  RANKING_BONUS: 'Ranking Bonus',
  SIGNUP_BONUS: 'Signup Bonus',
  TOPUP: 'Top Up',
};

const formatDateTime = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

function getTransactionImpact(tx: WalletTransaction) {
  const isBonusTx = ['SIGNUP_BONUS', 'RANKING_BONUS', 'REFERRAL_BONUS'].includes(tx.type);
  const isPositive = tx.amount > 0;
  const absAmount = Math.abs(tx.amount || 0);
  const refObj = typeof tx.referenceId === 'object' && tx.referenceId ? (tx.referenceId as any) : null;
  const rawRefId = refObj ? refObj._id : tx.referenceId;

  let deductedFromBalance = 0;
  let deductedFromBonus = 0;
  let addedToBalance = 0;
  let addedToBonus = 0;

  if (isPositive) {
    if (isBonusTx) {
      addedToBonus = absAmount;
    } else {
      addedToBalance = absAmount;
    }
  } else {
    // Transaction is a debit/deduction
    const hasTxSplit = (Number(tx.paidFromBalance) > 0) || (Number(tx.paidFromBonus) > 0);
    const hasRefSplit = (Number(refObj?.paidFromBalance) > 0) || (Number(refObj?.paidFromBonus) > 0);

    if (hasTxSplit) {
      deductedFromBalance = Number(tx.paidFromBalance || 0);
      deductedFromBonus = Number(tx.paidFromBonus || 0);
    } else if (hasRefSplit) {
      deductedFromBalance = Number(refObj?.paidFromBalance || 0);
      deductedFromBonus = Number(refObj?.paidFromBonus || 0);
    } else if (tx.description) {
      const descMatch = tx.description.match(/RM\s*([\d.]+)\s*balance\s*\+\s*RM\s*([\d.]+)\s*bonus/i);
      if (descMatch) {
        deductedFromBalance = parseFloat(descMatch[1]) || 0;
        deductedFromBonus = parseFloat(descMatch[2]) || 0;
      }
    }

    // Default / Fallback: If no split was detected, the entire amount was deducted from balance
    if (deductedFromBalance === 0 && deductedFromBonus === 0) {
      if (isBonusTx) {
        deductedFromBonus = absAmount;
      } else {
        deductedFromBalance = absAmount;
      }
    }
  }

  return {
    isPositive,
    isBonusTx,
    deductedFromBalance,
    deductedFromBonus,
    addedToBalance,
    addedToBonus,
    rawRefId,
  };
}

export default function AdminWallet() {
  const [type, setType] = useState('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<WalletTransaction | null>(null);
  const [selectedDetailTx, setSelectedDetailTx] = useState<WalletTransaction | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const queryClient = useQueryClient();

  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success('Transaction ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

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
  const totalOut = transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + getTransactionImpact(t).deductedFromBalance, 0);

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
                <th className="px-4 py-3 font-medium">Wallet Balance</th>
                <th className="px-4 py-3 font-medium">YBcoin</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map((tx: WalletTransaction) => {
                const hasReceipt = tx.type === 'BOOKING_PAYMENT' || tx.type === 'PRODUCT_PAYMENT';
                const userObj = typeof tx.userId === 'object' && tx.userId ? (tx.userId as any) : null;
                const walletBal = tx.walletBalanceAfter !== undefined ? tx.walletBalanceAfter : (userObj?.walletBalance !== undefined ? userObj.walletBalance : tx.balanceAfter);
                const walletBon = tx.walletBonusAfter !== undefined ? tx.walletBonusAfter : (userObj?.walletBonus !== undefined ? userObj.walletBonus : 0);
                const impact = getTransactionImpact(tx);

                return (
                  <tr
                    key={tx._id}
                    onClick={() => setSelectedDetailTx(tx)}
                    className="hover:bg-rose-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedSet.has(tx._id)}
                        onChange={() => toggleSelect(tx._id)}
                        className="rounded text-rose-deep focus:ring-rose-deep"
                        aria-label="Select transaction"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {userObj ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="group-hover:text-rose-deep transition-colors">{userObj.name}</span>
                          {Boolean(userObj.customerRanking && userObj.customerRanking > 0) ? (
                            <span className="inline-flex items-center gap-0.5 text-gold-600 font-semibold text-[11px] bg-gold-50 px-2 py-0.5 rounded-full border border-gold-200">
                              <Star size={11} className="fill-gold-400 text-gold-400" />
                              <span>{userObj.customerRanking}-Star</span>
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-50 text-gray-700 px-2 py-0.5 rounded-md border border-gray-100">
                        {typeLabels[tx.type] || tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{tx.description}</td>
                    <td className={`px-4 py-3 font-bold font-mono ${impact.isPositive ? 'text-green-600' : 'text-red-500'}`}>
                      {impact.isPositive ? (
                        impact.isBonusTx ? (
                          <span>+{impact.addedToBonus.toFixed(2)} YBcoin</span>
                        ) : (
                          <span>+RM{impact.addedToBalance.toFixed(2)}</span>
                        )
                      ) : (
                        <span>-RM{impact.deductedFromBalance.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700">
                      {walletBal !== undefined ? (
                        <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md font-semibold">
                          RM{walletBal.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {walletBon !== undefined ? (
                        <span className="font-mono text-xs bg-rose-50 text-rose-deep font-semibold px-2 py-0.5 rounded-md border border-rose-100">
                          {walletBon.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDetailTx(tx)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                          title="View Transaction Details"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        {hasReceipt && (
                          <button
                            onClick={() => setSelectedReceiptTx(tx)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded transition-colors"
                            title="View Official Receipt"
                          >
                            <Receipt size={13} />
                            <span>Receipt</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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

      {/* Official Receipt Modal */}
      {selectedReceiptTx && (
        <OfficialReceiptModal
          transaction={selectedReceiptTx}
          onClose={() => setSelectedReceiptTx(null)}
        />
      )}

      {/* Transaction Full Detail Modal */}
      {selectedDetailTx && (() => {
        const tx = selectedDetailTx;
        const userObj = typeof tx.userId === 'object' && tx.userId ? (tx.userId as any) : null;
        const hasReceipt = tx.type === 'BOOKING_PAYMENT' || tx.type === 'PRODUCT_PAYMENT';
        const walletBal = tx.walletBalanceAfter !== undefined ? tx.walletBalanceAfter : (userObj?.walletBalance !== undefined ? userObj.walletBalance : tx.balanceAfter);
        const walletBon = tx.walletBonusAfter !== undefined ? tx.walletBonusAfter : (userObj?.walletBonus !== undefined ? userObj.walletBonus : 0);
        const impact = getTransactionImpact(tx);
        const { isPositive, isBonusTx, deductedFromBalance, deductedFromBonus, addedToBalance, addedToBonus, rawRefId } = impact;
        const isDeduction = !isPositive;

        return (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-[fade-in_0.2s_ease-out]"
            onClick={() => setSelectedDetailTx(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-100 my-auto animate-[scale-in_0.2s_ease-out] flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-400/20 border border-gold-400/40 flex items-center justify-center text-gold-400 shadow-inner">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-wide">Transaction Details</h2>
                    <p className="text-xs text-gray-400 font-mono">
                      #{tx._id.slice(-10).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDetailTx(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Hero Amount Section */}
                <div className="bg-gradient-to-br from-gray-50 to-rose-50/30 rounded-2xl p-5 border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      {isDeduction
                        ? 'Deducted from Wallet Balance'
                        : isBonusTx
                        ? 'Added to YBcoin (Bonus)'
                        : 'Added to Wallet Balance'}
                    </span>
                    <div
                      className={`text-3xl font-extrabold font-mono tracking-tight flex items-center gap-1.5 ${
                        isPositive ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight size={26} className="text-green-500 shrink-0" />
                      ) : (
                        <ArrowDownLeft size={26} className="text-red-500 shrink-0" />
                      )}
                      <span>
                        {isPositive
                          ? isBonusTx
                            ? `+${addedToBonus.toFixed(2)} YBcoin`
                            : `+RM${addedToBalance.toFixed(2)}`
                          : `-RM${deductedFromBalance.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Calendar size={13} className="text-gray-400" />
                      <span>{formatDateTime(tx.date)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-100 text-rose-deep px-3 py-1 rounded-full border border-rose-200">
                      <Sparkles size={12} />
                      <span>{typeLabels[tx.type] || tx.type}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck size={11} />
                      <span>Completed</span>
                    </span>
                  </div>
                </div>

                {/* Customer Information Card */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 card-shadow space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <User size={14} className="text-rose-deep" />
                      <span>Customer Details</span>
                    </span>
                    {userObj?.customerRanking > 0 && (
                      <span className="inline-flex items-center gap-1 text-gold-600 font-semibold text-xs bg-gold-50 px-2.5 py-0.5 rounded-full border border-gold-200">
                        <Star size={12} className="fill-gold-400 text-gold-400" />
                        <span>{userObj.customerRanking}-Star VIP</span>
                      </span>
                    )}
                  </div>

                  {userObj ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 block mb-0.5">Customer Name</span>
                        <span className="font-semibold text-gray-800 text-sm">{userObj.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">User ID / Code</span>
                        <span className="font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                          {userObj.userId || 'N/A'}
                        </span>
                      </div>
                      {userObj.email && (
                        <div className="flex items-center gap-1.5 text-gray-600 truncate">
                          <Mail size={13} className="text-gray-400 shrink-0" />
                          <span className="truncate">{userObj.email}</span>
                        </div>
                      )}
                      {userObj.phone && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Phone size={13} className="text-gray-400 shrink-0" />
                          <span>{userObj.phone}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">User information unavailable</p>
                  )}
                </div>

                {/* Actual Transaction Deductions / Credits Impact Breakdown */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 card-shadow space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      {isDeduction ? (
                        <ArrowDownLeft size={14} className="text-red-500" />
                      ) : (
                        <ArrowUpRight size={14} className="text-green-500" />
                      )}
                      <span>{isDeduction ? 'Actual Payment Deductions' : 'Actual Credit Additions'}</span>
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {isDeduction ? 'Breakdown of Deducted Funds' : 'Breakdown of Added Funds'}
                    </span>
                  </div>

                  {isDeduction ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-red-50/40 rounded-xl p-3.5 border border-red-100/80">
                        <span className="text-[11px] font-medium text-red-700 block mb-1">
                          Deducted from Wallet Balance (Cash)
                        </span>
                        <span className="text-lg font-black font-mono text-red-600 block">
                          -RM{deductedFromBalance.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-red-400">Actual cash balance deducted</span>
                      </div>

                      <div className="bg-amber-50/40 rounded-xl p-3.5 border border-amber-100/80">
                        <span className="text-[11px] font-medium text-amber-700 block mb-1 flex items-center gap-1">
                          <Coins size={12} className="text-amber-500" />
                          <span>VIP DISCOUNT (YBcoin Bonus)</span>
                        </span>
                        <span className="text-lg font-black font-mono text-amber-600 block">
                          -{deductedFromBonus.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-amber-500">VIP discount deducted from wallet bonus</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-emerald-50/40 rounded-xl p-3.5 border border-emerald-100/80">
                        <span className="text-[11px] font-medium text-emerald-700 block mb-1">
                          Added to Wallet Balance (Cash)
                        </span>
                        <span className="text-lg font-black font-mono text-emerald-600 block">
                          +RM{addedToBalance.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-emerald-500">Cash credited to wallet</span>
                      </div>

                      <div className="bg-rose-50/40 rounded-xl p-3.5 border border-rose-100/80">
                        <span className="text-[11px] font-medium text-rose-deep block mb-1 flex items-center gap-1">
                          <Coins size={12} />
                          <span>Added to YBcoin (Bonus)</span>
                        </span>
                        <span className="text-lg font-black font-mono text-rose-deep block">
                          +{addedToBonus.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-rose-400">YBcoin credited to wallet</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Balances Breakdown Card */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 card-shadow space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard size={14} className="text-gold-500" />
                      <span>Wallet Balances (After Transaction)</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                      <span className="text-[11px] font-medium text-gray-500 block mb-1">
                        Wallet Balance
                      </span>
                      <span className="text-base font-bold font-mono text-gray-900 block">
                        RM{(walletBal ?? 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-gray-400">Cash Balance After</span>
                    </div>

                    <div className="bg-rose-50/50 rounded-xl p-3.5 border border-rose-100">
                      <span className="text-[11px] font-medium text-rose-deep block mb-1 flex items-center gap-1">
                        <Coins size={12} />
                        <span>YBcoin</span>
                      </span>
                      <span className="text-base font-bold font-mono text-rose-deep block">
                        {(walletBon ?? 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-rose-400">Wallet Bonus After</span>
                    </div>
                  </div>
                </div>

                {/* Transaction Information & References */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <FileText size={12} />
                      <span>Description</span>
                    </span>
                    <p className="text-sm font-medium text-gray-800 bg-white p-3 rounded-xl border border-gray-200/70 leading-relaxed">
                      {tx.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-gray-400 block mb-1">Transaction ID</span>
                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200">
                        <span className="font-mono text-[11px] text-gray-700 truncate">{tx._id}</span>
                        <button
                          onClick={() => handleCopyId(tx._id)}
                          className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition-colors shrink-0"
                          title="Copy ID"
                        >
                          {copiedId ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    {tx.referenceModel && (
                      <div>
                        <span className="text-gray-400 block mb-1">Reference</span>
                        <div className="bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-mono text-gray-700 truncate">
                          <span className="font-semibold text-rose-deep">{tx.referenceModel}:</span> #{rawRefId ? String(rawRefId).slice(-8).toUpperCase() : 'N/A'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <div>
                  {hasReceipt && (
                    <Button
                      size="sm"
                      variant="gold"
                      onClick={() => {
                        setSelectedDetailTx(null);
                        setSelectedReceiptTx(tx);
                      }}
                      className="py-1.5 px-3.5 text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Receipt size={14} />
                      <span>View Official POS Receipt</span>
                    </Button>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedDetailTx(null)}
                  className="py-1.5 px-4 text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
