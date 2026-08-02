import { Types } from 'mongoose';
import { Notification, NotificationType } from '../models/Notification';
import { getIO, SOCKET_EVENTS } from '../sockets/index';

export async function pushNotification(
  userId: Types.ObjectId | string,
  type: NotificationType,
  title: string,
  message: string,
  relatedToken?: Types.ObjectId | string
) {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    relatedToken,
  });

  getIO().to(`user-${userId}`).emit(SOCKET_EVENTS.NOTIFICATION_NEW, notification);
  return notification;
}
