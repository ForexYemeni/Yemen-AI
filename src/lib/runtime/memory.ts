// ============================================================
// AI Agent Factory — Runtime Memory Store
// Global in-memory storage — NO DATABASE
// Uses globalThis to persist across hot reloads in dev
// ============================================================

import { Project, AgentLog, AgentMessage, SharedContext } from './types';

export interface RuntimeStore {
  projects: Map<string, Project>;
  agentLogs: Map<string, AgentLog[]>;
  agentMessages: Map<string, AgentMessage[]>;
  settings: {
    githubToken?: string;
    vercelToken?: string;
    githubRepo?: string;
  };
  sharedContexts: Map<string, SharedContext>;
}

const globalForMemory = globalThis as unknown as { runtimeStore?: RuntimeStore };

export const runtimeStore: RuntimeStore =
  globalForMemory.runtimeStore ??= {
    projects: new Map(),
    agentLogs: new Map(),
    agentMessages: new Map(),
    settings: {},
    sharedContexts: new Map(),
  };

// ============================================================
// Helper functions for runtime store operations
// ============================================================

export function addLog(projectId: string, log: AgentLog): void {
  const logs = runtimeStore.agentLogs.get(projectId) ?? [];
  logs.push(log);
  runtimeStore.agentLogs.set(projectId, logs);
}

export function addMessage(projectId: string, message: AgentMessage): void {
  const messages = runtimeStore.agentMessages.get(projectId) ?? [];
  messages.push(message);
  runtimeStore.agentMessages.set(projectId, messages);
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const project = runtimeStore.projects.get(id);
  if (!project) return null;
  const updated = { ...project, ...updates, updatedAt: new Date().toISOString() };
  runtimeStore.projects.set(id, updated);
  return updated;
}

export function deleteProject(id: string): boolean {
  const existed = runtimeStore.projects.delete(id);
  runtimeStore.agentLogs.delete(id);
  runtimeStore.agentMessages.delete(id);
  runtimeStore.sharedContexts.delete(id);
  return existed;
}

export function getProjectLogs(id: string): AgentLog[] {
  return runtimeStore.agentLogs.get(id) ?? [];
}

export function getProjectMessages(id: string): AgentMessage[] {
  return runtimeStore.agentMessages.get(id) ?? [];
}

export function generateId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export function generateMsgId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}
