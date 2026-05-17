// ============================================================
// AI Agent Factory — Runtime Type Definitions
// NO DATABASE — All types are for in-memory runtime storage
// ============================================================

export type AgentType =
  | 'project_manager'
  | 'ui_ux'
  | 'frontend'
  | 'backend'
  | 'db_guidance'
  | 'notifications'
  | 'qa_debug'
  | 'devops';

export type ProjectStatus =
  | 'pending'
  | 'analyzing'
  | 'planning'
  | 'designing'
  | 'frontend_dev'
  | 'backend_dev'
  | 'db_setup'
  | 'notifications_setup'
  | 'testing'
  | 'debugging'
  | 'deploying'
  | 'completed'
  | 'failed';

export interface Project {
  id: string;
  name: string;
  description: string;
  idea: string;
  status: ProjectStatus;
  progress: number;
  currentStep: string;
  repoUrl?: string;
  deployUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentLog {
  id: string;
  projectId: string;
  agent: AgentType;
  action: string;
  content: string;
  status: 'running' | 'success' | 'error' | 'warning';
  timestamp: string;
}

export interface AgentMessage {
  id: string;
  projectId: string;
  role: 'system' | 'agent' | 'user';
  content: string;
  agent?: AgentType;
  timestamp: string;
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
}

export interface TechStack {
  frontend: string;
  backend: string;
  database: string;
  deployment: string;
  notifications: string;
}

export interface ExecutionPlan {
  steps: ExecutionStep[];
  estimatedTime: string;
  complexity: 'low' | 'medium' | 'high';
  needsDatabase: boolean;
  needsNotifications: boolean;
}

export interface ExecutionStep {
  agent: AgentType;
  task: string;
  description: string;
  dependencies: AgentType[];
  estimatedDuration: string;
}

export interface ContextMessage {
  from: AgentType;
  to: AgentType | 'all';
  content: string;
  timestamp: string;
  type: 'info' | 'request' | 'result' | 'error';
}

export interface ErrorReport {
  problem: string;
  cause: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  solution: string;
  autoFixable: boolean;
  agent?: AgentType;
}

export interface AgentDefinition {
  name: string;
  nameAr: string;
  descriptionAr: string;
  icon: string;
  color: string;
  gradient: string;
  step: number;
}

export const AGENT_DEFINITIONS: Record<AgentType, AgentDefinition> = {
  project_manager: {
    name: 'Project Manager',
    nameAr: 'مدير المشروع',
    descriptionAr: 'يحلل المشروع ويقسم المهام وينسق العمل بين الوكلاء',
    icon: 'Brain',
    color: 'text-violet-600',
    gradient: 'from-violet-500 to-purple-600',
    step: 1,
  },
  ui_ux: {
    name: 'UI/UX Designer',
    nameAr: 'مصمم الواجهات',
    descriptionAr: 'يصمم الواجهات ويحسن تجربة المستخدم بإبداع',
    icon: 'Palette',
    color: 'text-pink-600',
    gradient: 'from-pink-500 to-rose-600',
    step: 2,
  },
  frontend: {
    name: 'Frontend Developer',
    nameAr: 'مطور الواجهة الأمامية',
    descriptionAr: 'يبني React/Next.js ويحسن الأداء والتفاعل',
    icon: 'Monitor',
    color: 'text-sky-600',
    gradient: 'from-sky-500 to-blue-600',
    step: 3,
  },
  backend: {
    name: 'Backend Developer',
    nameAr: 'مطور الخلفية',
    descriptionAr: 'يبني APIs والمنطق البرمجي والمصادقة وربط البيانات',
    icon: 'Server',
    color: 'text-emerald-600',
    gradient: 'from-emerald-500 to-teal-600',
    step: 4,
  },
  db_guidance: {
    name: 'Database Advisor',
    nameAr: 'مستشار البيانات',
    descriptionAr: 'يقترح MongoDB ويصمم Schema ويساعد في الربط والاستعلامات',
    icon: 'Database',
    color: 'text-amber-600',
    gradient: 'from-amber-500 to-orange-600',
    step: 5,
  },
  notifications: {
    name: 'Notifications Engineer',
    nameAr: 'مهندس الإشعارات',
    descriptionAr: 'يعد Push Notifications و FCM والمعالجة في الخلفية',
    icon: 'Bell',
    color: 'text-rose-600',
    gradient: 'from-rose-500 to-pink-600',
    step: 6,
  },
  qa_debug: {
    name: 'QA & Debug',
    nameAr: 'ضمان الجودة',
    descriptionAr: 'يكتشف الأخطاء ويصلحها ويمنع الأعطال ويحلل الأداء',
    icon: 'ShieldCheck',
    color: 'text-red-600',
    gradient: 'from-red-500 to-orange-600',
    step: 7,
  },
  devops: {
    name: 'DevOps Engineer',
    nameAr: 'مهندس العمليات',
    descriptionAr: 'GitHub + Vercel + CI/CD وإصلاح مشاكل البناء والنشر',
    icon: 'Rocket',
    color: 'text-indigo-600',
    gradient: 'from-indigo-500 to-violet-600',
    step: 8,
  },
};

export const STATUS_LABELS_AR: Record<ProjectStatus, string> = {
  pending: 'في الانتظار',
  analyzing: 'جاري التحليل',
  planning: 'جاري التخطيط',
  designing: 'جاري التصميم',
  frontend_dev: 'تطوير الواجهة',
  backend_dev: 'تطوير الخلفية',
  db_setup: 'إعداد قاعدة البيانات',
  notifications_setup: 'إعداد الإشعارات',
  testing: 'جاري الاختبار',
  debugging: 'إصلاح الأخطاء',
  deploying: 'جاري النشر',
  completed: 'مكتمل',
  failed: 'فشل',
};

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  analyzing: 'bg-violet-100 text-violet-700',
  planning: 'bg-purple-100 text-purple-700',
  designing: 'bg-pink-100 text-pink-700',
  frontend_dev: 'bg-sky-100 text-sky-700',
  backend_dev: 'bg-emerald-100 text-emerald-700',
  db_setup: 'bg-amber-100 text-amber-700',
  notifications_setup: 'bg-rose-100 text-rose-700',
  testing: 'bg-orange-100 text-orange-700',
  debugging: 'bg-red-100 text-red-700',
  deploying: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-800',
};
