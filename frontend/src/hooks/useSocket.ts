import { useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useAuthStore } from '../store/authStore';

/** Establishes a single Socket.IO connection for the lifetime of the authenticated session. */
export function useSocketConnection() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const connected = useRef(false);

  useEffect(() => {
    if (!connected.current) {
      connectSocket(accessToken || undefined);
      connected.current = true;
    }
    return () => {
      // Keep connection alive across route changes; only torn down on logout via clearSession consumers
    };
  }, [accessToken]);

  useEffect(() => {
    return () => {
      if (!useAuthStore.getState().isAuthenticated) {
        disconnectSocket();
      }
    };
  }, []);
}
