// Agent Orchestrator - The core engine that coordinates all agents

import { PlannerAgent } from './planner-agent';
import { BuilderAgent } from './builder-agent';
import { DebuggerAgent } from './debugger-agent';
import { DevOpsAgent } from './devops-agent';
import { AgentContext, ProjectIdea } from './types';
import { db } from '@/lib/db';

export class AgentOrchestrator {
  private planner: PlannerAgent;
  private builder: BuilderAgent;
  private debugger: DebuggerAgent;
  private devops: DevOpsAgent;

  constructor() {
    this.planner = new PlannerAgent();
    this.builder = new BuilderAgent();
    this.debugger = new DebuggerAgent();
    this.devops = new DevOpsAgent();
  }

  /**
   * Main execution loop - autonomous agent system
   * 1. Create project record
   * 2. Plan the project
   * 3. Build the code
   * 4. Debug if errors
   * 5. Deploy the project
   * 6. Loop on errors until success or max retries
   */
  async execute(idea: ProjectIdea): Promise<string> {
    // Create project in database
    const project = await db.project.create({
      data: {
        name: idea.name,
        description: idea.description,
        idea: idea.idea,
        status: 'pending',
      },
    });

    const projectId = project.id;

    // Add initial system message
    await db.agentMessage.create({
      data: {
        projectId,
        role: 'system',
        content: `🚀 New project started: "${idea.name}"\n\nIdea: ${idea.idea}\n\nThe AI Agent system will now autonomously plan, build, debug, and deploy your application.`,
      },
    });

    // Start the autonomous loop in the background
    this.runAutonomousLoop(projectId, idea).catch(async (error) => {
      console.error('[Orchestrator] Fatal error:', error);
      await db.project.update({
        where: { id: projectId },
        data: {
          status: 'failed',
          errorLog: `Fatal orchestrator error: ${error.message}`,
        },
      });
      await db.agentMessage.create({
        data: {
          projectId,
          role: 'system',
          content: `❌ A fatal error occurred: ${error.message}. Please try again.`,
        },
      });
    });

    return projectId;
  }

  private async runAutonomousLoop(projectId: string, idea: ProjectIdea): Promise<void> {
    let context: AgentContext = {
      projectId,
      idea: idea.idea,
      retryCount: 0,
      maxRetries: 3,
    };

    try {
      // PHASE 1: PLANNING
      console.log(`[Orchestrator] Phase 1: Planning project ${projectId}`);
      context = await this.planner.execute(context);

      // PHASE 2: BUILDING
      console.log(`[Orchestrator] Phase 2: Building project ${projectId}`);
      context = await this.builder.execute(context);

      // PHASE 3: DEBUGGING (if errors)
      if (context.errorLog) {
        console.log(`[Orchestrator] Phase 3: Debugging project ${projectId}`);

        // Autonomous debug loop
        while (context.errorLog && context.retryCount < context.maxRetries) {
          context = await this.debugger.execute(context);

          if (context.errorLog) {
            // Re-try building after debug attempt
            await db.agentMessage.create({
              data: {
                projectId,
                role: 'system',
                content: `🔄 Retrying build after debug attempt ${context.retryCount}/${context.maxRetries}...`,
              },
            });
            context = await this.builder.execute(context);
          }
        }
      }

      // PHASE 4: DEPLOYMENT
      if (!context.errorLog) {
        console.log(`[Orchestrator] Phase 4: Deploying project ${projectId}`);
        context = await this.devops.execute(context);
      } else {
        await db.project.update({
          where: { id: projectId },
          data: { status: 'failed' },
        });
        await db.agentMessage.create({
          data: {
            projectId,
            role: 'system',
            content: `❌ Project could not be completed after ${context.maxRetries} debug attempts. Please review the errors and try again.`,
          },
        });
      }
    } catch (error: any) {
      console.error(`[Orchestrator] Error in loop:`, error);
      await db.project.update({
        where: { id: projectId },
        data: {
          status: 'failed',
          errorLog: error.message,
        },
      });
    }
  }
}

// Singleton instance
export const orchestrator = new AgentOrchestrator();
