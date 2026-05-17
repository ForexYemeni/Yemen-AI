// MongoDB Model - الإعدادات

import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  githubToken?: string;
  vercelToken?: string;
  githubRepo?: string;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    githubToken: { type: String },
    vercelToken: { type: String },
    githubRepo: { type: String },
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
