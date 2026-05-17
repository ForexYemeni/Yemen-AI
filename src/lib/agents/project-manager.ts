// ============================================================
// Project Manager Agent — يدير المشروع ويحلل الفكرة ويقسم المهام
// ============================================================

import { AgentType, ExecutionPlan, TechStack, CodeFile } from '../runtime/types';
import { SharedContext } from '../runtime/shared-context';
import { addLog, generateLogId, runtimeStore } from '../runtime/memory';

export async function runProjectManagerAgent(ctx: SharedContext): Promise<void> {
  const projectId = ctx.projectId;

  addLog(projectId, {
    id: generateLogId(),
    projectId,
    agent: 'project_manager',
    action: 'start_analysis',
    content: 'بدأ تحليل المشروع وفهم الفكرة...',
    status: 'running',
    timestamp: new Date().toISOString(),
  });

  try {
    // Analyze the project idea
    const analysis = await analyzeIdea(ctx.idea);

    // Determine tech stack
    ctx.techStack = analysis.techStack;
    ctx.needsDatabase = analysis.needsDatabase;
    ctx.needsNotifications = analysis.needsNotifications;
    ctx.architecture = analysis.architecture;

    // Create execution plan
    ctx.executionPlan = createExecutionPlan(ctx);

    // Generate project architecture document
    const archFile: CodeFile = {
      path: 'docs/architecture.md',
      content: generateArchitectureDoc(ctx),
      language: 'markdown',
    };
    ctx.addCodeFile(archFile);

    // Generate package.json
    const pkgFile: CodeFile = {
      path: 'package.json',
      content: generatePackageJson(ctx),
      language: 'json',
    };
    ctx.addCodeFile(pkgFile);

    // Update shared context
    ctx.setAgentResult('project_manager', {
      analysis,
      executionPlan: ctx.executionPlan,
      techStack: ctx.techStack,
    });

    ctx.addMessage('project_manager', 'all', 'تم تحليل المشروع وإنشاء خطة التنفيذ', 'result');

    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'project_manager',
      action: 'analysis_complete',
      content: `تم التحليل: ${analysis.summary} | التقنيات: ${ctx.techStack.frontend} + ${ctx.techStack.backend}`,
      status: 'success',
      timestamp: new Date().toISOString(),
    });

    ctx.setProgress(12);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
    ctx.addMessage('project_manager', 'all', `فشل التحليل: ${errMsg}`, 'error');
    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'project_manager',
      action: 'analysis_error',
      content: errMsg,
      status: 'error',
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

interface IdeaAnalysis {
  summary: string;
  techStack: TechStack;
  needsDatabase: boolean;
  needsNotifications: boolean;
  architecture: string;
  features: string[];
  pages: string[];
}

async function analyzeIdea(idea: string): Promise<IdeaAnalysis> {
  // Try AI-powered analysis first
  try {
    const sdk = await import('z-ai-web-dev-sdk');
    if (sdk.default?.chat) {
      const response = await sdk.default.chat({
        messages: [
          {
            role: 'system',
            content: 'أنت محلل مشاريع برمجية. حلل الفكرة التالية وأعد النتيجة بتنسيق JSON فقط يحتوي على: summary, techStack {frontend, backend, database, deployment, notifications}, needsDatabase (boolean), needsNotifications (boolean), architecture (string), features (string[]), pages (string[]). التقنيات الافتراضية: Next.js, Node.js, MongoDB, Vercel, Firebase.',
          },
          { role: 'user', content: idea },
        ],
      });
      const text = typeof response === 'string' ? response : JSON.stringify(response);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch {
    // Fallback to template analysis
  }

  // Template-based fallback analysis
  const lowerIdea = idea.toLowerCase();
  const needsDb = /بيان|داتا|قاعد|تخزين|حفظ|مستخدم|حساب|دخول|سجل|data|store|user|auth|login|register|database|db/i.test(idea);
  const needsNotif = /إشعار|تنبيه|رسال|notif|push|alert|message|reminder/i.test(idea);

  return {
    summary: `مشروع: ${idea.substring(0, 100)}`,
    techStack: {
      frontend: 'Next.js 16 + React 19 + Tailwind CSS 4 + shadcn/ui',
      backend: 'Next.js API Routes + Node.js',
      database: needsDb ? 'MongoDB + Mongoose' : 'غير مطلوب',
      deployment: 'Vercel + GitHub',
      notifications: needsNotif ? 'Firebase Cloud Messaging' : 'غير مطلوب',
    },
    needsDatabase: needsDb,
    needsNotifications: needsNotif,
    architecture: 'Next.js App Router with Server Components and API Routes',
    features: extractFeatures(idea),
    pages: extractPages(idea),
  };
}

function extractFeatures(idea: string): string[] {
  const features: string[] = ['واجهة مستخدم متجاوبة', 'تصميم عصري'];
  if (/تسج|حساب|دخول|auth|login|register|sign/i.test(idea)) features.push('نظام مصادقة');
  if (/بحث|search/i.test(idea)) features.push('بحث متقدم');
  if (/دفع|payment|pay/i.test(idea)) features.push('بوابة دفع');
  if (/إشعار|notif/i.test(idea)) features.push('نظام إشعارات');
  if (/لوحة|dashboard|admin/i.test(idea)) features.push('لوحة تحكم');
  if (/ملف|profile/i.test(idea)) features.push('ملفات شخصية');
  return features;
}

function extractPages(idea: string): string[] {
  const pages: string[] = ['الصفحة الرئيسية', 'صفحة حول'];
  if (/تسج|حساب|دخول|auth|login/i.test(idea)) pages.push('تسجيل الدخول', 'إنشاء حساب');
  if (/لوحة|dashboard/i.test(idea)) pages.push('لوحة التحكم');
  if (/ملف|profile/i.test(idea)) pages.push('الملف الشخصي');
  if (/منتج|product|shop|متجر/i.test(idea)) pages.push('المنتجات', 'تفاصيل المنتج', 'السلة');
  return pages;
}

function createExecutionPlan(ctx: SharedContext): ExecutionPlan {
  const steps = [
    { agent: 'project_manager' as AgentType, task: 'تحليل المشروع', description: 'تحليل الفكرة وإنشاء خطة التنفيذ', dependencies: [] as AgentType[], estimatedDuration: '30 ثانية' },
    { agent: 'ui_ux' as AgentType, task: 'تصميم الواجهات', description: 'تصميم نظام الألوان والمكونات', dependencies: ['project_manager'] as AgentType[], estimatedDuration: '45 ثانية' },
    { agent: 'frontend' as AgentType, task: 'تطوير الواجهة', description: 'بناء صفحات React/Next.js', dependencies: ['ui_ux'] as AgentType[], estimatedDuration: '60 ثانية' },
    { agent: 'backend' as AgentType, task: 'تطوير الخلفية', description: 'بناء APIs والمنطق البرمجي', dependencies: ['project_manager'] as AgentType[], estimatedDuration: '60 ثانية' },
  ];

  if (ctx.needsDatabase) {
    steps.push({ agent: 'db_guidance' as AgentType, task: 'إعداد قاعدة البيانات', description: 'تصميم Schema وإنشاء نماذج MongoDB', dependencies: ['backend'] as AgentType[], estimatedDuration: '45 ثانية' });
  }
  if (ctx.needsNotifications) {
    steps.push({ agent: 'notifications' as AgentType, task: 'إعداد الإشعارات', description: 'تهيئة FCM والإشعارات', dependencies: ['backend'] as AgentType[], estimatedDuration: '30 ثانية' });
  }

  steps.push(
    { agent: 'qa_debug' as AgentType, task: 'فحص الجودة', description: 'مراجعة الكود واكتشاف الأخطاء', dependencies: ['frontend', 'backend'] as AgentType[], estimatedDuration: '45 ثانية' },
    { agent: 'devops' as AgentType, task: 'النشر', description: 'نشر المشروع على Vercel', dependencies: ['qa_debug'] as AgentType[], estimatedDuration: '30 ثانية' },
  );

  return {
    steps,
    estimatedTime: '5-10 دقائق',
    complexity: steps.length > 6 ? 'high' : steps.length > 4 ? 'medium' : 'low',
    needsDatabase: ctx.needsDatabase,
    needsNotifications: ctx.needsNotifications,
  };
}

function generateArchitectureDoc(ctx: SharedContext): string {
  return `# معمارية المشروع

## الفكرة
${ctx.idea}

## التقنيات المستخدمة
- **الواجهة الأمامية**: ${ctx.techStack?.frontend ?? 'Next.js'}
- **الخلفية**: ${ctx.techStack?.backend ?? 'Node.js'}
- **قاعدة البيانات**: ${ctx.techStack?.database ?? 'MongoDB'}
- **النشر**: ${ctx.techStack?.deployment ?? 'Vercel'}
- **الإشعارات**: ${ctx.techStack?.notifications ?? 'Firebase'}

## المعمارية
${ctx.architecture ?? 'Next.js App Router'}

## الميزات
${ctx.executionPlan?.steps.map(s => `- ${s.task}`).join('\n') ?? ''}
`;
}

function generatePackageJson(ctx: SharedContext): string {
  const pkg = {
    name: ctx.idea.substring(0, 30).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, ''),
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: {
      next: '^16.0.0',
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      'tailwindcss': '^4.0.0',
    },
  };
  return JSON.stringify(pkg, null, 2);
}
