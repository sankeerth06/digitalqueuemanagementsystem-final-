import { Response } from 'express';
import { Notification } from '../models/Notification';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/auth';

export const listNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notifications = await Notification.find({ user: req.user!.id })
    .sort({ createdAt: -1 })
    .limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user!.id, read: false });
  res.json({ success: true, data: { notifications, unreadCount } });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user!.id }, { read: true });
  res.json({ success: true, message: 'Notification marked as read' });
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Notification.updateMany({ user: req.user!.id, read: false }, { read: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});
