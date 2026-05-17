// ============================================================
// Master Orchestrator — ينسق جميع الوكلاء بالتسلسل
// يتوقف عند مرحلة التصميم للموافقة
// ثم يتوقف مرة أخرى قبل النشر للموافقة النهائية
// لا يتم رفع أي شيء بدون موافقة المستخدم
// ============================================================

import {
  AgentType,
  ProjectStatus,
  AgentLog,
  SharedContext as SharedContextType,
} from '../runtime/types';
import { SharedContext } from '../runtime/shared-context';
import {
  runtimeStore,
  addLog,
  addMessage,
  updateProject,
  generateLogId,
  generateMsgId,
} from '../runtime/memory';
import { runProjectManagerAgent } from './project-manager';
import { runUiUxAgent } from './ui-ux-agent';
import { runFrontendAgent } from './frontend-agent';
import { runBackendAgent } from './backend-agent';
import { runDbGuidanceAgent } from './db-guidance';
import { runNotificationsAgent } from './notifications';
import { runQaDebugAgent } from './qa-debug';
import { runDevOpsAgent } from './devops-agent';

type AgentRunner = (ctx: SharedContext) => Promise<void>;

const AGENT_RUNNERS: Record<AgentType, AgentRunner> = {
  project_manager: runProjectManagerAgent,
  ui_ux: runUiUxAgent,
  frontend: runFrontendAgent,
  backend: runBackendAgent,
  db_guidance: runDbGuidanceAgent,
  notifications: runNotificationsAgent,
  qa_debug: runQaDebugAgent,
  devops: runDevOpsAgent,
};

const AGENT_STATUS_MAP: Record<AgentType, ProjectStatus> = {
  project_manager: 'analyzing',
  ui_ux: 'designing',
  frontend: 'frontend_dev',
  backend: 'backend_dev',
  db_guidance: 'db_setup',
  notifications: 'notifications_setup',
  qa_debug: 'testing',
  devops: 'deploying',
};

const AGENT_NAME_AR: Record<AgentType, string> = {
  project_manager: 'مدير المشروع',
  ui_ux: 'مصمم الواجهات',
  frontend: 'مطور الواجهة',
  backend: 'مطور الخلفية',
  db_guidance: 'مستشار البيانات',
  notifications: 'مهندس الإشعارات',
  qa_debug: 'ضمان الجودة',
  devops: 'مهندس العمليات',
};

// ============================================================
// Phase 1: PM + UI/UX → Stop for design approval
// ============================================================
const PHASE1_AGENTS: AgentType[] = [
  'project_manager',
  'ui_ux',
];

// ============================================================
// Phase 2: After design approval — build the rest (no deploy)
// ============================================================
const PHASE2_AGENTS: AgentType[] = [
  'frontend',
  'backend',
  'db_guidance',
  'notifications',
  'qa_debug',
];

// ============================================================
// Phase 3: After final approval — DevOps only
// ============================================================
const PHASE3_AGENTS: AgentType[] = [
  'devops',
];

// ============================================================
// Start orchestration — Phase 1 only (PM + Design)
// ============================================================
export async function orchestrate(
  projectId: string,
  mode: 'new' | 'existing',
  githubUrl?: string,
  githubToken?: string
): Promise<void> {
  const project = runtimeStore.projects.get(projectId);
  if (!project) {
    throw new Error('المشروع غير موجود');
  }

  // Create shared context
  const ctx = new SharedContext(projectId, project.idea, mode);
  if (githubUrl) ctx.githubUrl = githubUrl;
  ctx.sync();

  // Update project status
  updateProject(projectId, { status: 'analyzing', currentStep: 'بدأ تحليل المشروع' });

  addMessage(projectId, {
    id: generateMsgId(),
    projectId,
    role: 'system',
    content: 'بدأ خط إنتاج المشروع — سيتم عرض التصميم للموافقة قبل المتابعة',
    timestamp: new Date().toISOString(),
  });

  try {
    // Run Phase 1: PM + UI/UX
    const phase1 = mode === 'new'
      ? PHASE1_AGENTS
      : ['project_manager'] as AgentType[];

    for (const agentType of phase1) {
      await runAgent(ctx, agentType, projectId);
    }

    // ============================================================
    // STOP HERE — Show design for approval
    // ============================================================
    updateProject(projectId, {
      status: 'pending_approval',
      progress: 25,
      currentStep: 'بانتظار موافقة المستخدم على التصميم',
    });

    addMessage(projectId, {
      id: generateMsgId(),
      projectId,
      role: 'system',
      content: 'تم إنشاء التصميم — راجع المعاينة ووافق أو قدم مقترحات للتحسين. لا يتم المتابعة بدون موافقتك.',
      timestamp: new Date().toISOString(),
    });

    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'ui_ux',
      action: 'waiting_design_approval',
      content: 'بانتظار موافقة المستخدم على التصميم — لا متابعة بدون موافقة',
      status: 'warning',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
    updateProject(projectId, {
      status: 'failed',
      currentStep: `فشل: ${errMsg}`,
    });

    addMessage(projectId, {
      id: generateMsgId(),
      projectId,
      role: 'system',
      content: `فشل المشروع: ${errMsg}`,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================
// Continue after design approval — Phase 2 (build code)
// ============================================================
export async function orchestrateBuild(projectId: string): Promise<void> {
  const project = runtimeStore.projects.get(projectId);
  if (!project) {
    throw new Error('المشروع غير موجود');
  }

  if (project.status !== 'pending_approval') {
    throw new Error('المشروع ليس في حالة انتظار الموافقة');
  }

  const ctx = runtimeStore.sharedContexts.get(projectId);
  if (!ctx) {
    throw new Error('لا يوجد سياق مشترك لهذا المشروع');
  }

  addMessage(projectId, {
    id: generateMsgId(),
    projectId,
    role: 'system',
    content: 'تمت الموافقة على التصميم — بدأ بناء المشروع خطوة بخطوة',
    timestamp: new Date().toISOString(),
  });

  try {
    // Run Phase 2: Build agents sequentially
    for (const agentType of PHASE2_AGENTS) {
      // Skip DB if not needed
      if (agentType === 'db_guidance' && !ctx.needsDatabase) {
        addLog(projectId, {
          id: generateLogId(),
          projectId,
          agent: 'db_guidance',
          action: 'skipped',
          content: 'تم تخطي مستشار البيانات — لا حاجة لقاعدة بيانات',
          status: 'warning',
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      // Skip Notifications if not needed
      if (agentType === 'notifications' && !ctx.needsNotifications) {
        addLog(projectId, {
          id: generateLogId(),
          projectId,
          agent: 'notifications',
          action: 'skipped',
          content: 'تم تخطي مهندس الإشعارات — لا حاجة للإشعارات',
          status: 'warning',
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      await runAgent(ctx, agentType, projectId);
    }

    // ============================================================
    // STOP AGAIN — Show final code for approval before deploy
    // ============================================================
    updateProject(projectId, {
      status: 'pending_approval',
      progress: 85,
      currentStep: 'تم بناء المشروع بالكامل — بانتظار الموافقة النهائية قبل النشر',
    });

    addMessage(projectId, {
      id: generateMsgId(),
      projectId,
      role: 'system',
      content: 'تم بناء جميع ملفات المشروع — راجع الكود ووافق للنشر. لا يتم رفع أي شيء بدون موافقتك.',
      timestamp: new Date().toISOString(),
    });

    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'qa_debug',
      action: 'waiting_final_approval',
      content: 'بانتظار الموافقة النهائية — لن يتم الرفع إلى GitHub أو Vercel بدون موافقة المستخدم',
      status: 'warning',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
    updateProject(projectId, {
      status: 'failed',
      currentStep: `فشل: ${errMsg}`,
    });

    addMessage(projectId, {
      id: generateMsgId(),
      projectId,
      role: 'system',
      content: `فشل بناء المشروع: ${errMsg}`,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================
// Phase 3: Deploy after final approval
// ============================================================
export async function orchestrateDeploy(projectId: string): Promise<void> {
  const project = runtimeStore.projects.get(projectId);
  if (!project) {
    throw new Error('المشروع غير موجود');
  }

  if (project.status !== 'pending_approval') {
    throw new Error('المشروع ليس في حالة انتظار الموافقة');
  }

  const ctx = runtimeStore.sharedContexts.get(projectId);
  if (!ctx) {
    throw new Error('لا يوجد سياق مشترك لهذا المشروع');
  }

  updateProject(projectId, {
    status: 'deploying',
    currentStep: 'جاري النشر بعد الموافقة...',
  });

  addMessage(projectId, {
    id: generateMsgId(),
    projectId,
    role: 'system',
    content: 'وافق المستخدم — بدأ النشر على GitHub و Vercel',
    timestamp: new Date().toISOString(),
  });

  addLog(projectId, {
    id: generateLogId(),
    projectId,
    agent: 'devops',
    action: 'approval_received',
    content: 'تمت الموافقة النهائية — بدأ النشر',
    status: 'success',
    timestamp: new Date().toISOString(),
  });

  try {
    // Run DevOps agent
    await runDevOpsAgent(ctx);

    // Mark project as completed
    updateProject(projectId, {
      status: 'completed',
      progress: 100,
      currentStep: 'مكتمل',
      repoUrl: (ctx.getAgentResult('devops') as Record<string, unknown>)?.repoUrl as string | undefined,
      deployUrl: (ctx.getAgentResult('devops') as Record<string, unknown>)?.deployUrl as string | undefined,
    });

    addMessage(projectId, {
      id: generateMsgId(),
      projectId,
      role: 'system',
      content: 'تم إنجاز المشروع ونشره بنجاح!',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
    updateProject(projectId, {
      status: 'failed',
      currentStep: `فشل النشر: ${errMsg}`,
    });

    addMessage(projectId, {
      id: generateMsgId(),
      projectId,
      role: 'system',
      content: `فشل النشر: ${errMsg}`,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================
// Reject project — user disapproves
// ============================================================
export async function rejectProject(projectId: string, reason?: string): Promise<void> {
  const project = runtimeStore.projects.get(projectId);
  if (!project) {
    throw new Error('المشروع غير موجود');
  }

  updateProject(projectId, {
    status: 'failed',
    currentStep: `مرفوض: ${reason ?? 'لم يوافق المستخدم'}`,
  });

  addMessage(projectId, {
    id: generateMsgId(),
    projectId,
    role: 'system',
    content: `رفض المستخدم المشروع: ${reason ?? 'لم يوافق'}`,
    timestamp: new Date().toISOString(),
  });

  addLog(projectId, {
    id: generateLogId(),
    projectId,
    agent: 'devops',
    action: 'rejected',
    content: `تم رفض المشروع: ${reason ?? 'لم يوافق المستخدم'}`,
    status: 'error',
    timestamp: new Date().toISOString(),
  });
}

// ============================================================
// Helper: Run a single agent with retries
// ============================================================
async function runAgent(
  ctx: SharedContext,
  agentType: AgentType,
  projectId: string,
  maxRetries: number = 3
): Promise<void> {
  const status = AGENT_STATUS_MAP[agentType];
  const nameAr = AGENT_NAME_AR[agentType];

  updateProject(projectId, {
    status,
    currentStep: `وكيل ${nameAr}: يعمل...`,
  });

  addLog(projectId, {
    id: generateLogId(),
    projectId,
    agent: agentType,
    action: 'agent_start',
    content: `بدأ تشغيل وكيل ${nameAr} من الألف إلى الياء`,
    status: 'running',
    timestamp: new Date().toISOString(),
  });

  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      const runner = AGENT_RUNNERS[agentType];
      await runner(ctx);

      addLog(projectId, {
        id: generateLogId(),
        projectId,
        agent: agentType,
        action: 'agent_complete',
        content: `أكمل وكيل ${nameAr} عمله بنجاح`,
        status: 'success',
        timestamp: new Date().toISOString(),
      });

      return; // Success
    } catch (error) {
      attempts++;
      ctx.retryCount = attempts;
      const errMsg = error instanceof Error ? error.message : 'خطأ غير معروف';

      addLog(projectId, {
        id: generateLogId(),
        projectId,
        agent: agentType,
        action: 'agent_error',
        content: `محاولة ${attempts}/${maxRetries} لوكيل ${nameAr}: ${errMsg}`,
        status: attempts >= maxRetries ? 'error' : 'warning',
        timestamp: new Date().toISOString(),
      });

      if (attempts >= maxRetries) {
        if (agentType === 'qa_debug') {
          addLog(projectId, {
            id: generateLogId(),
            projectId,
            agent: 'qa_debug',
            action: 'qa_fallback',
            content: 'تم التخطي بسبب فشل الفحص — المتابعة بدون فحص مفصل',
            status: 'warning',
            timestamp: new Date().toISOString(),
          });
          return;
        }
        throw new Error(`فشل وكيل ${nameAr} بعد ${maxRetries} محاولات: ${errMsg}`);
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }
}
