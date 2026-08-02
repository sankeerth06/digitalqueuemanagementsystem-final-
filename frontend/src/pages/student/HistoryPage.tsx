import { Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMyHistory } from '../../hooks/useQueue';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatTime } from '../../utils/format';
import { History } from 'lucide-react';
import { TokenStatus } from '../../types';

const statusTone: Record<TokenStatus, 'mint' | 'coral' | 'amber' | 'neutral' | 'violet'> = {
  completed: 'mint',
  cancelled: 'coral',
  skipped: 'coral',
  waiting: 'amber',
  preparing: 'violet',
  ready: 'violet',
};

export function HistoryPage() {
  const { data: tokens, isLoading } = useMyHistory();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Order history</h1>
      <p className="mt-1 text-sm text-ink-600/60 dark:text-white/50">Every token you've booked at the canteen.</p>

      <div className="mt-6 space-y-3">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}

        {!isLoading && !tokens?.length && (
          <EmptyState icon={History} title="No orders yet" description="Once you book a token, it will show up here." />
        )}

        {tokens?.map((t) => (
          <div key={t._id} className="card-surface flex items-center justify-between p-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">{t.tokenCode}</span>
                <Badge tone={statusTone[t.status]}>{t.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-600/60 dark:text-white/50">
                {t.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
              </p>
              <p className="mt-0.5 text-xs text-ink-600/40 dark:text-white/30">{formatTime(t.createdAt)}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold">{formatCurrency(t.totalAmount)}</span>
              <button
                onClick={() => navigate('/student/order')}
                title="Reorder"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10 hover:bg-violet-500/10 hover:text-violet-500"
              >
                <Repeat className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
