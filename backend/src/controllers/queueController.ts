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

import {
  getIO,
  SOCKET_EVENTS,
} from '../sockets/index';

interface BookItemInput {
  menuItemId: string;
  quantity: number;
}

/**
 * Checks whether a MongoDB error is a duplicate-key error.
 */
function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}

/**
 * Creates a token safely.
 *
 * If two students order at exactly the same time,
 * MongoDB may detect a duplicate tokenCode.
 *
 * In that case we generate another tokenCode and retry.
 */
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
}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const {
        code,
        sequence,
      } = await generateTokenCode();

      const token = await Token.create({
        tokenCode: code,
        sequence,
        student: data.student,
        items: data.items,
        totalAmount: data.totalAmount,
        estimatedWaitMinutes:
          data.estimatedWaitMinutes,
      });

      return token;
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }

      // Another order got the same token.
      // Try again with the next sequence.
      continue;
    }
  }

  throw ApiError.conflict(
    'Unable to generate a unique token. Please try again.'
  );
}

/**
 * Student books a new token.
 */
export const bookToken = asyncHandler(
  async (
    req: AuthRequest,
    res: Response
  ) => {
    const settings = await getSettings();

    if (settings.queuePaused) {
      throw ApiError.badRequest(
        settings.pauseReason ||
          'The queue is currently paused. Please try again shortly.'
      );
    }

    const {
      items,
    }: {
      items: BookItemInput[];
    } = req.body;

    if (!items || items.length === 0) {
      throw ApiError.badRequest(
        'At least one item is required to book a token'
      );
    }

    /**
     * Prevent one student from having
     * multiple active tokens.
     */
    const existingActive =
      await Token.findOne({
        student: req.user!.id,
        status: {
          $in: [
            'waiting',
            'preparing',
            'ready',
          ],
        },
      });

    if (existingActive) {
      throw ApiError.conflict(
        'You already have an active token. Please complete or cancel it first.'
      );
    }

    /**
     * Get menu items.
     */
    const menuItemIds = items.map(
      (item) => item.menuItemId
    );

    const menuItems =
      await MenuItem.find({
        _id: {
          $in: menuItemIds,
        },
      });

    if (
      menuItems.length !==
      items.length
    ) {
      throw ApiError.badRequest(
        'One or more selected menu items could not be found'
      );
    }

    /**
     * Prepare token items.
     */
    const tokenItems = items.map(
      (input) => {
        const menuItem =
          menuItems.find(
            (item) =>
              item._id.toString() ===
              input.menuItemId
          )!;

        if (
          !menuItem.isAvailable ||
          menuItem.stock <
            input.quantity
        ) {
          throw ApiError.badRequest(
            `${menuItem.name} is currently unavailable or out of stock`
          );
        }

        return {
          menuItem: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: input.quantity,
          prepTimeMinutes:
            menuItem.prepTimeMinutes,
        };
      }
    );

    /**
     * Calculate order amount.
     */
    const totalAmount =
      tokenItems.reduce(
        (sum, item) =>
          sum +
          item.price *
            item.quantity,
        0
      );

    /**
     * Calculate preparation time.
     */
    const maxPrepTime =
      Math.max(
        ...tokenItems.map(
          (item) =>
            item.prepTimeMinutes
        )
      );

    const estimatedWaitMinutes =
      await estimateWaitMinutes(
        maxPrepTime
      );

    /**
     * Create token safely.
     */
    const token =
      await createTokenSafely({
        student: req.user!.id,
        items: tokenItems,
        totalAmount,
        estimatedWaitMinutes,
      });

    /**
     * Decrease stock and update
     * popularity/order counters.
     */
    await Promise.all(
      tokenItems.map(
        (item) =>
          MenuItem.findByIdAndUpdate(
            item.menuItem,
            {
              $inc: {
                stock:
                  -item.quantity,
                totalOrders:
                  item.quantity,
              },
            }
          )
      )
    );

    /**
     * Broadcast updated queue.
     */
    const queue =
      await getLiveQueue();

    getIO()
      .to('queue-room')
      .to('tv-room')
      .to('staff-room')
      .emit(
        SOCKET_EVENTS.QUEUE_UPDATED,
        queue
      );

    getIO()
      .to('queue-room')
      .to('staff-room')
      .emit(
        SOCKET_EVENTS.TOKEN_CREATED,
        token
      );

    res.status(201).json({
      success: true,
      data: {
        token,
      },
    });
  }
);

/**
 * Get student's active token.
 */
export const getMyActiveToken =
  asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const token =
        await Token.findOne({
          student: req.user!.id,
          status: {
            $in: [
              'waiting',
              'preparing',
              'ready',
            ],
          },
        }).sort({
          createdAt: -1,
        });

      if (!token) {
        return res.json({
          success: true,
          data: {
            token: null,
            position: null,
          },
        });
      }

      const {
        position,
        peopleAhead,
      } =
        await getQueuePositionInfo(
          token._id.toString()
        );

      res.json({
        success: true,
        data: {
          token,
          position,
          peopleAhead,
        },
      });
    }
  );

/**
 * Get student's order history.
 */
export const getMyHistory =
  asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const tokens =
        await Token.find({
          student: req.user!.id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(50);

      res.json({
        success: true,
        data: {
          tokens,
        },
      });
    }
  );

/**
 * Cancel student's token.
 */
export const cancelMyToken =
  asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const token =
        await cancelToken(
          req.params.id,
          req.user!.id
        );

      res.json({
        success: true,
        data: {
          token,
        },
      });
    }
  );

/**
 * Search token by code.
 */
export const searchToken =
  asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const { code } =
        req.params;

      const startOfDay =
        new Date();

      startOfDay.setHours(
        0,
        0,
        0,
        0
      );

      const token =
        await Token.findOne({
          tokenCode:
            code.toUpperCase(),
          createdAt: {
            $gte: startOfDay,
          },
        }).populate(
          'student',
          'name studentId'
        );

      if (!token) {
        throw ApiError.notFound(
          'No token found with that code today'
        );
      }

      res.json({
        success: true,
        data: {
          token,
        },
      });
    }
  );

/* =========================
   STAFF ACTIONS
========================= */

export const getLiveQueueHandler =
  asyncHandler(
    async (
      _req: AuthRequest,
      res: Response
    ) => {
      const queue =
        await getLiveQueue();

      res.json({
        success: true,
        data: {
          queue,
        },
      });
    }
  );

export const getSkippedTokensHandler =
  asyncHandler(
    async (
      _req: AuthRequest,
      res: Response
    ) => {
      const skipped =
        await getSkippedTokens();

      res.json({
        success: true,
        data: {
          skipped,
        },
      });
    }
  );

export const callNext =
  asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const counter =
        parseInt(
          req.body.counter,
          10
        ) || 1;

      const token =
        await callNextToken(
          counter
        );

      res.json({
        success: true,
        data: {
          token,
        },
      });
    }
  );

export const markReady =
  asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const token =
        await markTokenReady(
          req.params.id
        );

      res.json({
        success: true,
        data: {
          token,
        },
      });
    }
  );

export const complete =
  asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const token =
        await completeToken(
          req.params.id
        );

      res.json({
        success: true,
        data: {
          token,
        },
      });
    }
  );

export const skip =
  asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const token =
        await skipToken(
          req.params.id
        );

      res.json({
        success: true,
        data: {
          token,
        },
      });
    }
  );

export const recall =
  asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const token =
        await recallToken(
          req.params.id
        );

      res.json({
        success: true,
        data: {
          token,
        },
      });
    }
  );
