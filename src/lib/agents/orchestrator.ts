// ============================================================
// Master Orchestrator — ينسق جميع الوكلاء ويدار خط الإنتاج
// IMPORTANT: يتوقف عند مرحلة الموافقة — لا نشر بدون موافقة المستخدم
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

// Pipeline stages BEFORE user approval (no deployment)
const PRE_APPROVAL_AGENTS: AgentType[] = [
  'project_manager',
  'ui_ux',
  'frontend',
  'backend',
  'db_guidance',
  'notifications',
  'qa_debug',
];

// DevOps is the POST-approval agent (only runs after user approval)
const POST_APPROVAL_AGENTS: AgentType[] = [
  'devops',
];

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
  updateProject(projectId, { status: 'analyzing', currentStep: 'تحليل المشروع' });

  addMessage(projectId, {
    id: generateMsgId(),
    projectId,
    role: 'system',
    content: '🚀 بدأ خط إنتاج المشروع — سيتم عرض التصميم للموافقة قبل النشر',
    timestamp: new Date().toISOString(),
  });

  try {
    // Run all agents EXCEPT DevOps (pre-approval pipeline)
    const pipeline = mode === 'new'
      ? PRE_APPROVAL_AGENTS
      : ['project_manager', 'backend', 'qa_debug'] as AgentType[];

    for (const agentType of pipeline) {
      // Skip DB if not needed (check after PM runs)
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

      const status = AGENT_STATUS_MAP[agentType];
      updateProject(projectId, {
        status,
        currentStep: `وكيل: ${agentType}`,
      });

      addLog(projectId, {
        id: generateLogId(),
        projectId,
        agent: agentType,
        action: 'agent_start',
        content: `بدأ تشغيل الوكيل ${agentType}`,
        status: 'running',
        timestamp: new Date().toISOString(),
      });

      const runner = AGENT_RUNNERS[agentType];
      await runAgentWithRetry(ctx, agentType, runner, projectId);
    }

    // ============================================================
    // STOP HERE — Wait for user approval before deployment
    // ============================================================
    updateProject(projectId, {
      status: 'pending_approval',
      progress: 90,
      currentStep: 'بانتظار موافقة المستخدم على التصميم والكود',
    });

    addMessage(projectId, {
      id: generateMsgId(),
      projectId,
      role: 'system',
      content: '⏸️ تم إيقاف النشر — راجع التصميم والكود ووافق عليه قبل الرفع. لا يتم رفع أي شيء بدون موافقتك.',
      timestamp: new Date().toISOString(),
    });

    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'devops',
      action: 'waiting_approval',
      content: '⏸️ بانتظار موافقة المستخدم — لن يتم الرفع إلى GitHub أو Vercel بدون موافقتك',
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
      content: `❌ فشل المشروع: ${errMsg}`,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================
// Continue orchestration after user approval
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
    content: '✅ وافق المستخدم — بدأ النشر على GitHub و Vercel',
    timestamp: new Date().toISOString(),
  });

  addLog(projectId, {
    id: generateLogId(),
    projectId,
    agent: 'devops',
    action: 'approval_received',
    content: '✅ تمت الموافقة — بدأ النشر',
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
      content: '🎉 تم إنجاز المشروع ونشره بنجاح!',
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
      content: `❌ فشل النشر: ${errMsg}`,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================
// Reject project — user disapproves the design
// ============================================================
export async function rejectProject(projectId: string, reason?: string): Promise<void> {
  const project = runtimeStore.projects.get(projectId);
  if (!project) {
    throw new Error('المشروع غير موجود');
  }

  updateProject(projectId, {
    status: 'failed',
    currentStep: `مرفوض: ${reason ?? 'لم يوافق المستخدم على التصميم'}`,
  });

  addMessage(projectId, {
    id: generateMsgId(),
    projectId,
    role: 'system',
    content: `🚫 رفض المستخدم المشروع: ${reason ?? 'لم يوافق على التصميم'}`,
    timestamp: new Date().toISOString(),
  });

  addLog(projectId, {
    id: generateLogId(),
    projectId,
    agent: 'devops',
    action: 'rejected',
    content: `🚫 تم رفض المشروع: ${reason ?? 'لم يوافق المستخدم'}`,
    status: 'error',
    timestamp: new Date().toISOString(),
  });
}

async function runAgentWithRetry(
  ctx: SharedContext,
  agentType: AgentType,
  runner: AgentRunner,
  projectId: string,
  maxRetries: number = 3
): Promise<void> {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      await runner(ctx);
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
        content: `محاولة ${attempts}/${maxRetries}: ${errMsg}`,
        status: attempts >= maxRetries ? 'error' : 'warning',
        timestamp: new Date().toISOString(),
      });

      if (attempts >= maxRetries) {
        // If QA fails after retries, skip
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
        throw new Error(`فشل الوكيل ${agentType} بعد ${maxRetries} محاولات: ${errMsg}`);
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }
}
