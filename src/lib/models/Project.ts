// MongoDB Models - نماذج قاعدة البيانات
// نموذج المشروع

import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  status: string;
  idea: string;
  plan?: string;
  codeFiles?: string;
  repoUrl?: string;
  deployUrl?: string;
  errorLog?: string;
  retryCount: number;
  progress: number;
  currentStep?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, default: '' },
    status: { type: String, required: true, default: 'pending', index: true },
    idea: { type: String, required: true },
    plan: { type: String },
    codeFiles: { type: String },
    repoUrl: { type: String },
    deployUrl: { type: String },
    errorLog: { type: String },
    retryCount: { type: Number, default: 0 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    currentStep: { type: String },
  },
  { timestamps: true }
);

ProjectSchema.index({ status: 1, createdAt: -1 });

export const ProjectModel = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
