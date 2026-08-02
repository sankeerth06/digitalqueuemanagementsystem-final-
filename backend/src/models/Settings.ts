import { Schema, model, Document } from 'mongoose';

export interface ISettings extends Document {
  queuePaused: boolean;
  pauseReason?: string;
  totalCounters: number;
  announcement?: string;
  averagePrepBufferMinutes: number;
  singletonKey: string;
}

const settingsSchema = new Schema<ISettings>(
  {
    queuePaused: { type: Boolean, default: false },
    pauseReason: { type: String },
    totalCounters: { type: Number, default: 2, min: 1 },
    announcement: { type: String },
    averagePrepBufferMinutes: { type: Number, default: 1 },
    singletonKey: { type: String, default: 'GLOBAL', unique: true },
  },
  { timestamps: true }
);

export const Settings = model<ISettings>('Settings', settingsSchema);

export async function getSettings(): Promise<ISettings> {
  let settings = await Settings.findOne({ singletonKey: 'GLOBAL' });
  if (!settings) {
    settings = await Settings.create({ singletonKey: 'GLOBAL' });
  }
  return settings;
}
