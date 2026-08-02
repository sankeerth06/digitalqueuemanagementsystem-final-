import { Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';

export function ThemeToggle() {
  const { isDark, toggle } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 dark:border-white/10 text-ink-700 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 transition"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
