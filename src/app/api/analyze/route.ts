// ============================================================
// POST /api/analyze — Analyze project for errors
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runtimeStore, addLog, generateLogId, addMessage, generateMsgId } from '@/lib/runtime/memory';
import { runQaDebugAgent } from '@/lib/agents/qa-debug';
import { SharedContext } from '@/lib/runtime/shared-context';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'معرف المشروع مطلوب' },
        { status: 400 }
      );
    }

    const project = runtimeStore.projects.get(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'المشروع غير موجود' },
        { status: 404 }
      );
    }

    // Get or create shared context
    let ctx = runtimeStore.sharedContexts.get(projectId);
    if (!ctx) {
      ctx = new SharedContext(projectId, project.idea);
      ctx.sync();
    }

    // Run QA analysis
    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'qa_debug',
      action: 'manual_analysis',
      content: 'بدأ فحص يدوي للمشروع...',
      status: 'running',
      timestamp: new Date().toISOString(),
    });

    await runQaDebugAgent(ctx);

    const qaResult = ctx.getAgentResult('qa_debug') as Record<string, unknown> | undefined;

    return NextResponse.json({
      success: true,
      reports: qaResult?.reports ?? [],
      summary: {
        total: qaResult?.totalIssues ?? 0,
        critical: qaResult?.critical ?? 0,
        high: qaResult?.high ?? 0,
        medium: qaResult?.medium ?? 0,
        low: qaResult?.low ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في تحليل المشروع' },
      { status: 500 }
    );
  }
}
