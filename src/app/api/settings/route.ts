// API Route: Manage settings (GitHub Token, Vercel Token, etc.)
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let settings = await db.settings.findFirst();

    if (!settings) {
      settings = await db.settings.create({
        data: {},
      });
    }

    // Mask sensitive tokens
    return NextResponse.json({
      id: settings.id,
      hasGithubToken: !!settings.githubToken,
      hasVercelToken: !!settings.vercelToken,
      githubRepo: settings.githubRepo,
      updatedAt: settings.updatedAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { githubToken, vercelToken, githubRepo } = body;

    let settings = await db.settings.findFirst();

    if (!settings) {
      settings = await db.settings.create({
        data: {
          githubToken: githubToken || undefined,
          vercelToken: vercelToken || undefined,
          githubRepo: githubRepo || undefined,
        },
      });
    } else {
      const updateData: Record<string, any> = {};
      if (githubToken !== undefined) updateData.githubToken = githubToken || null;
      if (vercelToken !== undefined) updateData.vercelToken = vercelToken || null;
      if (githubRepo !== undefined) updateData.githubRepo = githubRepo || null;

      settings = await db.settings.update({
        where: { id: settings.id },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      hasGithubToken: !!settings.githubToken,
      hasVercelToken: !!settings.vercelToken,
      githubRepo: settings.githubRepo,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
