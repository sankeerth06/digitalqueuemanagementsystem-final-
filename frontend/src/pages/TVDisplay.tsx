import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minimize2, Volume2 } from 'lucide-react';
import { connectSocket, getSocket } from '../services/socket';
import { api } from '../services/api';
import { Token, SystemSettings } from '../types';

export function TVDisplay() {
  const [queue, setQueue] = useState<Token[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [now, setNow] = useState(new Date());
  const [fullscreen, setFullscreen] = useState(false);
  const lastCalledRef = useRef<string | null>(null);

  useEffect(() => {
    const socket = getSocket() || connectSocket();
    socket.emit('join-tv-display');

    const loadInitial = async () => {
      try {
        const [queueRes, settingsRes] = await Promise.all([api.get('/queue/live'), api.get('/settings')]);
        setQueue(queueRes.data.data.queue);
        setSettings(settingsRes.data.data.settings);
      } catch {
        // TV display keeps showing last known state if the initial fetch fails
      }
    };
    loadInitial();

    const onQueueUpdate = (data: Token[]) => setQueue(data);
    const onSettingsUpdate = (data: SystemSettings) => setSettings(data);
    const onTokenCalled = (token: Token) => {
      if (lastCalledRef.current !== token._id) {
        lastCalledRef.current = token._id;
        playChime();
      }
    };

    socket.on('queue:updated', onQueueUpdate);
    socket.on('settings:updated', onSettingsUpdate);
    socket.on('token:called', onTokenCalled);

    return () => {
      socket.off('queue:updated', onQueueUpdate);
      socket.off('settings:updated', onSettingsUpdate);
      socket.off('token:called', onTokenCalled);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const preparing = queue.filter((t) => t.status === 'preparing');
  const waiting = queue.filter((t) => t.status === 'waiting');
  const avgWait = queue.length
    ? Math.round(queue.reduce((s, t) => s + t.estimatedWaitMinutes, 0) / queue.length)
    : 0;

  return (
    <div className="min-h-screen bg-ink-950 text-white font-mono selection:bg-mint-400/30">
      <div className="flex items-center justify-between border-b border-white/10 px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500 font-display text-base font-bold">Q</div>
          <span className="font-display text-xl font-bold tracking-tight">QServe — Live Board</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-white/60">
          <span>{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <span className="text-lg font-bold text-white">{now.toLocaleTimeString('en-IN')}</span>
          <button onClick={toggleFullscreen} className="rounded-lg border border-white/10 p-2 hover:bg-white/10">
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {settings?.announcement && (
        <div className="overflow-hidden whitespace-nowrap border-b border-white/10 bg-amber-500/10 py-2 text-amber-300">
          <motion.div animate={{ x: ['100%', '-100%'] }} transition={{ repeat: Infinity, duration: 18, ease: 'linear' }} className="inline-block">
            📢 {settings.announcement}
          </motion.div>
        </div>
      )}

      {settings?.queuePaused && (
        <div className="bg-coral-500/20 px-8 py-3 text-center text-coral-300">Queue paused: {settings.pauseReason}</div>
      )}

      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-mint-400">Now serving</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {preparing.map((t) => (
                <motion.div
                  key={t._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="rounded-2xl border border-mint-400/30 bg-mint-400/10 p-6 text-center"
                >
                  <p className="text-5xl font-bold text-mint-400">{t.tokenCode}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-white/50">Counter {t.counter}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            {!preparing.length && (
              <p className="col-span-full py-12 text-center text-white/30">No orders being prepared right now.</p>
            )}
          </div>

          <h2 className="mb-4 mt-10 text-xs uppercase tracking-[0.2em] text-white/50">Up next</h2>
          <div className="flex flex-wrap gap-3">
            {waiting.slice(0, 8).map((t, i) => (
              <div key={t._id} className={`rounded-xl border px-5 py-3 text-center ${i === 0 ? 'border-amber-400/40 bg-amber-400/10' : 'border-white/10'}`}>
                <p className="text-2xl font-bold">{t.tokenCode}</p>
              </div>
            ))}
            {!waiting.length && <p className="text-white/30">Queue is empty.</p>}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 p-6">
            <p className="text-xs uppercase tracking-wide text-white/40">Average wait</p>
            <p className="mt-1 text-3xl font-bold">{avgWait}m</p>
          </div>
          <div className="rounded-2xl border border-white/10 p-6">
            <p className="text-xs uppercase tracking-wide text-white/40">In queue now</p>
            <p className="mt-1 text-3xl font-bold">{queue.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 p-6">
            <p className="text-xs uppercase tracking-wide text-white/40">Counters open</p>
            <p className="mt-1 text-3xl font-bold">{settings?.totalCounters ?? '—'}</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 p-4 text-xs text-white/40">
            <Volume2 className="h-4 w-4" /> Sound alert plays when a new token is called
          </div>
        </aside>
      </div>
    </div>
  );
}

function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.4);
    });
  } catch {
    // Autoplay may be blocked until the user interacts with the page once
  }
}
