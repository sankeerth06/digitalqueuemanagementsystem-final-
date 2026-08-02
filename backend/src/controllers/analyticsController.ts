import { Response } from 'express';
import { Token } from '../models/Token';
import { MenuItem } from '../models/MenuItem';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/auth';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const getOverview = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const startOfDay = daysAgo(0);

  const [todayOrders, todayRevenueAgg, activeQueueLength, cancelledToday, completedTodayAgg] =
    await Promise.all([
      Token.countDocuments({ createdAt: { $gte: startOfDay } }),
      Token.aggregate([
        { $match: { createdAt: { $gte: startOfDay }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Token.countDocuments({ status: { $in: ['waiting', 'preparing'] } }),
      Token.countDocuments({ createdAt: { $gte: startOfDay }, status: 'cancelled' }),
      Token.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay },
            status: 'completed',
            calledAt: { $exists: true },
            completedAt: { $exists: true },
          },
        },
        {
          $project: {
            durationMinutes: {
              $divide: [{ $subtract: ['$completedAt', '$calledAt'] }, 60000],
            },
          },
        },
        { $group: { _id: null, avgDuration: { $avg: '$durationMinutes' } } },
      ]),
    ]);

  res.json({
    success: true,
    data: {
      todayOrders,
      todayRevenue: todayRevenueAgg[0]?.total || 0,
      activeQueueLength,
      cancelledToday,
      avgCompletionMinutes: Math.round((completedTodayAgg[0]?.avgDuration || 0) * 10) / 10,
    },
  });
});

export const getDailyOrdersTrend = asyncHandler(async (req: AuthRequest, res: Response) => {
  const days = parseInt(String(req.query.days || '7'), 10);
  const since = daysAgo(days - 1);

  const results = await Token.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data: { trend: results } });
});

export const getPeakHours = asyncHandler(async (req: AuthRequest, res: Response) => {
  const days = parseInt(String(req.query.days || '7'), 10);
  const since = daysAgo(days - 1);

  const results = await Token.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data: { peakHours: results } });
});

export const getTopItems = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const items = await MenuItem.find().sort({ totalOrders: -1 }).limit(8);
  res.json({ success: true, data: { items } });
});

export const getRevenueByCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const days = parseInt(String(req.query.days || '30'), 10);
  const since = daysAgo(days - 1);

  const results = await Token.aggregate([
    { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'menuitems',
        localField: 'items.menuItem',
        foreignField: '_id',
        as: 'menuItemDoc',
      },
    },
    { $unwind: '$menuItemDoc' },
    {
      $group: {
        _id: '$menuItemDoc.category',
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  res.json({ success: true, data: { categories: results } });
});
