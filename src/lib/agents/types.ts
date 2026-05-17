// AI Agent System - Core Types (Arabic System)
// نظام وكلاء الذكاء الاصطناعي - 15 وكيل متخصص

export type AgentType =
  | 'analyzer'      // 1. محلل المتطلبات
  | 'architect'     // 2. مهندس البنية
  | 'designer'      // 3. مصمم UI/UX
  | 'frontend'      // 4. متخصص الواجهة الأمامية
  | 'backend'       // 5. متخصص الخلفية
  | 'database'      // 6. مهندس قاعدة البيانات
  | 'developer'     // 7. المطور الرئيسي
  | 'reviewer'      // 8. مراجع الكود
  | 'tester'        // 9. مختبر الجودة
  | 'debugger'      // 10. مصحح الأخطاء
  | 'performance'   // 11. محسن الأداء
  | 'security'      // 12. مدقق الأمان
  | 'seo'           // 13. محسن محركات البحث
  | 'documenter'    // 14. الموثق
  | 'deployer';     // 15. مسؤول النشر

export type ProjectStatus =
  | 'pending'
  | 'analyzing'
  | 'architecting'
  | 'designing'
  | 'frontend_dev'
  | 'backend_dev'
  | 'database_dev'
  | 'developing'
  | 'reviewing'
  | 'testing'
  | 'debugging'
  | 'optimizing'
  | 'securing'
  | 'seo_optimizing'
  | 'documenting'
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
  databaseDesign?: string;
  apiDesign?: string[];
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

// Agent definitions with Arabic names, descriptions, and visual design
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
  emoji: string;
  step: number;
}> = {
  analyzer: {
    name: 'Analyzer',
    nameAr: 'محلل المتطلبات',
    description: 'Analyzes requirements and user needs',
    descriptionAr: 'يحلل متطلبات المشروع واحتياجات المستخدم بدقة متناهية ويحدد الميزات والأهداف',
    icon: 'Search',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    gradient: 'from-violet-500 to-purple-600',
    emoji: '🔍',
    step: 1,
  },
  architect: {
    name: 'Architect',
    nameAr: 'مهندس البنية',
    description: 'Designs system architecture and database',
    descriptionAr: 'يصمم بنية النظام وقاعدة البيانات بشكل احترافي ويحدد التقنيات المستخدمة',
    icon: 'Building2',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    gradient: 'from-blue-500 to-cyan-600',
    emoji: '🏗️',
    step: 2,
  },
  designer: {
    name: 'Designer',
    nameAr: 'مصمم الواجهات',
    description: 'Creates UI/UX design system and components',
    descriptionAr: 'يصمم واجهات المستخدم وتجربة الاستخدام بإبداع مع نظام ألوان وخطوط احترافي',
    icon: 'Palette',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    gradient: 'from-pink-500 to-rose-600',
    emoji: '🎨',
    step: 3,
  },
  frontend: {
    name: 'Frontend Specialist',
    nameAr: 'متخصص الواجهة',
    description: 'Builds frontend components and pages',
    descriptionAr: 'يبني مكونات الواجهة الأمامية والصفحات التفاعلية بأحدث التقنيات',
    icon: 'Monitor',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    gradient: 'from-sky-500 to-blue-600',
    emoji: '🖥️',
    step: 4,
  },
  backend: {
    name: 'Backend Specialist',
    nameAr: 'متخصص الخلفية',
    description: 'Builds API routes and server logic',
    descriptionAr: 'يبني مسارات API والمنطق الخلفي والخدمات المتكاملة',
    icon: 'Server',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    gradient: 'from-emerald-500 to-teal-600',
    emoji: '⚙️',
    step: 5,
  },
  database: {
    name: 'Database Engineer',
    nameAr: 'مهندس البيانات',
    description: 'Designs and optimizes database schema',
    descriptionAr: 'يصمم ويحسن مخطط قاعدة البيانات والعلاقات والاستعلامات',
    icon: 'Database',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    gradient: 'from-amber-500 to-orange-600',
    emoji: '🗄️',
    step: 6,
  },
  developer: {
    name: 'Developer',
    nameAr: 'المطور الرئيسي',
    description: 'Builds the application code',
    descriptionAr: 'يكتب الكود البرمجي ويبني التطبيق بالكامل ويدمج جميع الأجزاء',
    icon: 'Code2',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    gradient: 'from-green-500 to-emerald-600',
    emoji: '💻',
    step: 7,
  },
  reviewer: {
    name: 'Reviewer',
    nameAr: 'مراجع الكود',
    description: 'Reviews code quality and best practices',
    descriptionAr: 'يراجع جودة الكود ويتأكد من أفضل الممارسات والمعايير العالمية',
    icon: 'FileCheck',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    gradient: 'from-orange-500 to-red-600',
    emoji: '📝',
    step: 8,
  },
  tester: {
    name: 'Tester',
    nameAr: 'مختبر الجودة',
    description: 'Tests application functionality',
    descriptionAr: 'يختبر وظائف التطبيق ويتأكد من جودته وسلامة الأداء',
    icon: 'TestTube2',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    gradient: 'from-rose-500 to-pink-600',
    emoji: '🧪',
    step: 9,
  },
  debugger: {
    name: 'Debugger',
    nameAr: 'مصحح الأخطاء',
    description: 'Finds and fixes errors automatically',
    descriptionAr: 'يكتشف الأخطاء ويصلحها تلقائياً بذكاء مع حلقة إصلاح ذاتية',
    icon: 'Bug',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    gradient: 'from-red-500 to-pink-600',
    emoji: '🔧',
    step: 10,
  },
  performance: {
    name: 'Performance Optimizer',
    nameAr: 'محسن الأداء',
    description: 'Optimizes application speed and efficiency',
    descriptionAr: 'يحسن سرعة وكفاءة التطبيق ويقلل حجم التحميل ويحسن الاستجابة',
    icon: 'Gauge',
    color: 'text-lime-600',
    bgColor: 'bg-lime-50',
    borderColor: 'border-lime-200',
    gradient: 'from-lime-500 to-green-600',
    emoji: '⚡',
    step: 11,
  },
  security: {
    name: 'Security Auditor',
    nameAr: 'مدقق الأمان',
    description: 'Audits security and protects the application',
    descriptionAr: 'يفحص الأمان ويحمي التطبيق من الثغرات والهجمات السيبرانية',
    icon: 'Shield',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    gradient: 'from-cyan-500 to-blue-600',
    emoji: '🛡️',
    step: 12,
  },
  seo: {
    name: 'SEO Optimizer',
    nameAr: 'محسن البحث',
    description: 'Optimizes for search engines',
    descriptionAr: 'يحسن ظهور التطبيق في محركات البحث ويضيف البيانات الوصفية',
    icon: 'SearchCode',
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-50',
    borderColor: 'border-fuchsia-200',
    gradient: 'from-fuchsia-500 to-purple-600',
    emoji: '🔎',
    step: 13,
  },
  documenter: {
    name: 'Documenter',
    nameAr: 'الموثق',
    description: 'Generates documentation and README',
    descriptionAr: 'يُنشئ التوثيق والملفات التوضيحية ودليل الاستخدام',
    icon: 'BookOpen',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    gradient: 'from-teal-500 to-cyan-600',
    emoji: '📖',
    step: 14,
  },
  deployer: {
    name: 'Deployer',
    nameAr: 'مسؤول النشر',
    description: 'Deploys to GitHub and Vercel',
    descriptionAr: 'ينشر التطبيق على GitHub و Vercel تلقائياً ويهيئ البيئة الإنتاجية',
    icon: 'Rocket',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    gradient: 'from-indigo-500 to-violet-600',
    emoji: '🚀',
    step: 15,
  },
};

// Pipeline execution order (15 agents)
export const AGENT_PIPELINE: AgentType[] = [
  'analyzer',
  'architect',
  'designer',
  'frontend',
  'backend',
  'database',
  'developer',
  'reviewer',
  'tester',
  'debugger',      // called on-demand when errors occur
  'performance',
  'security',
  'seo',
  'documenter',
  'deployer',
];

// Status to agent mapping
export const STATUS_AGENT_MAP: Record<string, AgentType> = {
  pending: 'analyzer',
  analyzing: 'analyzer',
  architecting: 'architect',
  designing: 'designer',
  frontend_dev: 'frontend',
  backend_dev: 'backend',
  database_dev: 'database',
  developing: 'developer',
  reviewing: 'reviewer',
  testing: 'tester',
  debugging: 'debugger',
  optimizing: 'performance',
  securing: 'security',
  seo_optimizing: 'seo',
  documenting: 'documenter',
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
  frontend_dev: 'تطوير الواجهة الأمامية',
  backend_dev: 'تطوير الخلفية',
  database_dev: 'بناء قاعدة البيانات',
  developing: 'بناء التطبيق',
  reviewing: 'مراجعة الكود',
  testing: 'اختبار الجودة',
  debugging: 'إصلاح الأخطاء',
  optimizing: 'تحسين الأداء',
  securing: 'فحص الأمان',
  seo_optimizing: 'تحسين محركات البحث',
  documenting: 'التوثيق',
  deploying: 'النشر والرفع',
  completed: 'مكتمل بنجاح',
  failed: 'فشل',
};
