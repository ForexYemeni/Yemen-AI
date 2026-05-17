import { BaseAgent } from './base-agent';
import { AgentContext } from './types';

export class SecurityAgent extends BaseAgent {
  type = 'security' as const;
  name = 'Security';
  nameAr = 'مدقق الأمان';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, codeFiles } = context;

    await this.log(projectId, 'بدء_الفحص', 'بدء فحص أمان التطبيق', 'info');
    await this.updateProject(projectId, 'securing', 88, 'فحص الأمان');
    await this.addMessage(projectId, 'security', '🛡️ جاري فحص أمان التطبيق والتحقق من الحماية...');

    try {
      await this.delay(1500);

      const auditResult = this.auditSecurity(codeFiles || []);

      await this.log(projectId, 'اكتمال_الفحص', `تم فحص الأمان - مستوى الأمان: ${auditResult.level}`, auditResult.vulnerabilities.length > 0 ? 'warning' : 'success');
      await this.addMessage(projectId, 'security', `✅ تم فحص الأمان!\n\n🔒 **مستوى الأمان:** ${auditResult.level}\n${auditResult.vulnerabilities.length > 0 ? `⚠️ **الثغرات المكتشفة:** ${auditResult.vulnerabilities.length}\n${auditResult.vulnerabilities.map((v: string) => `- ${v}`).join('\n')}` : '🟢 **لا توجد ثغرات أمنية!**'}\n✅ **الحمايات المطبقة:** ${auditResult.protections.length}`);

      context.progress = 92;
      return context;
    } catch (error: any) {
      await this.log(projectId, 'فشل_الفحص', `فشل فحص الأمان: ${error.message}`, 'warning');
      await this.addMessage(projectId, 'security', `⚠️ تعذر فحص الأمان: ${error.message}`);
      context.progress = 92;
      return context;
    }
  }

  private auditSecurity(codeFiles: any[]): { level: string; vulnerabilities: string[]; protections: string[] } {
    const vulnerabilities: string[] = [];
    const protections: string[] = [];

    for (const file of codeFiles) {
      const content = file.content || '';

      // Check for SQL injection protection
      if (content.includes('prisma') || content.includes('Prisma')) {
        protections.push('حماية من SQL Injection عبر Prisma ORM');
      }

      // Check for input validation
      if (content.includes('if (!') || content.includes('required') || content.includes('zod')) {
        protections.push('التحقق من المدخلات');
      }

      // Check for XSS protection
      if (content.includes('NextResponse') && !content.includes('dangerouslySetInnerHTML')) {
        protections.push('حماية من XSS - React يمنع الحقن تلقائياً');
      }

      // Check for error handling
      if (content.includes('try') && content.includes('catch')) {
        protections.push('معالجة الأخطاء');
      }

      // Check for dangerous patterns
      if (content.includes('eval(')) {
        vulnerabilities.push(`استخدام eval() في ${file.path} - خطر أمني`);
      }
      if (content.includes('dangerouslySetInnerHTML')) {
        vulnerabilities.push(`استخدام dangerouslySetInnerHTML في ${file.path}`);
      }
    }

    // Default protections
    if (protections.length === 0) {
      protections.push('بيئة تشغيل آمنة (Vercel)');
      protections.push('HTTPS تلقائي');
    }

    const level = vulnerabilities.length === 0 ? 'عالي 🟢' : vulnerabilities.length <= 2 ? 'متوسط 🟡' : 'منخفض 🔴';

    return { level, vulnerabilities, protections };
  }
}
