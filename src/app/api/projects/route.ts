// API Route: Create a new project and start the AI agent system
// يعمل حتى بدون MongoDB (يعيد استجابة تجريبية)
import { NextResponse } from 'next/server';
import dbConnect, { isMongoConfigured } from '@/lib/mongodb';
import { ProjectModel, AgentMessageModel } from '@/lib/models';

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

    // Check if MongoDB is available
    const conn = await dbConnect();

    if (!conn) {
      // Demo mode - return success without DB
      return NextResponse.json({
        success: true,
        projectId: 'demo-' + Date.now(),
        message: 'تم إنشاء المشروع في الوضع التجريبي. لتفعيل الحفظ، قم بربط MongoDB.',
        demo: true,
      }, { status: 201 });
    }

    // Create project in MongoDB
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
    const conn = await dbConnect();

    if (!conn) {
      // Demo mode - return empty projects list
      return NextResponse.json([]);
    }

    const projects = await ProjectModel.find({})
      .sort({ createdAt: -1 })
      .lean();

    // Add log and message counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        try {
          const logCount = await AgentLogModel.countDocuments({ projectId: project._id });
          const messageCount = await AgentMessageModel.countDocuments({ projectId: project._id });
          return {
            ...project,
            id: project._id.toString(),
            _count: { logs: logCount, messages: messageCount },
          };
        } catch {
          return {
            ...project,
            id: project._id.toString(),
            _count: { logs: 0, messages: 0 },
          };
        }
      })
    );

    return NextResponse.json(projectsWithCounts);
  } catch (error: any) {
    console.error('[API] Error:', error);
    // Return empty array instead of error to prevent client crash
    return NextResponse.json([]);
  }
}
