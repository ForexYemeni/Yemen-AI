// MongoDB Model - رسائل الوكلاء

import mongoose, { Schema, Document } from 'mongoose';

export interface IAgentMessage extends Document {
  projectId: mongoose.Types.ObjectId;
  role: string;
  content: string;
  createdAt: Date;
}

const AgentMessageSchema = new Schema<IAgentMessage>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    role: { type: String, required: true, enum: ['system', 'agent', 'user'] },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

AgentMessageSchema.index({ projectId: 1, createdAt: 1 });

export const AgentMessageModel = mongoose.models.AgentMessage || mongoose.model<IAgentMessage>('AgentMessage', AgentMessageSchema);
