// ============================================================
// POST /api/projects/[id]/approve — User approves
// Phase 1 approval: Design → starts building code
// Phase 2 approval: Code → starts deployment
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runtimeStore } from '@/lib/runtime/memory';
import { orchestrateBuild, orchestrateDeploy } from '@/lib/agents/orchestrator';

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
        { error: 'المشروع ليس في حالة انتظار الموافقة. الحالة الحالية: ' + project.status },
        { status: 400 }
      );
    }

    // Determine phase based on progress
    // Progress < 50 = design approval → start building
    // Progress >= 50 = final approval → start deployment
    if (project.progress < 50) {
      // Phase 1: Design approved → Build the code
      orchestrateBuild(id).catch((error) => {
        console.error('Build error:', error);
      });

      return NextResponse.json({
        success: true,
        phase: 'build',
        message: 'تمت الموافقة على التصميم — بدأ بناء المشروع خطوة بخطوة',
      });
    } else {
      // Phase 2: Final code approved → Deploy
      orchestrateDeploy(id).catch((error) => {
        console.error('Deploy error:', error);
      });

      return NextResponse.json({
        success: true,
        phase: 'deploy',
        message: 'تمت الموافقة النهائية — بدأ النشر على GitHub و Vercel',
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في الموافقة على المشروع' },
      { status: 500 }
    );
  }
}
