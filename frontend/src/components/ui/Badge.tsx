import { HTMLAttributes } from 'react';
import clsx from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'violet' | 'mint' | 'amber' | 'coral' | 'neutral';
}

const toneClasses: Record<string, string> = {
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  mint: 'bg-mint-500/10 text-mint-500',
  amber: 'bg-amber-500/10 text-amber-500',
  coral: 'bg-coral-500/10 text-coral-500',
  neutral: 'bg-black/5 dark:bg-white/10 text-ink-700 dark:text-white/70',
};

export function Badge({ tone = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
