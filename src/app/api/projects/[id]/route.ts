// ============================================================
// GET /api/projects/[id] — Get project detail with logs and messages
// DELETE /api/projects/[id] — Delete project
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runtimeStore, deleteProject, getProjectLogs, getProjectMessages } from '@/lib/runtime/memory';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = runtimeStore.projects.get(id);

    if (!project) {
      return NextResponse.json(
        { error: 'المشروع غير موجود' },
        { status: 404 }
      );
    }

    const logs = getProjectLogs(id);
    const messages = getProjectMessages(id);
    const sharedContext = runtimeStore.sharedContexts.get(id);

    return NextResponse.json({
      project,
      logs,
      messages,
      codeFiles: sharedContext?.codeFiles ?? [],
      errorReports: sharedContext?.errorReports ?? [],
      executionPlan: sharedContext?.executionPlan ?? null,
      agentResults: sharedContext ? Object.fromEntries(sharedContext.agentResults) : {},
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في جلب تفاصيل المشروع' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteProject(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'المشروع غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'تم حذف المشروع' });
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في حذف المشروع' },
      { status: 500 }
    );
  }
}
