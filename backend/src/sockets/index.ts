import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { verifyAccessToken } from '../services/tokenService';
import { logger } from '../utils/logger';

let io: Server | undefined;

interface AuthedSocket extends Socket {
  data: {
    userId?: string;
    role?: string;
  };
}

export function initSocket(server: HTTPServer): Server {
  io = new Server(server, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  io.use((socket: AuthedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (token) {
        const payload = verifyAccessToken(token);
        socket.data.userId = payload.sub;
        socket.data.role = payload.role;
      }
      next();
    } catch {
      // Allow anonymous connections (e.g. TV display) but without identity
      next();
    }
  });

  io.on('connection', (socket: AuthedSocket) => {
    logger.info(`Socket connected: ${socket.id} (user=${socket.data.userId || 'anon'})`);

    // Everyone interested in the live queue joins this room
    socket.join('queue-room');

    if (socket.data.userId) {
      socket.join(`user-${socket.data.userId}`);
    }

    if (socket.data.role === 'staff' || socket.data.role === 'admin') {
      socket.join('staff-room');
    }

    socket.on('join-tv-display', () => {
      socket.join('tv-room');
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO has not been initialized');
  return io;
}

// Centralized event names to avoid typos across the codebase
export const SOCKET_EVENTS = {
  QUEUE_UPDATED: 'queue:updated',
  TOKEN_CREATED: 'token:created',
  TOKEN_UPDATED: 'token:updated',
  TOKEN_CALLED: 'token:called',
  NOTIFICATION_NEW: 'notification:new',
  SETTINGS_UPDATED: 'settings:updated',
  ANALYTICS_UPDATED: 'analytics:updated',
} as const;
