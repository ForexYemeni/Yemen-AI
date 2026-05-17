import { BaseAgent } from './base-agent';
import { AgentContext } from './types';

export class TesterAgent extends BaseAgent {
  type = 'tester' as const;
  name = 'Tester';
  nameAr = 'مختبر الجودة';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, codeFiles } = context;

    await this.log(projectId, 'بدء_الاختبار', 'بدء اختبار وظائف التطبيق', 'info');
    await this.updateProject(projectId, 'testing', 80, 'اختبار الجودة');
    await this.addMessage(projectId, 'tester', '🧪 جاري اختبار وظائف التطبيق والتحقق من جودته...');

    try {
      await this.delay(2000);

      const testResults = this.runTests(codeFiles || []);

      await this.log(projectId, 'اكتمال_الاختبار', `تم الاختبار - ${testResults.passed} نجح / ${testResults.failed} فشل`, testResults.failed > 0 ? 'warning' : 'success');
      await this.addMessage(projectId, 'tester', `✅ تم اختبار التطبيق!\n\n🟢 **الاختبارات الناجحة:** ${testResults.passed}\n${testResults.failed > 0 ? `🔴 **الاختبارات الفاشلة:** ${testResults.failed}\n${testResults.failures.map((f: string) => `- ${f}`).join('\n')}` : '🟢 **جميع الاختبارات نجحت!**'}`);

      if (testResults.failed > 0) {
        context.errorLog = testResults.failures.join('\n');
      }

      context.progress = 85;
      return context;
    } catch (error: any) {
      await this.log(projectId, 'فشل_الاختبار', `فشل الاختبار: ${error.message}`, 'warning');
      await this.addMessage(projectId, 'tester', `⚠️ تعذر الاختبار التلقائي: ${error.message}`);
      context.progress = 85;
      return context;
    }
  }

  private runTests(codeFiles: any[]): { passed: number; failed: number; failures: string[] } {
    const passed: string[] = [];
    const failed: string[] = [];
    const failures: string[] = [];

    // Test 1: Check for essential files
    const hasPackageJson = codeFiles.some(f => f.path === 'package.json');
    if (hasPackageJson) passed.push('ملف package.json موجود'); else { failed.push('ملف package.json مفقود'); failures.push('ملف package.json مفقود'); }

    // Test 2: Check for API routes
    const hasAPI = codeFiles.some(f => f.path.includes('api') && f.path.endsWith('route.ts'));
    if (hasAPI) passed.push('مسارات API موجودة'); else { failed.push('مسارات API مفقودة'); failures.push('مسارات API مفقودة'); }

    // Test 3: Check for page
    const hasPage = codeFiles.some(f => f.path === 'src/app/page.tsx');
    if (hasPage) passed.push('الصفحة الرئيسية موجودة'); else { failed.push('الصفحة الرئيسية مفقودة'); failures.push('الصفحة الرئيسية مفقودة'); }

    // Test 4: Check for layout
    const hasLayout = codeFiles.some(f => f.path === 'src/app/layout.tsx');
    if (hasLayout) passed.push('ملف Layout موجود'); else { failed.push('ملف Layout مفقود'); failures.push('ملف Layout مفقود'); }

    // Test 5: Check for Prisma schema
    const hasSchema = codeFiles.some(f => f.path.includes('schema.prisma'));
    if (hasSchema) passed.push('مخطط قاعدة البيانات موجود'); else { failed.push('مخطط قاعدة البيانات مفقود'); failures.push('مخطط قاعدة البيانات مفقود'); }

    // Test 6: Check for RTL support
    const hasRTL = codeFiles.some(f => f.path === 'src/app/layout.tsx' && f.content.includes('dir="rtl"'));
    if (hasRTL) passed.push('دعم RTL للعربية'); else { failed.push('لا يوجد دعم RTL'); failures.push('لا يوجد دعم RTL - يجب إضافة dir="rtl"'); }

    // Test 7: Check for Arabic content
    const hasArabic = codeFiles.some(f => /[\u0600-\u06FF]/.test(f.content));
    if (hasArabic) passed.push('محتوى عربي موجود'); else { failed.push('لا يوجد محتوى عربي'); failures.push('لا يوجد محتوى عربي في الكود'); }

    // Test 8: Check minimum file count
    if (codeFiles.length >= 8) passed.push(`عدد الملفات كافي (${codeFiles.length})`); else { failed.push(`عدد الملفات قليل (${codeFiles.length})`); failures.push('عدد الملفات أقل من المتوقع'); }

    return { passed: passed.length, failed: failed.length, failures };
  }
}
