import { Schema, model, Document, Types } from 'mongoose';

export type TokenStatus =
  | 'waiting'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'skipped';

export interface ITokenItem {
  menuItem: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  prepTimeMinutes: number;
}

export interface IToken extends Document {
  _id: Types.ObjectId;
  tokenCode: string;
  sequence: number;
  student: Types.ObjectId;
  items: ITokenItem[];
  totalAmount: number;
  status: TokenStatus;
  counter?: number;
  estimatedWaitMinutes: number;
  queuedAt: Date;
  calledAt?: Date;
  readyAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  isVip: boolean;
  notifiedNearTurn: boolean;
  notifiedCurrentTurn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tokenItemSchema = new Schema<ITokenItem>(
  {
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    prepTimeMinutes: { type: Number, required: true },
  },
  { _id: false }
);

const tokenSchema = new Schema<IToken>(
  {
    tokenCode: { type: String, required: true, unique: true },
    sequence: { type: Number, required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [tokenItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['waiting', 'preparing', 'ready', 'completed', 'cancelled', 'skipped'],
      default: 'waiting',
    },
    counter: { type: Number },
    estimatedWaitMinutes: { type: Number, default: 0 },
    queuedAt: { type: Date, default: Date.now },
    calledAt: { type: Date },
    readyAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    isVip: { type: Boolean, default: false },
    notifiedNearTurn: { type: Boolean, default: false },
    notifiedCurrentTurn: { type: Boolean, default: false },
  },
  { timestamps: true }
);

tokenSchema.index({ status: 1, sequence: 1 });
tokenSchema.index({ student: 1, createdAt: -1 });

export const Token = model<IToken>('Token', tokenSchema);
