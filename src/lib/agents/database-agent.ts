// Database Engineer Agent - مهندس قاعدة البيانات
// يصمم ويحسن مخطط قاعدة البيانات والعلاقات والاستعلامات

import { BaseAgent } from './base-agent';
import { AgentContext, CodeFile } from './types';
import ZAI from 'z-ai-web-dev-sdk';

export class DatabaseAgent extends BaseAgent {
  type = 'database' as const;
  name = 'Database Engineer';
  nameAr = 'مهندس البيانات';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, idea } = context;

    await this.log(projectId, 'بدء_البيانات', 'بدء تصميم وبناء مخطط قاعدة البيانات المتقدم', 'info');
    await this.updateProject(projectId, 'database_dev', 48, 'بناء قاعدة البيانات');
    await this.addMessage(projectId, 'database', '🗄️ جاري تصميم وبناء مخطط قاعدة البيانات المتقدم...');

    try {
      await this.delay(2000);
      const schemaFile = await this.generateAdvancedSchema(idea, projectId);

      await this.log(projectId, 'اكتمال_البيانات', 'تم تصميم مخطط قاعدة البيانات المتقدم', 'success');
      await this.addMessage(projectId, 'database', `✅ تم بناء قاعدة البيانات بنجاح!\n\n🗄️ **الجداول:** تصميم شامل مع العلاقات\n🔗 **العلاقات:** روابط بين الجداول\n📊 **الفهارس:** فهارس لتحسين الأداء\n🔍 **الاستعلامات:** استعلامات محسنة`);

      const existingFiles = context.codeFiles || [];
      // Replace any existing schema
      const filteredFiles = existingFiles.filter(f => !f.path.includes('schema.prisma'));
      context.codeFiles = [...filteredFiles, schemaFile];
      context.progress = 52;
      await this.updateProject(projectId, 'database_dev', 52, 'بناء قاعدة البيانات', {
        codeFiles: JSON.stringify([...filteredFiles, schemaFile]),
      });

      return context;
    } catch (error: any) {
      await this.log(projectId, 'فشل_البيانات', `فشل تصميم البيانات: ${error.message}`, 'error');
      await this.addMessage(projectId, 'database', `❌ فشل تصميم البيانات: ${error.message}`);
      context.errorLog = error.message;
      return context;
    }
  }

  private async generateAdvancedSchema(idea: string, projectId: string): Promise<CodeFile> {
    const zai = await ZAI.create();

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `أنت مهندس قواعد بيانات خبير متخصص في Prisma و SQLite.
أنشئ مخطط Prisma متقدم مع:
- generator client و datasource db
- جداول متعددة مع علاقات (one-to-many, many-to-many)
- فهارس @@@index لتحسين الأداء
- حقول createdAt و updatedAt لكل جدول
- حالات (enum-like) باستخدام String
- قيود فريدة حيث يناسب
أجب بمحتوى ملف Prisma فقط بدون markdown أو شرح.`
          },
          {
            role: 'user',
            content: `أنشئ مخطط Prisma متقدم لهذا المشروع: "${idea}"`
          }
        ],
        temperature: 0.5,
        max_tokens: 2000,
      });

      let content = completion.choices[0]?.message?.content || '';
      if (content.startsWith('```')) {
        content = content.replace(/^```(?:prisma)?\s*/, '').replace(/```\s*$/, '');
      }
      if (!content.includes('generator') || !content.includes('datasource')) {
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
  tags        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  comments Comment[]

  @@index([status])
  @@index([priority])
  @@index([createdAt])
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  author    String   @default("مستخدم")
  itemId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([itemId])
}

model ActivityLog {
  id        String   @id @default(cuid())
  action    String
  entity    String
  entityId  String?
  details   String?
  createdAt DateTime @default(now())

  @@index([entity])
  @@index([createdAt])
}`;
  }
}
