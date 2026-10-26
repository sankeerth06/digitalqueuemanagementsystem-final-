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

type PaymentMethod = 'online' | 'counter';

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}

async function createTokenSafely(data: {
  student: string;
  items: {
    menuItem: unknown;
    name: string;
    price: number;
    quantity: number;
    prepTimeMinutes: number;
  }[];
  totalAmount: number;
  estimatedWaitMinutes: number;
  paymentMethod: PaymentMethod;
}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const { code, sequence } = await generateTokenCode();

      const token = await Token.create({
        tokenCode: code,
        sequence,
        student: data.student,
        items: data.items,
        totalAmount: data.totalAmount,
        estimatedWaitMinutes: data.estimatedWaitMinutes,
        paymentMethod: data.paymentMethod,
        paymentStatus: 'pending',
      });

      return token;
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
      continue;
    }
  }

  throw ApiError.conflict(
    'Unable to generate a unique token. Please try again.'
  );
}

async function emitQueue() {
  const queue = await getLiveQueue();
  getIO()
    .to('queue-room')
    .to('tv-room')
    .to('staff-room')
    .emit(SOCKET_EVENTS.QUEUE_UPDATED, queue);
}

/**
 * Student books a new token (no limit on number of tokens).
 */
export const bookToken = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const settings = await getSettings();

    if (settings.queuePaused) {
      throw ApiError.badRequest(
        settings.pauseReason ||
          'The queue is currently paused. Please try again shortly.'
      );
    }

    const {
      items,
      paymentMethod = 'counter',
    }: { items: BookItemInput[]; paymentMethod?: PaymentMethod } = req.body;

    if (!items || items.length === 0) {
      throw ApiError.badRequest(
        'At least one item is required to book a token'
      );
    }

    if (!['online', 'counter'].includes(paymentMethod)) {
      throw ApiError.badRequest('Payment method must be online or counter');
    }

    const menuItemIds = items.map((item) => item.menuItemId);

    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
    });

    if (menuItems.length !== items.length) {
      throw ApiError.badRequest(
        'One or more selected menu items could not be found'
      );
    }

    const tokenItems = items.map((input) => {
      const menuItem = menuItems.find(
        (item) => item._id.toString() === input.menuItemId
      )!;

      if (!menuItem.isAvailable || menuItem.stock < input.quantity) {
        throw ApiError.badRequest(
          `${menuItem.name} is currently unavailable or out of stock`
        );
      }

      return {
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: input.quantity,
        prepTimeMinutes: menuItem.prepTimeMinutes,
      };
    });

    const totalAmount = tokenItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const maxPrepTime = Math.max(
      ...tokenItems.map((item) => item.prepTimeMinutes)
    );

    const estimatedWaitMinutes = await estimateWaitMinutes(maxPrepTime);

    const token = await createTokenSafely({
      student: req.user!.id,
      items: tokenItems,
      totalAmount,
      estimatedWaitMinutes,
      paymentMethod,
    });

    await Promise.all(
      tokenItems.map((item) =>
        MenuItem.findByIdAndUpdate(item.menuItem, {
          $inc: {
            stock: -item.quantity,
            totalOrders: item.quantity,
          },
        })
      )
    );

    await emitQueue();

    getIO()
      .to('queue-room')
      .to('staff-room')
      .emit(SOCKET_EVENTS.TOKEN_CREATED, token);

    res.status(201).json({
      success: true,
      data: { token },
    });
  }
);

export const getMyActiveToken = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const token = await Token.findOne({
      student: req.user!.id,
      status: { $in: ['waiting', 'preparing', 'ready'] },
    }).sort({ createdAt: -1 });

    if (!token) {
      return res.json({
        success: true,
        data: { token: null, position: null },
      });
    }

    const { position, peopleAhead } = await getQueuePositionInfo(
      token._id.toString()
    );

    res.json({
      success: true,
      data: { token, position, peopleAhead },
    });
  }
);

export const getMyActiveTokens = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tokens = await Token.find({
      student: req.user!.id,
      status: { $in: ['waiting', 'preparing', 'ready'] },
    }).sort({ createdAt: -1 });

    const withPositions = await Promise.all(
      tokens.map(async (token) => {
        const { position, peopleAhead } = await getQueuePositionInfo(
          token._id.toString()
        );
        return { token, position, peopleAhead };
      })
    );

    res.json({
      success: true,
      data: { tokens: withPositions },
    });
  }
);

export const getMyHistory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tokens = await Token.find({
      student: req.user!.id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: { tokens },
    });
  }
);

export const cancelMyToken = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const token = await cancelToken(req.params.id, req.user!.id);

    res.json({
      success: true,
      data: { token },
    });
  }
);

export const searchToken = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { code } = req.params;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const token = await Token.findOne({
      tokenCode: code.toUpperCase(),
      createdAt: { $gte: startOfDay },
    }).populate('student', 'name studentId');

    if (!token) {
      throw ApiError.notFound('No token found with that code today');
    }

    res.json({
      success: true,
      data: { token },
    });
  }
);

/* =========================
   PAYMENT
========================= */

/**
 * Student pays online (simulated gateway).
 */
export const payOnline = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const token = await Token.findById(req.params.id);

    if (!token) throw ApiError.notFound('Token not found');

    if (token.student.toString() !== req.user!.id) {
      throw ApiError.forbidden('You can only pay for your own token');
    }
    if (token.paymentStatus === 'paid') {
      throw ApiError.badRequest('This token is already paid');
    }
    if (['cancelled', 'completed'].includes(token.status)) {
      throw ApiError.badRequest('This token can no longer be paid');
    }

    token.paymentMethod = 'online';
    token.paymentStatus = 'paid';
    token.paidAt = new Date();
    token.paymentReference = `PAY-${Date.now()}-${token.tokenCode}`;
    await token.save();

    await emitQueue();

    res.json({ success: true, data: { token } });
  }
);

/**
 * Staff marks a counter payment as received.
 */
export const markPaid = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const token = await Token.findById(req.params.id);

    if (!token) throw ApiError.notFound('Token not found');

    if (token.paymentStatus === 'paid') {
      throw ApiError.badRequest('This token is already paid');
    }

    token.paymentStatus = 'paid';
    token.paidAt = new Date();
    token.paymentReference = `CNT-${Date.now()}-${token.tokenCode}`;
    await token.save();

    await emitQueue();

    res.json({ success: true, data: { token } });
  }
);

/* =========================
   STAFF ACTIONS
========================= */

export const getLiveQueueHandler = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const queue = await getLiveQueue();

    res.json({
      success: true,
      data: { queue },
    });
  }
);

export const getSkippedTokensHandler = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const skipped = await getSkippedTokens();

    res.json({
      success: true,
      data: { skipped },
    });
  }
);

export const callNext = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const counter = parseInt(req.body.counter, 10) || 1;

    const token = await callNextToken(counter);

    res.json({
      success: true,
      data: { token },
    });
  }
);

export const markReady = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const token = await markTokenReady(req.params.id);

    res.json({
      success: true,
      data: { token },
    });
  }
);

export const complete = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const existing = await Token.findById(req.params.id);

    if (existing && existing.paymentStatus !== 'paid') {
      throw ApiError.badRequest(
        'Payment is pending. Collect payment at the counter and mark it paid first.'
      );
    }

    const token = await completeToken(req.params.id);

    res.json({
      success: true,
      data: { token },
    });
  }
);

export const skip = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const token = await skipToken(req.params.id);

    res.json({
      success: true,
      data: { token },
    });
  }
);

export const recall = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const token = await recallToken(req.params.id);

    res.json({
      success: true,
      data: { token },
    });
  }
);
