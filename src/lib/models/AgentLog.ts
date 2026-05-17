// MongoDB Model - سجل الوكلاء

import mongoose, { Schema, Document } from 'mongoose';

export interface IAgentLog extends Document {
  projectId: mongoose.Types.ObjectId;
  agent: string;
  action: string;
  content: string;
  status: string;
  createdAt: Date;
}

const AgentLogSchema = new Schema<IAgentLog>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    agent: { type: String, required: true },
    action: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, default: 'info', enum: ['info', 'success', 'error', 'warning'] },
  },
  { timestamps: true }
);

AgentLogSchema.index({ projectId: 1, createdAt: -1 });

export const AgentLogModel = mongoose.models.AgentLog || mongoose.model<IAgentLog>('AgentLog', AgentLogSchema);
