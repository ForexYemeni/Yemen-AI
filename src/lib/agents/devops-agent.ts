// DevOps Agent - Handles GitHub and Vercel integration

import { BaseAgent } from './base-agent';
import { AgentContext, CodeFile, DeployResult } from './types';

export class DevOpsAgent extends BaseAgent {
  type = 'devops' as const;
  name = 'DevOps Agent';
  description = 'Manages GitHub repository and Vercel deployment';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, codeFiles } = context;

    if (!codeFiles || codeFiles.length === 0) {
      await this.log(projectId, 'no_code', 'No code files to deploy', 'error');
      await this.addMessage(projectId, 'devops', '❌ No code files available for deployment.');
      return context;
    }

    await this.log(projectId, 'start_devops', 'Starting deployment process...', 'info');
    await this.updateProjectStatus(projectId, 'deploying');
    await this.addMessage(projectId, 'devops', `🚀 Preparing deployment for ${codeFiles.length} files...`);

    try {
      // Step 1: GitHub - Create/Update Repository
      await this.log(projectId, 'github_step', 'Attempting GitHub integration...', 'info');
      const githubResult = await this.pushToGitHub(projectId, codeFiles, context);

      if (githubResult.repoUrl) {
        await this.addMessage(projectId, 'devops', `📦 GitHub repository ready: ${githubResult.repoUrl}`);
        context.codeFiles = codeFiles;
      }

      // Step 2: Vercel - Deploy
      await this.log(projectId, 'vercel_step', 'Attempting Vercel deployment...', 'info');
      const vercelResult = await this.deployToVercel(projectId, codeFiles, context);

      if (vercelResult.success && vercelResult.deployUrl) {
        await this.log(projectId, 'deploy_success', `Deployed successfully: ${vercelResult.deployUrl}`, 'success');
        await this.addMessage(projectId, 'devops', `🎉 Deployment successful!\n\n🌐 Live URL: ${vercelResult.deployUrl}\n📦 Repo: ${githubResult.repoUrl || 'Local only'}`);

        await this.updateProjectStatus(projectId, 'completed', {
          repoUrl: githubResult.repoUrl,
          deployUrl: vercelResult.deployUrl,
        });
      } else {
        await this.log(projectId, 'deploy_partial', 'Code generated successfully. Manual deployment needed.', 'warning');
        await this.addMessage(projectId, 'devops', `✅ Code generated successfully!\n\n⚠️ Automatic deployment requires GitHub Token and Vercel Token to be configured in Settings.\n\nYour code is ready and can be downloaded or deployed manually.`);

        await this.updateProjectStatus(projectId, 'completed', {
          repoUrl: githubResult.repoUrl,
        });
      }

      return context;
    } catch (error: any) {
      await this.log(projectId, 'devops_error', `DevOps process error: ${error.message}`, 'warning');
      await this.addMessage(projectId, 'devops', `⚠️ Deployment step encountered an issue: ${error.message}\n\nYour code has been generated successfully and is available for download.`);

      await this.updateProjectStatus(projectId, 'completed');
      return context;
    }
  }

  private async pushToGitHub(projectId: string, codeFiles: CodeFile[], context: AgentContext): Promise<DeployResult> {
    try {
      const settings = await this.getSettings();

      if (!settings?.githubToken) {
        await this.log(projectId, 'github_no_token', 'GitHub token not configured. Skipping GitHub push.', 'warning');
        return { success: false, error: 'GitHub token not configured' };
      }

      const repoName = `ai-agent-${projectId.substring(0, 8)}`;

      // Create repository via GitHub API
      const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          description: context.idea?.substring(0, 100) || 'AI Agent generated project',
          private: false,
          auto_init: true,
        }),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        await this.log(projectId, 'github_create_error', `GitHub API error: ${errorData.message}`, 'error');
        return { success: false, error: errorData.message };
      }

      const repoData = await createRes.json();
      const repoUrl = repoData.html_url;
      const owner = repoData.owner.login;

      await this.log(projectId, 'github_repo_created', `Repository created: ${repoUrl}`, 'success');

      // Push files via GitHub API (using Git Data API)
      // First, get the latest commit on main
      const refRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/main`, {
        headers: {
          'Authorization': `Bearer ${settings.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      const refData = await refRes.json();
      const latestCommitSha = refData.object.sha;

      // Get the commit tree
      const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits/${latestCommitSha}`, {
        headers: {
          'Authorization': `Bearer ${settings.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      const commitData = await commitRes.json();
      const baseTreeSha = commitData.tree.sha;

      // Create blobs for each file
      const treeItems = [];
      for (const file of codeFiles.slice(0, 50)) { // GitHub API limit
        const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/blobs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: file.content,
            encoding: 'utf-8',
          }),
        });

        const blobData = await blobRes.json();
        treeItems.push({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha,
        });
      }

      // Create tree
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems,
        }),
      });

      const treeData = await treeRes.json();

      // Create commit
      const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Initial commit - Generated by AI Agent System',
          tree: treeData.sha,
          parents: [latestCommitSha],
        }),
      });

      const newCommitData = await newCommitRes.json();

      // Update reference
      await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/main`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${settings.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sha: newCommitData.sha,
        }),
      });

      await this.log(projectId, 'github_pushed', `Pushed ${codeFiles.length} files to GitHub`, 'success');
      return { success: true, repoUrl };
    } catch (error: any) {
      await this.log(projectId, 'github_error', `GitHub error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  private async deployToVercel(projectId: string, codeFiles: CodeFile[], context: AgentContext): Promise<DeployResult> {
    try {
      const settings = await this.getSettings();

      if (!settings?.vercelToken) {
        await this.log(projectId, 'vercel_no_token', 'Vercel token not configured. Skipping Vercel deploy.', 'warning');
        return { success: false, error: 'Vercel token not configured' };
      }

      const repoName = `ai-agent-${projectId.substring(0, 8)}`;

      // Create Vercel project
      const createRes = await fetch('https://api.vercel.com/v9/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          framework: 'nextjs',
        }),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        await this.log(projectId, 'vercel_create_error', `Vercel API error: ${errorData.message || 'Unknown error'}`, 'error');
        return { success: false, error: errorData.message || 'Vercel project creation failed' };
      }

      const projectData = await createRes.json();
      const deployUrl = `${projectData.name}.vercel.app`;

      await this.log(projectId, 'vercel_project_created', `Vercel project created: ${deployUrl}`, 'success');

      return { success: true, deployUrl };
    } catch (error: any) {
      await this.log(projectId, 'vercel_error', `Vercel error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  private async getSettings(): Promise<{ githubToken?: string; vercelToken?: string } | null> {
    try {
      const { db } = await import('@/lib/db');
      const settings = await db.settings.findFirst();
      return settings;
    } catch {
      return null;
    }
  }
}
