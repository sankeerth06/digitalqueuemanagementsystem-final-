import { useState } from 'react';
import { Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMarkAllRead, useNotifications } from '../../hooks/useNotifications';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useNotifications();
  const markAllRead = useMarkAllRead();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 dark:border-white/10 text-ink-700 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 transition"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {!!data?.unreadCount && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-coral-500 text-[10px] font-bold text-white">
            {data.unreadCount > 9 ? '9+' : data.unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 z-40 mt-2 w-80 card-surface p-2 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-sm font-semibold">Notifications</p>
              {!!data?.unreadCount && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs font-medium text-violet-500 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            {!data?.notifications.length && (
              <p className="px-2 py-6 text-center text-sm text-ink-600/60 dark:text-white/40">
                You're all caught up.
              </p>
            )}
            {data?.notifications.map((n) => (
              <div
                key={n._id}
                className={`rounded-xl px-3 py-2.5 text-sm ${!n.read ? 'bg-violet-500/5' : ''}`}
              >
                <p className="font-medium">{n.title}</p>
                <p className="text-xs text-ink-600/60 dark:text-white/50">{n.message}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
