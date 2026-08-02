import { Response } from 'express';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../services/tokenService';
import { AuthRequest } from '../middlewares/auth';
import { env } from '../config/env';

function issueTokens(user: { _id: unknown; role: 'student' | 'staff' | 'admin'; name: string; refreshTokenVersion: number }) {
  const accessToken = signAccessToken({ sub: String(user._id), role: user.role, name: user.name });
  const refreshToken = signRefreshToken({ sub: String(user._id), version: user.refreshTokenVersion });
  return { accessToken, refreshToken };
}

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password, phone, studentId } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({ name, email, password, phone, studentId, role: 'student' });
  const { accessToken, refreshToken } = issueTokens(user);

  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  res.status(201).json({ success: true, data: { user, accessToken } });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated');
  }

  const { accessToken, refreshToken } = issueTokens(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  res.json({ success: true, data: { user, accessToken } });
});

export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw ApiError.unauthorized('No refresh token provided');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub);
  if (!user || user.refreshTokenVersion !== payload.version) {
    throw ApiError.unauthorized('Session has been revoked, please log in again');
  }

  const { accessToken, refreshToken } = issueTokens(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  res.json({ success: true, data: { user, accessToken } });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user.id, { $inc: { refreshTokenVersion: 1 } });
  }
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  res.json({ success: true, message: 'Logged out successfully' });
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, data: { user } });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, phone, avatarUrl, darkMode } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { $set: { name, phone, avatarUrl, darkMode } },
    { new: true, runValidators: true }
  );
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, data: { user } });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user!.id).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  user.password = newPassword;
  user.refreshTokenVersion += 1;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully. Please log in again.' });
});
