// Builder Agent - Generates code based on the execution plan

import { BaseAgent } from './base-agent';
import { AgentContext, CodeFile, BuildResult } from './types';
import ZAI from 'z-ai-web-dev-sdk';

export class BuilderAgent extends BaseAgent {
  type = 'builder' as const;
  name = 'Builder Agent';
  description = 'Generates application code based on the execution plan';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, idea, plan } = context;

    if (!plan) {
      throw new Error('No execution plan available. Planner must run first.');
    }

    await this.log(projectId, 'start_building', 'Starting code generation...', 'info');
    await this.updateProjectStatus(projectId, 'building');
    await this.addMessage(projectId, 'builder', '🔨 Starting to build your application...');

    try {
      const result = await this.generateCode(idea, plan, projectId);

      if (result.success) {
        await this.log(projectId, 'build_complete', `Successfully generated ${result.files.length} files`, 'success');
        await this.addMessage(projectId, 'builder', `✅ Build complete! Generated ${result.files.length} files.\n\n${result.warnings.length > 0 ? `⚠️ Warnings: ${result.warnings.join(', ')}` : 'No warnings.'}`);

        // Save code files to project
        await this.updateProjectStatus(projectId, 'building', {
          codeFiles: JSON.stringify(result.files),
        });

        context.codeFiles = result.files;
      } else {
        await this.log(projectId, 'build_errors', `Build completed with errors: ${result.errors.join('; ')}`, 'error');
        await this.addMessage(projectId, 'builder', `❌ Build completed with errors: ${result.errors.join('; ')}`);

        context.errorLog = result.errors.join('\n');
      }

      return context;
    } catch (error: any) {
      await this.log(projectId, 'build_failed', `Build failed: ${error.message}`, 'error');
      await this.addMessage(projectId, 'builder', `❌ Build failed: ${error.message}`);
      context.errorLog = error.message;
      return context;
    }
  }

  private async generateCode(idea: string, plan: any, projectId: string): Promise<BuildResult> {
    const files: CodeFile[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    const zai = await ZAI.create();

    // Generate each major file
    const fileGenerations = [
      this.generatePrismaSchema(idea, zai, projectId),
      this.generateAPIRoutes(idea, zai, projectId),
      this.generateFrontendPages(idea, zai, projectId),
      this.generateLayoutAndConfig(idea, zai, projectId),
    ];

    for (const generation of fileGenerations) {
      try {
        const generatedFiles = await generation;
        files.push(...generatedFiles);
      } catch (error: any) {
        errors.push(`Failed to generate files: ${error.message}`);
      }
    }

    // Generate essential project files
    files.push(...this.getEssentialFiles(idea));

    return {
      success: errors.length === 0,
      files,
      errors,
      warnings,
    };
  }

  private async generatePrismaSchema(idea: string, zai: any, projectId: string): Promise<CodeFile[]> {
    await this.log(projectId, 'generating_schema', 'Generating database schema...', 'info');

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a database architect. Generate a Prisma schema for SQLite based on the project description.
Return ONLY the schema file content, no markdown, no code blocks, no explanation. Start with "generator client" directly.`
          },
          {
            role: 'user',
            content: `Generate a Prisma schema for this project: "${idea}". Use SQLite as the database provider. Include appropriate models with relationships. Use cuid for IDs. Include createdAt and updatedAt timestamps.`
          }
        ],
        temperature: 0.5,
        max_tokens: 1500,
      });

      const schemaContent = this.cleanCodeResponse(completion.choices[0]?.message?.content || '');

      return [{
        path: 'prisma/schema.prisma',
        content: schemaContent,
        language: 'prisma',
      }];
    } catch (error: any) {
      await this.log(projectId, 'schema_fallback', `Using default schema: ${error.message}`, 'warning');
      return [{
        path: 'prisma/schema.prisma',
        content: this.getDefaultSchema(idea),
        language: 'prisma',
      }];
    }
  }

  private async generateAPIRoutes(idea: string, zai: any, projectId: string): Promise<CodeFile[]> {
    await this.log(projectId, 'generating_api', 'Generating API routes...', 'info');

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a backend developer. Generate Next.js API route handlers.
Return ONLY valid TypeScript code, no markdown, no code blocks.
Each file should be a complete API route handler using Next.js App Router (export async function GET, POST, PUT, DELETE).
Use Prisma Client for database operations. Import db from '@/lib/db'.`
          },
          {
            role: 'user',
            content: `Generate a complete API route handler for: "${idea}". 
Create a CRUD API at src/app/api/items/route.ts with GET (list all), POST (create), and a dynamic route at src/app/api/items/[id]/route.ts with GET (by id), PUT (update), DELETE (delete).
Use proper error handling and validation.`
          }
        ],
        temperature: 0.5,
        max_tokens: 2500,
      });

      const apiContent = this.cleanCodeResponse(completion.choices[0]?.message?.content || '');

      const files: CodeFile[] = [{
        path: 'src/app/api/items/route.ts',
        content: apiContent.includes('export') ? apiContent : this.getDefaultAPIRoutes(),
        language: 'typescript',
      }];

      // Generate dynamic route
      const dynamicCompletion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a backend developer. Generate a Next.js API dynamic route handler.
Return ONLY valid TypeScript code, no markdown, no code blocks.
Use params: { params: Promise<{ id: string }> } for Next.js 16 compatibility.`
          },
          {
            role: 'user',
            content: `Generate a dynamic API route at src/app/api/items/[id]/route.ts with GET, PUT, DELETE handlers for: "${idea}". Use Prisma Client. Import db from '@/lib/db'.`
          }
        ],
        temperature: 0.5,
        max_tokens: 1500,
      });

      const dynamicContent = this.cleanCodeResponse(dynamicCompletion.choices[0]?.message?.content || '');

      files.push({
        path: 'src/app/api/items/[id]/route.ts',
        content: dynamicContent.includes('export') ? dynamicContent : this.getDefaultDynamicRoute(),
        language: 'typescript',
      });

      return files;
    } catch (error: any) {
      await this.log(projectId, 'api_fallback', `Using default API routes: ${error.message}`, 'warning');
      return [
        { path: 'src/app/api/items/route.ts', content: this.getDefaultAPIRoutes(), language: 'typescript' },
        { path: 'src/app/api/items/[id]/route.ts', content: this.getDefaultDynamicRoute(), language: 'typescript' },
      ];
    }
  }

  private async generateFrontendPages(idea: string, zai: any, projectId: string): Promise<CodeFile[]> {
    await this.log(projectId, 'generating_frontend', 'Generating frontend pages...', 'info');

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a frontend developer. Generate a Next.js page component.
Return ONLY valid JSX/TSX code, no markdown, no code blocks.
Use 'use client' directive. Use shadcn/ui components (Button, Card, Input, etc.).
Import from '@/components/ui/button', '@/components/ui/card', '@/components/ui/input', etc.
Use Tailwind CSS for styling. Make it responsive and modern.`
          },
          {
            role: 'user',
            content: `Generate a complete main page (src/app/page.tsx) for this application: "${idea}".
It should:
- Have a hero section with the app name and description
- Display items in a grid layout using Cards
- Have a form to add new items with Input and Button components
- Use fetch to call /api/items for CRUD operations
- Be fully responsive (mobile-first)
- Include loading states and error handling
- Use modern UI with proper spacing and typography`
          }
        ],
        temperature: 0.6,
        max_tokens: 3000,
      });

      const pageContent = this.cleanCodeResponse(completion.choices[0]?.message?.content || '');

      return [{
        path: 'src/app/page.tsx',
        content: pageContent.includes('export') ? pageContent : this.getDefaultPage(idea),
        language: 'tsx',
      }];
    } catch (error: any) {
      await this.log(projectId, 'frontend_fallback', `Using default page: ${error.message}`, 'warning');
      return [{
        path: 'src/app/page.tsx',
        content: this.getDefaultPage(idea),
        language: 'tsx',
      }];
    }
  }

  private async generateLayoutAndConfig(idea: string, zai: any, projectId: string): Promise<CodeFile[]> {
    const appName = idea.split(' ').slice(0, 3).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const layoutCode = [
      'import type { Metadata } from "next";',
      'import { Geist, Geist_Mono } from "next/font/google";',
      'import "./globals.css";',
      'import { Toaster } from "@/components/ui/toaster";',
      '',
      'const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });',
      'const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });',
      '',
      'export const metadata: Metadata = {',
      `  title: "${appName}",`,
      `  description: "${idea.replace(/"/g, '\\"')}",`,
      '};',
      '',
      'export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {',
      '  return (',
      '    <html lang="en" suppressHydrationWarning>',
      '      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>',
      '        {children}',
      '        <Toaster />',
      '      </body>',
      '    </html>',
      '  );',
      '}',
    ].join('\n');

    return [
      {
        path: 'src/app/layout.tsx',
        content: layoutCode,
        language: 'tsx',
      },
    ];
  }

  private getEssentialFiles(idea: string): CodeFile[] {
    const appName = idea.split(' ').slice(0, 3).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const slugName = appName.toLowerCase().replace(/\s+/g, '-');

    const packageJson = {
      name: slugName,
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'eslint .',
        'db:push': 'prisma db push',
        'db:generate': 'prisma generate',
      },
      dependencies: {
        '@prisma/client': '^6.11.1',
        '@radix-ui/react-slot': '^1.2.3',
        'class-variance-authority': '^0.7.1',
        clsx: '^2.1.1',
        'lucide-react': '^0.525.0',
        next: '^16.1.1',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        sonner: '^2.0.6',
        'tailwind-merge': '^3.3.1',
        zod: '^4.0.2',
      },
      devDependencies: {
        '@tailwindcss/postcss': '^4',
        '@types/react': '^19',
        '@types/react-dom': '^19',
        prisma: '^6.11.1',
        tailwindcss: '^4',
        typescript: '^5',
      },
    };

    const dbCode = [
      "import { PrismaClient } from '@prisma/client';",
      '',
      'const globalForPrisma = globalThis as unknown as {',
      '  prisma: PrismaClient | undefined;',
      '};',
      '',
      'export const db = globalForPrisma.prisma ?? new PrismaClient();',
      '',
      "if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;",
      '',
      'export default db;',
    ].join('\n');

    const utilsCode = [
      'import { clsx, type ClassValue } from "clsx";',
      'import { twMerge } from "tailwind-merge";',
      '',
      'export function cn(...inputs: ClassValue[]) {',
      '  return twMerge(clsx(inputs));',
      '}',
    ].join('\n');

    const nextConfigCode = [
      'import type { NextConfig } from "next";',
      '',
      'const nextConfig: NextConfig = {};',
      '',
      'export default nextConfig;',
    ].join('\n');

    const tsconfigJson = {
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: { '@/*': ['./src/*'] },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    };

    return [
      {
        path: 'package.json',
        content: JSON.stringify(packageJson, null, 2),
        language: 'json',
      },
      {
        path: '.env',
        content: 'DATABASE_URL="file:./dev.db"',
        language: 'env',
      },
      {
        path: 'src/lib/db.ts',
        content: dbCode,
        language: 'typescript',
      },
      {
        path: 'src/lib/utils.ts',
        content: utilsCode,
        language: 'typescript',
      },
      {
        path: 'next.config.ts',
        content: nextConfigCode,
        language: 'typescript',
      },
      {
        path: 'tsconfig.json',
        content: JSON.stringify(tsconfigJson, null, 2),
        language: 'json',
      },
    ];
  }

  private getDefaultSchema(idea: string): string {
    return `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Item {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}`;
  }

  private getDefaultAPIRoutes(): string {
    return `import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const items = await db.item.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const item = await db.item.create({
      data: { title, description },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}`;
  }

  private getDefaultDynamicRoute(): string {
    return `import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await db.item.findUnique({ where: { id } });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const item = await db.item.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.item.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}`;
  }

  private getDefaultPage(idea: string): string {
    const appName = idea.split(' ').slice(0, 3).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const pageCode = [
      "'use client';",
      '',
      "import { useState, useEffect } from 'react';",
      "import { Button } from '@/components/ui/button';",
      "import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';",
      "import { Input } from '@/components/ui/input';",
      "import { Label } from '@/components/ui/label';",
      "import { Textarea } from '@/components/ui/textarea';",
      "import { Badge } from '@/components/ui/badge';",
      "import { Plus, Trash2, Loader2, Sparkles } from 'lucide-react';",
      '',
      'interface Item {',
      '  id: string;',
      '  title: string;',
      '  description?: string;',
      '  status: string;',
      '  createdAt: string;',
      '}',
      '',
      'export default function HomePage() {',
      '  const [items, setItems] = useState<Item[]>([]);',
      '  const [loading, setLoading] = useState(true);',
      '  const [submitting, setSubmitting] = useState(false);',
      "  const [title, setTitle] = useState('');",
      "  const [description, setDescription] = useState('');",
      '',
      '  useEffect(() => { fetchItems(); }, []);',
      '',
      '  const fetchItems = async () => {',
      '    try {',
      "      const res = await fetch('/api/items');",
      '      const data = await res.json();',
      '      setItems(data);',
      '    } catch (error) { console.error(error); }',
      '    finally { setLoading(false); }',
      '  };',
      '',
      '  const handleSubmit = async (e: React.FormEvent) => {',
      '    e.preventDefault();',
      "    if (!title.trim()) return;",
      '    setSubmitting(true);',
      '    try {',
      "      const res = await fetch('/api/items', {",
      "        method: 'POST',",
      "        headers: { 'Content-Type': 'application/json' },",
      '        body: JSON.stringify({ title, description }),',
      '      });',
      '      if (res.ok) { setTitle(""); setDescription(""); fetchItems(); }',
      '    } catch (error) { console.error(error); }',
      '    finally { setSubmitting(false); }',
      '  };',
      '',
      '  const handleDelete = async (id: string) => {',
      '    try {',
      '      await fetch(`/api/items/${id}`, { method: "DELETE" });',
      '      fetchItems();',
      '    } catch (error) { console.error(error); }',
      '  };',
      '',
      '  return (',
      '    <div className="min-h-screen bg-gradient-to-br from-background to-muted">',
      '      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">',
      '        <div className="container mx-auto px-4 py-4 flex items-center gap-3">',
      '          <div className="flex items-center gap-2">',
      '            <Sparkles className="h-6 w-6 text-primary" />',
      `            <h1 className="text-2xl font-bold">${appName}</h1>`,
      '          </div>',
      '          <Badge variant="secondary" className="ml-auto">Built by AI Agent</Badge>',
      '        </div>',
      '      </header>',
      '      <main className="container mx-auto px-4 py-8 max-w-5xl">',
      '        <section className="text-center py-12">',
      '          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">',
      `            ${appName}`,
      '          </h2>',
      '          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">',
      `            ${idea}`,
      '          </p>',
      '        </section>',
      '        <Card className="mb-8">',
      '          <CardHeader><CardTitle>Add New Item</CardTitle></CardHeader>',
      '          <CardContent>',
      '            <form onSubmit={handleSubmit} className="space-y-4">',
      '              <div className="space-y-2">',
      '                <Label htmlFor="title">Title</Label>',
      '                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title..." required />',
      '              </div>',
      '              <div className="space-y-2">',
      '                <Label htmlFor="description">Description</Label>',
      '                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter description..." rows={3} />',
      '              </div>',
      '              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">',
      '                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : <><Plus className="mr-2 h-4 w-4" />Add Item</>}',
      '              </Button>',
      '            </form>',
      '          </CardContent>',
      '        </Card>',
      '        {loading ? (',
      '          <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /><p className="mt-2 text-muted-foreground">Loading...</p></div>',
      '        ) : items.length === 0 ? (',
      '          <div className="text-center py-12"><p className="text-muted-foreground text-lg">No items yet. Add your first item!</p></div>',
      '        ) : (',
      '          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">',
      '            {items.map((item) => (',
      '              <Card key={item.id} className="group hover:shadow-md transition-shadow">',
      '                <CardHeader className="pb-3">',
      '                  <div className="flex items-start justify-between">',
      '                    <CardTitle className="text-lg">{item.title}</CardTitle>',
      '                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(item.id)}>',
      '                      <Trash2 className="h-4 w-4 text-destructive" />',
      '                    </Button>',
      '                  </div>',
      '                </CardHeader>',
      '                <CardContent>',
      '                  {item.description && <p className="text-sm text-muted-foreground mb-3">{item.description}</p>}',
      '                  <div className="flex items-center justify-between">',
      '                    <Badge variant="outline">{item.status}</Badge>',
      '                    <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>',
      '                  </div>',
      '                </CardContent>',
      '              </Card>',
      '            ))}',
      '          </div>',
      '        )}',
      '      </main>',
      '    </div>',
      '  );',
      '}',
    ].join('\n');

    return pageCode;
  }

  private cleanCodeResponse(response: string): string {
    let clean = response.trim();
    // Remove markdown code blocks
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:typescript|tsx|ts|json|prisma|javascript|jsx)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    return clean;
  }
}
