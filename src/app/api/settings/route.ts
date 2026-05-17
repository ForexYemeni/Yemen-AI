// API Route: Manage settings (GitHub Token, Vercel Token, etc.)
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { SettingsModel } from '@/lib/models';

export async function GET() {
  try {
    await dbConnect();
    let settings = await SettingsModel.findOne().lean();

    if (!settings) {
      settings = await SettingsModel.create({});
    }

    // Mask sensitive tokens
    return NextResponse.json({
      id: settings._id.toString(),
      hasGithubToken: !!settings.githubToken,
      hasVercelToken: !!settings.vercelToken,
      githubRepo: settings.githubRepo,
      updatedAt: settings.updatedAt,
    });
  } catch (error: any) {
    console.error('[API Settings] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { githubToken, vercelToken, githubRepo } = body;

    let settings = await SettingsModel.findOne();

    if (!settings) {
      settings = await SettingsModel.create({
        githubToken: githubToken || undefined,
        vercelToken: vercelToken || undefined,
        githubRepo: githubRepo || undefined,
      });
    } else {
      const updateData: Record<string, any> = {};
      if (githubToken !== undefined) updateData.githubToken = githubToken || null;
      if (vercelToken !== undefined) updateData.vercelToken = vercelToken || null;
      if (githubRepo !== undefined) updateData.githubRepo = githubRepo || null;

      settings = await SettingsModel.findByIdAndUpdate(
        settings._id,
        updateData,
        { new: true }
      );
    }

    return NextResponse.json({
      success: true,
      hasGithubToken: !!settings?.githubToken,
      hasVercelToken: !!settings?.vercelToken,
      githubRepo: settings?.githubRepo,
    });
  } catch (error: any) {
    console.error('[API Settings] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
