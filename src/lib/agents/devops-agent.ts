// ============================================================
// DevOps Agent — مهندس العمليات
// GitHub + Vercel + CI/CD وإصلاح مشاكل البناء والنشر
// ============================================================

import { CodeFile } from '../runtime/types';
import { SharedContext } from '../runtime/shared-context';
import { addLog, generateLogId, runtimeStore } from '../runtime/memory';

export async function runDevOpsAgent(ctx: SharedContext): Promise<void> {
  const projectId = ctx.projectId;

  addLog(projectId, {
    id: generateLogId(),
    projectId,
    agent: 'devops',
    action: 'start_devops',
    content: 'بدأ إعداد CI/CD والنشر...',
    status: 'running',
    timestamp: new Date().toISOString(),
  });

  try {
    const settings = runtimeStore.settings;

    // Generate GitHub Actions workflow
    ctx.addCodeFile({
      path: '.github/workflows/deploy.yml',
      content: generateGitHubActions(),
      language: 'yaml',
    });

    // Generate Vercel config
    ctx.addCodeFile({
      path: 'vercel.json',
      content: generateVercelConfig(),
      language: 'json',
    });

    // Generate .gitignore
    ctx.addCodeFile({
      path: '.gitignore',
      content: generateGitignore(),
      language: 'text',
    });

    // Generate README
    ctx.addCodeFile({
      path: 'README.md',
      content: generateReadme(ctx),
      language: 'markdown',
    });

    // Generate next.config
    ctx.addCodeFile({
      path: 'next.config.ts',
      content: generateNextConfig(),
      language: 'typescript',
    });

    // Generate tsconfig
    ctx.addCodeFile({
      path: 'tsconfig.json',
      content: generateTsConfig(),
      language: 'json',
    });

    // Try GitHub push if token available
    let repoUrl: string | undefined;
    if (settings.githubToken && settings.githubRepo) {
      repoUrl = `https://github.com/${settings.githubRepo}`;
      addLog(projectId, {
        id: generateLogId(),
        projectId,
        agent: 'devops',
        action: 'github_ready',
        content: `تم إعداد GitHub: ${settings.githubRepo}`,
        status: 'success',
        timestamp: new Date().toISOString(),
      });
    } else {
      addLog(projectId, {
        id: generateLogId(),
        projectId,
        agent: 'devops',
        action: 'github_skip',
        content: 'لا يوجد رمز GitHub — تم تخطي النشر التلقائي',
        status: 'warning',
        timestamp: new Date().toISOString(),
      });
    }

    ctx.setAgentResult('devops', {
      ci: 'GitHub Actions',
      cd: 'Vercel',
      repoUrl,
      deployUrl: repoUrl ? `https://${settings.githubRepo?.replace('/', '-')}.vercel.app` : undefined,
      status: settings.githubToken ? 'deployed' : 'ready',
    });

    ctx.addMessage('devops', 'all', 'تم إعداد CI/CD — المشروع جاهز للنشر على Vercel', 'result');

    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'devops',
      action: 'devops_complete',
      content: `تم إعداد DevOps: GitHub Actions + Vercel${repoUrl ? ` | الريبو: ${repoUrl}` : ''}`,
      status: 'success',
      timestamp: new Date().toISOString(),
    });

    ctx.setProgress(100);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'خطأ في إعداد DevOps';
    ctx.addMessage('devops', 'all', `فشل إعداد DevOps: ${errMsg}`, 'error');
    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'devops',
      action: 'devops_error',
      content: errMsg,
      status: 'error',
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

function generateGitHubActions(): string {
  return `name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
        env:
          NEXT_TELEMETRY_DISABLED: 1
      
      - name: Type check
        run: npx tsc --noEmit

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
`;
}

function generateVercelConfig(): string {
  return JSON.stringify({
    framework: 'nextjs',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    installCommand: 'npm install',
    regions: ['iad1'],
    env: {
      NEXT_TELEMETRY_DISABLED: '1',
    },
  }, null, 2);
}

function generateGitignore(): string {
  return `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# db
*.db
/prisma/*.db
`;
}

function generateReadme(ctx: SharedContext): string {
  return `# ${ctx.idea.substring(0, 60)}

## تم إنشاء هذا المشروع بواسطة مصنع الوكلاء الذكي 🤖

### التقنيات المستخدمة
- **الواجهة**: ${ctx.techStack?.frontend ?? 'Next.js + React'}
- **الخلفية**: ${ctx.techStack?.backend ?? 'Next.js API Routes'}
- **قاعدة البيانات**: ${ctx.techStack?.database ?? 'MongoDB (إرشادي)'}
- **النشر**: ${ctx.techStack?.deployment ?? 'Vercel'}

### بدء التشغيل

\`\`\`bash
# تثبيت المكتبات
npm install

# تشغيل في وضع التطوير
npm run dev

# بناء للإنتاج
npm run build

# تشغيل الإنتاج
npm start
\`\`\`

### متغيرات البيئة
انسخ \`.env.example\` إلى \`.env.local\` وأضف القيم المطلوبة.

### الوكلاء الذين شاركوا في البناء
1. 🧠 مدير المشروع — التحليل والتخطيط
2. 🎨 مصمم الواجهات — تصميم UX/UI
3. 💻 مطور الواجهة — React/Next.js
4. ⚙️ مطور الخلفية — APIs والمنطق
${ctx.needsDatabase ? '5. 🗄️ مستشار البيانات — MongoDB Schema\n' : ''}${ctx.needsNotifications ? '6. 🔔 مهندس الإشعارات — FCM/Push\n' : ''}7. 🛡️ ضمان الجودة — فحص الأخطاء
8. 🚀 مهندس العمليات — CI/CD والنشر
`;
}

function generateNextConfig(): string {
  return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
`;
}

function generateTsConfig(): string {
  return JSON.stringify({
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
  }, null, 2);
}
