// API Route: Get/Update/Delete a specific project
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
      return NextResponse.json({ error: 'قاعدة البيانات غير متصلة' }, { status: 503 });
    }

    const project = await ProjectModel.findById(id).lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const logs = await AgentLogModel.find({ projectId: id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const messages = await AgentMessageModel.find({ projectId: id })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      ...project,
      id: project._id.toString(),
      logs: logs.map(l => ({ ...l, id: l._id.toString() })),
      messages: messages.map(m => ({ ...m, id: m._id.toString() })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const conn = await dbConnect();
    const { id } = await params;

    if (!conn) {
      return NextResponse.json({ error: 'قاعدة البيانات غير متصلة' }, { status: 503 });
    }

    await AgentLogModel.deleteMany({ projectId: id });
    await AgentMessageModel.deleteMany({ projectId: id });
    await ProjectModel.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
