import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, ShieldCheck, ShieldOff } from 'lucide-react';
import { api, extractErrorMessage } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { User, UserRole } from '../../types';
import { initials } from '../../utils/format';

export function AdminUsers() {
  const [tab, setTab] = useState<'student' | 'staff' | 'admin'>('student');
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' as UserRole, counterAssigned: '1' });

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', tab],
    queryFn: async () => (await api.get('/users', { params: { role: tab } })).data.data.users as User[],
  });

  const toggleActive = async (user: User) => {
    try {
      await api.patch(`/users/${user._id}`, { isActive: !user.isActive });
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.post('/users/staff', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        counterAssigned: form.role === 'staff' ? Number(form.counterAssigned) : undefined,
      });
      toast.success('Account created');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setModalOpen(false);
      setForm({ name: '', email: '', password: '', role: 'staff', counterAssigned: '1' });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">People</h1>
          <p className="mt-1 text-sm text-ink-600/60 dark:text-white/50">Manage students, staff, and admins.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Add staff / admin</Button>
      </div>

      <div className="flex gap-2">
        {(['student', 'staff', 'admin'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setTab(r)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
              tab === r ? 'bg-violet-500 text-white' : 'bg-black/5 dark:bg-white/10 text-ink-700 dark:text-white/70'
            }`}
          >
            {r}s
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {!isLoading && users?.map((u) => (
          <div key={u._id} className="card-surface flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-sm font-bold text-violet-600 dark:text-violet-400">
                {initials(u.name)}
              </div>
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-ink-600/60 dark:text-white/50">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {u.counterAssigned && <Badge tone="violet">Counter {u.counterAssigned}</Badge>}
              <Badge tone={u.isActive ? 'mint' : 'coral'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
              <button
                onClick={() => toggleActive(u)}
                className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10"
                title={u.isActive ? 'Deactivate' : 'Activate'}
              >
                {u.isActive ? <ShieldOff className="h-4 w-4 text-coral-500" /> : <ShieldCheck className="h-4 w-4 text-mint-500" />}
              </button>
            </div>
          </div>
        ))}
        {!isLoading && !users?.length && (
          <p className="py-8 text-center text-sm text-ink-600/50 dark:text-white/40">No {tab}s found.</p>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add staff or admin">
        <div className="space-y-3">
          <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <div>
            <label className="label-text">Role</label>
            <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {form.role === 'staff' && (
            <Input label="Counter assigned" type="number" value={form.counterAssigned} onChange={(e) => setForm({ ...form, counterAssigned: e.target.value })} />
          )}
          <Button className="w-full" onClick={handleCreate} loading={saving}>Create account</Button>
        </div>
      </Modal>
    </div>
  );
}
