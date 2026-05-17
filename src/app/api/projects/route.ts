// API Route: Create a new project and start the AI agent system
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, idea } = body;

    if (!name || !idea) {
      return NextResponse.json(
        { error: 'الاسم والفكرة مطلوبان' },
        { status: 400 }
      );
    }

    // Create project first
    const project = await db.project.create({
      data: {
        name,
        description: description || name,
        idea,
        status: 'pending',
        progress: 0,
        currentStep: 'في الانتظار',
      },
    });

    const projectId = project.id;

    // Add initial system message
    await db.agentMessage.create({
      data: {
        projectId,
        role: 'system',
        content: `🚀 تم بدء مشروع جديد: "${name}"\n\n💡 الفكرة: ${idea}\n\nسيعمل نظام الوكلاء الذكي الآن بشكل ذاتي.`,
      },
    });

    // Start the autonomous agent system in background (non-blocking)
    // Use dynamic import to avoid blocking the response
    import('@/lib/agents/orchestrator').then(async ({ orchestrator }) => {
      try {
        await orchestrator.execute({ name, description: description || name, idea });
      } catch (error) {
        console.error('[Orchestrator] Background error:', error);
      }
    }).catch((error) => {
      console.error('[Orchestrator] Import error:', error);
    });

    return NextResponse.json({
      success: true,
      projectId,
      message: 'تم تشغيل نظام الوكلاء الذكي! جاري بناء المشروع بشكل ذاتي.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'فشل في بدء المشروع', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { logs: true, messages: true },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب المشاريع' },
      { status: 500 }
    );
  }
}
