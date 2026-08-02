import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { MenuItem } from '../types';

export function useMenu(params?: { category?: string; search?: string; availableOnly?: boolean }) {
  return useQuery({
    queryKey: ['menu', params],
    queryFn: async () => {
      const res = await api.get('/menu', { params });
      return res.data.data.items as MenuItem[];
    },
    staleTime: 30_000,
  });
}
