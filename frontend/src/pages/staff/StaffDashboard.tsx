import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, PauseCircle, PlayCircle, RotateCcw, SkipForward, Users } from 'lucide-react';
import { useCallNext, useCompleteToken, useLiveQueue, useMarkReady, useRecallToken, useSkipToken, useSkippedTokens } from '../../hooks/useQueue';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { SystemSettings } from '../../types';

export function StaffDashboard() {
  const { data: queue, isLoading } = useLiveQueue();
  const callNext = useCallNext();
  const markReady = useMarkReady();
  const complete = useCompleteToken();
  const skip = useSkipToken();
  const recall = useRecallToken();
  const [counter, setCounter] = useState(1);
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data.data.settings as SystemSettings,
  });

const waiting = queue?.filter((t) => t.status === 'waiting') ?? [];
const preparing = queue?.filter((t) => t.status === 'preparing') ?? [];
const ready = queue?.filter((t) => t.status === 'ready') ?? [];

  const togglePause = async () => {
    if (settings?.queuePaused) await api.post('/settings/resume');
    else await api.post('/settings/pause', { reason: 'Staff paused the queue' });
    queryClient.invalidateQueries({ queryKey: ['settings'] });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Live queue</h1>
          <p className="mt-1 text-sm text-ink-600/60 dark:text-white/50">Manage counters and move the queue forward.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            Counter
            <select value={counter} onChange={(e) => setCounter(Number(e.target.value))} className="input-field w-20 py-1.5">
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <Button onClick={() => callNext.mutate(counter)} loading={callNext.isPending} disabled={!waiting.length || settings?.queuePaused}>
            Call next
          </Button>
          <Button variant={settings?.queuePaused ? 'primary' : 'secondary'} onClick={togglePause}>
            {settings?.queuePaused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
            {settings?.queuePaused ? 'Resume queue' : 'Pause queue'}
          </Button>
        </div>
      </div>

      {settings?.queuePaused && (
        <div className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400">
          Queue paused: {settings.pauseReason}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-600/70 dark:text-white/50">
            <Users className="h-4 w-4" /> Waiting ({waiting.length})
          </h2>
          {isLoading && <Skeleton className="h-24 rounded-2xl" />}
          {!isLoading && !waiting.length && (
            <EmptyState icon={Users} title="Nobody waiting" description="New tokens will appear here as students book them." />
          )}
          <div className="space-y-2">
            {waiting.map((t, idx) => (
              <motion.div key={t._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="card-surface flex items-center justify-between p-4">
                <div>
                  <span className="font-mono font-semibold">{t.tokenCode}</span>
                  {idx === 0 && <Badge tone="violet" className="ml-2">Next</Badge>}
                  <p className="text-xs text-ink-600/60 dark:text-white/50">{t.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => skip.mutate(t._id)}>
                  <SkipForward className="h-3.5 w-3.5" /> Skip
                </Button>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink-600/70 dark:text-white/50">Preparing ({preparing.length})</h2>
          {!preparing.length && (
            <EmptyState icon={CheckCircle2} title="Nothing in preparation" description="Call the next token to start preparing an order." />
          )}
          <div className="space-y-2">
            {preparing.map((t) => (
              <motion.div key={t._id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="card-surface flex items-center justify-between p-4">
                <div>
                  <span className="font-mono font-semibold">{t.tokenCode}</span>
                  <Badge tone="amber" className="ml-2">Counter {t.counter}</Badge>
                  <p className="text-xs text-ink-600/60 dark:text-white/50">{t.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => markReady.mutate(t._id)}>Ready</Button>
                  <Button size="sm" onClick={() => complete.mutate(t._id)}>Complete</Button>
                </div>
              </motion.div>
            ))}
            <section>
  <h2 className="mb-3 text-sm font-semibold text-ink-600/70 dark:text-white/50">
    Ready for pickup ({ready.length})
  </h2>

  {!ready.length && (
    <EmptyState
      icon={CheckCircle2}
      title="No orders ready"
      description="Orders marked ready will appear here."
    />
  )}

  <div className="space-y-2">
    {ready.map((t) => (
      <motion.div
        key={t._id}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        className="card-surface flex items-center justify-between p-4"
      >
        <div>
          <span className="font-mono font-semibold">{t.tokenCode}</span>

          <Badge tone="coral" className="ml-2">
            Ready for pickup
          </Badge>

          <p className="text-xs text-ink-600/60 dark:text-white/50">
            {t.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => complete.mutate(t._id)}
          loading={complete.isPending}
        >
          Complete
        </Button>
      </motion.div>
    ))}
  </div>
</section>
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-600/70 dark:text-white/50">
          <RotateCcw className="h-4 w-4" /> Skipped tokens
        </h2>
        <SkippedList onRecall={(id) => recall.mutate(id)} />
      </section>
    </div>
  );
}

function SkippedList({ onRecall }: { onRecall: (id: string) => void }) {
  const { data: skipped } = useSkippedTokens();
  if (!skipped?.length) {
    return <p className="text-sm text-ink-600/50 dark:text-white/40">No skipped tokens right now.</p>;
  }
  return (
    <div className="space-y-2">
      {skipped.map((t) => (
        <div key={t._id} className="card-surface flex items-center justify-between p-4">
          <span className="font-mono font-semibold">{t.tokenCode}</span>
          <Button size="sm" variant="secondary" onClick={() => onRecall(t._id)}>Recall</Button>
        </div>
      ))}
    </div>
  );
}
