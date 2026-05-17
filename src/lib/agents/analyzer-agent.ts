import { BaseAgent } from './base-agent';
import { AgentContext, ExecutionPlan, PlanStep, TechStack } from './types';
import ZAI from 'z-ai-web-dev-sdk';

export class AnalyzerAgent extends BaseAgent {
  type = 'analyzer' as const;
  name = 'Analyzer';
  nameAr = 'محلل المتطلبات';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, idea } = context;

    await this.log(projectId, 'بدء_التحليل', `بدء تحليل المتطلبات للمشروع: "${idea}"`, 'info');
    await this.updateProject(projectId, 'analyzing', 5, 'تحليل المتطلبات');
    await this.addMessage(projectId, 'analyzer', '🔍 جاري تحليل متطلبات مشروعك بالتفصيل...');

    try {
      await this.delay(1500);
      const analysis = await this.analyzeRequirements(idea, projectId);

      await this.log(projectId, 'اكتمال_التحليل', `تم تحليل المتطلبات بنجاح - ${analysis.features.length} ميزة محددة`, 'success');
      await this.addMessage(projectId, 'analyzer', `✅ تم تحليل المتطلبات بنجاح!\n\n📋 **الميزات المحددة:** ${analysis.features.length}\n👥 **الفئة المستهدفة:** ${analysis.targetAudience}\n🎯 **الهدف الرئيسي:** ${analysis.mainGoal}`);

      await this.updateProject(projectId, 'analyzing', 15, 'تحليل المتطلبات', {
        plan: JSON.stringify(analysis),
      });

      context.plan = analysis;
      context.progress = 15;
      return context;
    } catch (error: any) {
      await this.log(projectId, 'فشل_التحليل', `فشل التحليل: ${error.message}`, 'error');
      await this.addMessage(projectId, 'analyzer', `❌ فشل تحليل المتطلبات: ${error.message}`);
      throw error;
    }
  }

  private async analyzeRequirements(idea: string, projectId: string): Promise<ExecutionPlan> {
    const zai = await ZAI.create();

    const systemPrompt = `أنت محلل متطلبات خبير. حلل فكرة المشروع وأنتج خطة تنفيذ مفصلة.
أجب ONLY بـ JSON صالح بدون markdown أو code blocks:
{
  "architecture": "وصف البنية",
  "designSystem": "نظام التصميم المقترح",
  "estimatedFiles": 12,
  "techStack": {
    "frontend": ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    "backend": ["Next.js API Routes"],
    "database": ["SQLite via Prisma"],
    "deployment": ["Vercel"]
  },
  "steps": [
    {
      "id": "step-1",
      "title": "Step Title",
      "titleAr": "عنوان الخطوة",
      "description": "What this step does",
      "agent": "architect",
      "dependencies": [],
      "status": "pending"
    }
  ],
  "features": ["ميزة 1", "ميزة 2"],
  "targetAudience": "الفئة المستهدفة",
  "mainGoal": "الهدف الرئيسي"
}

يجب أن تحتوي الخطوات على 8-12 خطوة مرتبة بالترتيب التالي:
architect → designer → developer → developer → developer → reviewer → tester → security → deployer

تأكد أن كل خطوة محددة وقابلة للتنفيذ.`;

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `حلل هذا المشروع وأنشئ خطة تنفيذ مفصلة: "${idea}"` }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      });

      let responseText = completion.choices[0]?.message?.content || '';
      if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
      }

      const planData = JSON.parse(responseText.trim());

      return {
        architecture: planData.architecture || 'تطبيق Next.js متكامل',
        designSystem: planData.designSystem || 'نظام تصميم حديث مع Tailwind CSS',
        estimatedFiles: planData.estimatedFiles || 12,
        techStack: planData.techStack || {
          frontend: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
          backend: ['Next.js API Routes'],
          database: ['SQLite via Prisma'],
          deployment: ['Vercel'],
        },
        steps: (planData.steps || []).map((step: any, index: number) => ({
          id: step.id || `step-${index + 1}`,
          title: step.title || `خطوة ${index + 1}`,
          titleAr: step.titleAr || step.title || `خطوة ${index + 1}`,
          description: step.description,
          agent: step.agent || 'developer',
          dependencies: step.dependencies || [],
          status: 'pending' as const,
        })),
        features: planData.features || [],
        targetAudience: planData.targetAudience || 'عام',
        mainGoal: planData.mainGoal || idea,
      };
    } catch {
      return this.getDefaultPlan(idea);
    }
  }

  private getDefaultPlan(idea: string): ExecutionPlan {
    return {
      architecture: 'تطبيق Next.js متكامل مع API Routes وقاعدة بيانات SQLite وواجهة احترافية',
      designSystem: 'نظام تصميم حديث مع Tailwind CSS وshadcn/ui مع دعم RTL للعربية',
      estimatedFiles: 14,
      techStack: {
        frontend: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS 4', 'shadcn/ui'],
        backend: ['Next.js API Routes'],
        database: ['SQLite via Prisma'],
        deployment: ['Vercel'],
      },
      steps: [
        { id: 's1', title: 'تصميم قاعدة البيانات', titleAr: 'تصميم قاعدة البيانات', description: 'تصميم وإنشاء مخطط قاعدة البيانات', agent: 'architect', dependencies: [], status: 'pending' },
        { id: 's2', title: 'تصميم نظام الألوان والخطوط', titleAr: 'تصميم نظام الألوان والخطوط', description: 'إنشاء نظام تصميم احترافي', agent: 'designer', dependencies: ['s1'], status: 'pending' },
        { id: 's3', title: 'بناء API الخلفي', titleAr: 'بناء API الخلفي', description: 'إنشاء مسارات API كاملة', agent: 'developer', dependencies: ['s2'], status: 'pending' },
        { id: 's4', title: 'بناء الواجهة الرئيسية', titleAr: 'بناء الواجهة الرئيسية', description: 'تصميم وبناء الصفحات الرئيسية', agent: 'developer', dependencies: ['s3'], status: 'pending' },
        { id: 's5', title: 'بناء المكونات التفاعلية', titleAr: 'بناء المكونات التفاعلية', description: 'إنشاء المكونات التفاعلية والنماذج', agent: 'developer', dependencies: ['s4'], status: 'pending' },
        { id: 's6', title: 'مراجعة الكود', titleAr: 'مراجعة الكود', description: 'مراجعة جودة الكود وأفضل الممارسات', agent: 'reviewer', dependencies: ['s5'], status: 'pending' },
        { id: 's7', title: 'اختبار الوظائف', titleAr: 'اختبار الوظائف', description: 'اختبار جميع وظائف التطبيق', agent: 'tester', dependencies: ['s6'], status: 'pending' },
        { id: 's8', title: 'فحص الأمان', titleAr: 'فحص الأمان', description: 'فحص أمان التطبيق وحمايته', agent: 'security', dependencies: ['s7'], status: 'pending' },
        { id: 's9', title: 'النشر والرفع', titleAr: 'النشر والرفع', description: 'نشر التطبيق على المنصات', agent: 'deployer', dependencies: ['s8'], status: 'pending' },
      ],
      features: ['إدارة البيانات', 'واجهة احترافية', 'API كامل', 'تصميم متجاوب'],
      targetAudience: 'المستخدمون العاميون والمطورون',
      mainGoal: idea,
    };
  }
}
