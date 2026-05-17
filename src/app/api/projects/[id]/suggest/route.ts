// ============================================================
// POST /api/projects/[id]/suggest — User submits suggestions
// Redesigns the UI based on user feedback
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runtimeStore, addLog, generateLogId, addMessage, generateMsgId, updateProject } from '@/lib/runtime/memory';
import { runUiUxAgent } from '@/lib/agents/ui-ux-agent';
import { SharedContext } from '@/lib/runtime/shared-context';

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

    // Must be in design approval or pending_approval state
    if (project.status !== 'pending_approval' && project.status !== 'designing') {
      return NextResponse.json(
        { error: 'المشروع ليس في حالة مراجعة التصميم' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { suggestions } = body;

    if (!suggestions || suggestions.trim().length === 0) {
      return NextResponse.json(
        { error: 'يرجى كتابة مقترح أو ملاحظة' },
        { status: 400 }
      );
    }

    // Get or create shared context
    let ctx = runtimeStore.sharedContexts.get(id);
    if (!ctx) {
      ctx = new SharedContext(id, project.idea);
      ctx.sync();
    }

    // Update status
    updateProject(id, {
      status: 'designing',
      currentStep: 'إعادة التصميم بناءً على مقترحات المستخدم...',
    });

    addLog(id, {
      id: generateLogId(),
      projectId: id,
      agent: 'ui_ux',
      action: 'redesign_with_suggestions',
      content: `مقترحات المستخدم: ${suggestions}`,
      status: 'running',
      timestamp: new Date().toISOString(),
    });

    addMessage(id, {
      id: generateMsgId(),
      projectId: id,
      role: 'user',
      content: `مقترحات على التصميم: ${suggestions}`,
      timestamp: new Date().toISOString(),
    });

    // Re-run UI/UX agent with suggestions
    await runUiUxAgent(ctx, suggestions);

    // Update status back to pending_approval
    updateProject(id, {
      status: 'pending_approval',
      progress: 25,
      currentStep: 'تم إعادة التصميم — بانتظار موافقة المستخدم',
    });

    addLog(id, {
      id: generateLogId(),
      projectId: id,
      agent: 'ui_ux',
      action: 'redesign_complete',
      content: `تم إعادة التصميم بناءً على المقترحات — بانتظار الموافقة`,
      status: 'success',
      timestamp: new Date().toISOString(),
    });

    addMessage(id, {
      id: generateMsgId(),
      projectId: id,
      role: 'system',
      content: 'تم إعادة التصميم بناءً على مقترحاتك — راجع التصميم الجديد',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'تم إعادة التصميم بناءً على مقترحاتك',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في تطبيق المقترحات' },
      { status: 500 }
    );
  }
}
