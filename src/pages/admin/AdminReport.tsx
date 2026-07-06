import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Download, Calendar, CheckCircle, Tag, ShoppingBag,
  TrendingUp, Clock, ChevronDown, ChevronRight, FileDown, Crown, Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api';
import { Spinner, Badge, Button, EmptyState } from '../../components/ui';
import type { Booking, Order, RankingPurchase } from '../../types';

interface ReportData {
  success: boolean;
  range: { from: string | null; to: string | null } | null;
  summary: {
    completedServiceBookings: number;
    completedPromotionBookings: number;
    paidOrders: number;
    rankingPurchases: number;
    serviceRevenue: number;
    promotionRevenue: number;
    orderRevenue: number;
    rankingRevenue: number;
    totalRevenue: number;
  };
  completedServiceBookings: (Booking & { userId?: { name: string; userId: string; email: string; phone: string }; serviceId?: { name: string; category: string; price: number } })[];
  completedPromotionBookings: (Booking & { userId?: { name: string; userId: string; email: string; phone: string }; promotionId?: { title: string; discount: number; originalPrice: number } })[];
  paidOrders: (Order & { userId?: { name: string; userId: string; email: string; phone: string } })[];
  rankingPurchases: (RankingPurchase & { userId?: { name: string; userId: string; email: string; phone: string }; reviewedBy?: { name: string; userId: string } | null })[];
}

const fmtMoney = (n: number) => `RM${(n || 0).toFixed(2)}`;
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleString() : '-');

function getCustomerField(u: unknown, field: string): string {
  if (typeof u === 'object' && u !== null && field in (u as Record<string, unknown>)) {
    const val = (u as Record<string, unknown>)[field];
    return typeof val === 'string' ? val : '-';
  }
  return '-';
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildCSV(data: ReportData): string {
  const lines: string[] = [];
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  lines.push('=== YBLS ADMIN REPORT ===');
  lines.push(`Generated,${new Date().toLocaleString()}`);
  if (data.range) lines.push(`Range,${data.range.from || ''} to ${data.range.to || ''}`);
  lines.push('');
  lines.push('=== SUMMARY ===');
  lines.push(`Completed Service Bookings,${data.summary.completedServiceBookings}`);
  lines.push(`Completed Promotion Bookings,${data.summary.completedPromotionBookings}`);
  lines.push(`Paid Orders,${data.summary.paidOrders}`);
  lines.push(`Ranking Purchases,${data.summary.rankingPurchases}`);
  lines.push(`Service Revenue,${data.summary.serviceRevenue.toFixed(2)}`);
  lines.push(`Promotion Revenue,${data.summary.promotionRevenue.toFixed(2)}`);
  lines.push(`Order Revenue,${data.summary.orderRevenue.toFixed(2)}`);
  lines.push(`Ranking Revenue,${data.summary.rankingRevenue.toFixed(2)}`);
  lines.push(`Total Revenue,${data.summary.totalRevenue.toFixed(2)}`);
  lines.push('');

  lines.push('=== COMPLETED SERVICE BOOKINGS ===');
  lines.push('ID,Customer,Email,Phone,Service,Category,Date,Time,Price,Payment Method,Paid From Wallet,Notes,Created At');
  data.completedServiceBookings.forEach((b) => {
    lines.push([
      esc(b._id), esc(getCustomerField(b.userId, 'name')), esc(getCustomerField(b.userId, 'email')), esc(getCustomerField(b.userId, 'phone')),
      esc(b.serviceId && typeof b.serviceId === 'object' ? b.serviceId.name : b.serviceName),
      esc(b.serviceId && typeof b.serviceId === 'object' ? b.serviceId.category : '-'),
      esc(b.bookingDate), esc(b.bookingTime), esc(b.price?.toFixed(2)),
      esc(b.paymentMethod), esc(b.paidFromWallet ? 'Yes' : 'No'), esc(b.notes), esc(fmtDate(b.createdAt)),
    ].join(','));
  });
  lines.push('');

  lines.push('=== COMPLETED PROMOTION BOOKINGS ===');
  lines.push('ID,Customer,Email,Phone,Promotion,Discount,Original Price,Date,Time,Price,Payment Method,Paid From Wallet,Notes,Created At');
  data.completedPromotionBookings.forEach((b) => {
    lines.push([
      esc(b._id), esc(getCustomerField(b.userId, 'name')), esc(getCustomerField(b.userId, 'email')), esc(getCustomerField(b.userId, 'phone')),
      esc(b.promotionId && typeof b.promotionId === 'object' ? b.promotionId.title : b.serviceName),
      esc(b.promotionId && typeof b.promotionId === 'object' ? `${b.promotionId.discount}%` : '-'),
      esc(b.promotionId && typeof b.promotionId === 'object' ? b.promotionId.originalPrice?.toFixed(2) : '-'),
      esc(b.bookingDate), esc(b.bookingTime), esc(b.price?.toFixed(2)),
      esc(b.paymentMethod), esc(b.paidFromWallet ? 'Yes' : 'No'), esc(b.notes), esc(fmtDate(b.createdAt)),
    ].join(','));
  });
  lines.push('');

  lines.push('=== PAID ORDERS ===');
  lines.push('ID,Customer,Email,Phone,Items,Total Amount,Paid From Wallet,Shipping Address,Created At');
  data.paidOrders.forEach((o) => {
    const itemsStr = (o.items || []).map((i) => `${i.name} x${i.qty} @ ${i.price?.toFixed(2)}`).join('; ');
    lines.push([
      esc(o._id), esc(getCustomerField(o.userId, 'name')), esc(getCustomerField(o.userId, 'email')), esc(getCustomerField(o.userId, 'phone')),
      esc(itemsStr), esc(o.totalAmount?.toFixed(2)), esc(o.paidFromWallet ? 'Yes' : 'No'), esc(o.shippingAddress), esc(fmtDate(o.createdAt)),
    ].join(','));
  });
  lines.push('');

  lines.push('=== RANKING PURCHASES ===');
  lines.push('ID,Customer,Email,Phone,Tier,Tier Name,Price,Status,Reviewed By,Reviewed At,Created At');
  data.rankingPurchases.forEach((r) => {
    const reviewer = typeof r.reviewedBy === 'object' && r.reviewedBy ? r.reviewedBy.name : '-';
    lines.push([
      esc(r._id), esc(getCustomerField(r.userId, 'name')), esc(getCustomerField(r.userId, 'email')), esc(getCustomerField(r.userId, 'phone')),
      esc(r.tier), esc(r.tierName), esc(r.price?.toFixed(2)), esc(r.status), esc(reviewer), esc(r.reviewedAt ? fmtDate(r.reviewedAt) : '-'), esc(fmtDate(r.createdAt)),
    ].join(','));
  });

  return lines.join('\n');
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildPDFHTML(data: ReportData): string {
  const genDate = new Date().toLocaleString();
  const rangeStr = data.range ? `${data.range.from || '...'} to ${data.range.to || '...'}` : 'All time';

  const serviceRows = data.completedServiceBookings.map((b) => `
    <tr>
      <td>${esc(getCustomerField(b.userId, 'name'))}</td>
      <td>${esc(b.serviceId && typeof b.serviceId === 'object' ? b.serviceId.name : b.serviceName)}</td>
      <td>${esc(b.bookingDate)} ${esc(b.bookingTime)}</td>
      <td style="text-align:right">${esc(b.price?.toFixed(2))}</td>
      <td>${esc(b.paidFromWallet ? 'Wallet' : 'Cash')}</td>
      <td style="text-align:right">${esc(fmtDate(b.createdAt))}</td>
    </tr>`).join('');

  const promoRows = data.completedPromotionBookings.map((b) => `
    <tr>
      <td>${esc(getCustomerField(b.userId, 'name'))}</td>
      <td>${esc(b.promotionId && typeof b.promotionId === 'object' ? b.promotionId.title : b.serviceName)}</td>
      <td>${esc(b.bookingDate)} ${esc(b.bookingTime)}</td>
      <td style="text-align:right">${esc(b.price?.toFixed(2))}</td>
      <td>${esc(b.paidFromWallet ? 'Wallet' : 'Cash')}</td>
      <td style="text-align:right">${esc(fmtDate(b.createdAt))}</td>
    </tr>`).join('');

  const orderRows = data.paidOrders.map((o) => {
    const items = (o.items || []).map((i) => `${esc(i.name)} x${i.qty}`).join('<br>');
    return `
    <tr>
      <td style="font-family:monospace;font-size:10px">#${esc(o._id.slice(-8).toUpperCase())}</td>
      <td>${esc(getCustomerField(o.userId, 'name'))}</td>
      <td>${items}</td>
      <td style="text-align:right">${esc(o.totalAmount?.toFixed(2))}</td>
      <td>${esc(o.paidFromWallet ? 'Wallet' : 'External')}</td>
      <td style="text-align:right">${esc(fmtDate(o.createdAt))}</td>
    </tr>`;
  }).join('');

  const rankingRows = data.rankingPurchases.map((r) => {
    const stars = '★'.repeat(r.tier) + '☆'.repeat(Math.max(0, 5 - r.tier));
    const reviewer = typeof r.reviewedBy === 'object' && r.reviewedBy ? r.reviewedBy.name : '-';
    return `
    <tr>
      <td style="font-family:monospace;font-size:10px">#${esc(r._id.slice(-8).toUpperCase())}</td>
      <td>${esc(getCustomerField(r.userId, 'name'))}</td>
      <td><span style="color:#c87a8a">${esc(stars)}</span> ${esc(r.tierName)}</td>
      <td style="text-align:right">${esc(r.price?.toFixed(2))}</td>
      <td>${esc(reviewer)}</td>
      <td style="text-align:right">${esc(r.reviewedAt ? fmtDate(r.reviewedAt) : '-')}</td>
      <td style="text-align:right">${esc(fmtDate(r.createdAt))}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>YBLS Sales Report</title>
<style>
  @page { margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #4a4040; font-size: 12px; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #c87a8a; padding-bottom: 12px; }
  .header h1 { font-size: 22px; color: #3a2a2a; }
  .header .subtitle { font-size: 12px; color: #999; margin-top: 3px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 18px; font-size: 11px; color: #666; }
  .summary { display: flex; gap: 10px; margin-bottom: 22px; }
  .summary-card { flex: 1; border: 1px solid #e8b4bc; border-radius: 8px; padding: 12px; text-align: center; }
  .summary-card .label { font-size: 9px; color: #999; text-transform: uppercase; }
  .summary-card .value { font-size: 18px; font-weight: bold; color: #c87a8a; margin-top: 3px; }
  .summary-card .rev { font-size: 10px; color: #a56e2c; margin-top: 2px; }
  .summary-card.total { background: #f8e1e5; border-color: #c87a8a; }
  .summary-card.total .value { font-size: 16px; }
  h2 { font-size: 14px; color: #3a2a2a; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #eee; }
  .section-count { font-size: 11px; color: #999; font-weight: normal; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #f8e1e5; color: #3a2a2a; font-size: 10px; text-transform: uppercase; padding: 6px 8px; text-align: left; }
  td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; font-size: 11px; }
  tr:nth-child(even) td { background: #faf8f6; }
  .empty { color: #ccc; text-align: center; padding: 12px; font-style: italic; }
  .footer { margin-top: 24px; text-align: center; font-size: 9px; color: #ccc; border-top: 1px solid #eee; padding-top: 8px; }
</style>
</head>
<body>
  <div class="header">
    <h1>YBLS Beauty Salon</h1>
    <div class="subtitle">Sales Report — Completed Bookings, Promotions &amp; Paid Orders</div>
  </div>
  <div class="meta">
    <span>Generated: ${esc(genDate)}</span>
    <span>Date Range: ${esc(rangeStr)}</span>
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="label">Service Bookings</div>
      <div class="value">${data.summary.completedServiceBookings}</div>
      <div class="rev">RM${data.summary.serviceRevenue.toFixed(2)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Promotion Bookings</div>
      <div class="value">${data.summary.completedPromotionBookings}</div>
      <div class="rev">RM${data.summary.promotionRevenue.toFixed(2)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Paid Orders</div>
      <div class="value">${data.summary.paidOrders}</div>
      <div class="rev">RM${data.summary.orderRevenue.toFixed(2)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Ranking Purchases</div>
      <div class="value">${data.summary.rankingPurchases}</div>
      <div class="rev">RM${data.summary.rankingRevenue.toFixed(2)}</div>
    </div>
    <div class="summary-card total">
      <div class="label">Total Revenue</div>
      <div class="value">RM${data.summary.totalRevenue.toFixed(2)}</div>
    </div>
  </div>

  <h2>Completed Service Bookings <span class="section-count">(${data.completedServiceBookings.length})</span></h2>
  ${data.completedServiceBookings.length === 0 ? '<div class="empty">No completed service bookings.</div>' : `
  <table>
    <thead><tr><th>Customer</th><th>Service</th><th>Date &amp; Time</th><th style="text-align:right">Price</th><th>Payment</th><th style="text-align:right">Created</th></tr></thead>
    <tbody>${serviceRows}</tbody>
  </table>`}

  <h2>Completed Promotion Bookings <span class="section-count">(${data.completedPromotionBookings.length})</span></h2>
  ${data.completedPromotionBookings.length === 0 ? '<div class="empty">No completed promotion bookings.</div>' : `
  <table>
    <thead><tr><th>Customer</th><th>Promotion</th><th>Date &amp; Time</th><th style="text-align:right">Price</th><th>Payment</th><th style="text-align:right">Created</th></tr></thead>
    <tbody>${promoRows}</tbody>
  </table>`}

  <h2>Paid Orders <span class="section-count">(${data.paidOrders.length})</span></h2>
  ${data.paidOrders.length === 0 ? '<div class="empty">No paid orders.</div>' : `
  <table>
    <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th style="text-align:right">Total</th><th>Payment</th><th style="text-align:right">Created</th></tr></thead>
    <tbody>${orderRows}</tbody>
  </table>`}

  <h2>Ranking Purchases <span class="section-count">(${data.rankingPurchases.length})</span></h2>
  ${data.rankingPurchases.length === 0 ? '<div class="empty">No approved ranking purchases.</div>' : `
  <table>
    <thead><tr><th>Request ID</th><th>Customer</th><th>Tier</th><th style="text-align:right">Price</th><th>Approved By</th><th style="text-align:right">Approved</th><th style="text-align:right">Created</th></tr></thead>
    <tbody>${rankingRows}</tbody>
  </table>`}

  <div class="footer">YBLS Beauty Salon — Confidential Sales Report — Generated ${esc(genDate)}</div>
</body>
</html>`;
}

function SectionTable({
  title,
  icon: Icon,
  count,
  revenue,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  count: number;
  revenue: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl card-shadow overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
          <Icon size={20} className="text-rose-deep" />
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <Badge variant="info">{count}</Badge>
        </div>
        <span className="text-sm font-bold text-rose-deep">{revenue}</span>
      </button>
      {open && <div className="border-t border-gray-100 overflow-x-auto">{children}</div>}
    </div>
  );
}

export default function AdminReport() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [appliedRange, setAppliedRange] = useState<{ from?: string; to?: string }>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-report', appliedRange],
    queryFn: () => adminAPI.getReport(appliedRange).then((r) => r.data as ReportData),
  });

  const handleApply = () => {
    setAppliedRange({ from: from || undefined, to: to || undefined });
  };

  const handleClear = () => {
    setFrom('');
    setTo('');
    setAppliedRange({});
  };

  const handleDownloadJSON = () => {
    if (!data) return;
    const filename = `ybls-report-${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(filename, JSON.stringify(data, null, 2), 'application/json');
    toast.success('Report downloaded (JSON)');
  };

  const handleDownloadCSV = () => {
    if (!data) return;
    const filename = `ybls-report-${new Date().toISOString().split('T')[0]}.csv`;
    downloadFile(filename, buildCSV(data), 'text/csv;charset=utf-8;');
    toast.success('Report downloaded (CSV)');
  };

  const handleDownloadPDF = () => {
    if (!data) return;
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Please allow popups to download PDF');
      return;
    }
    win.document.open();
    win.document.write(buildPDFHTML(data));
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 500);
    toast.success('Opening PDF preview...');
  };

  const summary = data?.summary;
  const stats = [
    { icon: CheckCircle, label: 'Completed Service Bookings', value: summary?.completedServiceBookings ?? 0, revenue: summary?.serviceRevenue ?? 0, color: 'from-rose-soft to-rose-medium' },
    { icon: Tag, label: 'Completed Promotion Bookings', value: summary?.completedPromotionBookings ?? 0, revenue: summary?.promotionRevenue ?? 0, color: 'from-gold-100 to-gold-300' },
    { icon: ShoppingBag, label: 'Paid Orders', value: summary?.paidOrders ?? 0, revenue: summary?.orderRevenue ?? 0, color: 'from-blush-100 to-blush-300' },
    { icon: Crown, label: 'Ranking Purchases', value: summary?.rankingPurchases ?? 0, revenue: summary?.rankingRevenue ?? 0, color: 'from-gold-100 to-gold-300' },
    { icon: TrendingUp, label: 'Total Revenue', value: summary?.totalRevenue ?? 0, revenue: summary?.totalRevenue ?? 0, color: 'from-rose-medium to-rose-deep', isTotal: true },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-rose-soft to-gold-100 flex items-center justify-center">
            <FileText size={22} className="text-rose-deep" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sales Report</h1>
            <p className="text-sm text-gray-500">Completed bookings, promotions and paid orders</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadJSON} disabled={!data}>
            <Download size={16} className="inline mr-1" /> JSON
          </Button>
          <Button variant="gold" onClick={handleDownloadCSV} disabled={!data}>
            <Download size={16} className="inline mr-1" /> CSV
          </Button>
          <Button onClick={handleDownloadPDF} disabled={!data}>
            <FileDown size={16} className="inline mr-1" /> PDF
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 card-shadow mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-rose-deep" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-rose-deep" />
          </div>
          <Button size="sm" onClick={handleApply}>Apply</Button>
          <Button size="sm" variant="ghost" onClick={handleClear}>Clear</Button>
          {(appliedRange.from || appliedRange.to) && (
            <span className="text-xs text-gray-400 ml-2">Filtered: {appliedRange.from || '...'} to {appliedRange.to || '...'}</span>
          )}
        </div>
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : !data ? (
        <EmptyState icon={FileText} title="No data" message="Unable to load report data." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 card-shadow">
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                {stat.isTotal ? (
                  <>
                    <p className="text-2xl font-bold text-gray-800">{fmtMoney(stat.value)}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-xs text-gold-600 mt-0.5">Revenue: {fmtMoney(stat.revenue)}</p>
                  </>
                )}
              </div>
            ))}
          </div>

          <SectionTable
            title="Completed Service Bookings"
            icon={CheckCircle}
            count={data.completedServiceBookings.length}
            revenue={fmtMoney(data.summary.serviceRevenue)}
          >
            {data.completedServiceBookings.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">No completed service bookings.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Service</th>
                    <th className="px-4 py-3 font-medium">Date and Time</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.completedServiceBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{getCustomerField(b.userId, 'name')}</p>
                        <p className="text-xs text-gray-400">{getCustomerField(b.userId, 'email')}</p>
                        <p className="text-xs text-gray-400">{getCustomerField(b.userId, 'phone')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{b.serviceId && typeof b.serviceId === 'object' ? b.serviceId.name : b.serviceName}</p>
                        <p className="text-xs text-gray-400">{b.serviceId && typeof b.serviceId === 'object' ? b.serviceId.category : '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {b.bookingDate}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={12} /> {b.bookingTime}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-rose-deep">{fmtMoney(b.price)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={b.paidFromWallet ? 'success' : 'default'}>{b.paidFromWallet ? 'Wallet' : 'Cash'}</Badge>
                        <p className="text-xs text-gray-400 mt-0.5">{b.paymentMethod}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(b.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionTable>

          <SectionTable
            title="Completed Promotion Bookings"
            icon={Tag}
            count={data.completedPromotionBookings.length}
            revenue={fmtMoney(data.summary.promotionRevenue)}
          >
            {data.completedPromotionBookings.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">No completed promotion bookings.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Promotion</th>
                    <th className="px-4 py-3 font-medium">Date and Time</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.completedPromotionBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{getCustomerField(b.userId, 'name')}</p>
                        <p className="text-xs text-gray-400">{getCustomerField(b.userId, 'email')}</p>
                        <p className="text-xs text-gray-400">{getCustomerField(b.userId, 'phone')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{b.promotionId && typeof b.promotionId === 'object' ? b.promotionId.title : b.serviceName}</p>
                        <p className="text-xs text-gold-600">
                          {b.promotionId && typeof b.promotionId === 'object' ? `${b.promotionId.discount}% off - Orig RM${b.promotionId.originalPrice?.toFixed(2)}` : '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {b.bookingDate}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={12} /> {b.bookingTime}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-rose-deep">{fmtMoney(b.price)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={b.paidFromWallet ? 'success' : 'default'}>{b.paidFromWallet ? 'Wallet' : 'Cash'}</Badge>
                        <p className="text-xs text-gray-400 mt-0.5">{b.paymentMethod}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(b.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionTable>

          <SectionTable
            title="Paid Orders"
            icon={ShoppingBag}
            count={data.paidOrders.length}
            revenue={fmtMoney(data.summary.orderRevenue)}
          >
            {data.paidOrders.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">No paid orders.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order ID</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium">Shipping Address</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.paidOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">#{o._id.slice(-8).toUpperCase()}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{getCustomerField(o.userId, 'name')}</p>
                        <p className="text-xs text-gray-400">{getCustomerField(o.userId, 'email')}</p>
                        <p className="text-xs text-gray-400">{getCustomerField(o.userId, 'phone')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {(o.items || []).map((item, idx) => (
                            <p key={idx} className="text-xs text-gray-600">
                              {item.name} x {item.qty} <span className="text-gray-400">@ RM{item.price?.toFixed(2)}</span>
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-rose-deep">{fmtMoney(o.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={o.paidFromWallet ? 'success' : 'info'}>{o.paidFromWallet ? 'Wallet' : 'External'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{o.shippingAddress || '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionTable>

          <SectionTable
            title="Ranking Purchases"
            icon={Crown}
            count={data.rankingPurchases.length}
            revenue={fmtMoney(data.summary.rankingRevenue)}
          >
            {data.rankingPurchases.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">No approved ranking purchases.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Request ID</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Tier</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Approved By</th>
                    <th className="px-4 py-3 font-medium">Approved At</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.rankingPurchases.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">#{r._id.slice(-8).toUpperCase()}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{getCustomerField(r.userId, 'name')}</p>
                        <p className="text-xs text-gray-400">{getCustomerField(r.userId, 'email')}</p>
                        <p className="text-xs text-gray-400">{getCustomerField(r.userId, 'phone')}</p>
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
                      <td className="px-4 py-3 font-medium text-rose-deep">{fmtMoney(r.price)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {typeof r.reviewedBy === 'object' && r.reviewedBy ? r.reviewedBy.name : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{r.reviewedAt ? fmtDate(r.reviewedAt) : '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionTable>
        </div>
      )}
    </div>
  );
}
