import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface Overview {
  todayOrders: number;
  todayRevenue: number;
  activeQueueLength: number;
  cancelledToday: number;
  avgCompletionMinutes: number;
}

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview');
      return res.data.data as Overview;
    },
    refetchInterval: 20_000,
  });
}

export function useDailyTrend(days = 7) {
  return useQuery({
    queryKey: ['analytics-trend', days],
    queryFn: async () => {
      const res = await api.get('/analytics/daily-trend', { params: { days } });
      return res.data.data.trend as { _id: string; orders: number; revenue: number; cancelled: number }[];
    },
  });
}

export function usePeakHours(days = 7) {
  return useQuery({
    queryKey: ['analytics-peak-hours', days],
    queryFn: async () => {
      const res = await api.get('/analytics/peak-hours', { params: { days } });
      return res.data.data.peakHours as { _id: number; orders: number }[];
    },
  });
}

export function useTopItems() {
  return useQuery({
    queryKey: ['analytics-top-items'],
    queryFn: async () => {
      const res = await api.get('/analytics/top-items');
      return res.data.data.items as { _id: string; name: string; totalOrders: number }[];
    },
  });
}

export function useRevenueByCategory(days = 30) {
  return useQuery({
    queryKey: ['analytics-revenue-category', days],
    queryFn: async () => {
      const res = await api.get('/analytics/revenue-by-category', { params: { days } });
      return res.data.data.categories as { _id: string; revenue: number }[];
    },
  });
}
