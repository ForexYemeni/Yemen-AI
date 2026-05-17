// ============================================================
// GET /api/settings — Get settings (mask tokens)
// PUT /api/settings — Save tokens (in-memory)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runtimeStore } from '@/lib/runtime/memory';

function maskToken(token: string | undefined): string {
  if (!token) return '';
  if (token.length <= 8) return '****';
  return token.substring(0, 4) + '****' + token.substring(token.length - 4);
}

export async function GET() {
  try {
    return NextResponse.json({
      githubToken: maskToken(runtimeStore.settings.githubToken),
      vercelToken: maskToken(runtimeStore.settings.vercelToken),
      githubRepo: runtimeStore.settings.githubRepo ?? '',
      hasGithubToken: !!runtimeStore.settings.githubToken,
      hasVercelToken: !!runtimeStore.settings.vercelToken,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في جلب الإعدادات' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { githubToken, vercelToken, githubRepo } = body;

    if (githubToken !== undefined) {
      runtimeStore.settings.githubToken = githubToken || undefined;
    }
    if (vercelToken !== undefined) {
      runtimeStore.settings.vercelToken = vercelToken || undefined;
    }
    if (githubRepo !== undefined) {
      runtimeStore.settings.githubRepo = githubRepo || undefined;
    }

    return NextResponse.json({
      success: true,
      message: 'تم حفظ الإعدادات',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في حفظ الإعدادات' },
      { status: 500 }
    );
  }
}
