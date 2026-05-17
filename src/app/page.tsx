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
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import {
  Search, Building2, Palette, Code2, FileCheck, TestTube2,
  Bug, Shield, Rocket, Plus, Loader2, CheckCircle2, XCircle,
  Clock, ExternalLink, Github, Globe, Settings, Sparkles,
  Zap, Activity, MessageSquare, FileCode, Trash2, Eye,
  RefreshCw, Brain, ChevronLeft, Cpu, Heart,
} from 'lucide-react';
import { AGENT_DEFINITIONS, STATUS_LABELS_AR } from '@/lib/agents/types';
import type { AgentType, ProjectStatus } from '@/lib/agents/types';

// Types
interface Project {
  id: string;
  name: string;
  description: string;
  idea: string;
  status: string;
  progress: number;
  currentStep?: string;
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
  project: Project & { plan?: string; codeFiles?: string };
  logs: AgentLog[];
  messages: AgentMessage[];
}

// Map agent types to icons
const agentIcons: Record<string, any> = {
  analyzer: Search,
  architect: Building2,
  designer: Palette,
  developer: Code2,
  reviewer: FileCheck,
  tester: TestTube2,
  debugger: Bug,
  security: Shield,
  deployer: Rocket,
  system: Cpu,
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  analyzing: Search,
  architecting: Building2,
  designing: Palette,
  developing: Code2,
  reviewing: FileCheck,
  testing: TestTube2,
  debugging: Bug,
  securing: Shield,
  deploying: Rocket,
  completed: CheckCircle2,
  failed: XCircle,
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  const [newName, setNewName] = useState('');
  const [newIdea, setNewIdea] = useState('');
  const [newDescription, setNewDescription] = useState('');

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
      console.error('فشل في جلب المشاريع:', error);
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
      console.error('فشل في جلب الإعدادات:', error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchSettings();
  }, [fetchProjects, fetchSettings]);

  useEffect(() => {
    const interval = setInterval(fetchProjects, 3000);
    return () => clearInterval(interval);
  }, [fetchProjects]);

  useEffect(() => {
    if (!selectedProject) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/agent/${selectedProject.project.id}`);
        const data = await res.json();
        setSelectedProject(data);
      } catch (error) {
        console.error('فشل في تحديث المشروع:', error);
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
        body: JSON.stringify({ name: newName, idea: newIdea, description: newDescription || newName }),
      });
      if (res.ok) {
        setNewName('');
        setNewIdea('');
        setNewDescription('');
        setShowNewProject(false);
        fetchProjects();
      }
    } catch (error) {
      console.error('فشل في إنشاء المشروع:', error);
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
      console.error('فشل في جلب تفاصيل المشروع:', error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (selectedProject?.project.id === id) setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      console.error('فشل في حذف المشروع:', error);
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
      console.error('فشل في حفظ الإعدادات:', error);
    } finally {
      setSavingSettings(false);
    }
  };

  const activeProjects = projects.filter(p => !['completed', 'failed'].includes(p.status));
  const completedProjects = projects.filter(p => p.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30" dir="rtl">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-l from-violet-700 to-indigo-600 bg-clip-text text-transparent">
                  مصنع الوكلاء الذكي
                </h1>
                <p className="text-xs text-muted-foreground">نظام تطوير برمجيات ذاتي بالكامل</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
                <Activity className="h-3.5 w-3.5" />
                <span>{activeProjects.length} نشط</span>
                <span className="text-border">|</span>
                <span>{completedProjects.length} مكتمل</span>
              </div>
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">الإعدادات</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>⚙️ إعدادات النظام</DialogTitle>
                    <DialogDescription>إعداد ربط GitHub و Vercel للنشر التلقائي</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveSettings} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>رمز GitHub الشخصي</Label>
                      <Input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} placeholder={settings?.hasGithubToken ? '•••••••• (مُعد)' : 'ghp_xxxxxxxxxxxx'} />
                      <p className="text-xs text-muted-foreground">مطلوب لإنشاء المستودعات تلقائياً</p>
                    </div>
                    <div className="space-y-2">
                      <Label>رمز Vercel</Label>
                      <Input type="password" value={vercelToken} onChange={(e) => setVercelToken(e.target.value)} placeholder={settings?.hasVercelToken ? '•••••••• (مُعد)' : 'vercel_xxxxxxxxxxxx'} />
                      <p className="text-xs text-muted-foreground">مطلوب للنشر التلقائي</p>
                    </div>
                    <div className="space-y-2">
                      <Label>بادئة المستودع</Label>
                      <Input value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} placeholder="my-organization" />
                    </div>
                    <Button type="submit" disabled={savingSettings} className="w-full">
                      {savingSettings ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                      حفظ الإعدادات
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
                <DialogTrigger asChild>
                  <Button className="gap-1.5 bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">مشروع جديد</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>🚀 إنشاء مشروع جديد</DialogTitle>
                    <DialogDescription>صِف فكرتك وسيعمل نظام الوكلاء الذكي على بنائها بشكل ذاتي</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>اسم المشروع</Label>
                      <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="تطبيق المهام" required />
                    </div>
                    <div className="space-y-2">
                      <Label>الفكرة</Label>
                      <Textarea value={newIdea} onChange={(e) => setNewIdea(e.target.value)} placeholder="صِف ما تريد بناءه بالتفصيل. كلما كان الوصف أدق، كان البناء أفضل..." rows={4} required />
                    </div>
                    <div className="space-y-2">
                      <Label>وصف مختصر (اختياري)</Label>
                      <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="وصف مختصر للمشروع" />
                    </div>
                    <Button type="submit" disabled={creating} className="w-full bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                      {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />جاري تشغيل الوكلاء...</> : <><Zap className="h-4 w-4 mr-2" />إطلاق الوكلاء الذكيين</>}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Agent Pipeline */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-5 w-5 text-violet-600" />
            <h2 className="text-lg font-bold">خط أنابيب الوكلاء الذكيين</h2>
            <Badge variant="secondary" className="mr-2">9 وكلاء</Badge>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {(Object.entries(AGENT_DEFINITIONS) as [AgentType, any][]).map(([key, config], index) => {
              const Icon = agentIcons[key] || Cpu;
              const isActive = activeProjects.some(p => {
                const statusMap: Record<string, string> = {
                  analyzing: 'analyzer', architecting: 'architect', designing: 'designer',
                  developing: 'developer', reviewing: 'reviewer', testing: 'tester',
                  debugging: 'debugger', securing: 'security', deploying: 'deployer',
                };
                return statusMap[p.status] === key;
              });
              return (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className={`relative rounded-xl border p-3 text-center transition-all cursor-default ${
                    isActive ? `border-violet-300 bg-gradient-to-br ${config.gradient} text-white shadow-lg` : `${config.bgColor} ${config.borderColor}`
                  }`}
                >
                  <Icon className={`h-6 w-6 mx-auto mb-1 ${isActive ? 'text-white' : config.color}`} />
                  <p className={`text-xs font-bold ${isActive ? 'text-white' : config.color}`}>{config.nameAr}</p>
                  <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center text-slate-600">
                    {index + 1}
                  </div>
                  {isActive && (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-lg"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">المشاريع</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchProjects}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-violet-500" />
                <p className="mt-2 text-sm text-muted-foreground">جاري تحميل المشاريع...</p>
              </div>
            ) : projects.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="text-center py-12">
                  <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-violet-500" />
                  </div>
                  <h3 className="font-bold mb-1">لا توجد مشاريع بعد</h3>
                  <p className="text-sm text-muted-foreground mb-4">أنشئ مشروعك الأول ودع الوكلاء الذكيين يبنونه لك!</p>
                  <Button onClick={() => setShowNewProject(true)} className="bg-gradient-to-l from-violet-600 to-indigo-600">
                    <Plus className="h-4 w-4 mr-2" />مشروع جديد
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-380px)]">
                <div className="space-y-3 pl-2">
                  <AnimatePresence>
                    {projects.map((project) => {
                      const StatusIcon = statusIcons[project.status] || Clock;
                      const isSelected = selectedProject?.project.id === project.id;
                      const isActive = !['completed', 'failed'].includes(project.status);
                      const statusLabel = STATUS_LABELS_AR[project.status] || project.status;

                      return (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              isSelected ? 'ring-2 ring-violet-500 shadow-md' : ''
                            }`}
                            onClick={() => handleSelectProject(project)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {isActive ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                                  ) : project.status === 'completed' ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <h3 className="font-bold text-sm">{project.name}</h3>
                                </div>
                                <Badge variant="secondary" className="text-[10px]">
                                  {statusLabel}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.idea}</p>
                              <Progress value={project.progress} className="h-1.5 mb-2" />
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span>{project.progress}% — {project.currentStep || statusLabel}</span>
                                <span>{new Date(project.createdAt).toLocaleDateString('ar')}</span>
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
              <ProjectDetailComponent
                detail={selectedProject}
                onDelete={() => handleDeleteProject(selectedProject.project.id)}
              />
            ) : (
              <Card className="border-dashed h-[calc(100vh-380px)] flex items-center justify-center">
                <CardContent className="text-center">
                  <div className="h-20 w-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                    <Eye className="h-10 w-10 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">اختر مشروعاً</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">اضغط على مشروع لمتابعة تقدم الوكلاء الذكيين والرسائل والسجلات في الوقت الفعلي.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-muted-foreground py-4 border-t">
          <p className="flex items-center justify-center gap-1">
            صُنع بكل <Heart className="h-3 w-3 text-red-400 inline" /> بواسطة مصنع الوكلاء الذكي — 9 وكلاء ذكاء اصطناعي يعملون بشكل ذاتي
          </p>
        </footer>
      </main>
    </div>
  );
}

function ProjectDetailComponent({
  detail,
  onDelete,
}: {
  detail: ProjectDetail;
  onDelete: () => void;
}) {
  const { project, logs, messages } = detail;
  const isActive = !['completed', 'failed'].includes(project.status);
  const statusLabel = STATUS_LABELS_AR[project.status] || project.status;
  const StatusIcon = statusIcons[project.status] || Clock;

  let codeFilesCount = 0;
  try {
    if (project.codeFiles) codeFilesCount = JSON.parse(project.codeFiles).length;
  } catch {}

  return (
    <div className="space-y-4">
      {/* Project Header */}
      <Card className="overflow-hidden">
        <div className={`h-2 bg-gradient-to-l ${
          project.status === 'completed' ? 'from-emerald-400 to-teal-500' :
          project.status === 'failed' ? 'from-red-400 to-pink-500' :
          'from-violet-400 to-indigo-500'
        }`} />
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold">{project.name}</h2>
                <Badge className={
                  project.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                  project.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-violet-100 text-violet-700'
                }>
                  {isActive && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  {statusLabel}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl">{project.idea}</p>
            </div>
            <div className="flex items-center gap-2">
              {project.repoUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4 mr-1" />المستودع
                  </a>
                </Button>
              )}
              {project.deployUrl && (
                <Button size="sm" className="bg-gradient-to-l from-violet-600 to-indigo-600" asChild>
                  <a href={`https://${project.deployUrl}`} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-1" />الموقع
                  </a>
                </Button>
              )}
              <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Progress value={project.progress} className="h-2 mb-3" />
          <p className="text-xs text-muted-foreground text-center mb-4">{project.progress}% — {project.currentStep || statusLabel}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 p-3 text-center">
              <FileCode className="h-5 w-5 mx-auto text-violet-500 mb-1" />
              <p className="text-lg font-bold">{codeFilesCount}</p>
              <p className="text-[10px] text-muted-foreground">ملف</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-3 text-center">
              <Activity className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
              <p className="text-lg font-bold">{project.retryCount}</p>
              <p className="text-[10px] text-muted-foreground">إعادة محاولة</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-3 text-center">
              <MessageSquare className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold">{messages.length}</p>
              <p className="text-[10px] text-muted-foreground">رسالة</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 p-3 text-center">
              <Clock className="h-5 w-5 mx-auto text-pink-500 mb-1" />
              <p className="text-sm font-bold">{new Date(project.createdAt).toLocaleTimeString('ar')}</p>
              <p className="text-[10px] text-muted-foreground">وقت الإنشاء</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="conversation">
        <TabsList className="w-full">
          <TabsTrigger value="conversation" className="flex-1 gap-1.5">
            <MessageSquare className="h-4 w-4" />المحادثة
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex-1 gap-1.5">
            <Activity className="h-4 w-4" />السجلات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversation">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      لا توجد رسائل بعد. سيبدأ الوكلاء بالتواصل قريباً...
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const agentDef = AGENT_DEFINITIONS[msg.role as AgentType];
                      const Icon = agentIcons[msg.role] || Cpu;
                      const color = agentDef?.color || 'text-gray-600';
                      const bgColor = agentDef?.bgColor || 'bg-gray-50';

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-3 p-3 rounded-xl ${bgColor}`}
                        >
                          <div className={`mt-0.5 shrink-0 ${color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-bold text-sm ${color}`}>
                                {agentDef?.nameAr || msg.role === 'system' ? 'النظام' : msg.role}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(msg.createdAt).toLocaleTimeString('ar')}
                              </span>
                            </div>
                            <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
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
                <div className="p-4 space-y-1">
                  {logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      لا توجد سجلات بعد. ستظهر نشاطات الوكلاء هنا...
                    </div>
                  ) : (
                    logs.map((log) => {
                      const agentDef = AGENT_DEFINITIONS[log.agent as AgentType];
                      const Icon = agentIcons[log.agent] || Cpu;
                      const color = agentDef?.color || 'text-gray-600';
                      const statusEmoji: Record<string, string> = { info: '●', success: '✓', error: '✕', warning: '⚠' };
                      const statusColor: Record<string, string> = { info: 'text-blue-500', success: 'text-emerald-500', error: 'text-red-500', warning: 'text-amber-500' };

                      return (
                        <div key={log.id} className="flex items-start gap-2 py-2 border-b last:border-0 text-xs">
                          <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className={`font-bold ${color}`}>{agentDef?.nameAr || log.agent}</span>
                              <span className="text-muted-foreground">{log.action}</span>
                              <span className={statusColor[log.status] || ''}>{statusEmoji[log.status] || '●'}</span>
                            </div>
                            <p className="text-muted-foreground truncate">{log.content}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(log.createdAt).toLocaleTimeString('ar')}
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
