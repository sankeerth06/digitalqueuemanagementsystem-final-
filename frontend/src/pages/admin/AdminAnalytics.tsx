import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useDailyTrend, usePeakHours, useRevenueByCategory, useTopItems } from '../../hooks/useAnalytics';
import { formatHour } from '../../utils/format';

const COLORS = ['#6D5EF8', '#22C58C', '#F59E0B', '#F5484D', '#8B7FFF'];

export function AdminAnalytics() {
  const { data: trend } = useDailyTrend(30);
  const { data: peakHours } = usePeakHours(14);
  const { data: topItems } = useTopItems();
  const { data: revenueByCategory } = useRevenueByCategory(30);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-ink-600/60 dark:text-white/50">Deep dive into orders, revenue, and queue patterns.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-6">
          <h2 className="mb-4 text-sm font-semibold">Peak hours (last 14 days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="_id" tickFormatter={(v) => formatHour(v)} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip labelFormatter={(v) => formatHour(Number(v))} />
                <Bar dataKey="orders" fill="#6D5EF8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-6">
          <h2 className="mb-4 text-sm font-semibold">Revenue by category (30 days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenueByCategory} dataKey="revenue" nameKey="_id" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {revenueByCategory?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-6">
          <h2 className="mb-4 text-sm font-semibold">Revenue trend (30 days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="_id" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#22C58C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-6">
          <h2 className="mb-4 text-sm font-semibold">Most ordered items</h2>
          <div className="space-y-3">
            {topItems?.map((item, i) => (
              <div key={item._id} className="flex items-center gap-3">
                <span className="w-5 text-xs font-semibold text-ink-600/50 dark:text-white/40">{i + 1}</span>
                <span className="flex-1 text-sm">{item.name}</span>
                <span className="text-sm font-semibold">{item.totalOrders} orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
