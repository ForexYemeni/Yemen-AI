// Base Agent - Abstract class for all agents (Arabic system)

import { AgentType, AgentContext, LogStatus } from './types';
import { db } from '@/lib/db';

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
      await db.agentLog.create({
        data: { projectId, agent: this.type, action, content, status },
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
      await db.agentMessage.create({
        data: { projectId, role, content },
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
      await db.project.update({
        where: { id: projectId },
        data: {
          status,
          progress,
          currentStep,
          ...additionalData,
        },
      });
    } catch (error) {
      console.error(`[تحديث المشروع] ${this.type}:`, error);
    }
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
