// ============================================================
// Master Orchestrator — ينسق جميع الوكلاء ويدار خط الإنتاج
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
    content: mode === 'new' ? '🚀 بدأ خط إنتاج مشروع جديد' : '🔄 بدأ تحليل وتحسين مشروع موجود',
    timestamp: new Date().toISOString(),
  });

  try {
    if (mode === 'new') {
      await runNewProjectPipeline(ctx, projectId);
    } else {
      await runExistingProjectPipeline(ctx, projectId);
    }

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
      content: '✅ تم إنجاز المشروع بنجاح!',
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

async function runNewProjectPipeline(ctx: SharedContext, projectId: string): Promise<void> {
  // Pipeline: PM → UI/UX → Frontend → Backend → DB (if needed) → Notifications (if needed) → QA → DevOps
  const pipeline: AgentType[] = [
    'project_manager',
    'ui_ux',
    'frontend',
    'backend',
  ];

  // Conditionally add DB and Notifications agents
  // We'll check after PM analysis to determine if needed
  // For now, always include them but they check needs internally
  const needsDb = true; // Will be refined after PM runs
  const needsNotif = true;

  if (needsDb) pipeline.push('db_guidance');
  if (needsNotif) pipeline.push('notifications');
  pipeline.push('qa_debug', 'devops');

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
}

async function runExistingProjectPipeline(ctx: SharedContext, projectId: string): Promise<void> {
  // Pipeline for existing projects: PM (analyze) → Backend (modify) → QA → DevOps
  const pipeline: AgentType[] = [
    'project_manager',
    'backend',
    'qa_debug',
    'devops',
  ];

  for (const agentType of pipeline) {
    const status = AGENT_STATUS_MAP[agentType];
    updateProject(projectId, {
      status,
      currentStep: `وكيل: ${agentType}`,
    });

    const runner = AGENT_RUNNERS[agentType];
    await runAgentWithRetry(ctx, agentType, runner, projectId);
  }
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
        // If QA fails after retries, try running QA once more with simpler analysis
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
