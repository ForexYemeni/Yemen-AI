// API Route: Agent status and logs for a project
// يعمل حتى بدون MongoDB
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ProjectModel, AgentLogModel, AgentMessageModel } from '@/lib/models';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const conn = await dbConnect();
    const { id } = await params;

    if (!conn) {
      // Demo mode - return empty project detail
      return NextResponse.json({
        project: {
          id,
          name: 'مشروع تجريبي',
          status: 'pending',
          idea: 'وضع تجريبي - قاعدة البيانات غير متصلة',
          retryCount: 0,
          repoUrl: null,
          deployUrl: null,
          errorLog: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        logs: [],
        messages: [
          {
            id: 'demo-msg-1',
            role: 'system',
            content: '⚠️ النظام يعمل في الوضع التجريبي. لتفعيل الحفظ، قم بربط MONGODB_URI.',
            createdAt: new Date().toISOString(),
          }
        ],
      });
    }

    const project = await ProjectModel.findById(id).lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const logs = await AgentLogModel.find({ projectId: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const messages = await AgentMessageModel.find({ projectId: id })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      project: {
        ...project,
        id: project._id.toString(),
      },
      logs: logs.map(l => ({ ...l, id: l._id.toString(), projectId: (l.projectId as any).toString() })),
      messages: messages.map(m => ({ ...m, id: m._id.toString(), projectId: (m.projectId as any).toString() })),
    });
  } catch (error: any) {
    console.error('[API Agent] Error:', error);
    return NextResponse.json({
      project: { id: 'error', name: 'خطأ', status: 'failed', idea: '' },
      logs: [],
      messages: [],
    });
  }
}
