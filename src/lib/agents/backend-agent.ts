// ============================================================
// Backend Agent — يبني APIs والمنطق البرمجي والمصادقة وربط البيانات
// ============================================================

import { CodeFile } from '../runtime/types';
import { SharedContext } from '../runtime/shared-context';
import { addLog, generateLogId } from '../runtime/memory';

export async function runBackendAgent(ctx: SharedContext): Promise<void> {
  const projectId = ctx.projectId;

  addLog(projectId, {
    id: generateLogId(),
    projectId,
    agent: 'backend',
    action: 'start_dev',
    content: 'بدأ تطوير الخلفية وبناء APIs...',
    status: 'running',
    timestamp: new Date().toISOString(),
  });

  try {
    const pmResult = ctx.getAgentResult('project_manager') as Record<string, unknown> | undefined;
    const features = (pmResult?.analysis as Record<string, unknown>)?.features as string[] ?? [];

    // Generate API routes
    ctx.addCodeFile({
      path: 'src/app/api/health/route.ts',
      content: generateHealthRoute(),
      language: 'typescript',
    });

    ctx.addCodeFile({
      path: 'src/app/api/data/route.ts',
      content: generateDataRoute(),
      language: 'typescript',
    });

    // Generate auth if needed
    if (features.some(f => /مصادقة|auth|تسجيل دخول/i.test(f))) {
      ctx.addCodeFile({
        path: 'src/app/api/auth/route.ts',
        content: generateAuthRoute(),
        language: 'typescript',
      });

      ctx.addCodeFile({
        path: 'src/lib/auth.ts',
        content: generateAuthLib(),
        language: 'typescript',
      });
    }

    // Generate middleware
    ctx.addCodeFile({
      path: 'src/middleware.ts',
      content: generateMiddleware(),
      language: 'typescript',
    });

    // Generate utility functions
    ctx.addCodeFile({
      path: 'src/lib/api-utils.ts',
      content: generateApiUtils(),
      language: 'typescript',
    });

    ctx.setAgentResult('backend', {
      routes: ['/api/health', '/api/data', ...(features.some(f => /مصادقة|auth/i.test(f)) ? ['/api/auth'] : [])],
      middleware: true,
      status: 'completed',
    });

    ctx.addMessage('backend', 'frontend', 'تم بناء APIs — استخدم /api/health و /api/data', 'result');
    ctx.addMessage('backend', 'db_guidance', 'APIs جاهزة — هل تحتاج نماذج قاعدة بيانات؟', 'request');

    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'backend',
      action: 'dev_complete',
      content: 'تم بناء APIs والمنطق البرمجي',
      status: 'success',
      timestamp: new Date().toISOString(),
    });

    ctx.setProgress(55);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'خطأ في تطوير الخلفية';
    ctx.addMessage('backend', 'all', `فشل تطوير الخلفية: ${errMsg}`, 'error');
    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'backend',
      action: 'dev_error',
      content: errMsg,
      status: 'error',
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

function generateHealthRoute(): string {
  return `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
`;
}

function generateDataRoute(): string {
  return `import { NextRequest, NextResponse } from 'next/server';

// In-memory data store (replace with DB connection for production)
let data: Record<string, unknown>[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const start = (page - 1) * limit;
    
    return NextResponse.json({
      data: data.slice(start, start + limit),
      total: data.length,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في جلب البيانات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const item = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
    };
    data.push(item);
    
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في إنشاء العنصر' },
      { status: 500 }
    );
  }
}
`;
}

function generateAuthRoute(): string {
  return `import { NextRequest, NextResponse } from 'next/server';

// Simple auth route — replace with NextAuth.js for production
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // TODO: Verify credentials against database
    // For now, return a mock token
    const token = Buffer.from(\`\${email}:\${Date.now()}\`).toString('base64');
    
    return NextResponse.json({
      success: true,
      token,
      user: { email },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل تسجيل الدخول' },
      { status: 500 }
    );
  }
}
`;
}

function generateAuthLib(): string {
  return `// Authentication utility functions
// Replace with NextAuth.js configuration for production

export interface User {
  id: string;
  email: string;
  name?: string;
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [email] = decoded.split(':');
    return { id: email, email };
  } catch {
    return null;
  }
}

export function requireAuth(request: Request): User | Response {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'مطلوب مصادقة' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const token = authHeader.substring(7);
  const user = verifyToken(token);
  if (!user) {
    return new Response(JSON.stringify({ error: 'رمز غير صالح' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return user;
}
`;
}

function generateMiddleware(): string {
  return `import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Add security headers
  const response = NextResponse.next();
  
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  return response;
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
`;
}

function generateApiUtils(): string {
  return `// API Utility Functions

export function successResponse(data: unknown, status = 200) {
  return Response.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 500) {
  return Response.json({ success: false, error: message }, { status });
}

export function paginate<T>(items: T[], page: number, limit: number) {
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    total: items.length,
    page,
    limit,
    totalPages: Math.ceil(items.length / limit),
  };
}

export function validateRequired(fields: Record<string, unknown>): string | null {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') {
      return \`الحقل \${key} مطلوب\`;
    }
  }
  return null;
}
`;
}
