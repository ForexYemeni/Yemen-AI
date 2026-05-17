// ============================================================
// UI/UX Agent — يصمم الواجهات ويحسن تجربة المستخدم بإبداع
// يولد HTML كامل قابل للعرض كمعاينة حية داخل التطبيق
// ============================================================

import { CodeFile } from '../runtime/types';
import { SharedContext } from '../runtime/shared-context';
import { addLog, generateLogId } from '../runtime/memory';

export async function runUiUxAgent(ctx: SharedContext, suggestions?: string): Promise<void> {
  const projectId = ctx.projectId;

  addLog(projectId, {
    id: generateLogId(),
    projectId,
    agent: 'ui_ux',
    action: suggestions ? 'redesign_with_suggestions' : 'start_design',
    content: suggestions ? `إعادة التصميم بناءً على المقترحات: ${suggestions}` : 'بدأ تصميم نظام الواجهات وتجربة المستخدم...',
    status: 'running',
    timestamp: new Date().toISOString(),
  });

  try {
    // Generate design system
    const designSystem = generateDesignSystem(ctx.idea, suggestions);

    // Generate FULL HTML preview — this is what the user sees as a live app
    const previewHtml = generateFullPreviewHtml(ctx, designSystem, suggestions);

    // Store the preview HTML as a code file for rendering
    ctx.addCodeFile({
      path: 'design-preview.html',
      content: previewHtml,
      language: 'html',
    });

    // Generate color palette file
    ctx.addCodeFile({
      path: 'src/styles/design-system.ts',
      content: designSystem.code,
      language: 'typescript',
    });

    // Generate tailwind config
    ctx.addCodeFile({
      path: 'tailwind.config.ts',
      content: generateTailwindConfig(designSystem.colors),
      language: 'typescript',
    });

    // Generate component specifications
    ctx.addCodeFile({
      path: 'docs/ui-specs.md',
      content: generateUiSpecs(ctx, designSystem),
      language: 'markdown',
    });

    ctx.setAgentResult('ui_ux', {
      designSystem,
      previewHtml,
      colors: designSystem.colors,
      typography: designSystem.typography,
      spacing: designSystem.spacing,
      designSummary: designSystem.summary,
    });

    ctx.addMessage('ui_ux', 'all', 'تم تصميم نظام الواجهات — يرجى مراجعة المعاينة والموافقة أو تقديم مقترحات', 'result');

    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'ui_ux',
      action: 'design_complete',
      content: `تم التصميم: ${designSystem.colors.primary} | خطوط: ${designSystem.typography.heading} | ملخص: ${designSystem.summary}`,
      status: 'success',
      timestamp: new Date().toISOString(),
    });

    ctx.setProgress(25);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'خطأ في التصميم';
    ctx.addMessage('ui_ux', 'all', `فشل التصميم: ${errMsg}`, 'error');
    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'ui_ux',
      action: 'design_error',
      content: errMsg,
      status: 'error',
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

interface DesignSystem {
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    destructive: string;
    success: string;
    card: string;
    border: string;
  };
  typography: {
    heading: string;
    body: string;
    mono: string;
  };
  spacing: string;
  borderRadius: string;
  code: string;
  summary: string;
  theme: string;
}

function generateDesignSystem(idea: string, suggestions?: string): DesignSystem {
  const isEcommerce = /متجر|shop|ecommerce|بيع|تسوق/i.test(idea);
  const isSocial = /اجتماع|social|chat|محادثة|تواصل/i.test(idea);
  const isEducation = /تعلم|education|course|دورة|درس/i.test(idea);
  const isHealth = /صح|health|طب|doctor|عيادة/i.test(idea);
  const isDashboard = /لوحة|dashboard|admin|إدارة/i.test(idea);
  const isPortfolio = /بورتفوليو|portfolio|سيرة|resume|cv/i.test(idea);

  let colors: DesignSystem['colors'];
  let theme: string;
  let summary: string;

  if (isEcommerce) {
    theme = 'ecommerce';
    summary = 'تصميم متجر إلكتروني عصري مع ألوان خضراء هادئة تعكس الثقة والنمو';
    colors = { primary: '#059669', primaryLight: '#34d399', primaryDark: '#047857', secondary: '#0891b2', accent: '#d97706', background: '#ffffff', foreground: '#111827', muted: '#6b7280', destructive: '#dc2626', success: '#10b981', card: '#ffffff', border: '#e5e7eb' };
  } else if (isSocial) {
    theme = 'social';
    summary = 'تصميم شبكة اجتماعية حيوية مع ألوان بنفسجية وزهرية تعكس التواصل والإبداع';
    colors = { primary: '#7c3aed', primaryLight: '#a78bfa', primaryDark: '#5b21b6', secondary: '#ec4899', accent: '#06b6d4', background: '#ffffff', foreground: '#111827', muted: '#6b7280', destructive: '#dc2626', success: '#10b981', card: '#ffffff', border: '#e5e7eb' };
  } else if (isEducation) {
    theme = 'education';
    summary = 'تصميم منصة تعليمية احترافية مع ألوان زرقاء تعكس المعرفة والثقة';
    colors = { primary: '#2563eb', primaryLight: '#60a5fa', primaryDark: '#1d4ed8', secondary: '#059669', accent: '#f59e0b', background: '#ffffff', foreground: '#111827', muted: '#6b7280', destructive: '#dc2626', success: '#10b981', card: '#ffffff', border: '#e5e7eb' };
  } else if (isHealth) {
    theme = 'health';
    summary = 'تصميم تطبيق صحي هادئ مع ألوان فيروزية تعكس الصحة والاستقرار';
    colors = { primary: '#0d9488', primaryLight: '#2dd4bf', primaryDark: '#0f766e', secondary: '#2563eb', accent: '#10b981', background: '#ffffff', foreground: '#111827', muted: '#6b7280', destructive: '#dc2626', success: '#10b981', card: '#ffffff', border: '#e5e7eb' };
  } else if (isDashboard) {
    theme = 'dashboard';
    summary = 'تصميم لوحة تحكم احترافية مع ألوان داكنة أنيقة تعكس الكفاءة والتنظيم';
    colors = { primary: '#4f46e5', primaryLight: '#818cf8', primaryDark: '#3730a3', secondary: '#0891b2', accent: '#f59e0b', background: '#f8fafc', foreground: '#0f172a', muted: '#64748b', destructive: '#dc2626', success: '#10b981', card: '#ffffff', border: '#e2e8f0' };
  } else if (isPortfolio) {
    theme = 'portfolio';
    summary = 'تصميم بورتفوليو إبداعي مع تدرجات لونية مميزة تعكس الاحترافية';
    colors = { primary: '#7c3aed', primaryLight: '#a78bfa', primaryDark: '#5b21b6', secondary: '#06b6d4', accent: '#f43f5e', background: '#0f172a', foreground: '#f8fafc', muted: '#94a3b8', destructive: '#ef4444', success: '#22c55e', card: '#1e293b', border: '#334155' };
  } else {
    theme = 'general';
    summary = 'تصميم عصري متوازن مع ألوان بنفسجية وسماوية تعكس الابتكار والتطور';
    colors = { primary: '#7c3aed', primaryLight: '#a78bfa', primaryDark: '#5b21b6', secondary: '#06b6d4', accent: '#f59e0b', background: '#ffffff', foreground: '#111827', muted: '#6b7280', destructive: '#dc2626', success: '#10b981', card: '#ffffff', border: '#e5e7eb' };
  }

  // Apply suggestions
  if (suggestions) {
    summary += ` | معدل بناءً على: ${suggestions}`;
  }

  return {
    colors,
    typography: {
      heading: 'Cairo / Inter',
      body: 'Cairo / Inter',
      mono: 'JetBrains Mono',
    },
    spacing: '4px base unit',
    borderRadius: '12px',
    code: `// Design System — Auto-generated by UI/UX Agent
export const colors = ${JSON.stringify(colors, null, 2)};

export const typography = {
  heading: { fontFamily: 'Cairo, Inter, sans-serif', fontWeight: '700' },
  body: { fontFamily: 'Cairo, Inter, sans-serif', fontWeight: '400' },
  mono: { fontFamily: 'JetBrains Mono, monospace' },
};

export const spacing = { unit: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 };
export const borderRadius = { sm: 6, md: 12, lg: 16, xl: 20, full: 9999 };
`,
    summary,
    theme,
  };
}

// ============================================================
// Generate FULL HTML preview — shown as a live app inside iframe
// ============================================================
function generateFullPreviewHtml(ctx: SharedContext, design: DesignSystem, suggestions?: string): string {
  const pmResult = ctx.getAgentResult('project_manager') as Record<string, unknown> | undefined;
  const analysis = pmResult?.analysis as Record<string, unknown> | undefined;
  const features = (analysis?.features as string[]) ?? ['واجهة مستخدم متجاوبة', 'تصميم عصري'];
  const pages = (analysis?.pages as string[]) ?? ['الرئيسية', 'حول'];

  const c = design.colors;
  const isDark = c.background.startsWith('#0') || c.background.startsWith('#1');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ctx.idea.substring(0, 60)} — معاينة التصميم</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Cairo', sans-serif; background: ${c.background}; color: ${c.foreground}; overflow-x: hidden; }
    a { text-decoration: none; color: inherit; }

    /* Navbar */
    .navbar { position: sticky; top: 0; z-index: 100; background: ${isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)'}; backdrop-filter: blur(20px); border-bottom: 1px solid ${c.border}; padding: 0 24px; height: 72px; display: flex; align-items: center; justify-content: space-between; }
    .navbar-logo { font-size: 24px; font-weight: 800; background: linear-gradient(135deg, ${c.primary}, ${c.secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .navbar-links { display: flex; gap: 32px; }
    .navbar-links a { font-size: 15px; font-weight: 500; color: ${c.muted}; transition: color 0.2s; }
    .navbar-links a:hover { color: ${c.primary}; }
    .navbar-btn { background: ${c.primary}; color: white; border: none; padding: 10px 24px; border-radius: 12px; font-family: 'Cairo'; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .navbar-btn:hover { background: ${c.primaryDark}; transform: translateY(-1px); box-shadow: 0 4px 12px ${c.primary}33; }

    /* Hero */
    .hero { padding: 80px 24px; text-align: center; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle at 30% 50%, ${c.primary}08 0%, transparent 50%), radial-gradient(circle at 70% 30%, ${c.secondary}06 0%, transparent 50%); }
    .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: ${c.primary}12; color: ${c.primary}; padding: 8px 20px; border-radius: 100px; font-size: 14px; font-weight: 600; margin-bottom: 24px; position: relative; }
    .hero-badge::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: ${c.primary}; animation: pulse 2s infinite; }
    .hero h1 { font-size: clamp(32px, 5vw, 56px); font-weight: 900; line-height: 1.2; margin-bottom: 20px; position: relative; }
    .hero h1 span { background: linear-gradient(135deg, ${c.primary}, ${c.secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero p { font-size: 18px; color: ${c.muted}; max-width: 600px; margin: 0 auto 40px; line-height: 1.8; position: relative; }
    .hero-buttons { display: flex; gap: 16px; justify-content: center; position: relative; }
    .btn-primary { background: ${c.primary}; color: white; border: none; padding: 14px 36px; border-radius: 14px; font-family: 'Cairo'; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s; display: inline-flex; align-items: center; gap: 8px; }
    .btn-primary:hover { background: ${c.primaryDark}; transform: translateY(-2px); box-shadow: 0 8px 24px ${c.primary}33; }
    .btn-outline { background: transparent; color: ${c.primary}; border: 2px solid ${c.primary}; padding: 14px 36px; border-radius: 14px; font-family: 'Cairo'; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
    .btn-outline:hover { background: ${c.primary}0a; }

    /* Stats */
    .stats { display: flex; justify-content: center; gap: 48px; padding: 40px 24px; position: relative; }
    .stat { text-align: center; }
    .stat-number { font-size: 36px; font-weight: 900; color: ${c.primary}; }
    .stat-label { font-size: 14px; color: ${c.muted}; margin-top: 4px; }

    /* Features */
    .features { padding: 80px 24px; ${isDark ? '' : 'background: linear-gradient(180deg, ' + c.background + ' 0%, ' + c.primary + '05 100%);'} }
    .section-title { text-align: center; font-size: 36px; font-weight: 800; margin-bottom: 12px; }
    .section-subtitle { text-align: center; color: ${c.muted}; font-size: 16px; margin-bottom: 48px; max-width: 500px; margin-left: auto; margin-right: auto; }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto; }
    .feature-card { background: ${c.card}; border: 1px solid ${c.border}; border-radius: 20px; padding: 32px; transition: all 0.3s; position: relative; overflow: hidden; }
    .feature-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px ${c.primary}15; border-color: ${c.primary}40; }
    .feature-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 20px; }
    .feature-card h3 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    .feature-card p { color: ${c.muted}; font-size: 14px; line-height: 1.8; }

    /* Pages Preview */
    .pages { padding: 80px 24px; }
    .pages-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; max-width: 1000px; margin: 0 auto; }
    .page-card { background: ${c.card}; border: 1px solid ${c.border}; border-radius: 16px; padding: 24px; text-align: center; transition: all 0.3s; cursor: pointer; }
    .page-card:hover { border-color: ${c.primary}; background: ${c.primary}08; }
    .page-card .icon { font-size: 32px; margin-bottom: 12px; }
    .page-card h4 { font-size: 16px; font-weight: 700; }

    /* CTA */
    .cta { padding: 80px 24px; text-align: center; background: linear-gradient(135deg, ${c.primary}, ${c.primaryDark}); color: white; position: relative; overflow: hidden; }
    .cta::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, ${c.secondary}20 0%, transparent 60%); }
    .cta h2 { font-size: 36px; font-weight: 800; margin-bottom: 16px; position: relative; }
    .cta p { font-size: 18px; opacity: 0.9; margin-bottom: 32px; position: relative; }
    .cta .btn-white { background: white; color: ${c.primary}; border: none; padding: 16px 40px; border-radius: 14px; font-family: 'Cairo'; font-size: 17px; font-weight: 700; cursor: pointer; position: relative; transition: all 0.3s; }
    .cta .btn-white:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }

    /* Footer */
    .footer { background: ${isDark ? '#020617' : '#0f172a'}; color: #94a3b8; padding: 64px 24px 32px; }
    .footer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px; max-width: 1200px; margin: 0 auto; }
    .footer h3 { color: white; font-size: 18px; font-weight: 700; margin-bottom: 16px; }
    .footer p { font-size: 14px; line-height: 1.8; }
    .footer-links { list-style: none; }
    .footer-links li { margin-bottom: 8px; }
    .footer-links a { font-size: 14px; color: #94a3b8; transition: color 0.2s; }
    .footer-links a:hover { color: white; }
    .footer-bottom { max-width: 1200px; margin: 32px auto 0; padding-top: 32px; border-top: 1px solid #1e293b; text-align: center; font-size: 13px; }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  </style>
</head>
<body>
  <!-- Navbar -->
  <nav class="navbar">
    <div class="navbar-logo">${ctx.idea.substring(0, 30)}</div>
    <div class="navbar-links">
      ${pages.slice(0, 5).map(p => `<a href="#">${p}</a>`).join('\n      ')}
    </div>
    <button class="navbar-btn">ابدأ الآن</button>
  </nav>

  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-badge">متاح الآن</div>
    <h1><span>${ctx.idea.substring(0, 80)}</span></h1>
    <p>منصة متكاملة تجمع بين التقنية الحديثة وتجربة المستخدم المتميزة لتقديم أفضل الخدمات والحلول الرقمية</p>
    <div class="hero-buttons">
      <button class="btn-primary">ابدأ مجاناً &#10004;</button>
      <button class="btn-outline">شاهد العرض التوضيحي</button>
    </div>
  </section>

  <!-- Stats -->
  <section class="stats">
    <div class="stat"><div class="stat-number">10K+</div><div class="stat-label">مستخدم نشط</div></div>
    <div class="stat"><div class="stat-number">99.9%</div><div class="stat-label">وقت التشغيل</div></div>
    <div class="stat"><div class="stat-number">150+</div><div class="stat-label">دولة</div></div>
    <div class="stat"><div class="stat-number">4.9</div><div class="stat-label">تقييم المستخدمين</div></div>
  </section>

  <!-- Features -->
  <section class="features">
    <h2 class="section-title">المميزات الرئيسية</h2>
    <p class="section-subtitle">كل ما تحتاجه لبناء مشروعك الرقمي في مكان واحد</p>
    <div class="features-grid">
      ${features.map((f, i) => {
        const icons = ['&#9889;', '&#128640;', '&#128274;', '&#128200;', '&#128172;', '&#127912;', '&#9881;', '&#128640;'];
        const bgColors = [c.primary, c.secondary, c.accent, c.success, c.primary, c.secondary, c.accent, c.success];
        return `<div class="feature-card">
        <div class="feature-icon" style="background: ${bgColors[i % bgColors.length]}15; color: ${bgColors[i % bgColors.length]};">${icons[i % icons.length]}</div>
        <h3>${f}</h3>
        <p>تقنية متطورة توفر لك أفضل تجربة ممكنة مع أداء عالي وموثوقية كبيرة</p>
      </div>`;
      }).join('\n      ')}
    </div>
  </section>

  <!-- Pages Preview -->
  <section class="pages">
    <h2 class="section-title">الصفحات</h2>
    <p class="section-subtitle">تصفح صفحات التطبيق المختلفة</p>
    <div class="pages-grid">
      ${pages.map((p, i) => {
        const pageIcons = ['&#127968;', '&#128218;', '&#128100;', '&#128722;', '&#128172;', '&#9881;'];
        return `<div class="page-card">
        <div class="icon">${pageIcons[i % pageIcons.length]}</div>
        <h4>${p}</h4>
      </div>`;
      }).join('\n      ')}
    </div>
  </section>

  <!-- CTA -->
  <section class="cta">
    <h2>جاهز للبدء؟</h2>
    <p>انضم إلى آلاف المستخدمين الذين يثقون بنا يومياً</p>
    <button class="btn-white">ابدأ الآن مجاناً</button>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-grid">
      <div>
        <h3>${ctx.idea.substring(0, 20)}</h3>
        <p>منصة متكاملة تقدم أفضل الخدمات الرقمية والحلول التقنية المبتكرة لجميع احتياجاتك</p>
      </div>
      <div>
        <h3>روابط سريعة</h3>
        <ul class="footer-links">
          ${pages.slice(0, 4).map(p => `<li><a href="#">${p}</a></li>`).join('\n          ')}
        </ul>
      </div>
      <div>
        <h3>القانوني</h3>
        <ul class="footer-links">
          <li><a href="#">سياسة الخصوصية</a></li>
          <li><a href="#">الشروط والأحكام</a></li>
          <li><a href="#">سياسة الاسترجاع</a></li>
        </ul>
      </div>
      <div>
        <h3>تواصل معنا</h3>
        <ul class="footer-links">
          <li><a href="#">info@example.com</a></li>
          <li><a href="#">+966 XX XXX XXXX</a></li>
          <li><a href="#">تويتر | إنستغرام</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">&copy; 2025 ${ctx.idea.substring(0, 20)}. جميع الحقوق محفوظة.</div>
  </footer>
</body>
</html>`;
}

function generateTailwindConfig(colors: DesignSystem['colors']): string {
  return `import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "${colors.primary}",
        "primary-light": "${colors.primaryLight}",
        "primary-dark": "${colors.primaryDark}",
        secondary: "${colors.secondary}",
        accent: "${colors.accent}",
        background: "${colors.background}",
        foreground: "${colors.foreground}",
        muted: "${colors.muted}",
        destructive: "${colors.destructive}",
        success: "${colors.success}",
        card: "${colors.card}",
        border: "${colors.border}",
      },
      fontFamily: {
        heading: ["Cairo", "Inter", "sans-serif"],
        body: ["Cairo", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "12px",
        "3xl": "16px",
      },
    },
  },
  plugins: [],
};

export default config;
`;
}

function generateUiSpecs(ctx: SharedContext, design: DesignSystem): string {
  return `# مواصفات واجهة المستخدم

## ملخص التصميم
${design.summary}

## نظام الألوان
- الأساسي: ${design.colors.primary}
- الأساسي الفاتح: ${design.colors.primaryLight}
- الأساسي الداكن: ${design.colors.primaryDark}
- الثانوي: ${design.colors.secondary}
- التمييز: ${design.colors.accent}
- الخلفية: ${design.colors.background}
- النص: ${design.colors.foreground}

## الخطوط
- العناوين: ${design.typography.heading}
- النص: ${design.typography.body}
- الكود: ${design.typography.mono}

## المكونات المطلوبة
- Header / Navbar مع قائمة تنقل وأزرار CTA
- Hero Section مع عنوان متدرج وأزرار إجراء
- بطاقات المميزات مع أيقونات ووصف
- قسم الإحصائيات
- قسم CTA متدرج
- Footer كامل بـ 4 أعمدة
- نظام Toast للإشعارات
- أزرار بتصميم حديث (حواف مستديرة + ظلال)

## مبادئ التصميم
1. تصميم متجاوب (Mobile-First)
2. دعم RTL للعربية
3. ألوان متناسقة ومريحة للعين
4. حواف مستديرة عصرية (12-20px)
5. انتقالات سلسة (0.3s ease)
6. خط Cairo العربي الاحترافي
7. تدرجات لونية جذابة
8. ظلال ناعمة (box-shadow)
`;
}
