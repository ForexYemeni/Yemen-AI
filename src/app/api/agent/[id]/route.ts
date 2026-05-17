// API Route: Agent status and logs for a project
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ProjectModel, AgentLogModel, AgentMessageModel } from '@/lib/models';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
