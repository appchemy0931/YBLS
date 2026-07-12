import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Package, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { productAPI, uploadAPI } from '../../api';
import { Spinner, Button, Badge, EmptyState } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal';
import { sanitizeAmount, sanitizeInteger } from '../../utils/format';
import { imageUrl } from '../../utils/image';
import type { Product, WeightVariant } from '../../types';

const CATEGORIES = ['Skincare', 'Beauty Product', 'Treatment Product'];

type WeightForm = { label: string; stock: string; price: string };

const toWeightForms = (weights?: WeightVariant[]): WeightForm[] =>
  !weights || weights.length === 0
    ? []
    : weights.map((w) => ({ label: w.label, stock: String(w.stock ?? ''), price: String(w.price ?? '') }));

const toWeightVariants = (weights: WeightForm[]): WeightVariant[] =>
  weights
    .filter((w) => w.label.trim() !== '' && (w.stock !== '' || w.price !== ''))
    .map((w) => ({ label: w.label.trim(), stock: Number(w.stock) || 0, price: Number(w.price) || 0 }));

export default function AdminProducts() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', image: '', category: CATEGORIES[0], status: 'active', weights: [] as WeightForm[] });
  const [uploading, setUploading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: () => productAPI.getAllAdmin().then((r) => r.data) });

  const fillForm = (p: Product) => {
    setForm({
      name: p.name,
      description: p.description,
      price: p.price != null ? String(p.price) : '',
      stock: p.stock != null ? String(p.stock) : '',
      image: p.image,
      category: p.category,
      status: p.status,
      weights: toWeightForms(p.weights),
    });
  };

  const createMutation = useMutation({
    mutationFn: (payload?: Record<string, unknown>) => productAPI.create((payload ?? { ...form, price: Number(form.price) || 0, stock: Number(form.stock) || 0, weights: toWeightVariants(form.weights) }) as any),
    onSuccess: () => { toast.success('Product created'); queryClient.invalidateQueries({ queryKey: ['admin-products'] }); resetForm(); },
    onError: (err: Error) => toast.error(err.message),
  });
  const updateMutation = useMutation({
    mutationFn: (payload?: Record<string, unknown>) => productAPI.update(editingId!, (payload ?? { ...form, price: Number(form.price) || 0, stock: Number(form.stock) || 0, weights: toWeightVariants(form.weights) }) as any),
    onSuccess: () => { toast.success('Product updated'); queryClient.invalidateQueries({ queryKey: ['admin-products'] }); resetForm(); },
    onError: (err: Error) => toast.error(err.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productAPI.delete(id),
    onSuccess: () => { toast.success('Product deleted'); queryClient.invalidateQueries({ queryKey: ['admin-products'] }); setDeleteTarget(null); },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetForm = () => { setShowForm(false); setEditingId(null); setForm({ name: '', description: '', price: '', stock: '', image: '', category: CATEGORIES[0], status: 'active', weights: [] }); };
  const openEdit = async (p: Product) => {
    setEditingId(p._id);
    fillForm(p);
    setShowForm(true);
    try {
      setEditLoading(true);
      const { data } = await productAPI.getById(p._id);
      fillForm(data.product);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch latest product data');
    } finally {
      setEditLoading(false);
    }
  };

  const hasEnabledWeights = form.weights.some((w) => w.label.trim() !== '' && (w.stock !== '' || w.price !== ''));

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (hasEnabledWeights && !form.price) {
      const variantStockTotal = form.weights
        .filter((w) => w.label.trim() !== '')
        .reduce((sum, w) => sum + (Number(w.stock) || 0), 0);
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || variantStockTotal,
        weights: toWeightVariants(form.weights),
      };
      editingId ? updateMutation.mutate(payload as any) : createMutation.mutate(payload as any);
    } else {
      editingId ? updateMutation.mutate(undefined) : createMutation.mutate(undefined);
    }
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
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {editLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm"><Spinner /></div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep resize-none" />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Price (RM) {hasEnabledWeights && <span className="text-gray-400">(optional)</span>}</label>
                  <input type="text" inputMode="decimal" placeholder={hasEnabledWeights ? '0 (uses variant prices)' : '0.00'} value={form.price} onChange={(e) => setForm({ ...form, price: sanitizeAmount(e.target.value) })} required={!hasEnabledWeights} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Stock {hasEnabledWeights && <span className="text-gray-400">(optional)</span>}</label>
                  <input type="text" inputMode="numeric" placeholder={hasEnabledWeights ? '0 (auto from variants)' : '0'} value={form.stock} onChange={(e) => setForm({ ...form, stock: sanitizeInteger(e.target.value) })} required={!hasEnabledWeights} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Weight Variants — add custom variants (leave empty for default)</label>
                <p className="text-xs text-gray-400 mb-2">e.g. add 13g at RM108 and 10g at RM318. Customers can then choose which variant to purchase.</p>
                <div className="space-y-2">
                  {form.weights.map((w, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center p-1.5 rounded-lg bg-rose-soft/30">
                      <input
                        type="text"
                        placeholder="e.g. 13g"
                        value={w.label}
                        onChange={(e) => {
                          const weights = [...form.weights];
                          weights[i] = { ...weights[i], label: e.target.value };
                          setForm({ ...form, weights });
                        }}
                        className="col-span-3 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep text-sm"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Stock Qty"
                        value={w.stock}
                        onChange={(e) => {
                          const weights = [...form.weights];
                          weights[i] = { ...weights[i], stock: sanitizeInteger(e.target.value) };
                          setForm({ ...form, weights });
                        }}
                        className="col-span-3 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep text-sm"
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Price (RM)"
                        value={w.price}
                        onChange={(e) => {
                          const weights = [...form.weights];
                          weights[i] = { ...weights[i], price: sanitizeAmount(e.target.value) };
                          setForm({ ...form, weights });
                        }}
                        className="col-span-5 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const weights = form.weights.filter((_, idx) => idx !== i);
                          setForm({ ...form, weights });
                        }}
                        className="col-span-1 w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, weights: [...form.weights, { label: '', stock: '', price: '' }] })}
                  className="mt-2 flex items-center gap-1 text-sm text-rose-deep hover:underline"
                >
                  <Plus size={14} /> Add Variant
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-500">Image</label>
                {form.image && (
                  <div className="relative mt-1 mb-2">
                    <img src={imageUrl(form.image)} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
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
                {editingId ? 'Update Product' : 'Create Product'}
              </Button>
            </form>
            )}
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
                <th className="px-4 py-3 font-medium">Variants</th>
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
                      <img src={imageUrl(p.image)} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-medium text-gray-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category}</td>
                  <td className="px-4 py-3 font-medium text-rose-deep">{p.weights && p.weights.length > 0 && p.price === 0 ? <span className="text-gray-400">—</span> : `RM${p.price}`}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.weights && p.weights.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.weights.map((w, i) => (
                          <span key={i} className="inline-block text-xs bg-blush-50 text-gray-700 px-2 py-0.5 rounded-full">
                            {w.label} · RM{w.price} · Stock: {w.stock}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Default</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{p.weights && p.weights.length > 0 && p.stock === 0 ? <span className="text-gray-400">—</span> : <span className={p.stock < 10 ? 'text-red-500 font-medium' : 'text-gray-600'}>{p.stock}</span>}</td>
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
          ...(deleteTarget.weights && deleteTarget.weights.length > 0 && deleteTarget.price === 0
            ? []
            : [{ label: 'Price', value: `RM${deleteTarget.price}` }]),
        ] : []}
      />
    </div>
  );
}
