// ============================================================
// POST /api/execute — Start agent pipeline on a project
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runtimeStore, updateProject } from '@/lib/runtime/memory';
import { orchestrate } from '@/lib/agents/orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, mode = 'new', githubUrl, githubToken } = body;

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

    if (project.status !== 'pending' && project.status !== 'failed') {
      return NextResponse.json(
        { error: 'المشروع قيد التشغيل بالفعل أو مكتمل' },
        { status: 400 }
      );
    }

    // Update GitHub token if provided
    if (githubToken) {
      runtimeStore.settings.githubToken = githubToken;
    }
    if (githubUrl) {
      runtimeStore.settings.githubRepo = githubUrl.replace('https://github.com/', '').replace('.git', '');
    }

    // Update project status
    updateProject(projectId, {
      status: 'analyzing',
      currentStep: 'بدأ التحليل',
    });

    // Start orchestration in background
    orchestrate(projectId, mode, githubUrl, githubToken).catch((error) => {
      console.error('Orchestration error:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'بدأ خط الإنتاج — راقب التقدم من لوحة التحكم',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في بدء خط الإنتاج' },
      { status: 500 }
    );
  }
}
