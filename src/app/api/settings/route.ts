// API Route: Manage settings (GitHub Token, Vercel Token, etc.)
// يعمل حتى بدون MongoDB
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { SettingsModel } from '@/lib/models';

export async function GET() {
  try {
    const conn = await dbConnect();

    if (!conn) {
      // Demo mode - return default settings
      return NextResponse.json({
        id: 'demo',
        hasGithubToken: false,
        hasVercelToken: false,
        githubRepo: '',
        updatedAt: new Date().toISOString(),
        dbConnected: false,
      });
    }

    let settings = await SettingsModel.findOne().lean();

    if (!settings) {
      settings = await SettingsModel.create({});
    }

    return NextResponse.json({
      id: settings._id.toString(),
      hasGithubToken: !!settings.githubToken,
      hasVercelToken: !!settings.vercelToken,
      githubRepo: settings.githubRepo,
      updatedAt: settings.updatedAt,
      dbConnected: true,
    });
  } catch (error: any) {
    console.error('[API Settings] Error:', error);
    // Return safe defaults instead of error
    return NextResponse.json({
      id: 'error',
      hasGithubToken: false,
      hasVercelToken: false,
      githubRepo: '',
      updatedAt: new Date().toISOString(),
      dbConnected: false,
    });
  }
}

export async function PUT(request: Request) {
  try {
    const conn = await dbConnect();

    if (!conn) {
      return NextResponse.json({
        success: false,
        error: 'قاعدة البيانات غير متصلة. قم بربط MongoDB للحفظ.',
        demo: true,
      });
    }

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
