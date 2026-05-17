// ============================================================
// POST /api/projects/[id]/approve — User approves the design and code
// Only deploys after explicit user approval
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runtimeStore } from '@/lib/runtime/memory';
import { orchestrateDeploy } from '@/lib/agents/orchestrator';

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

    // Start deployment in background
    orchestrateDeploy(id).catch((error) => {
      console.error('Deploy error:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'تمت الموافقة — بدأ النشر على GitHub و Vercel',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في الموافقة على المشروع' },
      { status: 500 }
    );
  }
}
