// ============================================================
// Frontend Agent — يبني React/Next.js ويحسن الأداء والتفاعل
// ============================================================

import { CodeFile } from '../runtime/types';
import { SharedContext } from '../runtime/shared-context';
import { addLog, generateLogId } from '../runtime/memory';

export async function runFrontendAgent(ctx: SharedContext): Promise<void> {
  const projectId = ctx.projectId;

  addLog(projectId, {
    id: generateLogId(),
    projectId,
    agent: 'frontend',
    action: 'start_dev',
    content: 'بدأ تطوير الواجهة الأمامية...',
    status: 'running',
    timestamp: new Date().toISOString(),
  });

  try {
    const pmResult = ctx.getAgentResult('project_manager') as Record<string, unknown> | undefined;
    const pages = (pmResult?.analysis as Record<string, unknown>)?.pages as string[] ?? ['الرئيسية', 'حول'];

    // Generate layout
    ctx.addCodeFile({
      path: 'src/app/layout.tsx',
      content: generateLayout(),
      language: 'typescript',
    });

    // Generate main page
    ctx.addCodeFile({
      path: 'src/app/page.tsx',
      content: generateMainPage(ctx.idea, pages),
      language: 'typescript',
    });

    // Generate components
    ctx.addCodeFile({
      path: 'src/components/Header.tsx',
      content: generateHeader(pages),
      language: 'typescript',
    });

    ctx.addCodeFile({
      path: 'src/components/Footer.tsx',
      content: generateFooter(),
      language: 'typescript',
    });

    // Generate globals.css
    ctx.addCodeFile({
      path: 'src/app/globals.css',
      content: generateGlobalsCss(),
      language: 'css',
    });

    ctx.setAgentResult('frontend', {
      pages: pages.length,
      components: ['Header', 'Footer', 'Page'],
      status: 'completed',
    });

    ctx.addMessage('frontend', 'backend', 'تم بناء الواجهة — أرسل لي بيانات الـ API', 'request');
    ctx.addMessage('frontend', 'qa_debug', 'الواجهة جاهزة للفحص', 'result');

    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'frontend',
      action: 'dev_complete',
      content: `تم بناء ${pages.length} صفحة ومكونات الواجهة`,
      status: 'success',
      timestamp: new Date().toISOString(),
    });

    ctx.setProgress(40);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'خطأ في تطوير الواجهة';
    ctx.addMessage('frontend', 'all', `فشل تطوير الواجهة: ${errMsg}`, 'error');
    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'frontend',
      action: 'dev_error',
      content: errMsg,
      status: 'error',
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

function generateLayout(): string {
  return `'use client';

import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
`;
}

function generateMainPage(idea: string, pages: string[]): string {
  return `'use client';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-l from-violet-600 to-cyan-500 bg-clip-text text-transparent">
            ${idea.substring(0, 80)}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            منصة متكاملة تقدم أفضل التجارب والخدمات
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-8 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors">
              ابدأ الآن
            </button>
            <button className="px-8 py-3 border-2 border-violet-600 text-violet-600 rounded-xl hover:bg-violet-50 transition-colors">
              اعرف المزيد
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">المميزات</h2>
          <div className="grid md:grid-cols-3 gap-8">
            ${pages.slice(0, 6).map(p => `
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-violet-600 text-xl">✦</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">${p}</h3>
              <p className="text-gray-600">وصف مختصر لقسم ${p}</p>
            </div>`).join('')}
          </div>
        </div>
      </section>
    </div>
  );
}
`;
}

function generateHeader(pages: string[]): string {
  return `'use client';

import { useState } from 'react';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="text-xl font-bold bg-gradient-to-l from-violet-600 to-cyan-500 bg-clip-text text-transparent">
          مشروعي
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          ${pages.slice(0, 5).map(p => `<a href="#" className="text-gray-600 hover:text-violet-600 transition-colors">${p}</a>`).join('\n          ')}
        </nav>

        <button
          className="md:hidden p-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="القائمة"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t bg-white px-4 py-2">
          ${pages.slice(0, 5).map(p => `<a href="#" className="block py-2 text-gray-600 hover:text-violet-600">${p}</a>`).join('\n          ')}
        </div>
      )}
    </header>
  );
}
`;
}

function generateFooter(): string {
  return `export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white text-lg font-semibold mb-4">مشروعي</h3>
          <p className="text-sm">منصة متكاملة تقدم أفضل الخدمات</p>
        </div>
        <div>
          <h4 className="text-white font-medium mb-4">روابط سريعة</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">الرئيسية</a></li>
            <li><a href="#" className="hover:text-white transition-colors">عن المنصة</a></li>
            <li><a href="#" className="hover:text-white transition-colors">تواصل معنا</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-4">القانوني</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a></li>
            <li><a href="#" className="hover:text-white transition-colors">الشروط والأحكام</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-4">تواصل</h4>
          <p className="text-sm">info@example.com</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-sm">
        © 2024 مشروعي. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
`;
}

function generateGlobalsCss(): string {
  return `@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #111827;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', 'Cairo', sans-serif;
  background: var(--background);
  color: var(--foreground);
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f5f9;
}
::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
`;
}
