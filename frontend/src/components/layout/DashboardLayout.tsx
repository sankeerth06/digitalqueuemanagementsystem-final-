import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid, UtensilsCrossed, History, User as UserIcon, Users, Settings,
  BarChart3, Tv, LogOut, Menu as MenuIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import { useSocketConnection } from '../../hooks/useSocket';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { initials } from '../../utils/format';

const navByRole = {
  student: [
    { to: '/student', label: 'Dashboard', icon: LayoutGrid, end: true },
    { to: '/student/order', label: 'Order Food', icon: UtensilsCrossed },
    { to: '/student/history', label: 'History', icon: History },
    { to: '/student/profile', label: 'Profile', icon: UserIcon },
  ],
  staff: [
    { to: '/staff', label: 'Live Queue', icon: LayoutGrid, end: true },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutGrid, end: true },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
    { to: '/admin/users', label: 'People', icon: Users },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
};

export function DashboardLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  useSocketConnection();

  if (!user) return null;
  const items = navByRole[user.role];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-ink-950">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-black/5 dark:border-white/10 bg-white dark:bg-ink-900 px-4 py-6">
          <Logo />
          <nav className="mt-8 flex-1 space-y-1">
            {items.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
            <button
              onClick={() => navigate('/tv')}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600/70 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Tv className="h-4 w-4" /> TV Display
            </button>
          </nav>
          <button
            onClick={() => logout.mutate()}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-coral-500 hover:bg-coral-500/10"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </aside>

        <div className="flex-1 lg:pl-64">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-ink-950/80 backdrop-blur-xl px-4 py-3 sm:px-8">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <MenuIcon className="h-5 w-5" />
            </button>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <NotificationBell />
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-sm font-bold text-violet-600 dark:text-violet-400">
                {initials(user.name)}
              </div>
            </div>
          </header>

          {mobileOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-0 z-40 flex lg:hidden"
            >
              <div className="w-72 bg-white dark:bg-ink-900 p-4">
                <Logo />
                <nav className="mt-8 space-y-1">
                  {items.map((item) => (
                    <NavItem key={item.to} {...item} onClick={() => setMobileOpen(false)} />
                  ))}
                </nav>
              </div>
              <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
            </motion.div>
          )}

          <main className="p-4 sm:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500 font-display text-sm font-bold text-white">Q</div>
      <span className="font-display text-lg font-bold">QServe</span>
    </div>
  );
}

function NavItem({
  to, label, icon: Icon, end, onClick,
}: { to: string; label: string; icon: typeof LayoutGrid; end?: boolean; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
            : 'text-ink-700 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
        }`
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}
