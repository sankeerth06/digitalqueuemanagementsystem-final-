import { Link } from 'react-router-dom';
import { UtensilsCrossed, History as HistoryIcon, Search } from 'lucide-react';
import { useState } from 'react';
import { TokenCard } from '../../components/queue/TokenCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCancelToken, useMyActiveToken, useMyHistory, useSearchToken } from '../../hooks/useQueue';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, formatTime } from '../../utils/format';

export function StudentDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useMyActiveToken();
  const { data: history } = useMyHistory();
  const cancelToken = useCancelToken();
  const searchToken = useSearchToken();
  const [code, setCode] = useState('');

  const greeting = getGreeting();
  const completedCount = history?.filter((t) => t.status === 'completed').length ?? 0;
  const totalSpent = history?.reduce((sum, t) => (t.status === 'completed' ? sum + t.totalAmount : sum), 0) ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{greeting}, {user?.name.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-ink-600/60 dark:text-white/50">Here's what's happening with your order today.</p>
      </div>

      {isLoading && <Skeleton className="h-64 w-full rounded-3xl" />}

      {!isLoading && data?.token && (
        <div className="space-y-3">
          <TokenCard token={data.token} position={data.position} peopleAhead={data.peopleAhead} />
          {data.token.status === 'waiting' && (
            <Button variant="secondary" onClick={() => cancelToken.mutate(data.token!._id)} loading={cancelToken.isPending}>
              Cancel this token
            </Button>
          )}
        </div>
      )}

      {!isLoading && !data?.token && (
        <EmptyState
          icon={UtensilsCrossed}
          title="No active token"
          description="You don't have anything in the queue right now. Order food to get your digital token."
          action={<Link to="/student/order" className="btn-primary">Order food</Link>}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-600/60 dark:text-white/40">Orders completed</p>
          <p className="mt-1.5 text-2xl font-bold">{completedCount}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-600/60 dark:text-white/40">Total spent</p>
          <p className="mt-1.5 text-2xl font-bold">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-600/60 dark:text-white/40">Member since</p>
          <p className="mt-1.5 text-2xl font-bold">{user ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</p>
        </div>
      </div>

      <div className="card-surface p-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Search className="h-4 w-4" /> Look up any token
        </h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) searchToken.mutate(code.trim().toUpperCase());
          }}
        >
          <Input placeholder="e.g. A014" value={code} onChange={(e) => setCode(e.target.value)} className="flex-1" />
          <Button type="submit" variant="secondary" loading={searchToken.isPending}>Search</Button>
        </form>
        {searchToken.data && (
          <div className="mt-4 rounded-xl bg-black/[0.03] dark:bg-white/5 p-4 text-sm">
            <p className="font-semibold">{searchToken.data.tokenCode} — {searchToken.data.status}</p>
            <p className="text-ink-600/60 dark:text-white/50">Queued at {formatTime(searchToken.data.queuedAt)}</p>
          </div>
        )}
      </div>

      {!!history?.length && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><HistoryIcon className="h-4 w-4" /> Recent orders</h2>
            <Link to="/student/history" className="text-xs font-medium text-violet-500 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {history.slice(0, 3).map((t) => (
              <div key={t._id} className="card-surface flex items-center justify-between p-4">
                <div>
                  <p className="font-mono font-semibold">{t.tokenCode}</p>
                  <p className="text-xs text-ink-600/60 dark:text-white/50">{t.items.map((i) => i.name).join(', ')}</p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(t.totalAmount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
