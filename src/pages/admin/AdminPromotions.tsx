import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Tag, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { promotionAPI, uploadAPI } from '../../api';
import { Spinner, Button, Badge, EmptyState, PromotionIndicator } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal';
import { sanitizeAmount } from '../../utils/format';
import type { Promotion } from '../../types';

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '');

export default function AdminPromotions() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState({ title: '', description: '', image: '', discount: '', originalPrice: '', startDate: '', endDate: '', status: 'active' });
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const editingId = editing?._id;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['admin-promotions'], queryFn: () => promotionAPI.getAll().then((r) => r.data) });

  const createMutation = useMutation({
    mutationFn: () => promotionAPI.create({ ...form, discount: Number(form.discount) || 0, originalPrice: Number(form.originalPrice) || 0 } as any),
    onSuccess: () => { toast.success('Promotion created'); queryClient.invalidateQueries({ queryKey: ['admin-promotions'] }); resetForm(); },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => promotionAPI.update(editingId!, { ...form, discount: Number(form.discount) || 0, originalPrice: Number(form.originalPrice) || 0 } as any),
    onSuccess: () => { toast.success('Promotion updated'); queryClient.invalidateQueries({ queryKey: ['admin-promotions'] }); resetForm(); },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => promotionAPI.delete(id),
    onSuccess: () => { toast.success('Promotion deleted'); queryClient.invalidateQueries({ queryKey: ['admin-promotions'] }); setDeleteTarget(null); },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetForm = () => { setShowForm(false); setEditing(null); setForm({ title: '', description: '', image: '', discount: '', originalPrice: '', startDate: '', endDate: '', status: 'active' }); };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    setForm({ title: p.title, description: p.description, image: p.image, discount: p.discount != null ? String(p.discount) : '', originalPrice: p.originalPrice != null ? String(p.originalPrice) : '', startDate: p.startDate ? p.startDate.slice(0, 10) : '', endDate: p.endDate ? p.endDate.slice(0, 10) : '', status: p.status });
    setShowForm(true);
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    editing ? updateMutation.mutate() : createMutation.mutate();
  };

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

  const promotions = data?.promotions || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Promotions Management</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus size={18} className="inline mr-1" /> Add Promotion</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{editing ? 'Edit Promotion' : 'Add Promotion'}</h2>
                <PromotionIndicator />
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Promotion Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Discount (%)</label>
                  <input type="text" inputMode="numeric" placeholder="0" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '') })} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Original Price (RM)</label>
                  <input type="text" inputMode="decimal" placeholder="0.00" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: sanitizeAmount(e.target.value) })} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Image</label>
                {form.image && (
                  <div className="relative mt-1 mb-2">
                    <img src={form.image} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                    <button type="button" onClick={() => setForm({ ...form, image: '' })} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                      <X size={14} />
                    </button>
                  </div>
                )}
                <label className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:border-rose-deep transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Upload size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : form.image ? 'Change Image' : 'Upload Image'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="w-full">
                {editing ? 'Update Promotion' : 'Create Promotion'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {isLoading ? <Spinner className="py-20" /> : promotions.length === 0 ? (
        <EmptyState icon={Tag} title="No promotions" message="Add your first promotion." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((p) => (
            <div key={p._id} className="bg-white rounded-2xl overflow-hidden card-shadow">
              <img src={p.image} alt={p.title} className="w-full h-32 object-cover" />
              <div className="p-4">
                <div className="mb-2"><PromotionIndicator /></div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-800">{p.title}</h3>
                  <Badge variant={p.status === 'active' ? 'success' : 'danger'}>{p.status}</Badge>
                </div>
                <p className="text-xs text-gray-400 mb-1">{p.discount > 0 ? `${p.discount}% off · ` : ''}RM{p.originalPrice}</p>
                <p className="text-xs text-gray-400 mb-3">{formatDate(p.startDate)} - {formatDate(p.endDate)}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Edit size={14} className="inline mr-1" /> Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteTarget(p)}><Trash2 size={14} /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        title="Delete Promotion"
        message="Permanently delete this promotion? This action cannot be undone."
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        processingLabel="Deleting..."
        isLoading={deleteMutation.isPending}
        confirmVariant="danger"
        details={deleteTarget ? [
          { label: 'Promotion', value: deleteTarget.title },
          { label: 'Discount', value: deleteTarget.discount > 0 ? `${deleteTarget.discount}% off` : '—' },
          { label: 'Original Price', value: `RM${deleteTarget.originalPrice}` },
        ] : []}
      />
    </div>
  );
}
