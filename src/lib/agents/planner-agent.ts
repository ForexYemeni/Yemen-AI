// Planner Agent - Analyzes requests and creates execution plans

import { BaseAgent } from './base-agent';
import { AgentContext, ExecutionPlan, PlanStep, TechStack, AgentType } from './types';
import ZAI from 'z-ai-web-dev-sdk';

export class PlannerAgent extends BaseAgent {
  type: AgentType = 'planner';
  name = 'Planner Agent';
  description = 'Analyzes user requests and creates detailed execution plans';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, idea } = context;

    await this.log(projectId, 'start_planning', `Starting analysis of project idea: "${idea}"`, 'info');
    await this.updateProjectStatus(projectId, 'planning');
    await this.addMessage(projectId, 'planner', `🔍 Analyzing your project idea: "${idea}"`);

    try {
      const plan = await this.generatePlan(idea, projectId);

      await this.log(projectId, 'plan_created', `Generated execution plan with ${plan.steps.length} steps`, 'success');
      await this.addMessage(projectId, 'planner', `✅ Plan created successfully with ${plan.steps.length} steps.\n\n**Architecture:** ${plan.architecture}\n\n**Estimated Files:** ${plan.estimatedFiles}`);

      // Save plan to project
      await this.updateProjectStatus(projectId, 'planning', {
        plan: JSON.stringify(plan),
      });

      context.plan = plan;
      return context;
    } catch (error: any) {
      await this.log(projectId, 'plan_failed', `Planning failed: ${error.message}`, 'error');
      await this.addMessage(projectId, 'planner', `❌ Planning failed: ${error.message}`);
      throw error;
    }
  }

  private async generatePlan(idea: string, projectId: string): Promise<ExecutionPlan> {
    await this.log(projectId, 'ai_analysis', 'Sending request to AI for project analysis...', 'info');

    const zai = await ZAI.create();

    const systemPrompt = `You are a Senior Software Architect. Analyze the user's project idea and create a detailed execution plan.

You MUST respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "architecture": "Brief description of the architecture",
  "estimatedFiles": 8,
  "techStack": {
    "frontend": ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    "backend": ["Next.js API Routes"],
    "database": ["SQLite via Prisma"],
    "deployment": ["Vercel"]
  },
  "steps": [
    {
      "id": "step-1",
      "title": "Database Schema Design",
      "description": "Design and create the database schema",
      "agent": "builder",
      "dependencies": [],
      "status": "pending"
    }
  ]
}

Rules:
- Create 4-8 logical steps
- Steps must flow: database → backend → frontend → deployment
- Agent must be one of: "builder", "debugger", "devops"
- Each step should be specific and actionable
- The tech stack should be modern and practical
- Architecture should describe the overall system design`;

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this project idea and create an execution plan: "${idea}"` }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      await this.log(projectId, 'ai_response', `AI response received (${responseText.length} chars)`, 'info');

      // Clean and parse JSON response
      let cleanResponse = responseText.trim();
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
      }

      const planData = JSON.parse(cleanResponse);

      const plan: ExecutionPlan = {
        architecture: planData.architecture || 'Full-stack Next.js application',
        estimatedFiles: planData.estimatedFiles || 8,
        techStack: planData.techStack || {
          frontend: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
          backend: ['Next.js API Routes'],
          database: ['SQLite via Prisma'],
          deployment: ['Vercel'],
        },
        steps: (planData.steps || []).map((step: any, index: number) => ({
          id: step.id || `step-${index + 1}`,
          title: step.title,
          description: step.description,
          agent: step.agent || 'builder',
          dependencies: step.dependencies || [],
          status: 'pending' as const,
        })),
      };

      return plan;
    } catch (parseError: any) {
      await this.log(projectId, 'ai_parse_fallback', `AI response parsing failed, using default plan: ${parseError.message}`, 'warning');

      // Fallback to a default plan
      return this.getDefaultPlan(idea);
    }
  }

  private getDefaultPlan(idea: string): ExecutionPlan {
    return {
      architecture: 'Full-stack Next.js application with API Routes, Prisma ORM, and responsive UI with Tailwind CSS',
      estimatedFiles: 10,
      techStack: {
        frontend: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'shadcn/ui'],
        backend: ['Next.js API Routes'],
        database: ['SQLite via Prisma'],
        deployment: ['Vercel'],
      },
      steps: [
        {
          id: 'step-1',
          title: 'Database Schema Design',
          description: 'Design and create the Prisma schema for the application data models',
          agent: 'builder',
          dependencies: [],
          status: 'pending',
        },
        {
          id: 'step-2',
          title: 'API Routes Implementation',
          description: 'Create RESTful API endpoints for CRUD operations',
          agent: 'builder',
          dependencies: ['step-1'],
          status: 'pending',
        },
        {
          id: 'step-3',
          title: 'Frontend Components',
          description: 'Build the UI components and pages with responsive design',
          agent: 'builder',
          dependencies: ['step-2'],
          status: 'pending',
        },
        {
          id: 'step-4',
          title: 'Integration & Testing',
          description: 'Connect frontend to backend, test all features, and fix issues',
          agent: 'debugger',
          dependencies: ['step-3'],
          status: 'pending',
        },
        {
          id: 'step-5',
          title: 'Deployment Preparation',
          description: 'Prepare the project for deployment and configure environment',
          agent: 'devops',
          dependencies: ['step-4'],
          status: 'pending',
        },
      ],
    };
  }
}
