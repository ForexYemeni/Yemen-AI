// Base Agent - Abstract class for all agents

import { AgentType, AgentContext, AgentAction } from './types';
import { db } from '@/lib/db';

export abstract class BaseAgent {
  abstract type: AgentType;
  abstract name: string;
  abstract description: string;

  abstract execute(context: AgentContext): Promise<AgentContext>;

  protected async log(
    projectId: string,
    action: string,
    content: string,
    status: 'info' | 'success' | 'error' | 'warning' = 'info'
  ) {
    try {
      await db.agentLog.create({
        data: {
          projectId,
          agent: this.type,
          action,
          content,
          status,
        },
      });
    } catch (error) {
      console.error(`[AgentLog Error] ${this.type}:`, error);
    }
  }

  protected async addMessage(
    projectId: string,
    role: string,
    content: string
  ) {
    try {
      await db.agentMessage.create({
        data: {
          projectId,
          role,
          content,
        },
      });
    } catch (error) {
      console.error(`[AgentMessage Error] ${this.type}:`, error);
    }
  }

  protected async updateProjectStatus(projectId: string, status: string, additionalData?: Record<string, any>) {
    try {
      await db.project.update({
        where: { id: projectId },
        data: {
          status,
          ...additionalData,
        },
      });
    } catch (error) {
      console.error(`[UpdateProject Error] ${this.type}:`, error);
    }
  }
}
