import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Package, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { productAPI, uploadAPI } from '../../api';
import { Spinner, Button, Badge, EmptyState } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal';
import { sanitizeAmount, sanitizeInteger } from '../../utils/format';
import type { Product } from '../../types';

const CATEGORIES = ['Skincare', 'Beauty Product', 'Treatment Product'];

export default function AdminProducts() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', image: '', category: CATEGORIES[0], status: 'active' });
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const editingId = editing?._id;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: () => productAPI.getAll().then((r) => r.data) });

  const createMutation = useMutation({
    mutationFn: () => productAPI.create({ ...form, price: Number(form.price) || 0, stock: Number(form.stock) || 0 } as any),
    onSuccess: () => { toast.success('Product created'); queryClient.invalidateQueries({ queryKey: ['admin-products'] }); resetForm(); },
    onError: (err: Error) => toast.error(err.message),
  });
  const updateMutation = useMutation({
    mutationFn: () => productAPI.update(editingId!, { ...form, price: Number(form.price) || 0, stock: Number(form.stock) || 0 } as any),
    onSuccess: () => { toast.success('Product updated'); queryClient.invalidateQueries({ queryKey: ['admin-products'] }); resetForm(); },
    onError: (err: Error) => toast.error(err.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productAPI.delete(id),
    onSuccess: () => { toast.success('Product deleted'); queryClient.invalidateQueries({ queryKey: ['admin-products'] }); setDeleteTarget(null); },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetForm = () => { setShowForm(false); setEditing(null); setForm({ name: '', description: '', price: '', stock: '', image: '', category: CATEGORIES[0], status: 'active' }); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, price: p.price != null ? String(p.price) : '', stock: p.stock != null ? String(p.stock) : '', image: p.image, category: p.category, status: p.status });
    setShowForm(true);
  };
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
  const products = data?.products || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products Management</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus size={18} className="inline mr-1" /> Add Product</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep resize-none" />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Price (RM)</label>
                  <input type="text" inputMode="decimal" placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: sanitizeAmount(e.target.value) })} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Stock</label>
                  <input type="text" inputMode="numeric" placeholder="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: sanitizeInteger(e.target.value) })} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
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
                {editing ? 'Update Product' : 'Create Product'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {isLoading ? <Spinner className="py-20" /> : products.length === 0 ? (
        <EmptyState icon={Package} title="No products" message="Add your first beauty product." />
      ) : (
        <div className="bg-white rounded-2xl card-shadow overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-medium text-gray-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category}</td>
                  <td className="px-4 py-3 font-medium text-rose-deep">RM{p.price}</td>
                  <td className="px-4 py-3"><span className={p.stock < 10 ? 'text-red-500 font-medium' : 'text-gray-600'}>{p.stock}</span></td>
                  <td className="px-4 py-3"><Badge variant={p.status === 'active' ? 'success' : 'danger'}>{p.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100"><Edit size={16} /></button>
                      <button onClick={() => setDeleteTarget(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        title="Delete Product"
        message="Permanently delete this product? This action cannot be undone."
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        processingLabel="Deleting..."
        isLoading={deleteMutation.isPending}
        confirmVariant="danger"
        details={deleteTarget ? [
          { label: 'Product', value: deleteTarget.name },
          { label: 'Category', value: deleteTarget.category },
          { label: 'Price', value: `RM${deleteTarget.price}` },
        ] : []}
      />
    </div>
  );
}
