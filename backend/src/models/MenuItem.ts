import { Schema, model, Document, Types } from 'mongoose';

export type MenuCategory = 'Breakfast' | 'Meals' | 'Snacks' | 'Beverages' | 'Combos';

export interface IMenuItem extends Document {
  _id: Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 300 },
    category: {
      type: String,
      enum: ['Breakfast', 'Meals', 'Snacks', 'Beverages', 'Combos'],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String },
    prepTimeMinutes: { type: Number, required: true, min: 1, default: 5 },
    stock: { type: Number, default: 100, min: 0 },
    isAvailable: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    totalOrders: { type: Number, default: 0 },
  },
  { timestamps: true }
);

menuItemSchema.index({ category: 1 });
menuItemSchema.index({ name: 'text' });

export const MenuItem = model<IMenuItem>('MenuItem', menuItemSchema);
