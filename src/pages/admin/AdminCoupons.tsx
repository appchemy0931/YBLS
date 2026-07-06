import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X, Gift, Edit, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { couponAPI, uploadAPI } from '../../api';
import { Spinner, Button, Badge, EmptyState } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal';
import type { Coupon } from '../../types';

export default function AdminCoupons() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ name: '', image: '', amount: 50, price: 45, expiryDate: '2026-12-31' });
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const editingId = editing?._id;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['admin-coupons'], queryFn: () => couponAPI.getAll().then((r) => r.data) });

  const createMutation = useMutation({
    mutationFn: () => couponAPI.create({ ...form, expiryDate: new Date(form.expiryDate) } as any),
    onSuccess: () => { toast.success('Coupon created'); queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); resetForm(); },
    onError: (err: Error) => toast.error(err.message),
  });
  const updateMutation = useMutation({
    mutationFn: () => couponAPI.update(editingId!, { ...form, expiryDate: new Date(form.expiryDate) } as any),
    onSuccess: () => { toast.success('Coupon updated'); queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); resetForm(); },
    onError: (err: Error) => toast.error(err.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponAPI.delete(id),
    onSuccess: () => { toast.success('Coupon deleted'); queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); setDeleteTarget(null); },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetForm = () => { setShowForm(false); setEditing(null); setForm({ name: '', image: '', amount: 50, price: 45, expiryDate: '2026-12-31' }); };
  const openEdit = (c: Coupon) => { setEditing(c); setForm({ name: c.name, image: c.image || '', amount: c.amount, price: c.price, expiryDate: new Date(c.expiryDate).toISOString().split('T')[0] }); setShowForm(true); };
  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => { e.preventDefault(); editing ? updateMutation.mutate() : createMutation.mutate(); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const { data } = await uploadAPI.uploadImage(file);
      setForm((prev) => ({ ...prev, image: data.image }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
  const coupons = data?.coupons || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Coupons Management</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus size={18} className="inline mr-1" /> Add Coupon</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Coupon' : 'Add Coupon'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div>
              <label className="text-xs text-gray-500">Coupon Image</label>
              {form.image ? (
                <div className="relative mt-1 mb-2">
                  <img src={form.image} alt="Coupon preview" className="w-full h-24 rounded-2xl object-cover" />
                  <button type="button" onClick={() => setForm({ ...form, image: '' })} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                    <X size={14} />
                  </button>
                </div>
              ) : null}
              <label className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:border-rose-deep transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={16} className="text-gray-400" />
                <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : form.image ? 'Change Image' : 'Upload Image'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Coupon Name</label>
                <input type="text" placeholder="RM50 Top-Up Coupon" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Credit Amount (RM)</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Purchase Price (RM)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
              </div>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="w-full">
                {editing ? 'Update Coupon' : 'Create Coupon'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {isLoading ? <Spinner className="py-20" /> : coupons.length === 0 ? (
        <EmptyState icon={Gift} title="No coupons" message="Create your first wallet top-up coupon." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => {
            const expired = new Date(c.expiryDate) < new Date();
            return (
              <div key={c._id} className="bg-white rounded-2xl overflow-hidden card-shadow">
                {c.image ? (
                  <img src={c.image} alt={c.name} className="w-full h-34 rounded-2xl object-cover" />
                ) : null}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    {/* <div className="w-12 h-12 rounded-xl bg-linear-to-br from-rose-soft to-gold-100 flex items-center justify-center">
                      <Gift size={24} className="text-rose-deep" />
                    </div> */}
                    <Badge variant={expired ? 'danger' : 'success'}>{expired ? 'Expired' : 'Active'}</Badge>
                  </div>
                  <h3 className="font-semibold text-gray-800">{c.name}</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-rose-deep">RM{c.amount}</span>
                    <span className="text-sm text-gray-400">for RM{c.price}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Expires: {new Date(c.expiryDate).toLocaleDateString()}</p>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Edit size={14} className="inline mr-1" /> Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(c)}><Trash2 size={14} /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        title="Delete Coupon"
        message="Permanently delete this coupon? This action cannot be undone."
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        processingLabel="Deleting..."
        isLoading={deleteMutation.isPending}
        confirmVariant="danger"
        details={deleteTarget ? [
          { label: 'Coupon', value: deleteTarget.name },
          { label: 'Credit Amount', value: `RM${deleteTarget.amount}` },
          { label: 'Price', value: `RM${deleteTarget.price}` },
        ] : []}
      />
    </div>
  );
}
