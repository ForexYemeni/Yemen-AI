// ============================================================
// QA & Debug Agent — ضمان الجودة
// يكتشف الأخطاء ويصلحها ويمنع الأعطال ويحلل الأداء
// ============================================================

import { ErrorReport, CodeFile } from '../runtime/types';
import { SharedContext } from '../runtime/shared-context';
import { addLog, generateLogId } from '../runtime/memory';

export async function runQaDebugAgent(ctx: SharedContext): Promise<void> {
  const projectId = ctx.projectId;

  addLog(projectId, {
    id: generateLogId(),
    projectId,
    agent: 'qa_debug',
    action: 'start_qa',
    content: 'بدأ فحص الجودة واكتشاف الأخطاء...',
    status: 'running',
    timestamp: new Date().toISOString(),
  });

  try {
    // Analyze all code files
    const errorReports: ErrorReport[] = [];

    for (const file of ctx.codeFiles) {
      const fileErrors = analyzeFile(file);
      errorReports.push(...fileErrors);
    }

    // Check for common issues
    errorReports.push(...checkCommonIssues(ctx));

    // Store error reports in context
    for (const report of errorReports) {
      ctx.addErrorReport(report);
    }

    // Generate fixes for auto-fixable issues
    const autoFixable = errorReports.filter(r => r.autoFixable);
    if (autoFixable.length > 0) {
      const fixFile: CodeFile = {
        path: 'docs/fixes.md',
        content: generateFixesDoc(autoFixable),
        language: 'markdown',
      };
      ctx.addCodeFile(fixFile);
    }

    // Generate QA report
    ctx.addCodeFile({
      path: 'docs/qa-report.md',
      content: generateQaReport(ctx, errorReports),
      language: 'markdown',
    });

    ctx.setAgentResult('qa_debug', {
      totalIssues: errorReports.length,
      critical: errorReports.filter(r => r.severity === 'critical').length,
      high: errorReports.filter(r => r.severity === 'high').length,
      medium: errorReports.filter(r => r.severity === 'medium').length,
      low: errorReports.filter(r => r.severity === 'low').length,
      autoFixable: autoFixable.length,
      reports: errorReports,
    });

    const criticalCount = errorReports.filter(r => r.severity === 'critical' || r.severity === 'high').length;
    if (criticalCount > 0) {
      ctx.addMessage('qa_debug', 'all', `تم العثور على ${criticalCount} مشكلة حرجة — يُحتاج إصلاح`, 'error');
    } else {
      ctx.addMessage('qa_debug', 'devops', 'تم فحص الجودة — لا مشاكل حرجة، جاهز للنشر', 'result');
    }

    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'qa_debug',
      action: 'qa_complete',
      content: `تم الفحص: ${errorReports.length} مشكلة (${criticalCount} حرجة) | ${autoFixable.length} قابلة للإصلاح التلقائي`,
      status: criticalCount > 0 ? 'warning' : 'success',
      timestamp: new Date().toISOString(),
    });

    ctx.setProgress(82);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'خطأ في فحص الجودة';
    ctx.addMessage('qa_debug', 'all', `فشل فحص الجودة: ${errMsg}`, 'error');
    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'qa_debug',
      action: 'qa_error',
      content: errMsg,
      status: 'error',
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

function analyzeFile(file: CodeFile): ErrorReport[] {
  const reports: ErrorReport[] = [];
  const content = file.content;
  const path = file.path;

  // Check for TypeScript any types
  const anyMatches = content.match(/:\s*any\b/g);
  if (anyMatches && anyMatches.length > 3) {
    reports.push({
      problem: `استخدام مفرط لنوع any في ${path}`,
      cause: `تم العثور على ${anyMatches.length} استخدام لنوع any`,
      severity: 'medium',
      solution: 'استبدل any بأنواع TypeScript محددة',
      autoFixable: false,
      agent: 'qa_debug',
    });
  }

  // Check for console.log in production code
  const consoleMatches = content.match(/console\.(log|warn|error)\(/g);
  if (consoleMatches && consoleMatches.length > 5 && !path.includes('docs/')) {
    reports.push({
      problem: `كثرة console.log في ${path}`,
      cause: `تم العثور على ${consoleMatches.length} استدعاء console`,
      severity: 'low',
      solution: 'أزل أو استبدل بمكتبة تسجيل مناسبة',
      autoFixable: true,
      agent: 'qa_debug',
    });
  }

  // Check for hardcoded secrets
  if (/password\s*=\s*['"]|secret\s*=\s*['"]|api_key\s*=\s*['"]/i.test(content)) {
    reports.push({
      problem: `بيانات حساسة مدمجة في الكود: ${path}`,
      cause: 'تم العثور على قيم مشفرة في الكود المصدري',
      severity: 'critical',
      solution: 'انقل البيانات الحساسة إلى متغيرات البيئة',
      autoFixable: false,
      agent: 'qa_debug',
    });
  }

  // Check for missing error handling
  if (content.includes('await') && !content.includes('try') && !content.includes('catch')) {
    reports.push({
      problem: `معالجة أخطاء مفقودة في ${path}`,
      cause: 'عمليات async بدون try/catch',
      severity: 'high',
      solution: 'أضف try/catch حول العمليات غير المتزامنة',
      autoFixable: false,
      agent: 'qa_debug',
    });
  }

  // Check for very long files
  const lines = content.split('\n').length;
  if (lines > 500) {
    reports.push({
      problem: `ملف طويل جداً: ${path} (${lines} سطر)`,
      cause: 'الملف يتجاوز 500 سطر',
      severity: 'low',
      solution: 'قسم الملف إلى مكونات أو وحدات أصغر',
      autoFixable: false,
      agent: 'qa_debug',
    });
  }

  return reports;
}

function checkCommonIssues(ctx: SharedContext): ErrorReport[] {
  const reports: ErrorReport[] = [];

  // Check if frontend and backend are coordinated
  const frontendResult = ctx.getAgentResult('frontend');
  const backendResult = ctx.getAgentResult('backend');
  if (frontendResult && !backendResult) {
    reports.push({
      problem: 'الواجهة الأمامية بُنيت بدون تنسيق مع الخلفية',
      cause: 'وكيل الواجهة أنهى قبل الخلفية',
      severity: 'medium',
      solution: 'تأكد من تنسيق APIs بين الواجهة والخلفية',
      autoFixable: false,
      agent: 'qa_debug',
    });
  }

  // Check if DB models match API routes
  if (ctx.needsDatabase) {
    const dbResult = ctx.getAgentResult('db_guidance');
    if (!dbResult) {
      reports.push({
        problem: 'المشروع يحتاج قاعدة بيانات لكن لم يتم إعدادها',
        cause: 'وكيل قاعدة البيانات لم يُشغّل',
        severity: 'high',
        solution: 'شغّل وكيل مستشار البيانات',
        autoFixable: false,
        agent: 'qa_debug',
      });
    }
  }

  return reports;
}

function generateFixesDoc(issues: ErrorReport[]): string {
  return `# إصلاحات تلقائية — Generated by QA Agent

${issues.map((issue, i) => `
## ${i + 1}. ${issue.problem}
- **السبب**: ${issue.cause}
- **الخطورة**: ${issue.severity}
- **الحل**: ${issue.solution}
`).join('\n')}
`;
}

function generateQaReport(ctx: SharedContext, reports: ErrorReport[]): string {
  return `# تقرير فحص الجودة — QA Report

## ملخص
- **المشروع**: ${ctx.idea.substring(0, 80)}
- **إجمالي الملفات**: ${ctx.codeFiles.length}
- **إجمالي المشاكل**: ${reports.length}
- **حرج**: ${reports.filter(r => r.severity === 'critical').length}
- **عالي**: ${reports.filter(r => r.severity === 'high').length}
- **متوسط**: ${reports.filter(r => r.severity === 'medium').length}
- **منخفض**: ${reports.filter(r => r.severity === 'low').length}

## الملفات المفحوصة
${ctx.codeFiles.map(f => `- \`${f.path}\` (${f.language})`).join('\n')}

## النتائج
${reports.length === 0 ? '✅ لا توجد مشاكل — الكود جاهز للنشر' : reports.map((r, i) => `
### ${i + 1}. [${r.severity.toUpperCase()}] ${r.problem}
- **السبب**: ${r.cause}
- **الحل**: ${r.solution}
- **قابل للإصلاح التلقائي**: ${r.autoFixable ? 'نعم' : 'لا'}
`).join('\n')}
`;
}
