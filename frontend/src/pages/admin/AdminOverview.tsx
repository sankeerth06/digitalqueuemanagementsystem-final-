import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DollarSign, ListOrdered, TimerReset, Users2 } from 'lucide-react';
import { useAnalyticsOverview, useDailyTrend } from '../../hooks/useAnalytics';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../utils/format';

const toneClasses: Record<string, string> = {
  violet: 'bg-violet-500/10 text-violet-500',
  mint: 'bg-mint-500/10 text-mint-500',
  amber: 'bg-amber-500/10 text-amber-500',
  coral: 'bg-coral-500/10 text-coral-500',
};

export function AdminOverview() {
  const { data: overview, isLoading } = useAnalyticsOverview();
  const { data: trend } = useDailyTrend(14);

  const cards = [
    { label: "Today's orders", value: overview?.todayOrders ?? 0, icon: ListOrdered, tone: 'violet' },
    { label: "Today's revenue", value: overview ? formatCurrency(overview.todayRevenue) : '—', icon: DollarSign, tone: 'mint' },
    { label: 'Active in queue', value: overview?.activeQueueLength ?? 0, icon: Users2, tone: 'amber' },
    { label: 'Avg completion', value: overview ? `${overview.avgCompletionMinutes}m` : '—', icon: TimerReset, tone: 'coral' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Business overview</h1>
        <p className="mt-1 text-sm text-ink-600/60 dark:text-white/50">A live pulse on canteen performance today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          : cards.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card-surface p-5">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses[c.tone]}`}>
                  <c.icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-600/60 dark:text-white/40">{c.label}</p>
                <p className="mt-1 text-2xl font-bold">{c.value}</p>
              </motion.div>
            ))}
      </div>

      <div className="card-surface p-6">
        <h2 className="mb-4 text-sm font-semibold">Orders — last 14 days</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6D5EF8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6D5EF8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="orders" stroke="#6D5EF8" fill="url(#colorOrders)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
