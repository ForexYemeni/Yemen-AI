// AI Agent System - Core Types (Arabic System)

export type AgentType =
  | 'analyzer'    // محلل المتطلبات
  | 'architect'   // مهندس البنية
  | 'designer'    // مصمم UI/UX
  | 'developer'   // المطور
  | 'reviewer'    // مراجع الكود
  | 'tester'      // مختبر الجودة
  | 'debugger'    // مصحح الأخطاء
  | 'security'    // مدقق الأمان
  | 'deployer';   // مسؤول النشر

export type ProjectStatus =
  | 'pending'
  | 'analyzing'
  | 'architecting'
  | 'designing'
  | 'developing'
  | 'reviewing'
  | 'testing'
  | 'debugging'
  | 'securing'
  | 'deploying'
  | 'completed'
  | 'failed';

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
  designSystem: string;
  estimatedFiles: number;
  features?: string[];
  targetAudience?: string;
  mainGoal?: string;
}

export interface PlanStep {
  id: string;
  title: string;
  titleAr: string;
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
  progress: number;
}

// Agent definitions with Arabic names and colors
export const AGENT_DEFINITIONS: Record<AgentType, {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
}> = {
  analyzer: {
    name: 'Analyzer',
    nameAr: 'محلل المتطلبات',
    description: 'Analyzes requirements and user needs',
    descriptionAr: 'يحلل متطلبات المشروع واحتياجات المستخدم بدقة',
    icon: 'Search',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    gradient: 'from-violet-500 to-purple-600',
  },
  architect: {
    name: 'Architect',
    nameAr: 'مهندس البنية',
    description: 'Designs system architecture and database',
    descriptionAr: 'يصمم بنية النظام وقاعدة البيانات بشكل احترافي',
    icon: 'Building2',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    gradient: 'from-blue-500 to-cyan-600',
  },
  designer: {
    name: 'Designer',
    nameAr: 'مصمم الواجهات',
    description: 'Creates UI/UX design system and components',
    descriptionAr: 'يصمم واجهات المستخدم وتجربة الاستخدام بإبداع',
    icon: 'Palette',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    gradient: 'from-pink-500 to-rose-600',
  },
  developer: {
    name: 'Developer',
    nameAr: 'المطور الرئيسي',
    description: 'Builds the application code',
    descriptionAr: 'يكتب الكود البرمجي ويبني التطبيق بالكامل',
    icon: 'Code2',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    gradient: 'from-emerald-500 to-teal-600',
  },
  reviewer: {
    name: 'Reviewer',
    nameAr: 'مراجع الكود',
    description: 'Reviews code quality and best practices',
    descriptionAr: 'يراجع جودة الكود ويتأكد من أفضل الممارسات',
    icon: 'FileCheck',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    gradient: 'from-amber-500 to-orange-600',
  },
  tester: {
    name: 'Tester',
    nameAr: 'مختبر الجودة',
    description: 'Tests application functionality',
    descriptionAr: 'يختبر وظائف التطبيق ويتأكد من جودته',
    icon: 'TestTube2',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    gradient: 'from-orange-500 to-red-600',
  },
  debugger: {
    name: 'Debugger',
    nameAr: 'مصحح الأخطاء',
    description: 'Finds and fixes errors automatically',
    descriptionAr: 'يكتشف الأخطاء ويصلحها تلقائياً بذكاء',
    icon: 'Bug',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    gradient: 'from-red-500 to-pink-600',
  },
  security: {
    name: 'Security',
    nameAr: 'مدقق الأمان',
    description: 'Audits security and protects the application',
    descriptionAr: 'يفحص الأمان ويحمي التطبيق من الثغرات',
    icon: 'Shield',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    gradient: 'from-cyan-500 to-blue-600',
  },
  deployer: {
    name: 'Deployer',
    nameAr: 'مسؤول النشر',
    description: 'Deploys to GitHub and Vercel',
    descriptionAr: 'ينشر التطبيق على GitHub و Vercel تلقائياً',
    icon: 'Rocket',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    gradient: 'from-indigo-500 to-violet-600',
  },
};

// Pipeline execution order
export const AGENT_PIPELINE: AgentType[] = [
  'analyzer',
  'architect',
  'designer',
  'developer',
  'reviewer',
  'tester',
  'security',
  'deployer',
  // debugger is called on-demand when errors occur
];

// Status to agent mapping
export const STATUS_AGENT_MAP: Record<string, AgentType> = {
  pending: 'analyzer',
  analyzing: 'analyzer',
  architecting: 'architect',
  designing: 'designer',
  developing: 'developer',
  reviewing: 'reviewer',
  testing: 'tester',
  debugging: 'debugger',
  securing: 'security',
  deploying: 'deployer',
  completed: 'deployer',
  failed: 'debugger',
};

// Arabic status labels
export const STATUS_LABELS_AR: Record<string, string> = {
  pending: 'في الانتظار',
  analyzing: 'تحليل المتطلبات',
  architecting: 'تصميم البنية',
  designing: 'تصميم الواجهات',
  developing: 'بناء التطبيق',
  reviewing: 'مراجعة الكود',
  testing: 'اختبار الجودة',
  debugging: 'إصلاح الأخطاء',
  securing: 'فحص الأمان',
  deploying: 'النشر والرفع',
  completed: 'مكتمل بنجاح',
  failed: 'فشل',
};
