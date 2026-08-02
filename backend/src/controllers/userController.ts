import { Response } from 'express';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/auth';

export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role, search } = req.query;
  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: String(search), $options: 'i' } },
      { email: { $regex: String(search), $options: 'i' } },
    ];
  }
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: { users } });
});

export const createStaffOrAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password, role, counterAssigned } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({ name, email, password, role, counterAssigned });
  res.status(201).json({ success: true, data: { user } });
});

export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, phone, role, counterAssigned, isActive } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { name, phone, role, counterAssigned, isActive } },
    { new: true, runValidators: true }
  );
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, data: { user } });
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, message: 'User removed' });
});
