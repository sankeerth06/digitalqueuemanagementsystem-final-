import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, extractErrorMessage } from '../services/api';
import { Token } from '../types';

function refreshAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['my-active-token'] });
  queryClient.invalidateQueries({ queryKey: ['my-active-tokens'] });
  queryClient.invalidateQueries({ queryKey: ['my-history'] });
  queryClient.invalidateQueries({ queryKey: ['live-queue'] });
}

/** Student pays online (simulated gateway). */
export function usePayOnline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tokenId: string) => {
      const res = await api.patch(`/queue/tokens/${tokenId}/pay`);
      return res.data.data.token as Token;
    },
    onSuccess: (token) => {
      toast.success(`Payment successful for ${token.tokenCode}`);
      refreshAll(queryClient);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

/** Staff marks a counter payment as received. */
export function useMarkPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tokenId: string) => {
      const res = await api.patch(`/queue/tokens/${tokenId}/mark-paid`);
      return res.data.data.token as Token;
    },
    onSuccess: (token) => {
      toast.success(`${token.tokenCode} marked as paid`);
      refreshAll(queryClient);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

