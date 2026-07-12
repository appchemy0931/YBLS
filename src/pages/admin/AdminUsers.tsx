import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Ban, Check, Trash2, Edit, X, Users as UsersIcon, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api';
import { Spinner, Badge, EmptyState, Button } from '../../components/ui';
import ConfirmModal from '../../components/ConfirmModal';
import { sanitizeAmount } from '../../utils/format';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'customer', walletBalance: '', walletBonus: '', isActive: true });
  const [password, setPassword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminAPI.getUsers().then((r) => r.data),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; [key: string]: unknown }) => adminAPI.updateUser(id, payload),
    onSuccess: () => { toast.success('User updated'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); resetForm(); },
    onError: (err: Error) => toast.error(err.message),
  });

  const changePassword = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) => adminAPI.changeUserPassword(id, { newPassword }),
    onSuccess: () => { toast.success('Password updated successfully'); setPassword(''); },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminAPI.updateUser(id, { isActive }),
    onSuccess: () => { toast.success('User updated'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => adminAPI.deleteUser(id),
    onSuccess: () => { toast.success('User deleted'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); setDeleteTarget(null); },
    onError: (err: Error) => toast.error(err.message),
  });

  const users = (data?.users || []).filter((u: any) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => { setShowForm(false); setEditing(null); setForm({ name: '', email: '', phone: '', role: 'customer', walletBalance: '', walletBonus: '', isActive: true }); setPassword(''); };

  const openEdit = (u: any) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, phone: u.phone || '', role: u.role, walletBalance: u.walletBalance != null ? String(u.walletBalance) : '', walletBonus: u.walletBonus != null ? String(u.walletBonus) : '', isActive: u.isActive });
    setShowForm(true);
  };

  const editingId = editing?._id;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;
    updateUser.mutate({ id: editingId, ...form, walletBalance: Number(form.walletBalance) || 0, walletBonus: Number(form.walletBonus) || 0 });
  };

  const handleChangePassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!editingId || password.length < 6) return;
    changePassword.mutate({ id: editingId, newPassword: password });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Users Management</h1>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-rose-deep w-64" />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit User</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Name</label>
                <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Phone</label>
                <input type="text" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep">
                    <option value="customer">customer</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Wallet Balance (RM)</label>
                  <input type="text" inputMode="decimal" placeholder="0.00" value={form.walletBalance} onChange={(e) => setForm({ ...form, walletBalance: sanitizeAmount(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Wallet Bonus (RM)</label>
                <input type="text" inputMode="decimal" placeholder="0.00" value={form.walletBonus} onChange={(e) => setForm({ ...form, walletBonus: sanitizeAmount(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-rose-deep focus:ring-rose-deep" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <div className="border-t border-gray-100 pt-3">
                <label className="text-xs text-gray-500 flex items-center gap-1.5"><KeyRound size={12} /> Change Login Password</label>
                <div className="flex gap-2 mt-1">
                  <input type="password" placeholder="New password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-rose-deep" />
                  <Button type="button" variant="outline" onClick={handleChangePassword} disabled={changePassword.isPending || password.length < 6}>
                    {changePassword.isPending ? 'Updating...' : 'Change'}
                  </Button>
                </div>
              </div>
              <Button type="submit" disabled={updateUser.isPending} className="w-full">
                {updateUser.isPending ? 'Saving...' : 'Update User'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {isLoading ? <Spinner className="py-20" /> : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" message="No users match your search." />
      ) : (
        <div className="bg-white rounded-2xl card-shadow overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Wallet</th>
                <th className="px-4 py-3 font-medium">Bonus</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u: any) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-linear-to-br from-rose-deep to-gold-400 flex items-center justify-center text-white text-sm font-medium">{u.name.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.phone}</td>
                  <td className="px-4 py-3"><Badge variant={u.role === 'admin' ? 'blue' : 'default'}>{u.role}</Badge></td>
                  <td className="px-4 py-3 font-medium text-gray-700">RM{(u.walletBalance ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 font-medium text-amber-600">RM{(u.walletBonus ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Banned'}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(u)} title="Edit" className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => toggleActive.mutate({ id: u._id, isActive: !u.isActive })} title={u.isActive ? 'Ban' : 'Activate'}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${u.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}>
                        {u.isActive ? <Ban size={16} /> : <Check size={16} />}
                      </button>
                      {u.role !== 'admin' && (
                        <button onClick={() => setDeleteTarget(u)} title="Delete" className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50">
                          <Trash2 size={16} />
                        </button>
                      )}
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
        onConfirm={() => deleteTarget && deleteUser.mutate(deleteTarget._id)}
        title="Delete User"
        message="Permanently delete this user account? This action cannot be undone."
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        processingLabel="Deleting..."
        isLoading={deleteUser.isPending}
        confirmVariant="danger"
        details={deleteTarget ? [
          { label: 'Name', value: deleteTarget.name },
          { label: 'Email', value: deleteTarget.email },
          { label: 'Role', value: deleteTarget.role },
        ] : []}
      />
    </div>
  );
}
