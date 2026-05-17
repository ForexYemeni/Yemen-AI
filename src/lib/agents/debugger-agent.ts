import { BaseAgent } from './base-agent';
import { AgentContext, CodeFile } from './types';
import ZAI from 'z-ai-web-dev-sdk';

export class DebuggerAgent extends BaseAgent {
  type = 'debugger' as const;
  name = 'Debugger';
  nameAr = 'مصحح الأخطاء';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, errorLog, codeFiles, retryCount, maxRetries } = context;

    if (!errorLog) {
      await this.log(projectId, 'لا_أخطاء', 'لا توجد أخطاء للإصلاح', 'info');
      return context;
    }

    if (retryCount >= maxRetries) {
      await this.log(projectId, 'حد_المحاولات', `تم الوصول للحد الأقصى من المحاولات (${maxRetries})`, 'error');
      await this.addMessage(projectId, 'debugger', `❌ تم الوصول للحد الأقصى من محاولات الإصلاح (${maxRetries}). يرجى مراجعة الأخطاء يدوياً.`);
      await this.updateProject(projectId, 'failed', context.progress, 'فشل', { errorLog });
      return context;
    }

    await this.log(projectId, 'بدء_الإصلاح', `تحليل الخطأ (محاولة ${retryCount + 1}/${maxRetries})`, 'info');
    await this.updateProject(projectId, 'debugging', context.progress, 'إصلاح الأخطاء');
    await this.addMessage(projectId, 'debugger', `🔧 جاري تحليل الخطأ وإصلاحه (محاولة ${retryCount + 1}/${maxRetries})...`);

    try {
      const fixResult = await this.analyzeAndFix(errorLog, codeFiles || [], projectId);

      if (fixResult.fixed) {
        await this.log(projectId, 'تم_الإصلاح', `تم إصلاح الخطأ - ${fixResult.fixes.length} إصلاح مطبق`, 'success');
        await this.addMessage(projectId, 'debugger', `✅ تم إصلاح الخطأ بنجاح!\n\n🔧 **الإصلاحات:** ${fixResult.fixes.length}\n${fixResult.fixes.map((f: any) => `- ${f.description}`).join('\n')}`);

        const fixedFiles = this.applyFixes(codeFiles || [], fixResult.fixes);
        await this.updateProject(projectId, 'debugging', context.progress, 'إصلاح الأخطاء', {
          codeFiles: JSON.stringify(fixedFiles),
          errorLog: null,
        });

        context.codeFiles = fixedFiles;
        context.errorLog = undefined;
      } else {
        await this.log(projectId, 'لم_يُصلح', 'لم يتمكن من إصلاح الخطأ تلقائياً', 'warning');
        await this.addMessage(projectId, 'debugger', `⚠️ لم يتم إصلاح الخطأ تلقائياً. الاقتراح: ${fixResult.suggestion}`);
        context.retryCount = retryCount + 1;
      }

      return context;
    } catch (error: any) {
      await this.log(projectId, 'فشل_الإصلاح', `فشل الإصلاح: ${error.message}`, 'error');
      await this.addMessage(projectId, 'debugger', `❌ فشل الإصلاح: ${error.message}`);
      context.retryCount = retryCount + 1;
      return context;
    }
  }

  private async analyzeAndFix(errorLog: string, codeFiles: CodeFile[], projectId: string): Promise<{
    fixed: boolean;
    fixes: Array<{ file: string; description: string; content: string }>;
    suggestion: string;
  }> {
    const zai = await ZAI.create();
    const filesContext = codeFiles.slice(0, 3).map(f => `ملف: ${f.path}\n${f.content.substring(0, 300)}`).join('\n\n');

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'أنت خبير تصحيح أخطاء. حلل الخطأ واقدم إصلاحات. أجب ONLY بـ JSON: {"fixed": true/false, "fixes": [{"file": "path", "description": "وصف", "content": "المحتوى المصلح"}], "suggestion": "اقتراح إذا لم يُصلح"}'
          },
          {
            role: 'user',
            content: `حلل هذا الخطأ:\n${errorLog}\n\nالملفات:\n${filesContext}`
          }
        ],
        temperature: 0.4,
        max_tokens: 2000,
      });

      let responseText = completion.choices[0]?.message?.content || '';
      if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
      }
      return JSON.parse(responseText.trim());
    } catch {
      return { fixed: false, fixes: [], suggestion: 'لم يتمكن من تحليل الخطأ تلقائياً. يرجى المراجعة يدوياً.' };
    }
  }

  private applyFixes(files: CodeFile[], fixes: Array<{ file: string; content: string }>): CodeFile[] {
    const fixedFiles = [...files];
    for (const fix of fixes) {
      const idx = fixedFiles.findIndex(f => f.path === fix.file);
      if (idx >= 0) {
        fixedFiles[idx] = { ...fixedFiles[idx], content: fix.content };
      } else {
        fixedFiles.push({ path: fix.file, content: fix.content, language: this.inferLang(fix.file) });
      }
    }
    return fixedFiles;
  }

  private inferLang(path: string): string {
    if (path.endsWith('.tsx')) return 'tsx';
    if (path.endsWith('.ts')) return 'typescript';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.prisma')) return 'prisma';
    return 'text';
  }
}
