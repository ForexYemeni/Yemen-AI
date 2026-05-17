'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import {
  Brain,
  Hammer,
  Bug,
  Rocket,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Github,
  Globe,
  Settings,
  Sparkles,
  Zap,
  Activity,
  MessageSquare,
  FileCode,
  Trash2,
  Eye,
  RefreshCw,
} from 'lucide-react';

// Types
interface Project {
  id: string;
  name: string;
  description: string;
  idea: string;
  status: string;
  repoUrl?: string;
  deployUrl?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  _count?: { logs: number; messages: number };
}

interface AgentLog {
  id: string;
  agent: string;
  action: string;
  content: string;
  status: string;
  createdAt: string;
}

interface AgentMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface ProjectDetail {
  project: Project;
  logs: AgentLog[];
  messages: AgentMessage[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Clock },
  planning: { label: 'Planning', color: 'bg-purple-100 text-purple-700', icon: Brain },
  building: { label: 'Building', color: 'bg-amber-100 text-amber-700', icon: Hammer },
  debugging: { label: 'Debugging', color: 'bg-red-100 text-red-700', icon: Bug },
  deploying: { label: 'Deploying', color: 'bg-cyan-100 text-cyan-700', icon: Rocket },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const agentConfig: Record<string, { name: string; color: string; icon: any; bgColor: string }> = {
  planner: { name: 'Planner', color: 'text-purple-600', icon: Brain, bgColor: 'bg-purple-50' },
  builder: { name: 'Builder', color: 'text-amber-600', icon: Hammer, bgColor: 'bg-amber-50' },
  debugger: { name: 'Debugger', color: 'text-red-600', icon: Bug, bgColor: 'bg-red-50' },
  devops: { name: 'DevOps', color: 'text-cyan-600', icon: Rocket, bgColor: 'bg-cyan-50' },
  system: { name: 'System', color: 'text-gray-600', icon: Activity, bgColor: 'bg-gray-50' },
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // New project form
  const [newName, setNewName] = useState('');
  const [newIdea, setNewIdea] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Settings form
  const [githubToken, setGithubToken] = useState('');
  const [vercelToken, setVercelToken] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
      setGithubRepo(data.githubRepo || '');
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchSettings();
  }, [fetchProjects, fetchSettings]);

  // Auto-refresh projects every 3 seconds
  useEffect(() => {
    const interval = setInterval(fetchProjects, 3000);
    return () => clearInterval(interval);
  }, [fetchProjects]);

  // Auto-refresh selected project
  useEffect(() => {
    if (!selectedProject) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/agent/${selectedProject.project.id}`);
        const data = await res.json();
        setSelectedProject(data);
      } catch (error) {
        console.error('Failed to refresh project:', error);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedProject]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newIdea.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          idea: newIdea,
          description: newDescription || newName,
        }),
      });

      if (res.ok) {
        setNewName('');
        setNewIdea('');
        setNewDescription('');
        setShowNewProject(false);
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectProject = async (project: Project) => {
    try {
      const res = await fetch(`/api/agent/${project.id}`);
      const data = await res.json();
      setSelectedProject(data);
    } catch (error) {
      console.error('Failed to fetch project detail:', error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (selectedProject?.project.id === id) {
        setSelectedProject(null);
      }
      fetchProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updateData: Record<string, string> = { githubRepo };
      if (githubToken) updateData.githubToken = githubToken;
      if (vercelToken) updateData.vercelToken = vercelToken;

      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      fetchSettings();
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSavingSettings(false);
    }
  };

  const activeProjects = projects.filter(p => !['completed', 'failed'].includes(p.status));
  const completedProjects = projects.filter(p => p.status === 'completed');
  const failedProjects = projects.filter(p => p.status === 'failed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Brain className="h-8 w-8 text-primary" />
                <Sparkles className="h-4 w-4 text-amber-500 absolute -top-1 -right-1" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">AI Agent Factory</h1>
                <p className="text-sm text-muted-foreground">Autonomous Software Development System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>{activeProjects.length} active</span>
                <span className="text-border">|</span>
                <span>{completedProjects.length} completed</span>
              </div>
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>System Settings</DialogTitle>
                    <DialogDescription>Configure GitHub and Vercel integration tokens</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveSettings} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="github-token">GitHub Personal Access Token</Label>
                      <Input
                        id="github-token"
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder={settings?.hasGithubToken ? '•••••••• (configured)' : 'ghp_xxxxxxxxxxxx'}
                      />
                      <p className="text-xs text-muted-foreground">Required for automatic repository creation</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vercel-token">Vercel API Token</Label>
                      <Input
                        id="vercel-token"
                        type="password"
                        value={vercelToken}
                        onChange={(e) => setVercelToken(e.target.value)}
                        placeholder={settings?.hasVercelToken ? '•••••••• (configured)' : 'vercel_xxxxxxxxxxxx'}
                      />
                      <p className="text-xs text-muted-foreground">Required for automatic deployment</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github-repo">Default GitHub Repository Prefix</Label>
                      <Input
                        id="github-repo"
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        placeholder="my-organization"
                      />
                    </div>
                    <Button type="submit" disabled={savingSettings} className="w-full">
                      {savingSettings ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                      Save Settings
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>Describe your idea and the AI agents will build it autonomously</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-name">Project Name</Label>
                      <Input
                        id="project-name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="My Awesome App"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-idea">Your Idea</Label>
                      <Textarea
                        id="project-idea"
                        value={newIdea}
                        onChange={(e) => setNewIdea(e.target.value)}
                        placeholder="Describe what you want to build in detail. The more specific you are, the better the AI agents can build it. Example: A task management app with teams, priorities, and deadline tracking..."
                        rows={4}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-desc">Short Description (optional)</Label>
                      <Input
                        id="project-desc"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Brief description for the project card"
                      />
                    </div>
                    <Button type="submit" disabled={creating} className="w-full">
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Starting AI Agents...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Launch AI Agents
                        </>
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Agent Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {Object.entries(agentConfig).filter(([key]) => key !== 'system').map(([key, config]) => {
            const Icon = config.icon;
            const isActive = activeProjects.some(p => {
              if (key === 'planner' && p.status === 'planning') return true;
              if (key === 'builder' && p.status === 'building') return true;
              if (key === 'debugger' && p.status === 'debugging') return true;
              if (key === 'devops' && p.status === 'deploying') return true;
              return false;
            });
            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl border p-4 ${config.bgColor} transition-all ${isActive ? 'ring-2 ring-primary/30' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  <span className="font-medium text-sm">{config.name}</span>
                  {isActive && (
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-green-500 ml-auto"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isActive ? 'Currently active' : 'Standing by'}
                </p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Projects</h2>
              <Button variant="ghost" size="sm" onClick={fetchProjects}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="text-center py-12">
                  <Sparkles className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-semibold mb-1">No Projects Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first project and let the AI agents build it for you!
                  </p>
                  <Button onClick={() => setShowNewProject(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="space-y-3 pr-4">
                  <AnimatePresence>
                    {projects.map((project) => {
                      const statusInfo = statusConfig[project.status] || statusConfig.pending;
                      const StatusIcon = statusInfo.icon;
                      const isSelected = selectedProject?.project.id === project.id;
                      const isActive = !['completed', 'failed'].includes(project.status);

                      return (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              isSelected ? 'ring-2 ring-primary' : ''
                            } ${isActive ? 'border-primary/30' : ''}`}
                            onClick={() => handleSelectProject(project)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {isActive ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                  ) : (
                                    <StatusIcon className={`h-4 w-4 ${project.status === 'completed' ? 'text-emerald-500' : 'text-red-500'}`} />
                                  )}
                                  <h3 className="font-medium text-sm">{project.name}</h3>
                                </div>
                                <Badge variant="secondary" className={`text-xs ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {project.idea}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                {project._count && (
                                  <>
                                    <span className="text-border">|</span>
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{project._count.messages}</span>
                                  </>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Project Detail */}
          <div className="lg:col-span-2">
            {selectedProject ? (
              <ProjectDetail
                detail={selectedProject}
                onDelete={() => handleDeleteProject(selectedProject.project.id)}
                onClose={() => setSelectedProject(null)}
              />
            ) : (
              <Card className="border-dashed h-[calc(100vh-320px)] flex items-center justify-center">
                <CardContent className="text-center">
                  <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Project</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Click on a project to see the AI agents&apos; progress, logs, and conversation in real-time.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Project Detail Component
function ProjectDetail({
  detail,
  onDelete,
  onClose,
}: {
  detail: ProjectDetail;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { project, logs, messages } = detail;
  const statusInfo = statusConfig[project.status] || statusConfig.pending;
  const isActive = !['completed', 'failed'].includes(project.status);

  // Parse plan if available
  let planSteps: any[] = [];
  try {
    if ((project as any).plan) {
      const plan = JSON.parse((project as any).plan);
      planSteps = plan.steps || [];
    }
  } catch {}

  // Parse code files count
  let codeFilesCount = 0;
  try {
    if ((project as any).codeFiles) {
      const files = JSON.parse((project as any).codeFiles);
      codeFilesCount = files.length;
    }
  } catch {}

  return (
    <div className="space-y-4">
      {/* Project Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold">{project.name}</h2>
                <Badge className={statusInfo.color}>
                  {isActive && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  {statusInfo.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl">{project.idea}</p>
            </div>
            <div className="flex items-center gap-2">
              {project.repoUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4 mr-1" />
                    Repo
                  </a>
                </Button>
              )}
              {project.deployUrl && (
                <Button size="sm" asChild>
                  <a href={`https://${project.deployUrl}`} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-1" />
                    Live
                  </a>
                </Button>
              )}
              <Button variant="ghost" size="icon" className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <FileCode className="h-4 w-4" />
                Files
              </div>
              <p className="text-lg font-semibold">{codeFilesCount}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Activity className="h-4 w-4" />
                Retries
              </div>
              <p className="text-lg font-semibold">{project.retryCount}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <MessageSquare className="h-4 w-4" />
                Messages
              </div>
              <p className="text-lg font-semibold">{messages.length}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                Created
              </div>
              <p className="text-sm font-semibold">{new Date(project.createdAt).toLocaleTimeString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Conversation / Logs */}
      <Tabs defaultValue="conversation">
        <TabsList className="w-full">
          <TabsTrigger value="conversation" className="flex-1">
            <MessageSquare className="h-4 w-4 mr-2" />
            Conversation
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex-1">
            <Activity className="h-4 w-4 mr-2" />
            Agent Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversation">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No messages yet. The agents will start communicating soon...
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const agent = agentConfig[msg.role] || agentConfig.system;
                      const Icon = agent.icon;

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex gap-3 p-3 rounded-lg ${agent.bgColor}`}
                        >
                          <div className={`mt-0.5 ${agent.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-medium text-sm ${agent.color}`}>{agent.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-2">
                  {logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No logs yet. Agent activity will appear here...
                    </div>
                  ) : (
                    logs.map((log) => {
                      const agent = agentConfig[log.agent] || agentConfig.system;
                      const Icon = agent.icon;

                      const statusColors: Record<string, string> = {
                        info: 'text-blue-500',
                        success: 'text-emerald-500',
                        error: 'text-red-500',
                        warning: 'text-amber-500',
                      };

                      return (
                        <div key={log.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                          <Icon className={`h-4 w-4 mt-0.5 ${agent.color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-xs font-medium ${agent.color}`}>{agent.name}</span>
                              <span className="text-xs text-muted-foreground">{log.action}</span>
                              <span className={`text-xs ${statusColors[log.status] || ''}`}>
                                {log.status === 'error' ? '✕' : log.status === 'success' ? '✓' : log.status === 'warning' ? '⚠' : '●'}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{log.content}</p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
