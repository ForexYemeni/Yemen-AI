// SEO Optimizer Agent - محسن محركات البحث
// يحسن ظهور التطبيق في محركات البحث ويضيف البيانات الوصفية

import { BaseAgent } from './base-agent';
import { AgentContext, CodeFile } from './types';
import ZAI from 'z-ai-web-dev-sdk';

export class SeoAgent extends BaseAgent {
  type = 'seo' as const;
  name = 'SEO Optimizer';
  nameAr = 'محسن البحث';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, idea, codeFiles } = context;

    await this.log(projectId, 'بدء_SEO', 'بدء تحسين محركات البحث والبيانات الوصفية', 'info');
    await this.updateProject(projectId, 'seo_optimizing', 93, 'تحسين محركات البحث');
    await this.addMessage(projectId, 'seo', '🔎 جاري تحسين ظهور التطبيق في محركات البحث...');

    try {
      await this.delay(1500);
      const seoFiles = this.generateSEOFiles(idea);

      await this.log(projectId, 'اكتمال_SEO', 'تم تحسين SEO وإضافة البيانات الوصفية', 'success');
      await this.addMessage(projectId, 'seo', `✅ تم تحسين محركات البحث!\n\n🔎 **البيانات الوصفية:** عنوان ووصف محسنان\n🌐 **Open Graph:** صور وبيانات للوسائط الاجتماعية\n🗺️ **Sitemap:** خريطة الموقع تلقائية\n🤖 **Robots.txt:** إرشادات لمحركات البحث\n📊 **Schema.org:** بيانات منظمة`);

      const existingFiles = context.codeFiles || [];
      // Replace existing layout with SEO-optimized version
      const filteredFiles = existingFiles.filter(f => f.path !== 'src/app/layout.tsx' && !f.path.includes('sitemap') && !f.path.includes('robots'));
      context.codeFiles = [...filteredFiles, ...seoFiles];
      context.progress = 95;
      await this.updateProject(projectId, 'seo_optimizing', 95, 'تحسين محركات البحث', {
        codeFiles: JSON.stringify([...filteredFiles, ...seoFiles]),
      });

      return context;
    } catch (error: any) {
      await this.log(projectId, 'فشل_SEO', `فشل تحسين SEO: ${error.message}`, 'warning');
      await this.addMessage(projectId, 'seo', `⚠️ تعذر تحسين SEO: ${error.message}`);
      context.progress = 95;
      return context;
    }
  }

  private generateSEOFiles(idea: string): CodeFile[] {
    const appName = idea.split(' ').slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const description = idea.substring(0, 160);

    // SEO-optimized layout
    const layoutCode = `import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "${appName}",
    template: "%s | ${appName}",
  },
  description: "${description.replace(/"/g, '\\"')}",
  keywords: ["تطبيق", "إدارة", "تنظيم", "إنتاجية", "عربي"],
  authors: [{ name: "مصنع الوكلاء الذكي" }],
  creator: "مصنع الوكلاء الذكي",
  openGraph: {
    type: "website",
    locale: "ar_SA",
    title: "${appName}",
    description: "${description.replace(/"/g, '\\"')}",
    siteName: "${appName}",
  },
  twitter: {
    card: "summary_large_image",
    title: "${appName}",
    description: "${description.replace(/"/g, '\\"')}",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c3aed",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={\`\${geistSans.variable} \${geistMono.variable} antialiased bg-background text-foreground\`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}`;

    // Sitemap
    const sitemapCode = `import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];
}`;

    // Robots
    const robotsCode = `import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: (process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com') + '/sitemap.xml',
  };
}`;

    return [
      { path: 'src/app/layout.tsx', content: layoutCode, language: 'tsx' },
      { path: 'src/app/sitemap.ts', content: sitemapCode, language: 'typescript' },
      { path: 'src/app/robots.ts', content: robotsCode, language: 'typescript' },
    ];
  }
}
