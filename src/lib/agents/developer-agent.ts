import { BaseAgent } from './base-agent';
import { AgentContext, CodeFile, BuildResult } from './types';
import ZAI from 'z-ai-web-dev-sdk';

export class DeveloperAgent extends BaseAgent {
  type = 'developer' as const;
  name = 'Developer';
  nameAr = 'المطور الرئيسي';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, idea } = context;

    await this.log(projectId, 'بدء_التطوير', 'بدء كتابة الكود وبناء التطبيق', 'info');
    await this.updateProject(projectId, 'developing', 45, 'بناء التطبيق');
    await this.addMessage(projectId, 'developer', '💻 جاري بناء التطبيق وكتابة الكود...');

    try {
      const result = await this.generateCode(idea, projectId);

      if (result.success) {
        await this.log(projectId, 'اكتمال_التطوير', `تم إنشاء ${result.files.length} ملف بنجاح`, 'success');
        await this.addMessage(projectId, 'developer', `✅ تم بناء التطبيق بنجاح!\n\n📄 **الملفات المُنشأة:** ${result.files.length}\n🔗 **API:** مسارات CRUD كاملة\n🖥️ **الواجهة:** صفحات احترافية بالعربية\n🎨 **التصميم:** متجاوب وأنيق`);

        const existingFiles = context.codeFiles || [];
        context.codeFiles = [...existingFiles, ...result.files];
        context.progress = 65;
        await this.updateProject(projectId, 'developing', 65, 'بناء التطبيق', {
          codeFiles: JSON.stringify([...existingFiles, ...result.files]),
        });
      } else {
        await this.log(projectId, 'أخطاء_التطوير', `أخطاء في البناء: ${result.errors.join('; ')}`, 'error');
        await this.addMessage(projectId, 'developer', `❌ أخطاء في البناء: ${result.errors.join('; ')}`);
        context.errorLog = result.errors.join('\n');
      }

      return context;
    } catch (error: any) {
      await this.log(projectId, 'فشل_التطوير', `فشل التطوير: ${error.message}`, 'error');
      await this.addMessage(projectId, 'developer', `❌ فشل التطوير: ${error.message}`);
      context.errorLog = error.message;
      return context;
    }
  }

  private async generateCode(idea: string, projectId: string): Promise<BuildResult> {
    const files: CodeFile[] = [];
    const errors: string[] = [];

    try {
      // Generate API routes
      await this.log(projectId, 'إنشاء_API', 'إنشاء مسارات API...', 'info');
      files.push(...this.generateAPIRoutes());
      files.push(...this.generateDynamicRoute());

      // Generate frontend
      await this.log(projectId, 'إنشاء_الواجهة', 'إنشاء صفحات الواجهة...', 'info');
      files.push(this.generateMainPage(idea));

      // Generate layout
      files.push(this.generateLayout(idea));

      // Generate essential files
      files.push(...this.getEssentialFiles(idea));

    } catch (error: any) {
      errors.push(error.message);
    }

    return { success: errors.length === 0, files, errors, warnings: [] };
  }

  private generateAPIRoutes(): CodeFile[] {
    const apiContent = [
      "import { db } from '@/lib/db';",
      "import { NextResponse } from 'next/server';",
      '',
      'export async function GET() {',
      '  try {',
      '    const items = await db.item.findMany({ orderBy: { createdAt: "desc" } });',
      '    return NextResponse.json(items);',
      '  } catch (error) {',
      '    return NextResponse.json({ error: "فشل في جلب البيانات" }, { status: 500 });',
      '  }',
      '}',
      '',
      'export async function POST(request: Request) {',
      '  try {',
      '    const body = await request.json();',
      '    const { title, description, priority, category } = body;',
      '    if (!title) {',
      '      return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });',
      '    }',
      '    const item = await db.item.create({',
      '      data: { title, description, priority: priority || "medium", category },',
      '    });',
      '    return NextResponse.json(item, { status: 201 });',
      '  } catch (error) {',
      '    return NextResponse.json({ error: "فشل في إنشاء العنصر" }, { status: 500 });',
      '  }',
      '}',
    ].join('\n');

    return [{ path: 'src/app/api/items/route.ts', content: apiContent, language: 'typescript' }];
  }

  private generateDynamicRoute(): CodeFile[] {
    const content = [
      "import { db } from '@/lib/db';",
      "import { NextResponse } from 'next/server';",
      '',
      'export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {',
      '  try {',
      '    const { id } = await params;',
      '    const item = await db.item.findUnique({ where: { id } });',
      '    if (!item) return NextResponse.json({ error: "العنصر غير موجود" }, { status: 404 });',
      '    return NextResponse.json(item);',
      '  } catch (error) {',
      '    return NextResponse.json({ error: "فشل في جلب العنصر" }, { status: 500 });',
      '  }',
      '}',
      '',
      'export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {',
      '  try {',
      '    const { id } = await params;',
      '    const body = await request.json();',
      '    const item = await db.item.update({ where: { id }, data: body });',
      '    return NextResponse.json(item);',
      '  } catch (error) {',
      '    return NextResponse.json({ error: "فشل في تحديث العنصر" }, { status: 500 });',
      '  }',
      '}',
      '',
      'export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {',
      '  try {',
      '    const { id } = await params;',
      '    await db.item.delete({ where: { id } });',
      '    return NextResponse.json({ success: true });',
      '  } catch (error) {',
      '    return NextResponse.json({ error: "فشل في حذف العنصر" }, { status: 500 });',
      '  }',
      '}',
    ].join('\n');

    return [{ path: 'src/app/api/items/[id]/route.ts', content, language: 'typescript' }];
  }

  private generateMainPage(idea: string): CodeFile {
    const appName = idea.split(' ').slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

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
      '  priority: string;',
      '  category?: string;',
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
      "  useEffect(() => { fetchItems(); }, []);",
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
      '  const priorityLabels: Record<string, string> = {',
      '    high: "عالي", medium: "متوسط", low: "منخفض"',
      '  };',
      '',
      '  const priorityColors: Record<string, string> = {',
      '    high: "bg-red-100 text-red-700",',
      '    medium: "bg-amber-100 text-amber-700",',
      '    low: "bg-emerald-100 text-emerald-700",',
      '  };',
      '',
      '  return (',
      '    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30" dir="rtl">',
      '      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">',
      '        <div className="container mx-auto px-4 py-4 flex items-center gap-3">',
      '          <Sparkles className="h-6 w-6 text-primary" />',
      `          <h1 className="text-2xl font-bold">${appName}</h1>`,
      '          <Badge variant="secondary" className="mr-auto">صُنع بواسطة وكيل ذكاء اصطناعي</Badge>',
      '        </div>',
      '      </header>',
      '      <main className="container mx-auto px-4 py-8 max-w-5xl">',
      '        <section className="text-center py-12">',
      `          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">${appName}</h2>`,
      `          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">${idea}</p>`,
      '        </section>',
      '        <Card className="mb-8">',
      '          <CardHeader><CardTitle>إضافة عنصر جديد</CardTitle></CardHeader>',
      '          <CardContent>',
      '            <form onSubmit={handleSubmit} className="space-y-4">',
      '              <div className="space-y-2">',
      '                <Label htmlFor="title">العنوان</Label>',
      '                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="أدخل العنوان..." required />',
      '              </div>',
      '              <div className="space-y-2">',
      '                <Label htmlFor="description">الوصف</Label>',
      '                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="أدخل الوصف..." rows={3} />',
      '              </div>',
      '              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">',
      '                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />جاري الإضافة...</> : <><Plus className="mr-2 h-4 w-4" />إضافة</>}',
      '              </Button>',
      '            </form>',
      '          </CardContent>',
      '        </Card>',
      '        {loading ? (',
      '          <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /><p className="mt-2 text-muted-foreground">جاري التحميل...</p></div>',
      '        ) : items.length === 0 ? (',
      '          <div className="text-center py-12"><p className="text-muted-foreground text-lg">لا توجد عناصر بعد. أضف أول عنصر!</p></div>',
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
      '                    <Badge className={priorityColors[item.priority] || "bg-gray-100 text-gray-700"}>{priorityLabels[item.priority] || item.priority}</Badge>',
      '                    <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("ar")}</span>',
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

    return { path: 'src/app/page.tsx', content: pageCode, language: 'tsx' };
  }

  private generateLayout(idea: string): CodeFile {
    const appName = idea.split(' ').slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const content = [
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
      '    <html lang="ar" dir="rtl" suppressHydrationWarning>',
      '      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>',
      '        {children}',
      '        <Toaster />',
      '      </body>',
      '    </html>',
      '  );',
      '}',
    ].join('\n');

    return { path: 'src/app/layout.tsx', content, language: 'tsx' };
  }

  private getEssentialFiles(idea: string): CodeFile[] {
    const appName = idea.split(' ').slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const slugName = appName.toLowerCase().replace(/\s+/g, '-');

    const packageJson = {
      name: slugName, version: '0.1.0', private: true,
      scripts: { dev: 'next dev', build: 'next build', start: 'next start', lint: 'eslint .', 'db:push': 'prisma db push', 'db:generate': 'prisma generate' },
      dependencies: { '@prisma/client': '^6.11.1', '@radix-ui/react-slot': '^1.2.3', 'class-variance-authority': '^0.7.1', clsx: '^2.1.1', 'lucide-react': '^0.525.0', next: '^16.1.1', react: '^19.0.0', 'react-dom': '^19.0.0', sonner: '^2.0.6', 'tailwind-merge': '^3.3.1', zod: '^4.0.2' },
      devDependencies: { '@tailwindcss/postcss': '^4', '@types/react': '^19', '@types/react-dom': '^19', prisma: '^6.11.1', tailwindcss: '^4', typescript: '^5' },
    };

    const dbCode = [
      "import { PrismaClient } from '@prisma/client';",
      'const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };',
      'export const db = globalForPrisma.prisma ?? new PrismaClient();',
      "if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;",
      'export default db;',
    ].join('\n');

    const utilsCode = [
      'import { clsx, type ClassValue } from "clsx";',
      'import { twMerge } from "tailwind-merge";',
      'export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }',
    ].join('\n');

    const nextConfig = 'import type { NextConfig } from "next";\nconst nextConfig: NextConfig = {};\nexport default nextConfig;';

    const tsconfig = {
      compilerOptions: { target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler', resolveJsonModule: true, isolatedModules: true, jsx: 'preserve', incremental: true, plugins: [{ name: 'next' }], paths: { '@/*': ['./src/*'] } },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    };

    return [
      { path: 'package.json', content: JSON.stringify(packageJson, null, 2), language: 'json' },
      { path: '.env', content: 'DATABASE_URL="file:./dev.db"', language: 'env' },
      { path: 'src/lib/db.ts', content: dbCode, language: 'typescript' },
      { path: 'src/lib/utils.ts', content: utilsCode, language: 'typescript' },
      { path: 'next.config.ts', content: nextConfig, language: 'typescript' },
      { path: 'tsconfig.json', content: JSON.stringify(tsconfig, null, 2), language: 'json' },
    ];
  }
}
