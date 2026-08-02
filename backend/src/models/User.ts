import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export type UserRole = 'student' | 'staff' | 'admin';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  studentId?: string;
  avatarUrl?: string;
  counterAssigned?: number;
  isActive: boolean;
  darkMode: boolean;
  favoriteItems: Types.ObjectId[];
  refreshTokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['student', 'staff', 'admin'], default: 'student' },
    phone: { type: String, trim: true },
    studentId: { type: String, trim: true },
    avatarUrl: { type: String },
    counterAssigned: { type: Number },
    isActive: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
    favoriteItems: [{ type: Schema.Types.ObjectId, ref: 'MenuItem' }],
    refreshTokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptSaltRounds);
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.password;
    delete obj.__v;
    return obj;
  },
});

export const User = model<IUser>('User', userSchema);
