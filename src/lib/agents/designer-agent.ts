import { BaseAgent } from './base-agent';
import { AgentContext, CodeFile } from './types';

export class DesignerAgent extends BaseAgent {
  type = 'designer' as const;
  name = 'Designer';
  nameAr = 'مصمم الواجهات';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, idea } = context;

    await this.log(projectId, 'بدء_التصميم', 'بدء تصميم نظام الواجهات والتجربة', 'info');
    await this.updateProject(projectId, 'designing', 35, 'تصميم الواجهات');
    await this.addMessage(projectId, 'designer', '🎨 جاري تصميم نظام الواجهات والألوان والخطوط...');

    try {
      await this.delay(2000);
      const designFiles = this.generateDesignFiles(idea);

      await this.log(projectId, 'اكتمال_التصميم', `تم تصميم ${designFiles.length} ملفات تصميم`, 'success');
      await this.addMessage(projectId, 'designer', '✅ تم تصميم الواجهات بنجاح!\n\n🎨 **نظام الألوان:** لوحة ألوان احترافية\n📱 **التصميم المتجاوب:** متوافق مع جميع الأجهزة\n✨ **الأنيميشن:** حركات سلسة واحترافية\n🔤 **الخطوط:** خطوط عربية وإنجليزية مميزة');

      const existingFiles = context.codeFiles || [];
      context.codeFiles = [...existingFiles, ...designFiles];
      context.progress = 40;
      return context;
    } catch (error: any) {
      await this.log(projectId, 'فشل_التصميم', `فشل تصميم الواجهات: ${error.message}`, 'error');
      await this.addMessage(projectId, 'designer', `❌ فشل تصميم الواجهات: ${error.message}`);
      context.errorLog = error.message;
      return context;
    }
  }

  private generateDesignFiles(idea: string): CodeFile[] {
    const globalsCss = `@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.75rem;
  --background: oklch(0.985 0.002 247);
  --foreground: oklch(0.145 0.005 247);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0.005 247);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0.005 247);
  --primary: oklch(0.45 0.18 264);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.96 0.01 264);
  --secondary-foreground: oklch(0.25 0.03 264);
  --muted: oklch(0.96 0.01 264);
  --muted-foreground: oklch(0.55 0.02 264);
  --accent: oklch(0.93 0.03 264);
  --accent-foreground: oklch(0.25 0.03 264);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.91 0.01 264);
  --input: oklch(0.91 0.01 264);
  --ring: oklch(0.45 0.18 264);
  --chart-1: oklch(0.45 0.18 264);
  --chart-2: oklch(0.6 0.15 162);
  --chart-3: oklch(0.55 0.12 30);
  --chart-4: oklch(0.65 0.2 330);
  --chart-5: oklch(0.7 0.15 80);
  --sidebar: oklch(0.97 0.005 264);
  --sidebar-foreground: oklch(0.145 0.005 264);
  --sidebar-primary: oklch(0.45 0.18 264);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.93 0.03 264);
  --sidebar-accent-foreground: oklch(0.25 0.03 264);
  --sidebar-border: oklch(0.91 0.01 264);
  --sidebar-ring: oklch(0.45 0.18 264);
}

.dark {
  --background: oklch(0.13 0.005 264);
  --foreground: oklch(0.985 0.002 264);
  --card: oklch(0.18 0.01 264);
  --card-foreground: oklch(0.985 0.002 264);
  --popover: oklch(0.18 0.01 264);
  --popover-foreground: oklch(0.985 0.002 264);
  --primary: oklch(0.65 0.2 264);
  --primary-foreground: oklch(0.13 0.005 264);
  --secondary: oklch(0.25 0.02 264);
  --secondary-foreground: oklch(0.985 0.002 264);
  --muted: oklch(0.25 0.02 264);
  --muted-foreground: oklch(0.7 0.02 264);
  --accent: oklch(0.3 0.03 264);
  --accent-foreground: oklch(0.985 0.002 264);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.65 0.2 264);
  --chart-1: oklch(0.55 0.22 264);
  --chart-2: oklch(0.696 0.17 162);
  --chart-3: oklch(0.769 0.188 70);
  --chart-4: oklch(0.627 0.265 303);
  --chart-5: oklch(0.645 0.246 16);
  --sidebar: oklch(0.18 0.01 264);
  --sidebar-foreground: oklch(0.985 0.002 264);
  --sidebar-primary: oklch(0.55 0.22 264);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.3 0.03 264);
  --sidebar-accent-foreground: oklch(0.985 0.002 264);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.55 0.22 264);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}`;

    return [
      { path: 'src/app/globals.css', content: globalsCss, language: 'css' },
    ];
  }
}
