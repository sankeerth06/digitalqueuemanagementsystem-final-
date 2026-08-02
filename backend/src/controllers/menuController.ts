import { Response } from 'express';
import { MenuItem } from '../models/MenuItem';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/auth';

export const listMenuItems = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category, search, availableOnly } = req.query;
  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;
  if (availableOnly === 'true') filter.isAvailable = true;
  if (search) filter.$text = { $search: String(search) };

  const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
  res.json({ success: true, data: { items } });
});

export const getMenuItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw ApiError.notFound('Menu item not found');
  res.json({ success: true, data: { item } });
});

export const createMenuItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await MenuItem.create(req.body);
  res.status(201).json({ success: true, data: { item } });
});

export const updateMenuItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) throw ApiError.notFound('Menu item not found');
  res.json({ success: true, data: { item } });
});

export const deleteMenuItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) throw ApiError.notFound('Menu item not found');
  res.json({ success: true, message: 'Menu item removed' });
});
