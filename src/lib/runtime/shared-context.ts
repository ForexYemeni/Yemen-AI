// ============================================================
// AI Agent Factory — Shared Context
// Enables inter-agent communication via shared context objects
// ============================================================

import {
  AgentType,
  CodeFile,
  TechStack,
  ExecutionPlan,
  ContextMessage,
  ErrorReport,
} from './types';
import { runtimeStore, addLog, generateLogId } from './memory';

export class SharedContext {
  projectId: string;
  idea: string;
  architecture?: string;
  techStack?: TechStack;
  codeFiles: CodeFile[];
  errorLog?: string;
  retryCount: number;
  maxRetries: number;
  progress: number;
  agentResults: Map<string, unknown>;
  messages: ContextMessage[];
  executionPlan?: ExecutionPlan;
  errorReports: ErrorReport[];
  needsDatabase: boolean;
  needsNotifications: boolean;
  mode: 'new' | 'existing';
  githubUrl?: string;

  constructor(projectId: string, idea: string, mode: 'new' | 'existing' = 'new') {
    this.projectId = projectId;
    this.idea = idea;
    this.mode = mode;
    this.codeFiles = [];
    this.retryCount = 0;
    this.maxRetries = 3;
    this.progress = 0;
    this.agentResults = new Map();
    this.messages = [];
    this.errorReports = [];
    this.needsDatabase = false;
    this.needsNotifications = false;
  }

  setAgentResult(agent: AgentType, result: unknown): void {
    this.agentResults.set(agent, result);
    this.sync();
  }

  getAgentResult(agent: AgentType): unknown {
    return this.agentResults.get(agent);
  }

  addMessage(from: AgentType, to: AgentType | 'all', content: string, type: ContextMessage['type'] = 'info'): void {
    const msg: ContextMessage = {
      from,
      to,
      content,
      type,
      timestamp: new Date().toISOString(),
    };
    this.messages.push(msg);

    // Also log to runtime store
    addLog(this.projectId, {
      id: generateLogId(),
      projectId: this.projectId,
      agent: from,
      action: `message_to_${to}`,
      content,
      status: type === 'error' ? 'error' : 'success',
      timestamp: new Date().toISOString(),
    });
  }

  addCodeFile(file: CodeFile): void {
    // Replace if file with same path exists
    const idx = this.codeFiles.findIndex(f => f.path === file.path);
    if (idx >= 0) {
      this.codeFiles[idx] = file;
    } else {
      this.codeFiles.push(file);
    }
  }

  addErrorReport(report: ErrorReport): void {
    this.errorReports.push(report);
  }

  sync(): void {
    // Persist the shared context to the runtime store
    runtimeStore.sharedContexts.set(this.projectId, this);
  }

  getProgress(): number {
    return this.progress;
  }

  setProgress(value: number): void {
    this.progress = Math.min(100, Math.max(0, value));
    this.sync();
  }

  toJSON(): Record<string, unknown> {
    return {
      projectId: this.projectId,
      idea: this.idea,
      architecture: this.architecture,
      techStack: this.techStack,
      codeFiles: this.codeFiles,
      errorLog: this.errorLog,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      progress: this.progress,
      agentResults: Object.fromEntries(this.agentResults),
      messages: this.messages,
      executionPlan: this.executionPlan,
      errorReports: this.errorReports,
      needsDatabase: this.needsDatabase,
      needsNotifications: this.needsNotifications,
      mode: this.mode,
      githubUrl: this.githubUrl,
    };
  }
}
