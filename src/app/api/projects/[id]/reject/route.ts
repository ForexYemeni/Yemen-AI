// ============================================================
// POST /api/projects/[id]/reject — User rejects the design/code
// No code will be uploaded anywhere
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runtimeStore } from '@/lib/runtime/memory';
import { rejectProject } from '@/lib/agents/orchestrator';

export async function POST(
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

    if (project.status !== 'pending_approval') {
      return NextResponse.json(
        { error: 'المشروع ليس في حالة انتظار الموافقة' },
        { status: 400 }
      );
    }

    // Get optional rejection reason
    let reason = '';
    try {
      const body = await request.json();
      reason = body.reason ?? '';
    } catch {
      // No body provided
    }

    await rejectProject(id, reason);

    return NextResponse.json({
      success: true,
      message: 'تم رفض المشروع — لن يتم رفع أي كود',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في رفض المشروع' },
      { status: 500 }
    );
  }
}
