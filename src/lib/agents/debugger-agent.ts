// Debugger Agent - Analyzes and fixes errors automatically

import { BaseAgent } from './base-agent';
import { AgentContext, CodeFile } from './types';
import ZAI from 'z-ai-web-dev-sdk';

export class DebuggerAgent extends BaseAgent {
  type = 'debugger' as const;
  name = 'Debugger Agent';
  description = 'Analyzes errors and generates fixes automatically';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, errorLog, codeFiles, retryCount, maxRetries } = context;

    if (!errorLog) {
      await this.log(projectId, 'no_errors', 'No errors to debug. Skipping.', 'info');
      return context;
    }

    if (retryCount >= maxRetries) {
      await this.log(projectId, 'max_retries', `Max retries (${maxRetries}) reached. Stopping.`, 'error');
      await this.addMessage(projectId, 'debugger', `❌ Maximum retry attempts reached (${maxRetries}). Please review the errors manually.`);
      await this.updateProjectStatus(projectId, 'failed', { errorLog });
      return context;
    }

    await this.log(projectId, 'start_debugging', `Analyzing error (attempt ${retryCount + 1}/${maxRetries}): ${errorLog.substring(0, 200)}`, 'info');
    await this.updateProjectStatus(projectId, 'debugging');
    await this.addMessage(projectId, 'debugger', `🔧 Debugging error (attempt ${retryCount + 1}/${maxRetries})...`);

    try {
      const fixResult = await this.analyzeAndFix(errorLog, codeFiles || [], projectId);

      if (fixResult.fixed) {
        await this.log(projectId, 'debug_fixed', `Error fixed! Applied ${fixResult.fixes.length} fixes`, 'success');
        await this.addMessage(projectId, 'debugger', `✅ Error fixed! Applied ${fixResult.fixes.length} fix(es):\n${fixResult.fixes.map((f: any) => `- ${f.description}`).join('\n')}`);

        // Update code files with fixes
        const fixedFiles = this.applyFixes(codeFiles || [], fixResult.fixes);
        await this.updateProjectStatus(projectId, 'debugging', {
          codeFiles: JSON.stringify(fixedFiles),
          errorLog: null,
        });

        context.codeFiles = fixedFiles;
        context.errorLog = undefined;
      } else {
        await this.log(projectId, 'debug_unresolved', `Could not resolve error automatically`, 'warning');
        await this.addMessage(projectId, 'debugger', `⚠️ Could not fully resolve the error. Suggestion: ${fixResult.suggestion}`);

        context.retryCount = retryCount + 1;
      }

      return context;
    } catch (error: any) {
      await this.log(projectId, 'debug_failed', `Debug attempt failed: ${error.message}`, 'error');
      await this.addMessage(projectId, 'debugger', `❌ Debug attempt failed: ${error.message}`);
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

    // Prepare context about existing code files
    const filesContext = codeFiles
      .slice(0, 5) // Limit to avoid token overflow
      .map(f => `File: ${f.path}\n\`\`\`\n${f.content.substring(0, 500)}\n\`\`\``)
      .join('\n\n');

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert debugger. Analyze the error and provide fixes.
You MUST respond with ONLY valid JSON (no markdown, no code blocks):
{
  "fixed": true/false,
  "fixes": [
    {
      "file": "path/to/file",
      "description": "What was fixed",
      "content": "Complete fixed file content"
    }
  ],
  "suggestion": "If fixed is false, provide a suggestion"
}`
        },
        {
          role: 'user',
          content: `Analyze this error and provide fixes:

**Error Log:**
${errorLog}

**Relevant Code Files:**
${filesContext}

Provide the complete corrected content for any files that need fixes.`
        }
      ],
      temperature: 0.4,
      max_tokens: 3000,
    });

    try {
      let responseText = completion.choices[0]?.message?.content || '';
      if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
      }

      const result = JSON.parse(responseText.trim());
      return result;
    } catch {
      return {
        fixed: false,
        fixes: [],
        suggestion: 'Unable to parse AI fix response. Manual intervention may be required.',
      };
    }
  }

  private applyFixes(files: CodeFile[], fixes: Array<{ file: string; content: string }>): CodeFile[] {
    const fixedFiles = [...files];

    for (const fix of fixes) {
      const existingIndex = fixedFiles.findIndex(f => f.path === fix.file);
      if (existingIndex >= 0) {
        fixedFiles[existingIndex] = {
          ...fixedFiles[existingIndex],
          content: fix.content,
        };
      } else {
        fixedFiles.push({
          path: fix.file,
          content: fix.content,
          language: this.inferLanguage(fix.file),
        });
      }
    }

    return fixedFiles;
  }

  private inferLanguage(path: string): string {
    if (path.endsWith('.tsx') || path.endsWith('.jsx')) return 'tsx';
    if (path.endsWith('.ts')) return 'typescript';
    if (path.endsWith('.js')) return 'javascript';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.prisma')) return 'prisma';
    if (path.endsWith('.css')) return 'css';
    return 'text';
  }
}
