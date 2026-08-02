import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-ink-950 px-6 text-center">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-8xl font-bold text-violet-500/20"
      >
        404
      </motion.p>
      <h1 className="mt-2 text-2xl font-bold">This token doesn't exist</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-600/60 dark:text-white/50">
        The page you're looking for has been served, cancelled, or never joined the queue.
      </p>
      <Link to="/" className="btn-primary mt-8">
        <Home className="h-4 w-4" /> Back to home
      </Link>
    </div>
  );
}
