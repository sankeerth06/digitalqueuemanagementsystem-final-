import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, extractErrorMessage } from '../services/api';
import { getSocket } from '../services/socket';
import { Token } from '../types';

interface ActiveTokenResponse {
  token: Token | null;
  position: number | null;
  peopleAhead: number | null;
}

export function useMyActiveToken() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['my-active-token'],
    queryFn: async () => {
      const res = await api.get('/queue/tokens/mine/active');
      return res.data.data as ActiveTokenResponse;
    },
    refetchInterval: 15_000,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => queryClient.invalidateQueries({ queryKey: ['my-active-token'] });
    socket.on('queue:updated', handler);
    socket.on('token:called', handler);
    return () => {
      socket.off('queue:updated', handler);
      socket.off('token:called', handler);
    };
  }, [queryClient]);

  return query;
}

export function useMyHistory() {
  return useQuery({
    queryKey: ['my-history'],
    queryFn: async () => {
      const res = await api.get('/queue/tokens/mine/history');
      return res.data.data.tokens as Token[];
    },
  });
}

export function useBookToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: { menuItemId: string; quantity: number }[]) => {
      const res = await api.post('/queue/tokens', { items });
      return res.data.data.token as Token;
    },
    onSuccess: (token) => {
      toast.success(`Token ${token.tokenCode} booked!`);
      queryClient.invalidateQueries({ queryKey: ['my-active-token'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useCancelToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tokenId: string) => {
      await api.delete(`/queue/tokens/${tokenId}`);
    },
    onSuccess: () => {
      toast.success('Token cancelled');
      queryClient.invalidateQueries({ queryKey: ['my-active-token'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useLiveQueue() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['live-queue'],
    queryFn: async () => {
      const res = await api.get('/queue/live');
      return res.data.data.queue as Token[];
    },
    refetchInterval: 10_000,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (queue: Token[]) => {
      queryClient.setQueryData(['live-queue'], queue);
    };
    socket.on('queue:updated', handler);
    return () => {
      socket.off('queue:updated', handler);
    };
  }, [queryClient]);

  return query;
}

export function useSkippedTokens() {
  return useQuery({
    queryKey: ['skipped-tokens'],
    queryFn: async () => {
      const res = await api.get('/queue/skipped');
      return res.data.data.skipped as Token[];
    },
    refetchInterval: 10_000,
  });
}

export function useCallNext() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (counter: number) => {
      const res = await api.post('/queue/call-next', { counter });
      return res.data.data.token as Token;
    },
    onSuccess: (token) => {
      toast.success(`Called ${token.tokenCode} to Counter ${token.counter}`);
      queryClient.invalidateQueries({ queryKey: ['live-queue'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

function useTokenAction(path: string, method: 'patch' | 'delete', successMessage: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tokenId: string) => {
      const res = await api.request({ url: `/queue/tokens/${tokenId}${path}`, method });
      return res.data.data?.token as Token | undefined;
    },
    onSuccess: () => {
      toast.success(successMessage);
      queryClient.invalidateQueries({ queryKey: ['live-queue'] });
      queryClient.invalidateQueries({ queryKey: ['skipped-tokens'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export const useMarkReady = () => useTokenAction('/ready', 'patch', 'Order marked ready');
export const useCompleteToken = () => useTokenAction('/complete', 'patch', 'Order completed');
export const useSkipToken = () => useTokenAction('/skip', 'patch', 'Token skipped');
export const useRecallToken = () => useTokenAction('/recall', 'patch', 'Token recalled');

export function useSearchToken() {
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await api.get(`/queue/tokens/search/${code}`);
      return res.data.data.token as Token;
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}
