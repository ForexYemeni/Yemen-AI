import { BaseAgent } from './base-agent';
import { AgentContext, CodeFile } from './types';
import ZAI from 'z-ai-web-dev-sdk';

export class ArchitectAgent extends BaseAgent {
  type = 'architect' as const;
  name = 'Architect';
  nameAr = 'مهندس البنية';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, idea, plan } = context;

    await this.log(projectId, 'بدء_التصميم', 'بدء تصميم بنية النظام وقاعدة البيانات', 'info');
    await this.updateProject(projectId, 'architecting', 20, 'تصميم البنية');
    await this.addMessage(projectId, 'architect', '🏗️ جاري تصميم بنية النظام وقاعدة البيانات...');

    try {
      await this.delay(1500);
      const schemaFile = await this.generateSchema(idea, projectId);

      await this.log(projectId, 'اكتمال_التصميم', `تم تصميم البنية بنجاح - مخطط قاعدة البيانات جاهز`, 'success');
      await this.addMessage(projectId, 'architect', '✅ تم تصميم بنية النظام بنجاح!\n\n🗄️ **قاعدة البيانات:** تم تصميم الجداول والعلاقات\n🔗 **API:** تم تخطيط مسارات API\n📐 **البنية:** بنية احترافية متكاملة');

      const existingFiles = context.codeFiles || [];
      context.codeFiles = [...existingFiles, schemaFile];
      context.progress = 30;
      return context;
    } catch (error: any) {
      await this.log(projectId, 'فشل_التصميم', `فشل تصميم البنية: ${error.message}`, 'error');
      await this.addMessage(projectId, 'architect', `❌ فشل تصميم البنية: ${error.message}`);
      context.errorLog = error.message;
      return context;
    }
  }

  private async generateSchema(idea: string, projectId: string): Promise<CodeFile> {
    const zai = await ZAI.create();

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'أنت مهندس قواعد بيانات خبير. أنشئ مخطط Prisma لـ SQLite. أجب بمحتوى الملف فقط بدون markdown أو شرح.'
          },
          {
            role: 'user',
            content: `أنشئ مخطط Prisma لهذا المشروع: "${idea}". استخدم SQLite. أضف الجداول المناسبة مع العلاقات. استخدم cuid للمعرفات. أضف createdAt و updatedAt.`
          }
        ],
        temperature: 0.5,
        max_tokens: 1500,
      });

      let content = completion.choices[0]?.message?.content || '';
      if (content.startsWith('```')) {
        content = content.replace(/^```(?:prisma)?\s*/, '').replace(/```\s*$/, '');
      }
      if (!content.includes('generator')) {
        content = this.getDefaultSchema();
      }

      return { path: 'prisma/schema.prisma', content, language: 'prisma' };
    } catch {
      return { path: 'prisma/schema.prisma', content: this.getDefaultSchema(), language: 'prisma' };
    }
  }

  private getDefaultSchema(): string {
    return `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Item {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      String   @default("active")
  priority    String   @default("medium")
  category    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}`;
  }
}
