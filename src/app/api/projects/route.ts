// API Route: Create a new project and start the AI agent system
import { NextResponse } from 'next/server';
import { orchestrator } from '@/lib/agents';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, idea } = body;

    if (!name || !idea) {
      return NextResponse.json(
        { error: 'Name and idea are required' },
        { status: 400 }
      );
    }

    // Start the autonomous agent system
    const projectId = await orchestrator.execute({
      name,
      description: description || name,
      idea,
    });

    return NextResponse.json({
      success: true,
      projectId,
      message: 'AI Agent system started! The project is being built autonomously.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Projects] Error:', error);
    return NextResponse.json(
      { error: 'Failed to start project', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { logs: true, messages: true },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error('[API Projects] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
