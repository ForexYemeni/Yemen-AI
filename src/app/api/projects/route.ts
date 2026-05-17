// ============================================================
// POST /api/projects — Create a new project (in-memory)
// GET /api/projects — List all projects
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runtimeStore, generateId } from '@/lib/runtime/memory';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, idea } = body;

    if (!name || !idea) {
      return NextResponse.json(
        { error: 'اسم المشروع والفكرة مطلوبان' },
        { status: 400 }
      );
    }

    const id = generateId();
    const now = new Date().toISOString();

    const project = {
      id,
      name,
      description: idea.substring(0, 200),
      idea,
      status: 'pending' as const,
      progress: 0,
      currentStep: 'في الانتظار',
      createdAt: now,
      updatedAt: now,
    };

    runtimeStore.projects.set(id, project);
    runtimeStore.agentLogs.set(id, []);
    runtimeStore.agentMessages.set(id, []);

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في إنشاء المشروع' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const projects = Array.from(runtimeStore.projects.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في جلب المشاريع' },
      { status: 500 }
    );
  }
}
