// API Route: Agent status and logs for a project
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await db.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        idea: true,
        retryCount: true,
        repoUrl: true,
        deployUrl: true,
        errorLog: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const logs = await db.agentLog.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const messages = await db.agentMessage.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return NextResponse.json({
      project,
      logs,
      messages,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
