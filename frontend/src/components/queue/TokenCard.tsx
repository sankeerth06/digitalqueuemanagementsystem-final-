import { motion } from 'framer-motion';
import { Clock, Users, MapPin } from 'lucide-react';
import { Token } from '../../types';
import { waitColor } from '../../utils/format';
import { Badge } from '../ui/Badge';

interface TokenCardProps {
  token: Token;
  position?: number | null;
  peopleAhead?: number | null;
}

const statusCopy: Record<Token['status'], string> = {
  waiting: 'Waiting in queue',
  preparing: 'Being prepared',
  ready: 'Ready for pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
  skipped: 'Skipped — see staff',
};

const colorRing: Record<'green' | 'orange' | 'red', string> = {
  green: 'from-mint-500/20 to-mint-500/0 ring-mint-500/30',
  orange: 'from-amber-500/20 to-amber-500/0 ring-amber-500/30',
  red: 'from-coral-500/20 to-coral-500/0 ring-coral-500/30',
};

const dotColor: Record<'green' | 'orange' | 'red', string> = {
  green: 'bg-mint-500',
  orange: 'bg-amber-500',
  red: 'bg-coral-500',
};

export function TokenCard({ token, position, peopleAhead }: TokenCardProps) {
  const tone = token.status === 'ready' ? 'red' : waitColor(token.estimatedWaitMinutes);
  const total = (peopleAhead ?? 0) + 1;
  const progress = token.status === 'ready' ? 100 : Math.max(6, 100 - ((position ?? 1) / Math.max(total, 1)) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${colorRing[tone]} ring-1 p-[1px]`}
    >
      <div className="card-surface rounded-[calc(1.5rem-1px)] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-600/60 dark:text-white/40">
              Your token
            </p>
            <div className="mt-1 flex items-center gap-3">
              <span className="font-display text-5xl font-bold tracking-tight">{token.tokenCode}</span>
              <span className={`relative flex h-3 w-3`}>
                <span className={`absolute inline-flex h-full w-full animate-pulse-ring rounded-full ${dotColor[tone]}`} />
                <span className={`relative inline-flex h-3 w-3 rounded-full ${dotColor[tone]}`} />
              </span>
            </div>
          </div>
          <Badge tone={tone === 'red' ? 'coral' : tone === 'orange' ? 'amber' : 'mint'}>
            {statusCopy[token.status]}
          </Badge>
        </div>

        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <motion.div
            className={`h-full rounded-full ${dotColor[tone]}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 dark:bg-white/10">
              <Users className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold">{peopleAhead ?? 0}</p>
            <p className="text-xs text-ink-600/60 dark:text-white/40">Ahead of you</p>
          </div>
          <div>
            <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 dark:bg-white/10">
              <Clock className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold">{token.estimatedWaitMinutes}m</p>
            <p className="text-xs text-ink-600/60 dark:text-white/40">Est. wait</p>
          </div>
          <div>
            <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 dark:bg-white/10">
              <MapPin className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold">{token.counter ?? '—'}</p>
            <p className="text-xs text-ink-600/60 dark:text-white/40">Counter</p>
          </div>
        </div>

        <div className="mt-6 space-y-1.5 border-t border-black/5 pt-4 dark:border-white/10">
          {token.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-ink-700 dark:text-white/70">
                {item.quantity}× {item.name}
              </span>
              <span className="font-medium">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
