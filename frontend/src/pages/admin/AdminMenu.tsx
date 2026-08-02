import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';
import { api, extractErrorMessage } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/format';
import { MenuCategory, MenuItem } from '../../types';

const categories: MenuCategory[] = ['Breakfast', 'Meals', 'Snacks', 'Beverages', 'Combos'];

interface FormState {
  name: string;
  description: string;
  category: MenuCategory;
  price: string;
  prepTimeMinutes: string;
  stock: string;
  imageUrl: string;
  isAvailable: boolean;
}

const emptyForm: FormState = {
  name: '', description: '', category: 'Meals', price: '', prepTimeMinutes: '5', stock: '50', imageUrl: '', isAvailable: true,
};

export function AdminMenu() {
  const { data: items, isLoading } = useMenu();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description || '',
      category: item.category,
      price: String(item.price),
      prepTimeMinutes: String(item.prepTimeMinutes),
      stock: String(item.stock),
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      prepTimeMinutes: Number(form.prepTimeMinutes),
      stock: Number(form.stock),
      imageUrl: form.imageUrl || undefined,
      isAvailable: form.isAvailable,
    };
    try {
      if (editing) {
        await api.patch(`/menu/${editing._id}`, payload);
        toast.success('Item updated');
      } else {
        await api.post('/menu', payload);
        toast.success('Item added to menu');
      }
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      setModalOpen(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this menu item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      toast.success('Item removed');
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu management</h1>
          <p className="mt-1 text-sm text-ink-600/60 dark:text-white/50">Add, edit, and price canteen items.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add item</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.02] dark:bg-white/5 text-left text-xs uppercase tracking-wide text-ink-600/60 dark:text-white/40">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {!isLoading && items?.map((item) => (
              <tr key={item._id}>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">{item.category}</td>
                <td className="px-4 py-3">{formatCurrency(item.price)}</td>
                <td className="px-4 py-3">{item.stock}</td>
                <td className="px-4 py-3">
                  <Badge tone={item.isAvailable ? 'mint' : 'coral'}>{item.isAvailable ? 'Available' : 'Unavailable'}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(item._id)} className="rounded-lg p-1.5 text-coral-500 hover:bg-coral-500/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit item' : 'Add menu item'}>
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div>
            <label className="label-text">Category</label>
            <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as MenuCategory })}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Price (₹)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input label="Prep (min)" type="number" value={form.prepTimeMinutes} onChange={(e) => setForm({ ...form, prepTimeMinutes: e.target.value })} />
            <Input label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <Input label="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />
            Available for ordering
          </label>
          <Button className="w-full" onClick={handleSave} loading={saving}>{editing ? 'Save changes' : 'Add item'}</Button>
        </div>
      </Modal>
    </div>
  );
}
