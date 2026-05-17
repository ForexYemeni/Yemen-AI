// API Route: Create a new project and start the AI agent system
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ProjectModel, AgentMessageModel } from '@/lib/models';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, description, idea } = body;

    if (!name || !idea) {
      return NextResponse.json(
        { error: 'الاسم والفكرة مطلوبان' },
        { status: 400 }
      );
    }

    // Create project
    const project = await ProjectModel.create({
      name,
      description: description || name,
      idea,
      status: 'pending',
      progress: 0,
      currentStep: 'في الانتظار',
    });

    const projectId = project._id.toString();

    // Add initial system message
    await AgentMessageModel.create({
      projectId: project._id,
      role: 'system',
      content: `🚀 تم بدء مشروع جديد: "${name}"\n\n💡 الفكرة: ${idea}\n\nسيعمل نظام الوكلاء الذكي الآن بشكل ذاتي.`,
    });

    // Start the autonomous agent system in background (non-blocking)
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
    await dbConnect();
    const projects = await ProjectModel.find({})
      .sort({ createdAt: -1 })
      .lean();

    // Add log and message counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const { AgentLogModel } = await import('@/lib/models/AgentLog');
        const { AgentMessageModel } = await import('@/lib/models/AgentMessage');
        const logCount = await AgentLogModel.countDocuments({ projectId: project._id });
        const messageCount = await AgentMessageModel.countDocuments({ projectId: project._id });
        return {
          ...project,
          id: project._id.toString(),
          _count: { logs: logCount, messages: messageCount },
        };
      })
    );

    return NextResponse.json(projectsWithCounts);
  } catch (error: any) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب المشاريع' },
      { status: 500 }
    );
  }
}
