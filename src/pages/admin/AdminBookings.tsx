import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar as CalIcon, Clock, Search, Trash2, X, ChevronLeft, ChevronRight, CalendarDays, List, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingAPI } from '../../api';
import { Spinner, Button, Badge, EmptyState, PromotionIndicator } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal';
import type { Booking } from '../../types';

const statusVariant = (status: string) => {
  switch (status) {
    case 'Confirmed': return 'success';
    case 'Completed': return 'info';
    case 'Cancelled': return 'danger';
    default: return 'warning';
  }
};

const formatDateTime = (date: string) => new Date(date).toLocaleString();

import { imageUrl } from '../../utils/image';

const bookingImage = (b: Booking): string => {
  if (b.promotionId && typeof b.promotionId === 'object' && b.promotionId.image) return imageUrl(b.promotionId.image);
  if (b.serviceId && typeof b.serviceId === 'object' && b.serviceId.image) return imageUrl(b.serviceId.image);
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

const renderPriceCell = (b: Booking) => {
  const d = walletDiscountInfo(b);
  if (d) {
    return (
      <div>
        <span className="text-gray-400 line-through text-xs block">RM{b.price.toFixed(2)}</span>
        <span className="font-medium text-rose-deep">RM{d.paid.toFixed(2)}</span>
        <span className="text-[10px] text-gold-600 block">{d.percent}% wallet discount</span>
      </div>
    );
  }
  return <span className="font-medium text-rose-deep">RM{b.price}</span>;
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function AdminBookings() {
  const [status, setStatus] = useState('All');
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(today));

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', status],
    queryFn: () => bookingAPI.getAll({ status }).then((r) => r.data),
  });

  const { data: confirmedData, isLoading: confirmedLoading } = useQuery({
    queryKey: ['admin-bookings', 'Confirmed'],
    queryFn: () => bookingAPI.getAll({ status: 'Confirmed' }).then((r) => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) => bookingAPI.updateStatus(id, status, reason),
    onSuccess: (res) => {
      toast.success('Booking updated');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      setCancelTarget(null);
      setCancelReason('');
      setSelectedBooking((prev) => (prev ? res.data.booking : prev));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteBooking = useMutation({
    mutationFn: (id: string) => bookingAPI.delete(id),
    onSuccess: () => { toast.success('Booking deleted'); queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }); setSelectedBooking(null); setDeleteTarget(null); },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleDelete = (b: Booking) => {
    setDeleteTarget(b);
  };

  const bookings = (data?.bookings || []).filter((b: Booking) => {
    const q = search.toLowerCase();
    const customer = typeof b.userId === 'object' && b.userId ? (b.userId as any).name : '';
    return (
      customer.toLowerCase().includes(q) ||
      b.serviceName.toLowerCase().includes(q) ||
      b.bookingDate.toLowerCase().includes(q) ||
      b.status.toLowerCase().includes(q)
    );
  });
  const statuses = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];
  const selectedDiscount = selectedBooking ? walletDiscountInfo(selectedBooking) : null;

  const confirmedBookings = useMemo(() => confirmedData?.bookings || [], [confirmedData]);

  const confirmedByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of confirmedBookings) {
      const key = b.bookingDate;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    }
    return map;
  }, [confirmedBookings]);

  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calCells: (number | null)[] = [
    ...Array(calFirstDay).fill(null),
    ...Array.from({ length: calDaysInMonth }, (_, i) => i + 1),
  ];

  const goToPrevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1);
  };
  const goToNextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1);
  };
  const goToToday = () => {
    const now = new Date();
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth());
    setSelectedDate(toDateKey(now));
  };

  const selectedDateBookings = (confirmedByDate[selectedDate] || []).slice().sort((a, b) => a.bookingTime.localeCompare(b.bookingTime));
  const totalConfirmedThisMonth = confirmedBookings.filter((b) => {
    const d = new Date(b.bookingDate);
    return d.getFullYear() === calYear && d.getMonth() === calMonth;
  }).length;
  const todayKey = toDateKey(new Date());

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Bookings Management</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden card-shadow">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-rose-deep text-white' : 'bg-white text-gray-600 hover:bg-blush-50'}`}
            >
              <List size={16} /> Table
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-rose-deep text-white' : 'bg-white text-gray-600 hover:bg-blush-50'}`}
            >
              <CalendarDays size={16} /> Calendar
            </button>
          </div>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-rose-deep w-64" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {statuses.map((st) => (
          <button key={st} onClick={() => setStatus(st)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${status === st ? 'bg-rose-deep text-white' : 'bg-white text-gray-600 hover:bg-blush-50'} card-shadow`}>
            {st}
          </button>
        ))}
      </div>

      {viewMode === 'table' ? (
        isLoading ? <Spinner className="py-20" /> : bookings.length === 0 ? (
          <EmptyState icon={CalIcon} title={search ? 'No results found' : 'No bookings'} message={search ? `No bookings match "${search}".` : 'No bookings found for this filter.'} />
        ) : (
          <div className="bg-white rounded-2xl card-shadow overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Date & Time</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b: Booking) => (
                <tr key={b._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedBooking(b)}>
                  <td className="px-4 py-3">
                    {typeof b.userId === 'object' && b.userId ? (
                      <div>
                        <p className="font-medium text-gray-800">{(b.userId as any).name}</p>
                        <p className="text-xs text-gray-400">{(b.userId as any).phone}</p>
                      </div>
                    ) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{b.serviceName}</span>
                      {b.bookingType === 'promotion' && <PromotionIndicator />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.bookingDate}<br /><span className="text-xs text-gray-400">{b.bookingTime}</span></td>
                  <td className="px-4 py-3">{renderPriceCell(b)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                    {b.status === 'Cancelled' && (
                      <div className="mt-1 text-xs text-gray-400 space-y-0.5 max-w-45">
                        {b.cancellationReason && <p className="italic">Reason: {b.cancellationReason}</p>}
                        {b.cancelledBy && typeof b.cancelledBy === 'object' && (
                          <p>Cancelled by: {b.cancelledBy.name}{b.cancelledByRole ? ` (${b.cancelledByRole})` : ''}</p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <select
                        value={b.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (newStatus === 'Cancelled') {
                            setCancelTarget(b);
                            setCancelReason('');
                          } else {
                            updateStatus.mutate({ id: b._id, status: newStatus });
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-rose-deep"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirm</option>
                        <option value="Completed">Complete</option>
                        <option value="Cancelled">Cancel</option>
                      </select>
                      <button
                        onClick={() => handleDelete(b)}
                        disabled={deleteBooking.isPending}
                        title="Delete booking"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      ) : (
        confirmedLoading ? <Spinner className="py-20" /> : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl card-shadow p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={goToPrevMonth} className="w-9 h-9 rounded-full hover:bg-blush-50 flex items-center justify-center text-gray-500 transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-lg font-semibold text-gray-800 min-w-44 text-center">{MONTH_NAMES[calMonth]} {calYear}</h2>
                  <button onClick={goToNextMonth} className="w-9 h-9 rounded-full hover:bg-blush-50 flex items-center justify-center text-gray-500 transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-500" /> {totalConfirmedThisMonth} confirmed this month
                  </span>
                  <button onClick={goToToday} className="text-xs font-medium text-rose-deep hover:text-rose-medium px-3 py-1.5 rounded-full border border-rose-200 hover:bg-rose-soft transition-colors">
                    Today
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAY_LABELS.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calCells.map((day, i) => {
                  if (day === null) return <div key={i} className="min-h-20" />;
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayBookings = confirmedByDate[dateStr] || [];
                  const count = dayBookings.length;
                  const isToday = dateStr === todayKey;
                  const isSelected = dateStr === selectedDate;
                  const isPast = new Date(calYear, calMonth, day) < new Date(new Date().toDateString());
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`min-h-20 p-1.5 rounded-lg border text-left transition-all duration-150 ${
                        isSelected
                          ? 'border-rose-deep bg-rose-soft ring-1 ring-rose-deep'
                          : isToday
                          ? 'border-rose-300 bg-blush-50'
                          : 'border-gray-100 hover:border-rose-200 hover:bg-blush-50'
                      } ${isPast && !isToday ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isToday ? 'font-bold text-rose-deep' : 'text-gray-500'}`}>{day}</span>
                        {count > 0 && (
                          <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-green-500 text-white text-[10px] font-bold leading-none">
                            {count}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {dayBookings.slice(0, 2).map((b) => (
                          <div key={b._id} className="text-[10px] bg-rose-deep/10 text-rose-deep rounded px-1 py-0.5 truncate flex items-center gap-0.5">
                            <Clock size={9} className="shrink-0" />{b.bookingTime} {b.serviceName.slice(0, 7)}
                          </div>
                        ))}
                        {count > 2 && <p className="text-[10px] text-gray-400 px-1">+{count - 2} more</p>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 flex-wrap text-xs text-gray-500">
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-soft border border-rose-300" /> Today</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-deep/10" /> Has confirmed booking</span>
                <span className="inline-flex items-center gap-1.5"><span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-green-500 text-white text-[8px] font-bold">N</span> Booking count</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl card-shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
                {selectedDateBookings.length > 0 && (
                  <Badge variant="success">{selectedDateBookings.length} confirmed</Badge>
                )}
              </div>

              {selectedDateBookings.length === 0 ? (
                <EmptyState icon={CalIcon} title="No confirmed bookings" message="There are no confirmed appointments on this date." />
              ) : (
                <div className="space-y-3">
                  {selectedDateBookings.map((b) => (
                    <div
                      key={b._id}
                      onClick={() => setSelectedBooking(b)}
                      className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-rose-200 hover:bg-blush-50 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-rose-soft flex items-center justify-center shrink-0">
                        <Clock size={16} className="text-rose-deep" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{b.serviceName}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={11} /> {b.bookingTime}
                          {typeof b.userId === 'object' && b.userId && (
                            <span className="flex items-center gap-0.5 ml-1"><MapPin size={11} /> {(b.userId as any).name}</span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="success">Confirmed</Badge>
                          {b.bookingType === 'promotion' && <PromotionIndicator />}
                          <span className="text-xs font-medium text-rose-deep">RM{b.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      )}

      {cancelTarget && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => { setCancelTarget(null); setCancelReason(''); }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Cancel Booking</h2>
              <button onClick={() => { setCancelTarget(null); setCancelReason(''); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Cancelling <span className="font-medium text-gray-700">{cancelTarget.serviceName}</span> on {cancelTarget.bookingDate} at {cancelTarget.bookingTime}.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!cancelReason.trim()) {
                  toast.error('Please provide a cancellation reason');
                  return;
                }
                updateStatus.mutate({ id: cancelTarget._id, status: 'Cancelled', reason: cancelReason });
              }}
            >
              <label className="text-xs text-gray-500">Reason for cancellation <span className="text-red-500">*</span></label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                required
                placeholder="Enter the reason for cancelling this booking..."
                className="w-full mt-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep resize-none"
              />
              <div className="flex gap-2 mt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setCancelTarget(null); setCancelReason(''); }}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger" className="flex-1" disabled={updateStatus.isPending}>
                  {updateStatus.isPending ? 'Cancelling...' : 'Confirm Cancel'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-800">Booking Details</h2>
                <Badge variant={statusVariant(selectedBooking.status)}>{selectedBooking.status}</Badge>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-rose-soft">
                  {bookingImage(selectedBooking) ? (
                    <img src={bookingImage(selectedBooking)} alt={selectedBooking.serviceName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CalIcon size={28} className="text-rose-deep" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-800">{selectedBooking.serviceName}</h3>
                    {selectedBooking.bookingType === 'promotion' && <PromotionIndicator />}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-mono">#{selectedBooking._id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">Booked on {formatDateTime(selectedBooking.createdAt)}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer</h3>
                {typeof selectedBooking.userId === 'object' && selectedBooking.userId ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Name</p>
                      <p className="text-gray-700">{(selectedBooking.userId as any).name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">User ID</p>
                      <p className="text-gray-700">{(selectedBooking.userId as any).userId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Phone</p>
                      <p className="text-gray-700">{(selectedBooking.userId as any).phone || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">N/A</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {selectedBooking.bookingType === 'promotion' ? 'Promotion' : 'Service'}
                </h3>
                {selectedBooking.bookingType === 'promotion' && selectedBooking.promotionId && typeof selectedBooking.promotionId === 'object' ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">Title</p>
                      <p className="text-gray-700">{(selectedBooking.promotionId as any).title}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Original Price</p>
                      <p className="text-gray-400 line-through">RM{(selectedBooking.promotionId as any).originalPrice?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Discount</p>
                      <p className="text-gray-700">{(selectedBooking.promotionId as any).discount}%</p>
                    </div>
                  </div>
                ) : selectedBooking.serviceId && typeof selectedBooking.serviceId === 'object' ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Name</p>
                      <p className="text-gray-700">{(selectedBooking.serviceId as any).name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Category</p>
                      <p className="text-gray-700">{(selectedBooking.serviceId as any).category || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">N/A</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Schedule</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Date</p>
                    <p className="text-gray-700 flex items-center gap-1"><CalIcon size={14} /> {selectedBooking.bookingDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Time</p>
                    <p className="text-gray-700 flex items-center gap-1"><Clock size={14} /> {selectedBooking.bookingTime}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Price</p>
                    {selectedDiscount ? (
                      <p className="font-bold text-rose-deep">
                        <span className="text-gray-400 line-through text-sm font-normal mr-1">RM{selectedBooking.price.toFixed(2)}</span>
                        RM{selectedDiscount.paid.toFixed(2)}
                      </p>
                    ) : (
                      <p className="font-bold text-rose-deep">RM{selectedBooking.price.toFixed(2)}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Payment Method</p>
                    <p className="text-gray-700">
                      {selectedBooking.paymentMethod === 'split'
                        ? 'Wallet (Split)'
                        : selectedBooking.paymentMethod === 'wallet'
                        ? 'Wallet'
                        : 'Pay on Arrival'}
                    </p>
                  </div>
                  {selectedBooking.paymentMethod && selectedBooking.paymentMethod !== 'cash' && (
                    <div>
                      <p className="text-xs text-gray-400">Charge Status</p>
                      <p className={selectedBooking.paidFromWallet ? 'text-green-600 font-medium' : 'text-orange-500 font-medium'}>
                        {selectedBooking.paidFromWallet ? 'Charged' : 'Pending (on completion)'}
                      </p>
                    </div>
                  )}
                  {selectedBooking.paidFromWallet && (
                    <>
                      <div>
                        <p className="text-xs text-gray-400">Paid from Balance</p>
                        <p className="text-gray-700">RM{(selectedBooking.paidFromBalance || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Paid from Bonus</p>
                        <p className="text-gray-700">RM{(selectedBooking.paidFromBonus || 0).toFixed(2)}</p>
                      </div>
                    </>
                  )}
                  {selectedDiscount && (
                    <div>
                      <p className="text-xs text-gray-400">Wallet Discount</p>
                      <p className="text-gold-600">{selectedDiscount.percent}% off · Saved RM{selectedDiscount.discount.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</h3>
                  <p className="text-sm text-gray-600 italic bg-gray-50 rounded-lg p-3">{selectedBooking.notes}</p>
                </div>
              )}

              {selectedBooking.status === 'Cancelled' && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">Cancellation Details</h3>
                  <div className="bg-red-50 rounded-lg p-4 space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Reason</p>
                      <p className="text-gray-700 italic">{selectedBooking.cancellationReason || '-'}</p>
                    </div>
                    {selectedBooking.cancelledBy && typeof selectedBooking.cancelledBy === 'object' && (
                      <div>
                        <p className="text-xs text-gray-400">Cancelled By</p>
                        <p className="text-gray-700">{selectedBooking.cancelledBy.name}{selectedBooking.cancelledByRole ? ` (${selectedBooking.cancelledByRole})` : ''}</p>
                      </div>
                    )}
                    {selectedBooking.cancelledAt && (
                      <div>
                        <p className="text-xs text-gray-400">Cancelled At</p>
                        <p className="text-gray-700">{formatDateTime(selectedBooking.cancelledAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Update status:</span>
                <select
                  value={selectedBooking.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    if (newStatus === 'Cancelled') {
                      setCancelTarget(selectedBooking);
                      setCancelReason('');
                    } else {
                      updateStatus.mutate({ id: selectedBooking._id, status: newStatus });
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-rose-deep"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirm</option>
                  <option value="Completed">Complete</option>
                  <option value="Cancelled">Cancel</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="danger" onClick={() => handleDelete(selectedBooking)} disabled={deleteBooking.isPending}>
                  <Trash2 size={16} className="inline mr-1" /> Delete
                </Button>
                <Button type="button" variant="outline" onClick={() => setSelectedBooking(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteBooking.mutate(deleteTarget._id)}
        title="Delete Booking"
        message="Permanently delete this booking? This action cannot be undone."
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        processingLabel="Deleting..."
        isLoading={deleteBooking.isPending}
        confirmVariant="danger"
        details={deleteTarget ? [
          { label: 'Service', value: deleteTarget.serviceName },
          { label: 'Date', value: deleteTarget.bookingDate },
          { label: 'Time', value: deleteTarget.bookingTime },
          {
            label: 'Customer',
            value: typeof deleteTarget.userId === 'object' && deleteTarget.userId ? (deleteTarget.userId as any).name : 'N/A',
          },
        ] : []}
      />
    </div>
  );
}
