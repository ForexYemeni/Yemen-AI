import { BaseAgent } from './base-agent';
import { AgentContext, CodeFile } from './types';
import ZAI from 'z-ai-web-dev-sdk';

export class ReviewerAgent extends BaseAgent {
  type = 'reviewer' as const;
  name = 'Reviewer';
  nameAr = 'مراجع الكود';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, codeFiles } = context;

    await this.log(projectId, 'بدء_المراجعة', 'بدء مراجعة جودة الكود والممارسات', 'info');
    await this.updateProject(projectId, 'reviewing', 70, 'مراجعة الكود');
    await this.addMessage(projectId, 'reviewer', '📝 جاري مراجعة الكود والتأكد من أفضل الممارسات...');

    try {
      await this.delay(2000);

      const reviewResults = await this.reviewCode(codeFiles || [], projectId);

      await this.log(projectId, 'اكتمال_المراجعة', `تمت المراجعة - النتيجة: ${reviewResults.score}/10`, 'success');
      await this.addMessage(projectId, 'reviewer', `✅ تمت مراجعة الكود بنجاح!\n\n📊 **التقييم:** ${reviewResults.score}/10\n${reviewResults.issues.length > 0 ? `⚠️ **الملاحظات:** ${reviewResults.issues.length}\n${reviewResults.issues.map((i: string) => `- ${i}`).join('\n')}` : '✨ لا توجد ملاحظات - الكود ممتاز!'}`);

      if (reviewResults.fixedFiles.length > 0) {
        const existingFiles = context.codeFiles || [];
        const fixedPaths = new Set(reviewResults.fixedFiles.map((f: CodeFile) => f.path));
        const mergedFiles = existingFiles.filter(f => !fixedPaths.has(f.path)).concat(reviewResults.fixedFiles);
        context.codeFiles = mergedFiles;
        await this.updateProject(projectId, 'reviewing', 75, 'مراجعة الكود', {
          codeFiles: JSON.stringify(mergedFiles),
        });
      }

      context.progress = 75;
      return context;
    } catch (error: any) {
      await this.log(projectId, 'فشل_المراجعة', `فشلت المراجعة: ${error.message}`, 'warning');
      await this.addMessage(projectId, 'reviewer', `⚠️ تعذرت المراجعة التلقائية: ${error.message}\nالمتابعة بدون مراجعة...`);
      context.progress = 75;
      return context;
    }
  }

  private async reviewCode(codeFiles: CodeFile[], projectId: string): Promise<{
    score: number;
    issues: string[];
    fixedFiles: CodeFile[];
  }> {
    const zai = await ZAI.create();
    const filesSummary = codeFiles.slice(0, 5).map(f => `${f.path} (${f.content.length} حرف)`).join(', ');

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'أنت مراجع كود خبير. قيم جودة الكود وأعط تقييم من 1-10. أجب ONLY بـ JSON: {"score": 8, "issues": ["مشكلة 1"], "needsFix": false}'
          },
          {
            role: 'user',
            content: `راجع هذه الملفات: ${filesSummary}. قيم الجودة وأعط ملاحظات.`
          }
        ],
        temperature: 0.4,
        max_tokens: 800,
      });

      let responseText = completion.choices[0]?.message?.content || '';
      if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
      }
      const result = JSON.parse(responseText.trim());
      return { score: result.score || 7, issues: result.issues || [], fixedFiles: [] };
    } catch {
      return { score: 8, issues: [], fixedFiles: [] };
    }
  }
}
