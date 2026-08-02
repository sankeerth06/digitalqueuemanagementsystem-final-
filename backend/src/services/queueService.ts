import { Token, IToken } from '../models/Token';
import { getSettings } from '../models/Settings';
import { getIO, SOCKET_EVENTS } from '../sockets/index';
import { pushNotification } from './notificationService';
import { ApiError } from '../utils/ApiError';

const ACTIVE_STATUSES = ['waiting', 'preparing'] as const;

/** Generates the next sequential token code for today, e.g. A001, A002 ... Z999 then wraps. */
export async function generateTokenCode(): Promise<{ code: string; sequence: number }> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const countToday = await Token.countDocuments({ createdAt: { $gte: startOfDay } });
  const sequence = countToday + 1;

  const letterIndex = Math.floor((sequence - 1) / 999);
  const letter = String.fromCharCode(65 + (letterIndex % 26));
  const number = ((sequence - 1) % 999) + 1;
  const code = `${letter}${String(number).padStart(3, '0')}`;

  return { code, sequence };
}

/** Estimates wait time for a new token based on items ahead of it in the active queue and counter throughput. */
export async function estimateWaitMinutes(newItemPrepMinutes: number): Promise<number> {
  const settings = await getSettings();
  const activeTokens = await Token.find({ status: { $in: ACTIVE_STATUSES } }).sort({ sequence: 1 });

  const totalCounters = Math.max(1, settings.totalCounters);
  const buffer = settings.averagePrepBufferMinutes;

  // Sum prep time of all items ahead, distributed across counters
  const aheadPrepSum = activeTokens.reduce((sum, t) => {
    const tokenPrep = t.items.reduce((s, i) => s + i.prepTimeMinutes * i.quantity, 0);
    return sum + tokenPrep + buffer;
  }, 0);

  const distributed = aheadPrepSum / totalCounters;
  return Math.max(1, Math.round(distributed + newItemPrepMinutes));
}

export async function getLiveQueue(): Promise<IToken[]> {
  const queue = await Token.find({ status: { $in: ACTIVE_STATUSES } })
    .sort({ isVip: -1, sequence: 1 })
    .populate('student', 'name studentId')
    .lean();
  return queue as unknown as IToken[];
}

export async function getSkippedTokens(): Promise<IToken[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const tokens = await Token.find({ status: 'skipped', createdAt: { $gte: startOfDay } })
    .sort({ sequence: 1 })
    .populate('student', 'name studentId')
    .lean();
  return tokens as unknown as IToken[];
}

export async function getQueuePositionInfo(tokenId: string) {
  const token = await Token.findById(tokenId);
  if (!token) throw ApiError.notFound('Token not found');

  if (!ACTIVE_STATUSES.includes(token.status as (typeof ACTIVE_STATUSES)[number])) {
    return { position: 0, peopleAhead: 0, token };
  }

  const ahead = await Token.countDocuments({
    status: { $in: ACTIVE_STATUSES },
    sequence: { $lt: token.sequence },
  });

  return { position: ahead + 1, peopleAhead: ahead, token };
}

async function broadcastQueue() {
  const queue = await getLiveQueue();
  getIO().to('queue-room').to('tv-room').to('staff-room').emit(SOCKET_EVENTS.QUEUE_UPDATED, queue);
  return queue;
}

/** Notifies students who are near their turn (within 3 tokens) or currently up. */
async function evaluateProximityNotifications() {
  const queue = await getLiveQueue();
  for (let i = 0; i < queue.length; i++) {
    const token = queue[i] as unknown as IToken;
    const studentId = (token.student as unknown as { _id: string })._id || token.student;

    if (i === 0 && !token.notifiedCurrentTurn) {
      await Token.findByIdAndUpdate(token._id, { notifiedCurrentTurn: true });
      await pushNotification(
        studentId,
        'queue_current',
        "It's your turn!",
        `Please proceed to collect your order (Token ${token.tokenCode}).`,
        token._id
      );
    } else if (i > 0 && i <= 3 && !token.notifiedNearTurn) {
      await Token.findByIdAndUpdate(token._id, { notifiedNearTurn: true });
      await pushNotification(
        studentId,
        'queue_near',
        'Almost there',
        `Only ${i} customer${i > 1 ? 's' : ''} before you. Get ready!`,
        token._id
      );
    }
  }
}

export async function callNextToken(counter: number): Promise<IToken> {
  const settings = await getSettings();
  if (settings.queuePaused) {
    throw ApiError.badRequest('Queue is currently paused');
  }

  const next = await Token.findOne({ status: 'waiting' }).sort({ isVip: -1, sequence: 1 });
  if (!next) throw ApiError.notFound('No tokens waiting in the queue');

  next.status = 'preparing';
  next.counter = counter;
  next.calledAt = new Date();
  await next.save();

  getIO().to('queue-room').to('tv-room').to('staff-room').emit(SOCKET_EVENTS.TOKEN_CALLED, next);
  await pushNotification(
    next.student,
    'queue_current',
    'Order being prepared',
    `Your order (Token ${next.tokenCode}) is now being prepared at Counter ${counter}.`,
    next._id
  );

  await broadcastQueue();
  await evaluateProximityNotifications();
  return next;
}

export async function markTokenReady(tokenId: string): Promise<IToken> {
  const token = await Token.findById(tokenId);
  if (!token) throw ApiError.notFound('Token not found');
  if (token.status !== 'preparing') {
    throw ApiError.badRequest('Only tokens currently preparing can be marked ready');
  }
  token.status = 'ready';
  token.readyAt = new Date();
  await token.save();

  await pushNotification(
    token.student,
    'ready',
    'Order ready!',
    `Your order (Token ${token.tokenCode}) is ready for pickup at Counter ${token.counter}.`,
    token._id
  );
  await broadcastQueue();
  return token;
}

export async function completeToken(tokenId: string): Promise<IToken> {
  const token = await Token.findById(tokenId);
  if (!token) throw ApiError.notFound('Token not found');
  if (!['preparing', 'ready'].includes(token.status)) {
    throw ApiError.badRequest('Only active tokens can be completed');
  }
  token.status = 'completed';
  token.completedAt = new Date();
  await token.save();

  await broadcastQueue();
  await evaluateProximityNotifications();
  return token;
}

export async function skipToken(tokenId: string): Promise<IToken> {
  const token = await Token.findById(tokenId);
  if (!token) throw ApiError.notFound('Token not found');
  if (!['waiting', 'preparing'].includes(token.status)) {
    throw ApiError.badRequest('Only active tokens can be skipped');
  }
  token.status = 'skipped';
  await token.save();

  await pushNotification(
    token.student,
    'system',
    'Token skipped',
    `Your token (${token.tokenCode}) was skipped. Please see canteen staff.`,
    token._id
  );
  await broadcastQueue();
  return token;
}

export async function recallToken(tokenId: string): Promise<IToken> {
  const token = await Token.findById(tokenId);
  if (!token) throw ApiError.notFound('Token not found');
  if (token.status !== 'skipped') {
    throw ApiError.badRequest('Only skipped tokens can be recalled');
  }
  token.status = 'waiting';
  token.notifiedNearTurn = false;
  token.notifiedCurrentTurn = false;
  await token.save();

  await broadcastQueue();
  return token;
}

export async function cancelToken(tokenId: string, studentId: string): Promise<IToken> {
  const token = await Token.findById(tokenId);
  if (!token) throw ApiError.notFound('Token not found');
  if (token.student.toString() !== studentId) {
    throw ApiError.forbidden('You can only cancel your own token');
  }
  if (token.status !== 'waiting') {
    throw ApiError.badRequest('Only tokens that have not started preparing can be cancelled');
  }
  token.status = 'cancelled';
  token.cancelledAt = new Date();
  await token.save();

  await broadcastQueue();
  return token;
}

export { broadcastQueue, evaluateProximityNotifications, ACTIVE_STATUSES };
