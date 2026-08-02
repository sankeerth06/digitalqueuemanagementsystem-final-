import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(token?: string): Socket {
  if (socket && socket.connected) return socket;

  socket = io('/', {
    path: '/socket.io',
    auth: token ? { token } : {},
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
