// Agent Orchestrator - محرك التنسيق الذكي (15 Agents)
// ينفذ حلقة ذاتية: تحليل → تصميم → تطوير → مراجعة → اختبار → تحسين → أمان → SEO → توثيق → نشر

import { AnalyzerAgent } from './analyzer-agent';
import { ArchitectAgent } from './architect-agent';
import { DesignerAgent } from './designer-agent';
import { FrontendAgent } from './frontend-agent';
import { BackendAgent } from './backend-agent';
import { DatabaseAgent } from './database-agent';
import { DeveloperAgent } from './developer-agent';
import { ReviewerAgent } from './reviewer-agent';
import { TesterAgent } from './tester-agent';
import { DebuggerAgent } from './debugger-agent';
import { PerformanceAgent } from './performance-agent';
import { SecurityAgent } from './security-agent';
import { SeoAgent } from './seo-agent';
import { DocumenterAgent } from './documenter-agent';
import { DeployerAgent } from './deployer-agent';
import { AgentContext, ProjectIdea } from './types';
import { db } from '@/lib/db';

export class AgentOrchestrator {
  private analyzer: AnalyzerAgent;
  private architect: ArchitectAgent;
  private designer: DesignerAgent;
  private frontend: FrontendAgent;
  private backend: BackendAgent;
  private database: DatabaseAgent;
  private developer: DeveloperAgent;
  private reviewer: ReviewerAgent;
  private tester: TesterAgent;
  private debugger: DebuggerAgent;
  private performance: PerformanceAgent;
  private security: SecurityAgent;
  private seo: SeoAgent;
  private documenter: DocumenterAgent;
  private deployer: DeployerAgent;

  constructor() {
    this.analyzer = new AnalyzerAgent();
    this.architect = new ArchitectAgent();
    this.designer = new DesignerAgent();
    this.frontend = new FrontendAgent();
    this.backend = new BackendAgent();
    this.database = new DatabaseAgent();
    this.developer = new DeveloperAgent();
    this.reviewer = new ReviewerAgent();
    this.tester = new TesterAgent();
    this.debugger = new DebuggerAgent();
    this.performance = new PerformanceAgent();
    this.security = new SecurityAgent();
    this.seo = new SeoAgent();
    this.documenter = new DocumenterAgent();
    this.deployer = new DeployerAgent();
  }

  async execute(idea: ProjectIdea): Promise<string> {
    const project = await db.project.create({
      data: {
        name: idea.name,
        description: idea.description,
        idea: idea.idea,
        status: 'pending',
        progress: 0,
        currentStep: 'في الانتظار',
      },
    });

    const projectId = project.id;

    await db.agentMessage.create({
      data: {
        projectId,
        role: 'system',
        content: `🚀 تم بدء مشروع جديد: "${idea.name}"\n\n💡 الفكرة: ${idea.idea}\n\nسيعمل نظام الوكلاء الذكي الآن بشكل ذاتي عبر 15 مرحلة:\n1️⃣ تحليل المتطلبات\n2️⃣ تصميم البنية\n3️⃣ تصميم الواجهات\n4️⃣ تطوير الواجهة الأمامية\n5️⃣ تطوير الخلفية\n6️⃣ بناء قاعدة البيانات\n7️⃣ البناء المتكامل\n8️⃣ مراجعة الكود\n9️⃣ اختبار الجودة\n🔟 إصلاح الأخطاء (عند الحاجة)\n1️⃣1️⃣ تحسين الأداء\n1️⃣2️⃣ فحص الأمان\n1️⃣3️⃣ تحسين SEO\n1️⃣4️⃣ التوثيق\n1️⃣5️⃣ النشر والرفع`,
      },
    });

    // Start autonomous loop in background
    this.runAutonomousLoop(projectId, idea).catch(async (error) => {
      console.error('[منسق الوكلاء] خطأ فادح:', error);
      await db.project.update({
        where: { id: projectId },
        data: {
          status: 'failed',
          errorLog: `خطأ فادح: ${error.message}`,
          progress: 0,
          currentStep: 'فشل',
        },
      });
      await db.agentMessage.create({
        data: {
          projectId,
          role: 'system',
          content: `❌ حدث خطأ فادح: ${error.message}. يرجى المحاولة مرة أخرى.`,
        },
      });
    });

    return projectId;
  }

  private async runAutonomousLoop(projectId: string, idea: ProjectIdea): Promise<void> {
    let context: AgentContext = {
      projectId,
      idea: idea.idea,
      retryCount: 0,
      maxRetries: 3,
      progress: 0,
    };

    try {
      // المرحلة 1: تحليل المتطلبات
      console.log(`[منسق] المرحلة 1/15: تحليل المتطلبات - ${projectId}`);
      context = await this.analyzer.execute(context);

      // المرحلة 2: تصميم البنية
      console.log(`[منسق] المرحلة 2/15: تصميم البنية - ${projectId}`);
      context = await this.architect.execute(context);

      // المرحلة 3: تصميم الواجهات
      console.log(`[منسق] المرحلة 3/15: تصميم الواجهات - ${projectId}`);
      context = await this.designer.execute(context);

      // المرحلة 4: تطوير الواجهة الأمامية
      console.log(`[منسق] المرحلة 4/15: تطوير الواجهة الأمامية - ${projectId}`);
      context = await this.frontend.execute(context);

      // المرحلة 5: تطوير الخلفية
      console.log(`[منسق] المرحلة 5/15: تطوير الخلفية - ${projectId}`);
      context = await this.backend.execute(context);

      // المرحلة 6: بناء قاعدة البيانات
      console.log(`[منسق] المرحلة 6/15: بناء قاعدة البيانات - ${projectId}`);
      context = await this.database.execute(context);

      // المرحلة 7: البناء المتكامل (المطور الرئيسي)
      console.log(`[منسق] المرحلة 7/15: البناء المتكامل - ${projectId}`);
      context = await this.developer.execute(context);

      // إذا ظهرت أخطاء في البناء، حاول الإصلاح
      if (context.errorLog) {
        console.log(`[منسق] مرحلة إصلاح: تصحيح الأخطاء - ${projectId}`);
        context = await this.debugger.execute(context);
        if (!context.errorLog) {
          await db.agentMessage.create({
            data: { projectId, role: 'system', content: '🔄 إعادة البناء بعد إصلاح الأخطاء...' },
          });
          context = await this.developer.execute(context);
        }
      }

      // المرحلة 8: مراجعة الكود
      if (!context.errorLog) {
        console.log(`[منسق] المرحلة 8/15: مراجعة الكود - ${projectId}`);
        context = await this.reviewer.execute(context);
      }

      // المرحلة 9: اختبار الجودة
      if (!context.errorLog) {
        console.log(`[منسق] المرحلة 9/15: اختبار الجودة - ${projectId}`);
        context = await this.tester.execute(context);

        // إذا فشلت الاختبارات، حاول الإصلاح
        if (context.errorLog && context.retryCount < context.maxRetries) {
          await db.agentMessage.create({
            data: { projectId, role: 'system', content: '🔧 فشلت بعض الاختبارات - جاري الإصلاح التلقائي...' },
          });
          context = await this.debugger.execute(context);
          if (!context.errorLog) {
            context = await this.tester.execute(context);
          }
        }
      }

      // المرحلة 10: إصلاح الأخطاء (إذا تبقت أخطاء)
      if (context.errorLog && context.retryCount < context.maxRetries) {
        console.log(`[منسق] المرحلة 10/15: إصلاح الأخطاء - ${projectId}`);
        context = await this.debugger.execute(context);
        if (!context.errorLog) {
          context = await this.developer.execute(context);
        }
      }

      // المرحلة 11: تحسين الأداء
      if (!context.errorLog) {
        console.log(`[منسق] المرحلة 11/15: تحسين الأداء - ${projectId}`);
        context = await this.performance.execute(context);
      }

      // المرحلة 12: فحص الأمان
      if (!context.errorLog) {
        console.log(`[منسق] المرحلة 12/15: فحص الأمان - ${projectId}`);
        context = await this.security.execute(context);
      }

      // المرحلة 13: تحسين SEO
      if (!context.errorLog) {
        console.log(`[منسق] المرحلة 13/15: تحسين SEO - ${projectId}`);
        context = await this.seo.execute(context);
      }

      // المرحلة 14: التوثيق
      if (!context.errorLog) {
        console.log(`[منسق] المرحلة 14/15: التوثيق - ${projectId}`);
        context = await this.documenter.execute(context);
      }

      // المرحلة 15: النشر
      if (!context.errorLog) {
        console.log(`[منسق] المرحلة 15/15: النشر - ${projectId}`);
        context = await this.deployer.execute(context);
      } else {
        // حلقة إصلاح ذاتية نهائية
        while (context.errorLog && context.retryCount < context.maxRetries) {
          await db.agentMessage.create({
            data: { projectId, role: 'system', content: `🔄 محاولة إصلاح نهائية ${context.retryCount + 1}/${context.maxRetries}...` },
          });
          context = await this.debugger.execute(context);

          if (!context.errorLog) {
            context = await this.developer.execute(context);
            if (!context.errorLog) {
              context = await this.tester.execute(context);
            }
          }
        }

        if (!context.errorLog) {
          context = await this.performance.execute(context);
          context = await this.security.execute(context);
          context = await this.seo.execute(context);
          context = await this.documenter.execute(context);
          context = await this.deployer.execute(context);
        } else {
          await db.project.update({
            where: { id: projectId },
            data: { status: 'failed', currentStep: 'فشل' },
          });
          await db.agentMessage.create({
            data: {
              projectId,
              role: 'system',
              content: `❌ لم يتم إكمال المشروع بعد ${context.maxRetries} محاولات إصلاح. يرجى مراجعة الأخطاء.`,
            },
          });
        }
      }
    } catch (error: any) {
      console.error(`[منسق] خطأ:`, error);
      await db.project.update({
        where: { id: projectId },
        data: { status: 'failed', errorLog: error.message, currentStep: 'فشل' },
      });
    }
  }
}

export const orchestrator = new AgentOrchestrator();
