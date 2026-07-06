import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Scissors, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { serviceAPI, uploadAPI } from '../../api';
import { Spinner, Button, Badge, EmptyState } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal';
import { sanitizeAmount } from '../../utils/format';
import type { Service } from '../../types';

const CATEGORIES = ['Facial Wash', 'Facial Treatment', 'Therapy Massage', 'Body Treatment', 'Skin Care', 'Beauty Package'];

export default function AdminServices() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: '', category: CATEGORIES[0], description: '', duration: 60, price: '', image: '', status: 'active' });
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const editingId = editing?._id;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['admin-services'], queryFn: () => serviceAPI.getAll().then((r) => r.data) });

  const createMutation = useMutation({
    mutationFn: () => serviceAPI.create({ ...form, price: Number(form.price) || 0 } as any),
    onSuccess: () => { toast.success('Service created'); queryClient.invalidateQueries({ queryKey: ['admin-services'] }); resetForm(); },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => serviceAPI.update(editingId!, { ...form, price: Number(form.price) || 0 } as any),
    onSuccess: () => { toast.success('Service updated'); queryClient.invalidateQueries({ queryKey: ['admin-services'] }); resetForm(); },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceAPI.delete(id),
    onSuccess: () => { toast.success('Service deleted'); queryClient.invalidateQueries({ queryKey: ['admin-services'] }); setDeleteTarget(null); },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetForm = () => { setShowForm(false); setEditing(null); setForm({ name: '', category: CATEGORIES[0], description: '', duration: 60, price: '', image: '', status: 'active' }); };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({ name: s.name, category: s.category, description: s.description, duration: s.duration, price: s.price != null ? String(s.price) : '', image: s.image, status: s.status });
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

  const services = data?.services || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Services Management</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus size={18} className="inline mr-1" /> Add Service</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Service' : 'Add Service'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Service Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Duration (min)</label>
                  <input type="text" inputMode="numeric" placeholder="0" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Price (RM)</label>
                  <input type="text" inputMode="decimal" placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: sanitizeAmount(e.target.value) })} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
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
                {editing ? 'Update Service' : 'Create Service'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {isLoading ? <Spinner className="py-20" /> : services.length === 0 ? (
        <EmptyState icon={Scissors} title="No services" message="Add your first beauty service." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s._id} className="bg-white rounded-2xl overflow-hidden card-shadow">
              <img src={s.image} alt={s.name} className="w-full h-32 object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-800">{s.name}</h3>
                  <Badge variant={s.status === 'active' ? 'success' : 'danger'}>{s.status}</Badge>
                </div>
                <p className="text-xs text-gray-400 mb-2">{s.category}{s.duration ? ` · ${s.duration}min` : ''}</p>
                <p className="text-lg font-bold text-rose-deep mb-3">RM{s.price}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(s)}><Edit size={14} className="inline mr-1" /> Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteTarget(s)}><Trash2 size={14} /></Button>
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
        title="Delete Service"
        message="Permanently delete this service? This action cannot be undone."
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        processingLabel="Deleting..."
        isLoading={deleteMutation.isPending}
        confirmVariant="danger"
        details={deleteTarget ? [
          { label: 'Service', value: deleteTarget.name },
          { label: 'Category', value: deleteTarget.category },
          { label: 'Price', value: `RM${deleteTarget.price}` },
        ] : []}
      />
    </div>
  );
}
