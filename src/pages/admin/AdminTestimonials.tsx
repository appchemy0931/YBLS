import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, MessageSquare, Upload, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { testimonialAPI, uploadAPI } from '../../api';
import { Spinner, Badge, EmptyState } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal';
import { imageUrl } from '../../utils/image';
import type { Testimonial } from '../../types';

export default function AdminTestimonials() {
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: () => testimonialAPI.getAllAdmin().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (image: string) => testimonialAPI.create({ image, status: 'active' }),
    onSuccess: () => { toast.success('Testimonial added'); queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] }); },
    onError: (err: Error) => toast.error(err.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => testimonialAPI.delete(id),
    onSuccess: () => { toast.success('Testimonial deleted'); queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] }); setDeleteTarget(null); },
    onError: (err: Error) => toast.error(err.message),
  });
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) => testimonialAPI.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] }),
    onError: (err: Error) => toast.error(err.message),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const { data } = await uploadAPI.uploadImage(file);
      await createMutation.mutateAsync(data.image);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const testimonials = data?.testimonials || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Testimonials Management</h1>
        <label className={`inline-flex items-center gap-2 bg-linear-to-r from-rose-deep to-rose-medium text-white px-5 py-2.5 rounded-full font-medium cursor-pointer hover:shadow-xl transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Upload size={18} />
          {uploading ? 'Uploading...' : 'Upload Image'}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {isLoading ? <Spinner className="py-20" /> : testimonials.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No testimonials" message="Upload your first testimonial image." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {testimonials.map((t) => (
            <div key={t._id} className="bg-white rounded-2xl overflow-hidden card-shadow group">
              <div className="relative">
                <img src={imageUrl(t.image)} alt="Testimonial" className="w-full h-48 object-cover" />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleStatusMutation.mutate({ id: t._id, status: t.status === 'active' ? 'inactive' : 'active' })}
                    className="w-8 h-8 rounded-lg bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                    title={t.status === 'active' ? 'Hide' : 'Show'}
                  >
                    <ImageIcon size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(t)}
                    className="w-8 h-8 rounded-lg bg-black/50 text-red-400 flex items-center justify-center hover:bg-black/70"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''}</span>
                <Badge variant={t.status === 'active' ? 'success' : 'danger'}>{t.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        title="Delete Testimonial"
        message="Permanently delete this testimonial image? This action cannot be undone."
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        processingLabel="Deleting..."
        isLoading={deleteMutation.isPending}
        confirmVariant="danger"
      />
    </div>
  );
}
