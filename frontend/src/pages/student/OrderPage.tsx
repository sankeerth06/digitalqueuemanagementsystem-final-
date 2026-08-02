import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Star } from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';
import { useBookToken } from '../../hooks/useQueue';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/format';
import { MenuCategory } from '../../types';

const categories: MenuCategory[] = ['Breakfast', 'Meals', 'Snacks', 'Beverages', 'Combos'];

export function OrderPage() {
  const [activeCategory, setActiveCategory] = useState<MenuCategory | 'All'>('All');
  const [cart, setCart] = useState<Record<string, number>>({});
  const { data: items, isLoading } = useMenu({ availableOnly: true });
  const bookToken = useBookToken();
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!items) return [];
    return activeCategory === 'All' ? items : items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  const cartItems = useMemo(() => {
    if (!items) return [];
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ item: items.find((i) => i._id === id)!, qty }))
      .filter((c) => c.item);
  }, [cart, items]);

  const total = cartItems.reduce((sum, c) => sum + c.item.price * c.qty, 0);

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const next = Math.max(0, (prev[id] || 0) + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleBook = () => {
    const payload = cartItems.map((c) => ({ menuItemId: c.item._id, quantity: c.qty }));
    bookToken.mutate(payload, {
      onSuccess: () => {
        setCart({});
        navigate('/student');
      },
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold">Order food</h1>
      <p className="mt-1 text-sm text-ink-600/60 dark:text-white/50">Pick your items — we'll generate your digital token instantly.</p>

      <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {(['All', ...categories] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
              activeCategory === cat
                ? 'bg-violet-500 text-white'
                : 'bg-black/5 dark:bg-white/10 text-ink-700 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          {!isLoading && filtered.map((item, i) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card-surface overflow-hidden"
            >
              {item.imageUrl && (
                <div className="h-28 w-full overflow-hidden bg-black/5 dark:bg-white/5">
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{item.name}</h3>
                  {item.isPopular && (
                    <Badge tone="amber"><Star className="h-3 w-3" /> Popular</Badge>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-ink-600/60 dark:text-white/50">{item.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold">{formatCurrency(item.price)}</span>
                  <span className="text-xs text-ink-600/50 dark:text-white/40">{item.prepTimeMinutes} min prep</span>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-black/[0.03] dark:bg-white/5 p-1.5">
                  <button onClick={() => updateQty(item._id, -1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white dark:bg-ink-800 shadow-sm">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-sm font-semibold">{cart[item._id] || 0}</span>
                  <button onClick={() => updateQty(item._id, 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500 text-white shadow-sm">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><ShoppingBag className="h-4 w-4" /> Your order</h2>
            {!cartItems.length && <p className="mt-4 text-sm text-ink-600/60 dark:text-white/50">Your cart is empty.</p>}
            <div className="mt-4 space-y-2">
              {cartItems.map((c) => (
                <div key={c.item._id} className="flex items-center justify-between text-sm">
                  <span>{c.qty}× {c.item.name}</span>
                  <span className="font-medium">{formatCurrency(c.item.price * c.qty)}</span>
                </div>
              ))}
            </div>
            {!!cartItems.length && (
              <>
                <div className="mt-4 flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-4 text-sm font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <Button className="mt-4 w-full" onClick={handleBook} loading={bookToken.isPending}>
                  Book token
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
