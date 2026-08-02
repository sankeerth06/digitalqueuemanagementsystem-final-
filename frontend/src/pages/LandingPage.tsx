import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock3, QrCode, Radio, Smartphone, Tv, Users2 } from 'lucide-react';
import { ThemeToggle } from '../components/layout/ThemeToggle';

const features = [
  {
    icon: Smartphone,
    title: 'Book from your phone',
    description: 'Pick your order and get a digital token in seconds. No standing in line to place it.',
  },
  {
    icon: Radio,
    title: 'Live position, always',
    description: 'Watch your queue position and wait time update in real time — no refreshing, ever.',
  },
  {
    icon: Clock3,
    title: 'Smart wait estimates',
    description: 'QServe learns from real prep times to tell you exactly how long you have.',
  },
  {
    icon: Tv,
    title: 'Departure-board display',
    description: 'A large public screen shows now-serving tokens, counters, and announcements.',
  },
  {
    icon: QrCode,
    title: 'Scan and join',
    description: 'A QR code at the entrance drops you straight into the queue — no app install.',
  },
  {
    icon: Users2,
    title: 'Built for staff, too',
    description: 'One-click call, skip, recall, and complete — with live analytics for admins.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-ink-950 overflow-x-hidden">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500 font-display text-base font-bold text-white">Q</div>
          <span className="font-display text-xl font-bold">QServe</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login" className="hidden sm:inline-flex text-sm font-semibold text-ink-700 dark:text-white/70 hover:text-violet-500 px-3 py-2">
            Sign in
          </Link>
          <Link to="/register" className="btn-primary">Get started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-5xl px-6 pt-16 pb-24 text-center">
        <div className="absolute inset-x-0 top-0 -z-10 h-[600px] bg-grid-glow" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 px-4 py-1.5 text-xs font-medium text-ink-600/70 dark:text-white/60"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-mint-500" /> Now live for Autumn Semester
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl"
        >
          No more physical tokens.
          <br />
          <span className="bg-gradient-to-r from-violet-500 to-violet-400 bg-clip-text text-transparent">
            Smart digital queuing.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-6 max-w-xl text-lg text-ink-600/70 dark:text-white/60"
        >
          Book your canteen order from your phone, watch your place in line update live, and walk up right
          when it's ready. Built for college canteens that have outgrown paper tokens.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link to="/register" className="btn-primary px-6 py-3 text-base">
            Book your first token <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/tv" className="btn-secondary px-6 py-3 text-base">
            View live display
          </Link>
        </motion.div>
      </section>

      {/* Departure board preview */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-ink-950 dark:bg-ink-900 p-8 shadow-2xl ring-1 ring-white/10"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <span className="font-mono text-xs uppercase tracking-widest text-mint-400">Now serving</span>
            <span className="font-mono text-xs text-white/40">Counter 1 · Counter 2</span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 font-mono">
            {['A014', 'A015', 'A016'].map((code, i) => (
              <div key={code} className={`rounded-xl border p-4 text-center ${i === 0 ? 'border-mint-400/40 bg-mint-400/10' : 'border-white/10'}`}>
                <p className={`text-3xl font-bold ${i === 0 ? 'text-mint-400' : 'text-white/80'}`}>{code}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-white/40">
                  {i === 0 ? 'Counter 1' : i === 1 ? 'Next up' : 'Waiting'}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="card-surface p-6"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-ink-600/70 dark:text-white/50">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-black/5 dark:border-white/10 px-6 py-8 text-center text-sm text-ink-600/50 dark:text-white/40">
        Built for college canteens · QServe {new Date().getFullYear()}
      </footer>
    </div>
  );
}
