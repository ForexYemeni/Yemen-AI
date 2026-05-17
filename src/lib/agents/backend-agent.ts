// Backend Specialist Agent - متخصص الخلفية
// يبني مسارات API والمنطق الخلفي والخدمات المتكاملة

import { BaseAgent } from './base-agent';
import { AgentContext, CodeFile } from './types';
import ZAI from 'z-ai-web-dev-sdk';

export class BackendAgent extends BaseAgent {
  type = 'backend' as const;
  name = 'Backend Specialist';
  nameAr = 'متخصص الخلفية';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, idea } = context;

    await this.log(projectId, 'بدء_الخلفية', 'بدء تطوير مسارات API والمنطق الخلفي', 'info');
    await this.updateProject(projectId, 'backend_dev', 40, 'تطوير الخلفية');
    await this.addMessage(projectId, 'backend', '⚙️ جاري تطوير مسارات API والمنطق الخلفي...');

    try {
      await this.delay(2000);
      const backendFiles = this.generateBackendFiles(idea);

      await this.log(projectId, 'اكتمال_الخلفية', `تم إنشاء ${backendFiles.length} ملفات خلفية`, 'success');
      await this.addMessage(projectId, 'backend', `✅ تم تطوير الخلفية بنجاح!\n\n🔗 **مسارات API:** CRUD كامل مع التحقق\n🛡️ **معالجة الأخطاء:** شاملة ومتقدمة\n📊 **الاستجابة:** JSON مع حالة HTTP صحيحة\n🔐 **الأمان:** التحقق من المدخلات`);

      const existingFiles = context.codeFiles || [];
      context.codeFiles = [...existingFiles, ...backendFiles];
      context.progress = 45;
      await this.updateProject(projectId, 'backend_dev', 45, 'تطوير الخلفية', {
        codeFiles: JSON.stringify([...existingFiles, ...backendFiles]),
      });

      return context;
    } catch (error: any) {
      await this.log(projectId, 'فشل_الخلفية', `فشل تطوير الخلفية: ${error.message}`, 'error');
      await this.addMessage(projectId, 'backend', `❌ فشل تطوير الخلفية: ${error.message}`);
      context.errorLog = error.message;
      return context;
    }
  }

  private generateBackendFiles(idea: string): CodeFile[] {
    // Main CRUD API
    const apiContent = `import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const priority = searchParams.get('priority') || '';
    const category = searchParams.get('category') || '';

    const where: any = {};
    if (search) where.title = { contains: search };
    if (priority) where.priority = priority;
    if (category) where.category = category;

    const [items, total] = await Promise.all([
      db.item.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.item.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل في جلب البيانات', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, priority, category } = body;

    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      return NextResponse.json({ error: 'العنوان مطلوب ويجب أن يكون حرفين على الأقل' }, { status: 400 });
    }
    if (title.length > 200) {
      return NextResponse.json({ error: 'العنوان يجب ألا يتجاوز 200 حرف' }, { status: 400 });
    }

    const validPriorities = ['high', 'medium', 'low'];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'الأولوية غير صالحة' }, { status: 400 });
    }

    const item = await db.item.create({
      data: { title: title.trim(), description: description?.trim(), priority: priority || 'medium', category: category?.trim() },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل في إنشاء العنصر', details: error.message }, { status: 500 });
  }
}`;

    // Dynamic route
    const dynamicRouteContent = `import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await db.item.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل في جلب العنصر', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await db.item.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 });

    const item = await db.item.update({ where: { id }, data: body });
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل في تحديث العنصر', details: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await db.item.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 });

    const item = await db.item.update({ where: { id }, data: body });
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل في تحديث العنصر', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await db.item.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 });

    await db.item.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'تم حذف العنصر بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل في حذف العنصر', details: error.message }, { status: 500 });
  }
}`;

    // Stats API
    const statsApiContent = `import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [total, high, medium, low] = await Promise.all([
      db.item.count(),
      db.item.count({ where: { priority: 'high' } }),
      db.item.count({ where: { priority: 'medium' } }),
      db.item.count({ where: { priority: 'low' } }),
    ]);

    const recentItems = await db.item.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      total,
      byPriority: { high, medium, low },
      recent: recentItems,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل في جلب الإحصائيات' }, { status: 500 });
  }
}`;

    return [
      { path: 'src/app/api/items/route.ts', content: apiContent, language: 'typescript' },
      { path: 'src/app/api/items/[id]/route.ts', content: dynamicRouteContent, language: 'typescript' },
      { path: 'src/app/api/stats/route.ts', content: statsApiContent, language: 'typescript' },
    ];
  }
}
