// Base Agent - Abstract class for all agents (Arabic system)
// Uses MongoDB via Mongoose

import { AgentType, AgentContext, LogStatus } from './types';
import dbConnect from '@/lib/mongodb';
import { ProjectModel, AgentLogModel, AgentMessageModel } from '@/lib/models';

export abstract class BaseAgent {
  abstract type: AgentType;
  abstract name: string;
  abstract nameAr: string;

  abstract execute(context: AgentContext): Promise<AgentContext>;

  protected async log(
    projectId: string,
    action: string,
    content: string,
    status: LogStatus = 'info'
  ) {
    try {
      await dbConnect();
      await AgentLogModel.create({
        projectId,
        agent: this.type,
        action,
        content,
        status,
      });
    } catch (error) {
      console.error(`[سجل الوكيل] ${this.type}:`, error);
    }
  }

  protected async addMessage(
    projectId: string,
    role: string,
    content: string
  ) {
    try {
      await dbConnect();
      await AgentMessageModel.create({
        projectId,
        role,
        content,
      });
    } catch (error) {
      console.error(`[رسالة الوكيل] ${this.type}:`, error);
    }
  }

  protected async updateProject(
    projectId: string,
    status: string,
    progress: number,
    currentStep: string,
    additionalData?: Record<string, any>
  ) {
    try {
      await dbConnect();
      await ProjectModel.findByIdAndUpdate(
        projectId,
        {
          status,
          progress,
          currentStep,
          ...additionalData,
        },
        { new: true }
      );
    } catch (error) {
      console.error(`[تحديث المشروع] ${this.type}:`, error);
    }
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
