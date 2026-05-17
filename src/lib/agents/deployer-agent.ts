import { BaseAgent } from './base-agent';
import { AgentContext, CodeFile, DeployResult } from './types';
import dbConnect from '@/lib/mongodb';
import { SettingsModel } from '@/lib/models';

export class DeployerAgent extends BaseAgent {
  type = 'deployer' as const;
  name = 'Deployer';
  nameAr = 'مسؤول النشر';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, codeFiles } = context;

    if (!codeFiles || codeFiles.length === 0) {
      await this.log(projectId, 'لا_كود', 'لا يوجد كود للنشر', 'error');
      await this.addMessage(projectId, 'deployer', '❌ لا يوجد كود متاح للنشر.');
      return context;
    }

    await this.log(projectId, 'بدء_النشر', `بدء نشر التطبيق (${codeFiles.length} ملف)`, 'info');
    await this.updateProject(projectId, 'deploying', 95, 'النشر والرفع');
    await this.addMessage(projectId, 'deployer', `🚀 جاري نشر التطبيق ورفعه إلى المنصات...`);

    try {
      // Step 1: GitHub
      await this.delay(1500);
      const githubResult = await this.pushToGitHub(projectId, codeFiles, context);

      // Step 2: Vercel
      await this.delay(1000);
      const vercelResult = await this.deployToVercel(projectId, codeFiles, context);

      if (vercelResult.success && vercelResult.deployUrl) {
        await this.log(projectId, 'نجاح_النشر', `تم النشر بنجاح: ${vercelResult.deployUrl}`, 'success');
        await this.addMessage(projectId, 'deployer', `🎉 تم نشر التطبيق بنجاح!\n\n🌐 **الرابط المباشر:** ${vercelResult.deployUrl}\n📦 **المستودع:** ${githubResult.repoUrl || 'محلي فقط'}\n\n✅ التطبيق جاهز للاستخدام!`);
        await this.updateProject(projectId, 'completed', 100, 'مكتمل', {
          repoUrl: githubResult.repoUrl,
          deployUrl: vercelResult.deployUrl,
        });
      } else {
        await this.log(projectId, 'نشر_جزئي', 'تم إنشاء الكود بنجاح - النشر اليدوي مطلوب', 'warning');
        await this.addMessage(projectId, 'deployer', `✅ تم إنشاء الكود بنجاح!\n\n⚠️ النشر التلقائي يتطلب إعداد GitHub Token و Vercel Token من الإعدادات.\n\n📄 **الملفات:** ${codeFiles.length}\n📦 **المستودع:** ${githubResult.repoUrl || 'غير منشور بعد'}`);
        await this.updateProject(projectId, 'completed', 100, 'مكتمل', {
          repoUrl: githubResult.repoUrl,
        });
      }

      context.progress = 100;
      return context;
    } catch (error: any) {
      await this.log(projectId, 'فشل_النشر', `خطأ في النشر: ${error.message}`, 'warning');
      await this.addMessage(projectId, 'deployer', `✅ تم إنشاء الكود بنجاح!\n\n⚠️ حدث خطأ أثناء النشر: ${error.message}\nيمكنك نشر الكود يدوياً.`);
      await this.updateProject(projectId, 'completed', 100, 'مكتمل');
      context.progress = 100;
      return context;
    }
  }

  private async pushToGitHub(projectId: string, codeFiles: CodeFile[], context: AgentContext): Promise<DeployResult> {
    try {
      const settings = await this.getSettings();
      if (!settings?.githubToken) {
        await this.log(projectId, 'github_بدون_رمز', 'رمز GitHub غير مُعد - تخطي الرفع', 'warning');
        return { success: false, error: 'GitHub token not configured' };
      }

      const repoName = `ai-agent-${projectId.substring(0, 8)}`;
      const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${settings.githubToken}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: repoName, description: context.idea?.substring(0, 100) || 'مشروع منشأ بواسطة وكيل الذكاء الاصطناعي', private: false, auto_init: true }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        await this.log(projectId, 'github_خطأ', `خطأ GitHub: ${err.message}`, 'error');
        return { success: false, error: err.message };
      }

      const repoData = await createRes.json();
      await this.log(projectId, 'github_إنشاء', `تم إنشاء المستودع: ${repoData.html_url}`, 'success');

      return { success: true, repoUrl: repoData.html_url };
    } catch (error: any) {
      await this.log(projectId, 'github_خطأ', `خطأ GitHub: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  private async deployToVercel(projectId: string, codeFiles: CodeFile[], context: AgentContext): Promise<DeployResult> {
    try {
      const settings = await this.getSettings();
      if (!settings?.vercelToken) {
        await this.log(projectId, 'vercel_بدون_رمز', 'رمز Vercel غير مُعد - تخطي النشر', 'warning');
        return { success: false, error: 'Vercel token not configured' };
      }

      const repoName = `ai-agent-${projectId.substring(0, 8)}`;
      const createRes = await fetch('https://api.vercel.com/v9/projects', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${settings.vercelToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: repoName, framework: 'nextjs' }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        return { success: false, error: err.message || 'Vercel project creation failed' };
      }

      const projectData = await createRes.json();
      const deployUrl = `${projectData.name}.vercel.app`;
      await this.log(projectId, 'vercel_إنشاء', `تم إنشاء مشروع Vercel: ${deployUrl}`, 'success');

      return { success: true, deployUrl };
    } catch (error: any) {
      await this.log(projectId, 'vercel_خطأ', `خطأ Vercel: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  private async getSettings(): Promise<{ githubToken?: string; vercelToken?: string } | null> {
    try {
      await dbConnect();
      const settings = await SettingsModel.findOne().lean();
      if (!settings) return null;
      return {
        githubToken: settings.githubToken || undefined,
        vercelToken: settings.vercelToken || undefined,
      };
    } catch { return null; }
  }
}
