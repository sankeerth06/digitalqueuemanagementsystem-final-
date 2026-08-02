export type UserRole = 'student' | 'staff' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  studentId?: string;
  avatarUrl?: string;
  counterAssigned?: number;
  isActive: boolean;
  darkMode: boolean;
  createdAt: string;
}

export type MenuCategory = 'Breakfast' | 'Meals' | 'Snacks' | 'Beverages' | 'Combos';

export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  category: MenuCategory;
  price: number;
  imageUrl?: string;
  prepTimeMinutes: number;
  stock: number;
  isAvailable: boolean;
  isPopular: boolean;
  totalOrders: number;
}

export type TokenStatus = 'waiting' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'skipped';

export interface TokenItem {
  menuItem: string;
  name: string;
  price: number;
  quantity: number;
  prepTimeMinutes: number;
}

export interface Token {
  _id: string;
  tokenCode: string;
  sequence: number;
  student: string | { _id: string; name: string; studentId?: string };
  items: TokenItem[];
  totalAmount: number;
  status: TokenStatus;
  counter?: number;
  estimatedWaitMinutes: number;
  queuedAt: string;
  calledAt?: string;
  readyAt?: string;
  completedAt?: string;
  isVip: boolean;
  createdAt: string;
}

export type NotificationType = 'queue_near' | 'queue_current' | 'ready' | 'system' | 'announcement';

export interface AppNotification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  relatedToken?: string;
  createdAt: string;
}

export interface SystemSettings {
  _id: string;
  queuePaused: boolean;
  pauseReason?: string;
  totalCounters: number;
  announcement?: string;
  averagePrepBufferMinutes: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
