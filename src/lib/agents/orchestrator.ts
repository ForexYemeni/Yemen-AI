// Agent Orchestrator - محرك التنسيق الذكي (9 Agents)
// ينفذ حلقة ذاتية: تحليل → تصميم → بناء → مراجعة → اختبار → أمان → نشر

import { AnalyzerAgent } from './analyzer-agent';
import { ArchitectAgent } from './architect-agent';
import { DesignerAgent } from './designer-agent';
import { DeveloperAgent } from './developer-agent';
import { ReviewerAgent } from './reviewer-agent';
import { TesterAgent } from './tester-agent';
import { DebuggerAgent } from './debugger-agent';
import { SecurityAgent } from './security-agent';
import { DeployerAgent } from './deployer-agent';
import { AgentContext, ProjectIdea, AGENT_PIPELINE } from './types';
import { db } from '@/lib/db';

export class AgentOrchestrator {
  private analyzer: AnalyzerAgent;
  private architect: ArchitectAgent;
  private designer: DesignerAgent;
  private developer: DeveloperAgent;
  private reviewer: ReviewerAgent;
  private tester: TesterAgent;
  private debugger: DebuggerAgent;
  private security: SecurityAgent;
  private deployer: DeployerAgent;

  constructor() {
    this.analyzer = new AnalyzerAgent();
    this.architect = new ArchitectAgent();
    this.designer = new DesignerAgent();
    this.developer = new DeveloperAgent();
    this.reviewer = new ReviewerAgent();
    this.tester = new TesterAgent();
    this.debugger = new DebuggerAgent();
    this.security = new SecurityAgent();
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
        content: `🚀 تم بدء مشروع جديد: "${idea.name}"\n\n💡 الفكرة: ${idea.idea}\n\nسيعمل نظام الوكلاء الذكي الآن بشكل ذاتي على: تحليل المتطلبات، تصميم البنية، تصميم الواجهات، بناء التطبيق، مراجعة الكود، اختبار الجودة، فحص الأمان، ونشر التطبيق.`,
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
      console.log(`[منسق] المرحلة 1: تحليل المتطلبات - ${projectId}`);
      context = await this.analyzer.execute(context);

      // المرحلة 2: تصميم البنية
      console.log(`[منسق] المرحلة 2: تصميم البنية - ${projectId}`);
      context = await this.architect.execute(context);

      // المرحلة 3: تصميم الواجهات
      console.log(`[منسق] المرحلة 3: تصميم الواجهات - ${projectId}`);
      context = await this.designer.execute(context);

      // المرحلة 4: بناء التطبيق
      console.log(`[منسق] المرحلة 4: بناء التطبيق - ${projectId}`);
      context = await this.developer.execute(context);

      // إذا ظهرت أخطاء، حاول الإصلاح
      if (context.errorLog) {
        console.log(`[منسق] مرحلة إصلاح: تصحيح الأخطاء - ${projectId}`);
        context = await this.debugger.execute(context);

        // أعد البناء بعد الإصلاح
        if (!context.errorLog) {
          await db.agentMessage.create({
            data: {
              projectId,
              role: 'system',
              content: `🔄 إعادة البناء بعد إصلاح الأخطاء...`,
            },
          });
          context = await this.developer.execute(context);
        }
      }

      // المرحلة 5: مراجعة الكود
      if (!context.errorLog) {
        console.log(`[منسق] المرحلة 5: مراجعة الكود - ${projectId}`);
        context = await this.reviewer.execute(context);
      }

      // المرحلة 6: اختبار الجودة
      if (!context.errorLog) {
        console.log(`[منسق] المرحلة 6: اختبار الجودة - ${projectId}`);
        context = await this.tester.execute(context);

        // إذا فشلت الاختبارات، حاول الإصلاح
        if (context.errorLog && context.retryCount < context.maxRetries) {
          await db.agentMessage.create({
            data: {
              projectId,
              role: 'system',
              content: `🔧 فشلت بعض الاختبارات - جاري الإصلاح التلقائي...`,
            },
          });
          context = await this.debugger.execute(context);

          if (!context.errorLog) {
            context = await this.tester.execute(context);
          }
        }
      }

      // المرحلة 7: فحص الأمان
      if (!context.errorLog) {
        console.log(`[منسق] المرحلة 7: فحص الأمان - ${projectId}`);
        context = await this.security.execute(context);
      }

      // المرحلة 8: النشر
      if (!context.errorLog) {
        console.log(`[منسق] المرحلة 8: النشر - ${projectId}`);
        context = await this.deployer.execute(context);
      } else {
        // حلقة إصلاح ذاتية نهائية
        while (context.errorLog && context.retryCount < context.maxRetries) {
          await db.agentMessage.create({
            data: {
              projectId,
              role: 'system',
              content: `🔄 محاولة إصلاح ${context.retryCount + 1}/${context.maxRetries}...`,
            },
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
          context = await this.security.execute(context);
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
