import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, extractErrorMessage } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SystemSettings } from '../../types';

export function AdminSettings() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data.data.settings as SystemSettings,
  });

  const [totalCounters, setTotalCounters] = useState('2');
  const [buffer, setBuffer] = useState('1');
  const [announcement, setAnnouncement] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setTotalCounters(String(settings.totalCounters));
      setBuffer(String(settings.averagePrepBufferMinutes));
      setAnnouncement(settings.announcement || '');
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/settings', {
        totalCounters: Number(totalCounters),
        averagePrepBufferMinutes: Number(buffer),
        announcement,
      });
      toast.success('Settings updated');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System settings</h1>
        <p className="mt-1 text-sm text-ink-600/60 dark:text-white/50">Configure counters, wait-time buffers, and announcements.</p>
      </div>

      <div className="card-surface space-y-4 p-6">
        <Input label="Total counters" type="number" min={1} value={totalCounters} onChange={(e) => setTotalCounters(e.target.value)} />
        <Input
          label="Average buffer per order (minutes)"
          type="number"
          min={0}
          value={buffer}
          onChange={(e) => setBuffer(e.target.value)}
        />
        <div>
          <label className="label-text">Announcement banner</label>
          <textarea
            className="input-field min-h-24"
            placeholder="e.g. Canteen closes early today at 4 PM"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
          />
        </div>
        <Button onClick={handleSave} loading={saving}>Save settings</Button>
      </div>

      {settings?.queuePaused && (
        <div className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400">
          The queue is currently paused by staff: {settings.pauseReason}
        </div>
      )}
    </div>
  );
}
