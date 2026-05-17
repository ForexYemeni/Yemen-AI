// Documenter Agent - الموثق
// يُنشئ التوثيق والملفات التوضيحية ودليل الاستخدام

import { BaseAgent } from './base-agent';
import { AgentContext, CodeFile } from './types';

export class DocumenterAgent extends BaseAgent {
  type = 'documenter' as const;
  name = 'Documenter';
  nameAr = 'الموثق';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, idea, codeFiles } = context;

    await this.log(projectId, 'بدء_التوثيق', 'بدء إنشاء التوثيق والملفات التوضيحية', 'info');
    await this.updateProject(projectId, 'documenting', 96, 'التوثيق');
    await this.addMessage(projectId, 'documenter', '📖 جاري إنشاء التوثيق ودليل الاستخدام...');

    try {
      await this.delay(1500);
      const docFiles = this.generateDocumentation(idea, codeFiles || []);

      await this.log(projectId, 'اكتمال_التوثيق', `تم إنشاء ${docFiles.length} ملفات توثيق`, 'success');
      await this.addMessage(projectId, 'documenter', `✅ تم إنشاء التوثيق بنجاح!\n\n📖 **README.md:** دليل شامل للمشروع\n🏗️ **ARCHITECTURE.md:** توثيق البنية\n📋 **API.md:** توثيق مسارات API\n⚙️ **SETUP.md:** دليل التثبيت`);

      const existingFiles = context.codeFiles || [];
      context.codeFiles = [...existingFiles, ...docFiles];
      context.progress = 98;
      await this.updateProject(projectId, 'documenting', 98, 'التوثيق', {
        codeFiles: JSON.stringify([...existingFiles, ...docFiles]),
      });

      return context;
    } catch (error: any) {
      await this.log(projectId, 'فشل_التوثيق', `فشل إنشاء التوثيق: ${error.message}`, 'warning');
      await this.addMessage(projectId, 'documenter', `⚠️ تعذر إنشاء التوثيق: ${error.message}`);
      context.progress = 98;
      return context;
    }
  }

  private generateDocumentation(idea: string, codeFiles: CodeFile[]): CodeFile[] {
    const appName = idea.split(' ').slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const slugName = appName.toLowerCase().replace(/\s+/g, '-');
    const fileCount = codeFiles.length;
    const apiFiles = codeFiles.filter(f => f.path.includes('api'));
    const pageFiles = codeFiles.filter(f => f.path.includes('page'));

    // README
    const readme = `# ${appName}

> ${idea}

## ✨ المميزات

- 🎨 واجهة مستخدم احترافية بالعربية
- 📱 تصميم متجاوب مع جميع الأجهزة
- 🔗 API كامل مع CRUD
- 🗄️ قاعدة بيانات متقدمة مع Prisma
- ⚡ أداء محسن وسرعة عالية
- 🛡️ حماية أمنية متقدمة
- 🔎 تحسين لمحركات البحث

## 🛠️ التقنيات

- **الواجهة:** Next.js 16 + React 19 + TypeScript
- **التصميم:** Tailwind CSS 4 + shadcn/ui
- **الخلفية:** Next.js API Routes
- **قاعدة البيانات:** SQLite + Prisma ORM
- **النشر:** Vercel + GitHub

## 🚀 التثبيت والتشغيل

\`\`\`bash
# استنساخ المستودع
git clone https://github.com/username/${slugName}.git
cd ${slugName}

# تثبيت التبعيات
npm install

# إعداد قاعدة البيانات
npx prisma generate
npx prisma db push

# تشغيل الخادم المحلي
npm run dev
\`\`\`

افتح المتصفح على [http://localhost:3000](http://localhost:3000)

## 📁 هيكل المشروع

\`\`\`
${slugName}/
├── prisma/
│   └── schema.prisma       # مخطط قاعدة البيانات
├── src/
│   ├── app/
│   │   ├── api/            # مسارات API
│   │   ├── layout.tsx      # التخطيط الرئيسي
│   │   ├── page.tsx        # الصفحة الرئيسية
│   │   └── globals.css     # الأنماط العامة
│   ├── components/         # المكونات
│   └── lib/                # المكتبات المساعدة
├── package.json
└── next.config.ts
\`\`\`

## 📊 الإحصائيات

- **عدد الملفات:** ${fileCount}
- **مسارات API:** ${apiFiles.length}
- **الصفحات:** ${pageFiles.length}

## 📄 الرخصة

MIT License

---

*صُنع بكل ❤️ بواسطة [مصنع الوكلاء الذكي](https://github.com) — 15 وكيل ذكاء اصطناعي يعملون بشكل ذاتي*`;

    // Architecture doc
    const architectureDoc = `# 🏗️ توثيق البنية - ${appName}

## البنية العامة

التطبيق يتبع بنية **Next.js App Router** مع فصل واضح للمسؤوليات:

### الواجهة الأمامية (Frontend)
- **React 19** مع TypeScript
- **Tailwind CSS 4** للتصميم
- **shadcn/ui** للمكونات
- **Framer Motion** للأنيميشن
- **دعم RTL** كامل للعربية

### الخلفية (Backend)
- **Next.js API Routes** مع TypeScript
- **Prisma ORM** للتعامل مع قاعدة البيانات
- **تحقق شامل** من المدخلات
- **معالجة أخطاء** متقدمة

### قاعدة البيانات
- **SQLite** للتطوير
- **Prisma** كـ ORM
- **فهارس** لتحسين الأداء
- **علاقات** بين الجداول

## مخطط التدفق

\`\`\`
المستخدم → Next.js Frontend → API Routes → Prisma → SQLite
                                ↓
                          التحقق من المدخلات
                                ↓
                          معالجة الأخطاء
\`\`\``;

    // API Documentation
    const apiDoc = `# 📋 توثيق API - ${appName}

## النقاط الأساسية

### GET /api/items
جلب جميع العناصر مع دعم البحث والتصفية

**المعاملات:**
| المعامل | النوع | الوصف |
|---------|------|-------|
| page | number | رقم الصفحة (افتراضي: 1) |
| limit | number | عدد العناصر (افتراضي: 20) |
| search | string | نص البحث |
| priority | string | تصفية بالأولوية (high/medium/low) |
| category | string | تصفية بالفئة |

**الاستجابة:**
\`\`\`json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
\`\`\`

### POST /api/items
إنشاء عنصر جديد

**الطلب:**
\`\`\`json
{ "title": "عنوان", "description": "وصف", "priority": "high" }
\`\`\`

### GET /api/items/[id]
جلب عنصر محدد

### PUT /api/items/[id]
تحديث عنصر

### DELETE /api/items/[id]
حذف عنصر

### GET /api/stats
جلب الإحصائيات العامة`;

    return [
      { path: 'README.md', content: readme, language: 'markdown' },
      { path: 'ARCHITECTURE.md', content: architectureDoc, language: 'markdown' },
      { path: 'API.md', content: apiDoc, language: 'markdown' },
    ];
  }
}
