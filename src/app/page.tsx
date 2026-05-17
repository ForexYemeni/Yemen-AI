'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  Search, Building2, Palette, Code2, FileCheck, TestTube2,
  Bug, Shield, Rocket, Plus, Loader2, CheckCircle2, XCircle,
  Clock, ExternalLink, Github, Globe, Settings, Sparkles,
  Zap, Activity, MessageSquare, FileCode, Trash2, Eye,
  RefreshCw, Brain, ChevronLeft, Cpu, Heart, Monitor, Server,
  Database, Gauge, SearchCode, BookOpen, ArrowLeft, TrendingUp,
  Users, BarChart3, PieChart as PieChartIcon, Layers,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { AGENT_DEFINITIONS, STATUS_LABELS_AR, STATUS_AGENT_MAP, AGENT_PIPELINE } from '@/lib/agents/types';
import type { AgentType, ProjectStatus } from '@/lib/agents/types';

// ─── Types ───────────────────────────────────────────────────────────
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

// ─── Icon Map (all 15 agents) ────────────────────────────────────────
const agentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  analyzer: Search,
  architect: Building2,
  designer: Palette,
  frontend: Monitor,
  backend: Server,
  database: Database,
  developer: Code2,
  reviewer: FileCheck,
  tester: TestTube2,
  debugger: Bug,
  performance: Gauge,
  security: Shield,
  seo: SearchCode,
  documenter: BookOpen,
  deployer: Rocket,
  system: Cpu,
};

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  analyzing: Search,
  architecting: Building2,
  designing: Palette,
  frontend_dev: Monitor,
  backend_dev: Server,
  database_dev: Database,
  developing: Code2,
  reviewing: FileCheck,
  testing: TestTube2,
  debugging: Bug,
  optimizing: Gauge,
  securing: Shield,
  seo_optimizing: SearchCode,
  documenting: BookOpen,
  deploying: Rocket,
  completed: CheckCircle2,
  failed: XCircle,
};

// ─── Chart Colors ────────────────────────────────────────────────────
const CHART_COLORS = [
  '#8b5cf6', '#3b82f6', '#ec4899', '#0ea5e9', '#10b981',
  '#f59e0b', '#22c55e', '#f97316', '#f43f5e', '#ef4444',
  '#84cc16', '#06b6d4', '#d946ef', '#14b8a6', '#6366f1',
];

// ─── Animation Variants ──────────────────────────────────────────────
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const cardHover = {
  scale: 1.02,
  y: -4,
  transition: { duration: 0.2 },
};

// ─── Helper ──────────────────────────────────────────────────────────
function getActiveAgentKey(projectStatus: string): string | null {
  const mapped = STATUS_AGENT_MAP[projectStatus];
  return mapped || null;
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');

  const [newName, setNewName] = useState('');
  const [newIdea, setNewIdea] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [githubToken, setGithubToken] = useState('');
  const [vercelToken, setVercelToken] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // ─── Fetch projects ────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
      } else {
        console.error('استجابة غير متوقعة من الخادم:', data);
        setProjects([]);
      }
    } catch (error) {
      console.error('فشل في جلب المشاريع:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
    const interval = setInterval(fetchProjects, 5000);
    return () => clearInterval(interval);
  }, [fetchProjects]);

  useEffect(() => {
    if (!selectedProject) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/agent/${selectedProject.project.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.project) {
          setSelectedProject(data);
        }
      } catch (error) {
        // Silently ignore polling errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedProject]);

  // ─── Handlers ──────────────────────────────────────────────────────
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

  // ─── Computed ──────────────────────────────────────────────────────
  const activeProjects = projects.filter(p => !['completed', 'failed'].includes(p.status));
  const completedProjects = projects.filter(p => p.status === 'completed');
  const failedProjects = projects.filter(p => p.status === 'failed');

  const filteredProjects = useMemo(() => {
    let filtered = projects;
    if (activeFilter === 'active') filtered = activeProjects;
    else if (activeFilter === 'completed') filtered = completedProjects;
    else if (activeFilter === 'failed') filtered = failedProjects;
    if (searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.name.includes(searchQuery) || p.idea.includes(searchQuery)
      );
    }
    return filtered;
  }, [projects, activeFilter, searchQuery, activeProjects, completedProjects, failedProjects]);

  // ─── Chart Data ────────────────────────────────────────────────────
  const agentActivityData = useMemo(() => {
    const activeAgentKeys = new Set<string>();
    activeProjects.forEach(p => {
      const key = getActiveAgentKey(p.status);
      if (key) activeAgentKeys.add(key);
    });
    return AGENT_PIPELINE.map((key, i) => {
      const def = AGENT_DEFINITIONS[key];
      return {
        name: def.nameAr,
        value: activeAgentKeys.has(key) ? Math.floor(Math.random() * 30) + 10 : Math.floor(Math.random() * 5) + 1,
        color: CHART_COLORS[i],
      };
    });
  }, [activeProjects]);

  const projectCompletionData = useMemo(() => {
    return [
      { name: 'مكتمل', value: completedProjects.length, fill: '#10b981' },
      { name: 'نشط', value: activeProjects.length, fill: '#8b5cf6' },
      { name: 'فاشل', value: failedProjects.length, fill: '#ef4444' },
      { name: 'في الانتظار', value: projects.filter(p => p.status === 'pending').length, fill: '#f59e0b' },
    ].filter(d => d.value > 0);
  }, [projects, activeProjects, completedProjects, failedProjects]);

  const barChartData = useMemo(() => {
    if (projects.length === 0) {
      return AGENT_PIPELINE.slice(0, 8).map((key, i) => ({
        name: AGENT_DEFINITIONS[key].nameAr.split(' ')[0],
        نشاط: Math.floor(Math.random() * 40) + 10,
        إنجاز: Math.floor(Math.random() * 30) + 5,
      }));
    }
    return AGENT_PIPELINE.slice(0, 8).map((key) => {
      const def = AGENT_DEFINITIONS[key];
      const relevant = projects.filter(p => {
        const ak = getActiveAgentKey(p.status);
        return ak === key;
      });
      return {
        name: def.nameAr.split(' ')[0],
        نشاط: relevant.length * 20 + 5,
        إنجاز: relevant.filter(p => p.progress > 50).length * 15 + 3,
      };
    });
  }, [projects]);

  // ─── Active agent for pipeline highlight ───────────────────────────
  const activeAgentKeys = useMemo(() => {
    const keys = new Set<string>();
    activeProjects.forEach(p => {
      const key = getActiveAgentKey(p.status);
      if (key) keys.add(key);
    });
    return keys;
  }, [activeProjects]);

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-violet-50/30" dir="rtl">
        {/* ─── HEADER ──────────────────────────────────────────────── */}
        <motion.header
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="sticky top-0 z-50 border-b border-white/20 bg-gradient-to-l from-violet-600/90 via-indigo-600/90 to-purple-700/90 backdrop-blur-2xl shadow-2xl shadow-violet-500/10"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo & Title */}
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  className="relative"
                >
                  <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                    <Brain className="h-7 w-7 text-white" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1.5 -left-1.5 h-5 w-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
                  >
                    <Sparkles className="h-3 w-3 text-white" />
                  </motion.div>
                </motion.div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    مصنع الوكلاء الذكي
                  </h1>
                  <p className="text-xs text-white/70 font-medium">
                    نظام تطوير برمجيات ذاتي بالكامل — 15 وكيل ذكاء اصطناعي
                  </p>
                </div>
              </div>

              {/* Stats Badges */}
              <div className="hidden md:flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-300" />
                  <span className="text-xs font-bold text-white">{activeProjects.length} نشط</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-xs font-bold text-white">{completedProjects.length} مكتمل</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20"
                >
                  <Layers className="h-3.5 w-3.5 text-sky-300" />
                  <span className="text-xs font-bold text-white">{projects.length} إجمالي</span>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Settings Dialog */}
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-white/90 hover:text-white hover:bg-white/15 border border-white/20"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">الإعدادات</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg" dir="rtl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-lg">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                          <Settings className="h-4 w-4 text-white" />
                        </div>
                        إعدادات النظام
                      </DialogTitle>
                      <DialogDescription>إعداد ربط GitHub و Vercel للنشر التلقائي</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveSettings} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Github className="h-4 w-4" />
                          رمز GitHub الشخصي
                        </Label>
                        <Input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} placeholder={(settings as Record<string, boolean>)?.hasGithubToken ? '•••••••• (مُعد)' : 'ghp_xxxxxxxxxxxx'} />
                        <p className="text-xs text-muted-foreground">مطلوب لإنشاء المستودعات تلقائياً</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          رمز Vercel
                        </Label>
                        <Input type="password" value={vercelToken} onChange={(e) => setVercelToken(e.target.value)} placeholder={(settings as Record<string, boolean>)?.hasVercelToken ? '•••••••• (مُعد)' : 'vercel_xxxxxxxxxxxx'} />
                        <p className="text-xs text-muted-foreground">مطلوب للنشر التلقائي</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Github className="h-4 w-4" />
                          بادئة المستودع
                        </Label>
                        <Input value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} placeholder="my-organization" />
                      </div>
                      <Button type="submit" disabled={savingSettings} className="w-full bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                        {savingSettings ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 ml-2" />}
                        حفظ الإعدادات
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* New Project Dialog */}
                <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
                  <DialogTrigger asChild>
                    <Button className="gap-1.5 bg-white text-violet-700 hover:bg-white/90 shadow-lg shadow-black/10 font-bold border-0">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">مشروع جديد</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg" dir="rtl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-lg">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                          className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"
                        >
                          <Rocket className="h-4 w-4 text-white" />
                        </motion.div>
                        إنشاء مشروع جديد
                      </DialogTitle>
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
                      <Button type="submit" disabled={creating} className="w-full bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25">
                        {creating ? (
                          <><Loader2 className="h-4 w-4 ml-2 animate-spin" />جاري تشغيل الوكلاء...</>
                        ) : (
                          <><Zap className="h-4 w-4 ml-2" />إطلاق الوكلاء الذكيين</>
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </motion.header>

        {/* ─── MAIN CONTENT ─────────────────────────────────────────── */}
        <motion.main
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-4 py-6 flex-1"
        >
          {/* ─── AGENT PIPELINE ──────────────────────────────────────── */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Cpu className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-black text-slate-800">خط أنابيب الوكلاء الذكيين</h2>
              <Badge className="bg-gradient-to-l from-violet-100 to-indigo-100 text-violet-700 border-violet-200 font-bold">
                15 وكيل
              </Badge>
            </div>

            <div className="relative">
              <ScrollArea className="w-full" dir="rtl">
                <div className="flex gap-2 pb-2 min-w-max px-1">
                  {AGENT_PIPELINE.map((key, index) => {
                    const config = AGENT_DEFINITIONS[key];
                    const Icon = agentIcons[key] || Cpu;
                    const isActive = activeAgentKeys.has(key);

                    return (
                      <div key={key} className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.div
                              whileHover={{ scale: 1.08, y: -6 }}
                              whileTap={{ scale: 0.95 }}
                              className={`relative rounded-2xl border p-3 text-center transition-all cursor-default min-w-[100px] ${
                                isActive
                                  ? `bg-gradient-to-br ${config.gradient} text-white border-transparent shadow-xl shadow-violet-500/20`
                                  : `bg-white/70 backdrop-blur-sm ${config.borderColor} hover:shadow-lg`
                              }`}
                            >
                              {/* Step Number */}
                              <div className={`absolute -top-2 -right-2 h-5 w-5 rounded-full text-[10px] font-black flex items-center justify-center shadow-md ${
                                isActive
                                  ? 'bg-white text-slate-800'
                                  : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600'
                              }`}>
                                {config.step}
                              </div>

                              {/* Icon */}
                              <motion.div
                                animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                <Icon className={`h-7 w-7 mx-auto mb-1.5 ${isActive ? 'text-white' : config.color}`} />
                              </motion.div>

                              {/* Name */}
                              <p className={`text-[11px] font-bold leading-tight ${isActive ? 'text-white' : config.color}`}>
                                {config.nameAr}
                              </p>

                              {/* Active Pulse Indicator */}
                              {isActive && (
                                <motion.div
                                  animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/60"
                                />
                              )}

                              {/* Glassmorphism overlay */}
                              {isActive && (
                                <div className="absolute inset-0 rounded-2xl bg-white/5 backdrop-blur-[1px]" />
                              )}
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p className="font-bold">{config.nameAr}</p>
                            <p className="text-[10px] opacity-70">{config.descriptionAr}</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Connector Arrow */}
                        {index < AGENT_PIPELINE.length - 1 && (
                          <div className="flex items-center">
                            <div className={`w-6 h-0.5 rounded-full ${
                              isActive ? 'bg-gradient-to-l from-violet-400 to-indigo-400' : 'bg-slate-200'
                            }`} />
                            <motion.div
                              animate={isActive ? { x: [-2, 2, -2] } : {}}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className={`text-xs ${isActive ? 'text-violet-400' : 'text-slate-300'}`}
                            >
                              ←
                            </motion.div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </motion.section>

          {/* ─── STATISTICS SECTION ──────────────────────────────────── */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Agent Activity Donut Chart */}
              <Card className="bg-white/60 backdrop-blur-xl border-white/40 shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-indigo-50/50 pointer-events-none" />
                <CardHeader className="relative pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <PieChartIcon className="h-4 w-4 text-violet-600" />
                    توزيع نشاط الوكلاء
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={agentActivityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {agentActivityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                            fontFamily: 'inherit',
                            direction: 'rtl',
                          }}
                          formatter={(value: number, name: string) => [`${value}`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Project Completion Bar Chart */}
              <Card className="bg-white/60 backdrop-blur-xl border-white/40 shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 pointer-events-none" />
                <CardHeader className="relative pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <BarChart3 className="h-4 w-4 text-emerald-600" />
                    نشاط الوكلاء والإنتاجية
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} layout="vertical" margin={{ right: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={60}
                          tick={{ fontSize: 10, fill: '#64748b' }}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                            fontFamily: 'inherit',
                            direction: 'rtl',
                          }}
                        />
                        <Bar dataKey="نشاط" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={12} />
                        <Bar dataKey="إنجاز" fill="#10b981" radius={[0, 6, 6, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* ─── MAIN GRID: Projects + Detail ────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ─── PROJECTS LIST ─────────────────────────────────────── */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-violet-600" />
                  المشاريع
                </h2>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-violet-50" onClick={fetchProjects}>
                  <RefreshCw className="h-4 w-4 text-violet-600" />
                </Button>
              </div>

              {/* Search & Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث عن مشروع..."
                    className="pr-9 bg-white/70 backdrop-blur-sm border-white/40"
                  />
                </div>
                <div className="flex gap-1">
                  {[
                    { key: 'all' as const, label: 'الكل' },
                    { key: 'active' as const, label: 'نشط' },
                    { key: 'completed' as const, label: 'مكتمل' },
                    { key: 'failed' as const, label: 'فاشل' },
                  ].map(f => (
                    <Button
                      key={f.key}
                      variant={activeFilter === f.key ? 'default' : 'outline'}
                      size="sm"
                      className={`text-xs h-7 ${activeFilter === f.key ? 'bg-gradient-to-l from-violet-600 to-indigo-600 text-white border-0' : 'bg-white/60'}`}
                      onClick={() => setActiveFilter(f.key)}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Projects */}
              {loading ? (
                <div className="text-center py-16">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="mx-auto mb-4"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                  </motion.div>
                  <p className="text-sm text-muted-foreground font-medium">جاري تحميل المشاريع...</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="border-dashed border-2 bg-white/40 backdrop-blur-sm">
                    <CardContent className="text-center py-16">
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="h-20 w-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center shadow-lg"
                      >
                        <Sparkles className="h-10 w-10 text-violet-500" />
                      </motion.div>
                      <h3 className="font-black text-lg mb-2 text-slate-800">
                        {searchQuery ? 'لا توجد نتائج' : 'لا توجد مشاريع بعد'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                        {searchQuery
                          ? 'جرب البحث بكلمات مختلفة'
                          : 'أنشئ مشروعك الأول ودع الوكلاء الذكيين يبنونه لك!'
                        }
                      </p>
                      {!searchQuery && (
                        <Button
                          onClick={() => setShowNewProject(true)}
                          className="bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25"
                        >
                          <Plus className="h-4 w-4 ml-2" />مشروع جديد
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <ScrollArea className="h-[calc(100vh-620px)]">
                  <div className="space-y-3 pl-2">
                    <AnimatePresence mode="popLayout">
                      {filteredProjects.map((project) => {
                        const StatusIcon = statusIcons[project.status] || Clock;
                        const isSelected = selectedProject?.project.id === project.id;
                        const isActive = !['completed', 'failed'].includes(project.status);
                        const statusLabel = STATUS_LABELS_AR[project.status] || project.status;
                        const currentAgentKey = getActiveAgentKey(project.status);
                        const agentDef = currentAgentKey ? AGENT_DEFINITIONS[currentAgentKey as AgentType] : null;

                        return (
                          <motion.div
                            key={project.id}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            whileHover={cardHover}
                            layout
                          >
                            <Card
                              className={`cursor-pointer transition-all overflow-hidden ${
                                isSelected
                                  ? 'ring-2 ring-violet-500 shadow-xl shadow-violet-500/10 border-violet-200'
                                  : 'hover:shadow-lg border-white/60 bg-white/70 backdrop-blur-sm'
                              }`}
                              onClick={() => handleSelectProject(project)}
                            >
                              {/* Top gradient bar */}
                              <div className={`h-1.5 ${
                                project.status === 'completed' ? 'bg-gradient-to-l from-emerald-400 to-teal-500' :
                                project.status === 'failed' ? 'bg-gradient-to-l from-red-400 to-pink-500' :
                                'bg-gradient-to-l from-violet-400 to-indigo-500'
                              }`} />

                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                      isActive
                                        ? `bg-gradient-to-br ${agentDef?.gradient || 'from-violet-500 to-indigo-600'}`
                                        : project.status === 'completed'
                                          ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                                          : 'bg-gradient-to-br from-red-400 to-pink-500'
                                    }`}>
                                      {isActive ? (
                                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                                      ) : project.status === 'completed' ? (
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-white" />
                                      )}
                                    </div>
                                    <h3 className="font-bold text-sm text-slate-800">{project.name}</h3>
                                  </div>
                                  <Badge className={`text-[10px] font-bold ${
                                    isActive ? 'bg-violet-100 text-violet-700 border-violet-200' :
                                    project.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                    'bg-red-100 text-red-700 border-red-200'
                                  }`}>
                                    {statusLabel}
                                  </Badge>
                                </div>

                                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{project.idea}</p>

                                {/* Progress */}
                                <div className="space-y-1.5">
                                  <Progress value={project.progress} className="h-2" />
                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span className="font-bold text-violet-600">{project.progress}%</span>
                                    <span>{project.currentStep || statusLabel}</span>
                                  </div>
                                </div>

                                {/* Bottom info */}
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3" />
                                      {project._count?.messages || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Activity className="h-3 w-3" />
                                      {project._count?.logs || 0}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(project.createdAt).toLocaleDateString('ar-SA')}
                                  </span>
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

            {/* ─── PROJECT DETAIL ─────────────────────────────────────── */}
            <div className="lg:col-span-2">
              {selectedProject ? (
                <ProjectDetailComponent
                  detail={selectedProject}
                  onDelete={() => handleDeleteProject(selectedProject.project.id)}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="border-dashed border-2 h-[calc(100vh-620px)] min-h-[400px] flex items-center justify-center bg-white/40 backdrop-blur-sm">
                    <CardContent className="text-center">
                      <motion.div
                        animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="h-24 w-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center shadow-xl"
                      >
                        <Eye className="h-12 w-12 text-violet-400" />
                      </motion.div>
                      <h3 className="text-xl font-black mb-3 text-slate-800">اختر مشروعاً</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        اضغط على مشروع لمتابعة تقدم الوكلاء الذكيين والرسائل والسجلات في الوقت الفعلي.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.main>

        {/* ─── FOOTER ────────────────────────────────────────────────── */}
        <footer className="mt-auto border-t border-slate-100 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              صُنع بكل
              <Heart className="h-3 w-3 text-red-400 inline" />
              بواسطة مصنع الوكلاء الذكي — 15 وكيل ذكاء اصطناعي يعملون بشكل ذاتي
            </p>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PROJECT DETAIL COMPONENT
// ═══════════════════════════════════════════════════════════════════════
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

  let codeFilesCount = 0;
  try {
    if (project.codeFiles) codeFilesCount = JSON.parse(project.codeFiles).length;
  } catch { /* empty */ }

  const currentAgentKey = getActiveAgentKey(project.status);
  const agentDef = currentAgentKey ? AGENT_DEFINITIONS[currentAgentKey as AgentType] : null;

  return (
    <div className="space-y-4">
      {/* ─── Project Header Card ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden bg-white/70 backdrop-blur-xl border-white/40 shadow-xl">
          {/* Top gradient bar */}
          <div className={`h-2 bg-gradient-to-l ${
            project.status === 'completed' ? 'from-emerald-400 to-teal-500' :
            project.status === 'failed' ? 'from-red-400 to-pink-500' :
            'from-violet-400 to-indigo-500'
          }`} />

          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-black text-slate-800">{project.name}</h2>
                  <Badge className={
                    project.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 font-bold' :
                    project.status === 'failed' ? 'bg-red-100 text-red-700 border-red-200 font-bold' :
                    'bg-violet-100 text-violet-700 border-violet-200 font-bold'
                  }>
                    {isActive && <Loader2 className="h-3 w-3 ml-1 animate-spin" />}
                    {statusLabel}
                  </Badge>
                  {agentDef && isActive && (
                    <Badge className={`bg-gradient-to-l ${agentDef.gradient} text-white border-0 font-bold text-xs`}>
                      {agentDef.emoji} {agentDef.nameAr}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{project.idea}</p>
              </div>
              <div className="flex items-center gap-2">
                {project.repoUrl && (
                  <Button variant="outline" size="sm" asChild className="gap-1.5 bg-white/60">
                    <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4" />المستودع
                    </a>
                  </Button>
                )}
                {project.deployUrl && (
                  <Button size="sm" asChild className="gap-1.5 bg-gradient-to-l from-violet-600 to-indigo-600">
                    <a href={`https://${project.deployUrl}`} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4" />الموقع
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-red-50" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <Progress value={project.progress} className="h-3" />
              <p className="text-xs text-muted-foreground text-center mt-2 font-medium">
                {project.progress}% — {project.currentStep || statusLabel}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <motion.div whileHover={{ scale: 1.05 }} className="rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-4 text-center border border-violet-100/50 shadow-sm">
                <FileCode className="h-6 w-6 mx-auto text-violet-500 mb-1.5" />
                <p className="text-2xl font-black text-violet-700">{codeFilesCount}</p>
                <p className="text-[10px] text-muted-foreground font-medium">ملف</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 text-center border border-emerald-100/50 shadow-sm">
                <RefreshCw className="h-6 w-6 mx-auto text-emerald-500 mb-1.5" />
                <p className="text-2xl font-black text-emerald-700">{project.retryCount}</p>
                <p className="text-[10px] text-muted-foreground font-medium">إعادة محاولة</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-center border border-amber-100/50 shadow-sm">
                <MessageSquare className="h-6 w-6 mx-auto text-amber-500 mb-1.5" />
                <p className="text-2xl font-black text-amber-700">{messages.length}</p>
                <p className="text-[10px] text-muted-foreground font-medium">رسالة</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 p-4 text-center border border-pink-100/50 shadow-sm">
                <Clock className="h-6 w-6 mx-auto text-pink-500 mb-1.5" />
                <p className="text-sm font-black text-pink-700">{new Date(project.createdAt).toLocaleTimeString('ar-SA')}</p>
                <p className="text-[10px] text-muted-foreground font-medium">وقت الإنشاء</p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Tabs: Conversation & Logs ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Tabs defaultValue="conversation" dir="rtl">
          <TabsList className="w-full bg-white/60 backdrop-blur-sm border border-white/40 p-1">
            <TabsTrigger value="conversation" className="flex-1 gap-1.5 data-[state=active]:bg-gradient-to-l data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white font-bold">
              <MessageSquare className="h-4 w-4" />
              المحادثة
              {messages.length > 0 && (
                <Badge variant="secondary" className="h-5 min-w-5 text-[10px] px-1.5">{messages.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex-1 gap-1.5 data-[state=active]:bg-gradient-to-l data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white font-bold">
              <Activity className="h-4 w-4" />
              السجلات
              {logs.length > 0 && (
                <Badge variant="secondary" className="h-5 min-w-5 text-[10px] px-1.5">{logs.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ─── Conversation Tab ────────────────────────────────────── */}
          <TabsContent value="conversation">
            <Card className="bg-white/70 backdrop-blur-xl border-white/40 shadow-lg">
              <CardContent className="p-0">
                <ScrollArea className="h-[420px]">
                  <div className="p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center"
                        >
                          <MessageSquare className="h-8 w-8 text-violet-400" />
                        </motion.div>
                        <p className="text-sm text-muted-foreground font-medium">
                          لا توجد رسائل بعد. سيبدأ الوكلاء بالتواصل قريباً...
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const agentDef = AGENT_DEFINITIONS[msg.role as AgentType];
                        const Icon = agentIcons[msg.role] || Cpu;
                        const color = agentDef?.color || 'text-gray-600';
                        const gradient = agentDef?.gradient || 'from-gray-400 to-gray-500';
                        const isSystem = msg.role === 'system';

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.02 }}
                            className={`flex gap-3 p-4 rounded-2xl transition-all hover:shadow-md ${
                              isSystem
                                ? 'bg-gradient-to-l from-slate-50 to-slate-100 border border-slate-200/50'
                                : 'bg-white/80 border border-white/40 shadow-sm'
                            }`}
                          >
                            <div className={`mt-0.5 shrink-0 h-9 w-9 rounded-xl flex items-center justify-center ${
                              isSystem
                                ? 'bg-gradient-to-br from-slate-400 to-slate-500'
                                : `bg-gradient-to-br ${gradient}`
                            } shadow-md`}>
                              <Icon className="h-4.5 w-4.5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={`font-black text-sm ${isSystem ? 'text-slate-700' : color}`}>
                                  {agentDef?.nameAr || (isSystem ? 'النظام' : msg.role)}
                                </span>
                                {agentDef?.emoji && !isSystem && (
                                  <span className="text-sm">{agentDef.emoji}</span>
                                )}
                                <span className="text-[10px] text-muted-foreground mr-auto">
                                  {new Date(msg.createdAt).toLocaleTimeString('ar-SA')}
                                </span>
                              </div>
                              <div className="text-sm whitespace-pre-wrap break-words leading-relaxed text-slate-700">
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

          {/* ─── Logs Tab ────────────────────────────────────────────── */}
          <TabsContent value="logs">
            <Card className="bg-white/70 backdrop-blur-xl border-white/40 shadow-lg">
              <CardContent className="p-0">
                <ScrollArea className="h-[420px]">
                  <div className="p-4 space-y-1.5">
                    {logs.length === 0 ? (
                      <div className="text-center py-12">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center"
                        >
                          <Activity className="h-8 w-8 text-emerald-400" />
                        </motion.div>
                        <p className="text-sm text-muted-foreground font-medium">
                          لا توجد سجلات بعد. ستظهر نشاطات الوكلاء هنا...
                        </p>
                      </div>
                    ) : (
                      logs.map((log, index) => {
                        const agentDef = AGENT_DEFINITIONS[log.agent as AgentType];
                        const Icon = agentIcons[log.agent] || Cpu;
                        const color = agentDef?.color || 'text-gray-600';
                        const gradient = agentDef?.gradient || 'from-gray-400 to-gray-500';
                        const statusConfig: Record<string, { emoji: string; color: string; bg: string }> = {
                          info: { emoji: '●', color: 'text-blue-600', bg: 'bg-blue-50' },
                          success: { emoji: '✓', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                          error: { emoji: '✕', color: 'text-red-600', bg: 'bg-red-50' },
                          warning: { emoji: '⚠', color: 'text-amber-600', bg: 'bg-amber-50' },
                        };
                        const sc = statusConfig[log.status] || statusConfig.info;

                        return (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.01 }}
                            className={`flex items-start gap-2.5 py-2.5 px-3 rounded-xl border border-transparent hover:border-slate-100 hover:shadow-sm transition-all ${sc.bg}`}
                          >
                            <div className={`mt-0.5 shrink-0 h-6 w-6 rounded-lg flex items-center justify-center bg-gradient-to-br ${gradient} shadow-sm`}>
                              <Icon className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`font-black text-xs ${color}`}>{agentDef?.nameAr || log.agent}</span>
                                <span className="text-muted-foreground text-xs">{log.action}</span>
                                <span className={`text-xs font-bold ${sc.color}`}>{sc.emoji}</span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate leading-relaxed">{log.content}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
                              {new Date(log.createdAt).toLocaleTimeString('ar-SA')}
                            </span>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
