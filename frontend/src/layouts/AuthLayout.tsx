import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function AuthLayout() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-ink-950 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-grid-glow pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500 font-display text-base font-bold text-white">Q</div>
          <span className="font-display text-xl font-bold">QServe</span>
        </Link>
        <div className="card-surface p-8">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
