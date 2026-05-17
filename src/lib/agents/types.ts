// AI Agent System - Core Types

export type AgentType = 'planner' | 'builder' | 'debugger' | 'devops';
export type ProjectStatus = 'pending' | 'planning' | 'building' | 'debugging' | 'deploying' | 'completed' | 'failed';
export type LogStatus = 'info' | 'success' | 'error' | 'warning';

export interface ProjectIdea {
  name: string;
  description: string;
  idea: string;
}

export interface ExecutionPlan {
  steps: PlanStep[];
  techStack: TechStack;
  architecture: string;
  estimatedFiles: number;
}

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  agent: AgentType;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface TechStack {
  frontend: string[];
  backend: string[];
  database: string[];
  deployment: string[];
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
}

export interface BuildResult {
  success: boolean;
  files: CodeFile[];
  errors: string[];
  warnings: string[];
}

export interface DeployResult {
  success: boolean;
  repoUrl?: string;
  deployUrl?: string;
  error?: string;
}

export interface AgentAction {
  agent: AgentType;
  action: string;
  content: string;
  status: LogStatus;
}

export interface AgentContext {
  projectId: string;
  idea: string;
  plan?: ExecutionPlan;
  codeFiles?: CodeFile[];
  errorLog?: string;
  retryCount: number;
  maxRetries: number;
}
