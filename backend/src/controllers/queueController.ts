import { Response } from 'express';
import { Token } from '../models/Token';
import { MenuItem } from '../models/MenuItem';
import { getSettings } from '../models/Settings';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/auth';
import {
  generateTokenCode,
  estimateWaitMinutes,
  getLiveQueue,
  getSkippedTokens,
  getQueuePositionInfo,
  callNextToken,
  markTokenReady,
  completeToken,
  skipToken,
  recallToken,
  cancelToken,
} from '../services/queueService';
import { getIO, SOCKET_EVENTS } from '../sockets/index';

interface BookItemInput {
  menuItemId: string;
  quantity: number;
}

export const bookToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await getSettings();
  if (settings.queuePaused) {
    throw ApiError.badRequest(settings.pauseReason || 'The queue is currently paused. Please try again shortly.');
  }

  const { items }: { items: BookItemInput[] } = req.body;
  if (!items || items.length === 0) {
    throw ApiError.badRequest('At least one item is required to book a token');
  }

  // Check the student doesn't already have an active token
  const existingActive = await Token.findOne({
    student: req.user!.id,
    status: { $in: ['waiting', 'preparing', 'ready'] },
  });
  if (existingActive) {
    throw ApiError.conflict('You already have an active token. Please complete or cancel it first.');
  }

  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

  if (menuItems.length !== items.length) {
    throw ApiError.badRequest('One or more selected menu items could not be found');
  }

  const tokenItems = items.map((input) => {
    const menuItem = menuItems.find((m) => m._id.toString() === input.menuItemId)!;
    if (!menuItem.isAvailable || menuItem.stock < input.quantity) {
      throw ApiError.badRequest(`${menuItem.name} is currently unavailable or out of stock`);
    }
    return {
      menuItem: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: input.quantity,
      prepTimeMinutes: menuItem.prepTimeMinutes,
    };
  });

  const totalAmount = tokenItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const maxPrepTime = Math.max(...tokenItems.map((i) => i.prepTimeMinutes));
  const { code, sequence } = await generateTokenCode();
  const estimatedWaitMinutes = await estimateWaitMinutes(maxPrepTime);

  const token = await Token.create({
    tokenCode: code,
    sequence,
    student: req.user!.id,
    items: tokenItems,
    totalAmount,
    estimatedWaitMinutes,
  });

  // Decrement stock and bump popularity counters
  await Promise.all(
    tokenItems.map((i) =>
      MenuItem.findByIdAndUpdate(i.menuItem, {
        $inc: { stock: -i.quantity, totalOrders: i.quantity },
      })
    )
  );

  const queue = await getLiveQueue();
  getIO().to('queue-room').to('tv-room').to('staff-room').emit(SOCKET_EVENTS.QUEUE_UPDATED, queue);
  getIO().to('queue-room').to('staff-room').emit(SOCKET_EVENTS.TOKEN_CREATED, token);

  res.status(201).json({ success: true, data: { token } });
});

export const getMyActiveToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = await Token.findOne({
    student: req.user!.id,
    status: { $in: ['waiting', 'preparing', 'ready'] },
  }).sort({ createdAt: -1 });

  if (!token) {
    return res.json({ success: true, data: { token: null, position: null } });
  }

  const { position, peopleAhead } = await getQueuePositionInfo(token._id.toString());
  res.json({ success: true, data: { token, position, peopleAhead } });
});

export const getMyHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tokens = await Token.find({ student: req.user!.id }).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: { tokens } });
});

export const cancelMyToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = await cancelToken(req.params.id, req.user!.id);
  res.json({ success: true, data: { token } });
});

export const searchToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code } = req.params;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const token = await Token.findOne({
    tokenCode: code.toUpperCase(),
    createdAt: { $gte: startOfDay },
  }).populate('student', 'name studentId');
  if (!token) throw ApiError.notFound('No token found with that code today');
  res.json({ success: true, data: { token } });
});

// ---------- Staff actions ----------

export const getLiveQueueHandler = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const queue = await getLiveQueue();
  res.json({ success: true, data: { queue } });
});

export const getSkippedTokensHandler = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const skipped = await getSkippedTokens();
  res.json({ success: true, data: { skipped } });
});

export const callNext = asyncHandler(async (req: AuthRequest, res: Response) => {
  const counter = parseInt(req.body.counter, 10) || 1;
  const token = await callNextToken(counter);
  res.json({ success: true, data: { token } });
});

export const markReady = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = await markTokenReady(req.params.id);
  res.json({ success: true, data: { token } });
});

export const complete = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = await completeToken(req.params.id);
  res.json({ success: true, data: { token } });
});

export const skip = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = await skipToken(req.params.id);
  res.json({ success: true, data: { token } });
});

export const recall = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = await recallToken(req.params.id);
  res.json({ success: true, data: { token } });
});
