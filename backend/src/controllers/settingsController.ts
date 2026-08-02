import { Response } from 'express';
import { getSettings, Settings } from '../models/Settings';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/auth';
import { getIO, SOCKET_EVENTS } from '../sockets/index';

export const getSystemSettings = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const settings = await getSettings();
  res.json({ success: true, data: { settings } });
});

export const updateSystemSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await getSettings();
  const { totalCounters, averagePrepBufferMinutes, announcement } = req.body;

  if (totalCounters !== undefined) settings.totalCounters = totalCounters;
  if (averagePrepBufferMinutes !== undefined) settings.averagePrepBufferMinutes = averagePrepBufferMinutes;
  if (announcement !== undefined) settings.announcement = announcement;

  await settings.save();
  getIO().to('queue-room').to('tv-room').to('staff-room').emit(SOCKET_EVENTS.SETTINGS_UPDATED, settings);
  res.json({ success: true, data: { settings } });
});

export const pauseQueue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await getSettings();
  settings.queuePaused = true;
  settings.pauseReason = req.body.reason || 'The canteen queue is temporarily paused.';
  await settings.save();
  getIO().to('queue-room').to('tv-room').to('staff-room').emit(SOCKET_EVENTS.SETTINGS_UPDATED, settings);
  res.json({ success: true, data: { settings } });
});

export const resumeQueue = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const settings = await getSettings();
  settings.queuePaused = false;
  settings.pauseReason = undefined;
  await settings.save();
  getIO().to('queue-room').to('tv-room').to('staff-room').emit(SOCKET_EVENTS.SETTINGS_UPDATED, settings);
  res.json({ success: true, data: { settings } });
});
