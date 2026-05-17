'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Palette, Monitor, Server, Database, Bell, ShieldCheck, Rocket,
  Plus, Search, Settings, Trash2, Play, RefreshCw, X, CheckCircle2,
  AlertCircle, Clock, Loader2, FileCode, MessageSquare, BarChart3,
  ChevronLeft, Eye, Zap, FolderOpen, Shield, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// ============================================================
// Types
// ============================================================
type AgentType = 'project_manager' | 'ui_ux' | 'frontend' | 'backend' | 'db_guidance' | 'notifications' | 'qa_debug' | 'devops';
type ProjectStatus = 'pending' | 'analyzing' | 'planning' | 'designing' | 'frontend_dev' | 'backend_dev' | 'db_setup' | 'notifications_setup' | 'testing' | 'debugging' | 'pending_approval' | 'deploying' | 'completed' | 'failed';

interface Project {
  id: string;
  name: string;
  description: string;
  idea: string;
  status: ProjectStatus;
  progress: number;
  currentStep: string;
  repoUrl?: string;
  deployUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface AgentLog {
  id: string;
  projectId: string;
  agent: AgentType;
  action: string;
  content: string;
  status: 'running' | 'success' | 'error' | 'warning';
  timestamp: string;
}

interface AgentMessage {
  id: string;
  projectId: string;
  role: string;
  content: string;
  agent?: AgentType;
  timestamp: string;
}

interface CodeFile {
  path: string;
  content: string;
  language: string;
}

// ============================================================
// Agent Definitions
// ============================================================
const AGENTS = [
  { type: 'project_manager' as AgentType, nameAr: 'مدير المشروع', desc: 'يحلل ويقسم المهام', icon: Brain, color: 'text-violet-600', gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-500', step: 1 },
  { type: 'ui_ux' as AgentType, nameAr: 'مصمم الواجهات', desc: 'يصمم الواجهات', icon: Palette, color: 'text-pink-600', gradient: 'from-pink-500 to-rose-600', bg: 'bg-pink-500', step: 2 },
  { type: 'frontend' as AgentType, nameAr: 'مطور الواجهة', desc: 'يبني React/Next.js', icon: Monitor, color: 'text-sky-600', gradient: 'from-sky-500 to-blue-600', bg: 'bg-sky-500', step: 3 },
  { type: 'backend' as AgentType, nameAr: 'مطور الخلفية', desc: 'يبني APIs', icon: Server, color: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500', step: 4 },
  { type: 'db_guidance' as AgentType, nameAr: 'مستشار البيانات', desc: 'يقترح MongoDB', icon: Database, color: 'text-amber-600', gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-500', step: 5 },
  { type: 'notifications' as AgentType, nameAr: 'مهندس الإشعارات', desc: 'Push + FCM', icon: Bell, color: 'text-rose-600', gradient: 'from-rose-500 to-pink-600', bg: 'bg-rose-500', step: 6 },
  { type: 'qa_debug' as AgentType, nameAr: 'ضمان الجودة', desc: 'يكتشف الأخطاء', icon: ShieldCheck, color: 'text-red-600', gradient: 'from-red-500 to-orange-600', bg: 'bg-red-500', step: 7 },
  { type: 'devops' as AgentType, nameAr: 'مهندس العمليات', desc: 'GitHub + Vercel', icon: Rocket, color: 'text-indigo-600', gradient: 'from-indigo-500 to-violet-600', bg: 'bg-indigo-500', step: 8 },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'في الانتظار',
  analyzing: 'جاري التحليل',
  planning: 'جاري التخطيط',
  designing: 'جاري التصميم',
  frontend_dev: 'تطوير الواجهة',
  backend_dev: 'تطوير الخلفية',
  db_setup: 'إعداد قاعدة البيانات',
  notifications_setup: 'إعداد الإشعارات',
  testing: 'جاري الاختبار',
  debugging: 'إصلاح الأخطاء',
  pending_approval: 'بانتظار الموافقة',
  deploying: 'جاري النشر',
  completed: 'مكتمل',
  failed: 'فشل',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700 border-gray-200',
  analyzing: 'bg-violet-50 text-violet-700 border-violet-200',
  planning: 'bg-purple-50 text-purple-700 border-purple-200',
  designing: 'bg-pink-50 text-pink-700 border-pink-200',
  frontend_dev: 'bg-sky-50 text-sky-700 border-sky-200',
  backend_dev: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  db_setup: 'bg-amber-50 text-amber-700 border-amber-200',
  notifications_setup: 'bg-rose-50 text-rose-700 border-rose-200',
  testing: 'bg-orange-50 text-orange-700 border-orange-200',
  debugging: 'bg-red-50 text-red-700 border-red-200',
  pending_approval: 'bg-yellow-50 text-yellow-800 border-yellow-300',
  deploying: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-800 border-red-200',
};

// ============================================================
// Main Component
// ============================================================
export default function AgentFactoryDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetail, setProjectDetail] = useState<Record<string, unknown> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', idea: '' });
  const [settings, setSettings] = useState({ githubToken: '', vercelToken: '', githubRepo: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [activeAgents, setActiveAgents] = useState<Set<AgentType>>(new Set());
  const [isApproving, setIsApproving] = useState(false);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch {}
  }, []);

  // Fetch project detail
  const fetchProjectDetail = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}`);
      const data = await res.json();
      if (data.project) {
        setProjectDetail(data);
        // Detect active agents from logs
        const logs = (data.logs ?? []) as AgentLog[];
        const running = new Set<AgentType>();
        const recentLogs = logs.filter((l: AgentLog) => l.status === 'running' || (Date.now() - new Date(l.timestamp).getTime() < 60000 && l.status === 'success'));
        recentLogs.forEach((l: AgentLog) => running.add(l.agent));
        setActiveAgents(running);
      }
    } catch {}
  }, [selectedProjectId]);

  // Polling
  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 5000);
    return () => clearInterval(interval);
  }, [fetchProjects]);

  useEffect(() => {
    fetchProjectDetail();
    if (!selectedProjectId) return;
    const interval = setInterval(fetchProjectDetail, 3000);
    return () => clearInterval(interval);
  }, [fetchProjectDetail, selectedProjectId]);

  // Fetch settings
  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      setSettings({
        githubToken: '',
        vercelToken: '',
        githubRepo: data.githubRepo ?? '',
      });
    }).catch(() => {});
  }, []);

  // Create project
  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.idea) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      const data = await res.json();
      if (data.success) {
        setNewProject({ name: '', idea: '' });
        setShowNewProject(false);
        fetchProjects();
        // Auto-start execution
        await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: data.project.id, mode: 'new' }),
        });
        fetchProjects();
      }
    } catch {}
    setIsCreating(false);
  };

  // Execute project
  const handleExecute = async (projectId: string) => {
    await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, mode: 'new' }),
    });
    fetchProjects();
  };

  // Delete project
  const handleDelete = async (projectId: string) => {
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
    if (selectedProjectId === projectId) setSelectedProjectId(null);
    fetchProjects();
  };

  // Save settings
  const handleSaveSettings = async () => {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setShowSettings(false);
  };

  // Approve project — user explicitly approves design/code before deployment
  const handleApprove = async (projectId: string) => {
    setIsApproving(true);
    try {
      await fetch(`/api/projects/${projectId}/approve`, { method: 'POST' });
      fetchProjects();
      fetchProjectDetail();
    } catch {}
    setIsApproving(false);
  };

  // Reject project — user rejects, nothing gets uploaded
  const handleReject = async (projectId: string) => {
    setIsApproving(true);
    try {
      await fetch(`/api/projects/${projectId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'لم يوافق المستخدم على التصميم' }),
      });
      fetchProjects();
      if (selectedProjectId === projectId) setSelectedProjectId(null);
    } catch {}
    setIsApproving(false);
  };

  // Filter projects
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.includes(searchQuery) || p.idea.includes(searchQuery);
    const matchesFilter = filter === 'all' ||
      (filter === 'active' && !['completed', 'failed'].includes(p.status)) ||
      (filter === 'completed' && p.status === 'completed') ||
      (filter === 'failed' && p.status === 'failed');
    return matchesSearch && matchesFilter;
  });

  // Chart data
  const agentActivityData = AGENTS.map(a => ({
    name: a.nameAr,
    value: Math.floor(Math.random() * 30) + 10 + (activeAgents.has(a.type) ? 50 : 0),
    color: a.bg.replace('bg-', '#').replace('-500', '') === '#' ? '#7c3aed' : a.bg,
  }));

  const productivityData = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(d => ({
    day: d,
    tasks: Math.floor(Math.random() * 15) + 5,
    errors: Math.floor(Math.random() * 5),
  }));

  const COLORS = ['#8b5cf6', '#ec4899', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#ef4444', '#6366f1'];

  // Stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => !['completed', 'failed'].includes(p.status)).length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  const detail = projectDetail as Record<string, unknown> | null;
  const detailProject = detail?.project as Project | undefined;
  const detailLogs = (detail?.logs ?? []) as AgentLog[];
  const detailMessages = (detail?.messages ?? []) as AgentMessage[];
  const detailCodeFiles = (detail?.codeFiles ?? []) as CodeFile[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      {/* ==================== HEADER ==================== */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">مصنع الوكلاء الذكي</h1>
              <p className="text-xs text-slate-500 hidden sm:block">نظام تطوير برمجيات ذاتي بالذكاء الاصطناعي</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="secondary" className="bg-violet-50 text-violet-700 border-violet-200">
              <FolderOpen className="w-3 h-3 ml-1" />
              {totalProjects} مشروع
            </Badge>
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="w-3 h-3 ml-1" />
              {completedProjects} مكتمل
            </Badge>
            <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
              <Loader2 className="w-3 h-3 ml-1 animate-spin" />
              {activeProjects} نشط
            </Badge>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
                <Settings className="w-4 h-4" />
              </Button>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>إعدادات النظام</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">رمز GitHub</label>
                    <Input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxx"
                      value={settings.githubToken}
                      onChange={e => setSettings(s => ({ ...s, githubToken: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">رمز Vercel</label>
                    <Input
                      type="password"
                      placeholder="vrt_xxxxxxxxxxxx"
                      value={settings.vercelToken}
                      onChange={e => setSettings(s => ({ ...s, vercelToken: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">مستودع GitHub</label>
                    <Input
                      placeholder="username/repo"
                      value={settings.githubRepo}
                      onChange={e => setSettings(s => ({ ...s, githubRepo: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleSaveSettings} className="w-full bg-violet-600 hover:bg-violet-700">
                    حفظ الإعدادات
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ==================== AGENT PIPELINE ==================== */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">خط إنتاج الوكلاء</h2>
            <Badge variant="outline" className="text-xs">8 وكلاء ذكاء اصطناعي</Badge>
          </div>
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-3 min-w-max">
              {AGENTS.map((agent, i) => {
                const isActive = activeAgents.has(agent.type);
                const Icon = agent.icon;
                return (
                  <motion.div
                    key={agent.type}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="flex-shrink-0"
                  >
                    <Card className={`w-36 sm:w-40 relative overflow-hidden transition-all duration-300 ${isActive ? 'ring-2 ring-violet-400 shadow-lg shadow-violet-100' : 'hover:shadow-md'}`}>
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      <CardContent className="p-4 text-center relative z-10">
                        <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center mb-3 shadow-md`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">{agent.nameAr}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">{agent.desc}</p>
                        {isActive && (
                          <div className="mt-2 flex items-center justify-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin text-violet-500" />
                            <span className="text-xs text-violet-600 font-medium">يعمل</span>
                          </div>
                        )}
                        <Badge variant="outline" className="mt-2 text-[10px] px-1.5 py-0">
                          خطوة {agent.step}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== STATISTICS ==================== */}
        <section className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">نشاط الوكلاء</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={agentActivityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {agentActivityData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">إنتاجية الأسبوع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productivityData}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="tasks" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="المهام" />
                    <Bar dataKey="errors" fill="#f43f5e" radius={[4, 4, 0, 0]} name="الأخطاء" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ==================== PROJECTS LIST ==================== */}
        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-slate-900">المشاريع</h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="بحث في المشاريع..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pr-9 w-full sm:w-56"
                />
              </div>
              <div className="flex gap-1">
                {(['all', 'active', 'completed', 'failed'] as const).map(f => (
                  <Button
                    key={f}
                    variant={filter === f ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className={filter === f ? 'bg-violet-600 hover:bg-violet-700' : ''}
                  >
                    {f === 'all' ? 'الكل' : f === 'active' ? 'نشط' : f === 'completed' ? 'مكتمل' : 'فشل'}
                  </Button>
                ))}
              </div>
              <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
                <DialogTrigger asChild>
                  <Button className="bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-200">
                    <Plus className="w-4 h-4 ml-1" />
                    مشروع جديد
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl" className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>إنشاء مشروع جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium">اسم المشروع</label>
                      <Input
                        placeholder="مثال: متجر إلكتروني"
                        value={newProject.name}
                        onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">وصف الفكرة</label>
                      <Textarea
                        placeholder="اوصف فكرتك بالتفصيل... مثال: أريد متجر إلكتروني لبيع الملابس مع نظام مصادقة وإشعارات"
                        value={newProject.idea}
                        onChange={e => setNewProject(p => ({ ...p, idea: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    <Button
                      onClick={handleCreateProject}
                      disabled={!newProject.name || !newProject.idea || isCreating}
                      className="w-full bg-violet-600 hover:bg-violet-700"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                          جاري الإنشاء والتشغيل...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-4 h-4 ml-1" />
                          إنشاء وتشغيل
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <FolderOpen className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">لا توجد مشاريع</h3>
                <p className="text-sm text-slate-500">ابدأ بإنشاء مشروع جديد وسيقوم الوكلاء ببناؤه تلقائياً</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredProjects.map(project => (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-lg ${selectedProjectId === project.id ? 'ring-2 ring-violet-400 shadow-lg' : ''}`}
                      onClick={() => setSelectedProjectId(project.id === selectedProjectId ? null : project.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 truncate">{project.name}</h3>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{project.description}</p>
                          </div>
                          <Badge className={`text-[10px] px-2 py-0.5 border ${STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-700'}`}>
                            {STATUS_LABELS[project.status] ?? project.status}
                          </Badge>
                        </div>
                        <Progress value={project.progress} className="h-1.5 mb-3" />
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(project.createdAt).toLocaleDateString('ar-SA')}
                          </span>
                          <span>{project.progress}%</span>
                        </div>
                        {project.currentStep && project.status !== 'completed' && project.status !== 'pending' && (
                          <p className="text-xs text-violet-600 mt-2 font-medium truncate">
                            <Loader2 className="w-3 h-3 inline ml-1 animate-spin" />
                            {project.currentStep}
                          </p>
                        )}
                        <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                          {project.status === 'pending' && (
                            <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); handleExecute(project.id); }} className="text-xs">
                              <Play className="w-3 h-3 ml-1" /> تشغيل
                            </Button>
                          )}
                          {project.status === 'failed' && (
                            <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); handleExecute(project.id); }} className="text-xs border-red-200 text-red-600">
                              <RefreshCw className="w-3 h-3 ml-1" /> إعادة
                            </Button>
                          )}
                          {project.status === 'pending_approval' && (
                            <>
                              <Button size="sm" onClick={e => { e.stopPropagation(); handleApprove(project.id); }} className="text-xs bg-green-600 hover:bg-green-700" disabled={isApproving}>
                                <CheckCircle2 className="w-3 h-3 ml-1" /> موافقة
                              </Button>
                              <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); handleReject(project.id); }} className="text-xs border-red-300 text-red-600" disabled={isApproving}>
                                <X className="w-3 h-3 ml-1" /> رفض
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setSelectedProjectId(project.id); }} className="text-xs">
                            <Eye className="w-3 h-3 ml-1" /> تفاصيل
                          </Button>
                          <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); handleDelete(project.id); }} className="text-xs text-red-500 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* ==================== PROJECT DETAIL ==================== */}
        <AnimatePresence>
          {selectedProjectId && detailProject && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-violet-200 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">{detailProject.name}</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">{detailProject.idea}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`border ${STATUS_COLORS[detailProject.status] ?? ''}`}>
                      {STATUS_LABELS[detailProject.status] ?? detailProject.status}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedProjectId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* ============ APPROVAL BANNER ============ */}
                  {detailProject.status === 'pending_approval' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-4 rounded-xl bg-gradient-to-l from-yellow-50 to-amber-50 border-2 border-yellow-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-yellow-900" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-yellow-900 text-base mb-1">بانتظار موافقتك على التصميم والكود</h3>
                          <p className="text-yellow-800 text-sm mb-3">
                            تم إنشاء جميع الملفات والكود. راجع التصميم من تبويب الكود ثم اضغط موافقة للنشر أو رفض لإلغاء. <strong>لا يتم رفع أي شيء بدون موافقتك.</strong>
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprove(selectedProjectId!)}
                              className="bg-green-600 hover:bg-green-700"
                              disabled={isApproving}
                            >
                              {isApproving ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 ml-1" />}
                              موافقة ونشر على GitHub + Vercel
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleReject(selectedProjectId!)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              disabled={isApproving}
                            >
                              <X className="w-4 h-4 ml-1" />
                              رفض — لا يتم رفع أي كود
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>التقدم</span>
                      <span className="font-bold text-violet-600">{detailProject.progress}%</span>
                    </div>
                    <Progress value={detailProject.progress} className="h-2" />
                  </div>

                  <Tabs defaultValue="logs" dir="rtl">
                    <TabsList className="w-full justify-start">
                      <TabsTrigger value="logs">
                        <BarChart3 className="w-4 h-4 ml-1" /> السجلات
                      </TabsTrigger>
                      <TabsTrigger value="messages">
                        <MessageSquare className="w-4 h-4 ml-1" /> الرسائل
                      </TabsTrigger>
                      <TabsTrigger value="code">
                        <FileCode className="w-4 h-4 ml-1" /> الكود
                      </TabsTrigger>
                      <TabsTrigger value="overview">
                        <Eye className="w-4 h-4 ml-1" /> نظرة عامة
                      </TabsTrigger>
                    </TabsList>

                    {/* Logs Tab */}
                    <TabsContent value="logs">
                      <div className="max-h-96 overflow-y-auto space-y-2 mt-2 custom-scrollbar">
                        {(detailLogs as AgentLog[]).length === 0 ? (
                          <p className="text-center text-slate-400 py-8">لا توجد سجلات بعد</p>
                        ) : (
                          (detailLogs as AgentLog[]).map((log: AgentLog) => {
                            const agentDef = AGENTS.find(a => a.type === log.agent);
                            return (
                              <div
                                key={log.id}
                                className={`p-3 rounded-lg border text-sm ${
                                  log.status === 'success' ? 'bg-green-50 border-green-100' :
                                  log.status === 'error' ? 'bg-red-50 border-red-100' :
                                  log.status === 'warning' ? 'bg-amber-50 border-amber-100' :
                                  'bg-violet-50 border-violet-100'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-slate-700">
                                    {agentDef?.nameAr ?? log.agent}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
                                  </span>
                                </div>
                                <p className="text-slate-600">{log.content}</p>
                                {log.status === 'running' && (
                                  <Loader2 className="w-3 h-3 animate-spin text-violet-500 inline ml-1" />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </TabsContent>

                    {/* Messages Tab */}
                    <TabsContent value="messages">
                      <div className="max-h-96 overflow-y-auto space-y-2 mt-2 custom-scrollbar">
                        {(detailMessages as AgentMessage[]).length === 0 ? (
                          <p className="text-center text-slate-400 py-8">لا توجد رسائل بعد</p>
                        ) : (
                          (detailMessages as AgentMessage[]).map((msg: AgentMessage) => (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-lg text-sm ${
                                msg.role === 'system'
                                  ? 'bg-violet-50 border border-violet-100'
                                  : 'bg-slate-50 border border-slate-100'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-slate-700">
                                  {msg.role === 'system' ? '🔄 النظام' : msg.agent ?? 'مستخدم'}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {new Date(msg.timestamp).toLocaleTimeString('ar-SA')}
                                </span>
                              </div>
                              <p className="text-slate-600">{msg.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    {/* Code Tab */}
                    <TabsContent value="code">
                      <div className="max-h-96 overflow-y-auto space-y-2 mt-2 custom-scrollbar">
                        {(detailCodeFiles as CodeFile[]).length === 0 ? (
                          <p className="text-center text-slate-400 py-8">لا توجد ملفات كود بعد</p>
                        ) : (
                          (detailCodeFiles as CodeFile[]).map((file: CodeFile, idx: number) => (
                            <div key={idx} className="rounded-lg border border-slate-200 overflow-hidden">
                              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                  <FileCode className="w-4 h-4 text-slate-400" />
                                  <span className="text-sm font-mono text-slate-700">{file.path}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px]">{file.language}</Badge>
                              </div>
                              <pre className="p-3 text-xs font-mono text-slate-600 overflow-x-auto max-h-48 bg-white">
                                <code>{file.content.substring(0, 2000)}{file.content.length > 2000 ? '\n... (مقتطف)' : ''}</code>
                              </pre>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    {/* Overview Tab */}
                    <TabsContent value="overview">
                      <div className="grid sm:grid-cols-2 gap-4 mt-2">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-slate-900">معلومات المشروع</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">الحالة</span>
                              <Badge className={`border ${STATUS_COLORS[detailProject.status] ?? ''}`}>
                                {STATUS_LABELS[detailProject.status] ?? detailProject.status}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">التقدم</span>
                              <span className="font-bold text-violet-600">{detailProject.progress}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">الخطوة الحالية</span>
                              <span className="text-slate-700">{detailProject.currentStep}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">تاريخ الإنشاء</span>
                              <span className="text-slate-700">{new Date(detailProject.createdAt).toLocaleDateString('ar-SA')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">آخر تحديث</span>
                              <span className="text-slate-700">{new Date(detailProject.updatedAt).toLocaleTimeString('ar-SA')}</span>
                            </div>
                          </div>
                          {detailProject.repoUrl && (
                            <div className="mt-2 p-2 bg-slate-50 rounded-lg text-sm">
                              <span className="text-slate-500">المستودع: </span>
                              <span className="text-violet-600 font-mono">{detailProject.repoUrl}</span>
                            </div>
                          )}
                          {detailProject.deployUrl && (
                            <div className="p-2 bg-green-50 rounded-lg text-sm">
                              <span className="text-slate-500">النشر: </span>
                              <span className="text-green-600 font-mono">{detailProject.deployUrl}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-semibold text-slate-900">ملخص التنفيذ</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">السجلات</span>
                              <span className="text-slate-700">{(detailLogs as AgentLog[]).length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">الرسائل</span>
                              <span className="text-slate-700">{(detailMessages as AgentMessage[]).length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">ملفات الكود</span>
                              <span className="text-slate-700">{(detailCodeFiles as CodeFile[]).length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">ناجحة</span>
                              <span className="text-green-600">{(detailLogs as AgentLog[]).filter((l: AgentLog) => l.status === 'success').length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">أخطاء</span>
                              <span className="text-red-600">{(detailLogs as AgentLog[]).filter((l: AgentLog) => l.status === 'error').length}</span>
                            </div>
                          </div>
                          <div className="mt-3 space-y-1">
                            <h5 className="text-xs font-medium text-slate-500">الوكلاء النشطون</h5>
                            <div className="flex flex-wrap gap-1">
                              {AGENTS.filter(a => activeAgents.has(a.type)).map(a => {
                                const Icon = a.icon;
                                return (
                                  <Badge key={a.type} variant="outline" className="text-xs">
                                    <Icon className="w-3 h-3 ml-1" />
                                    {a.nameAr}
                                  </Badge>
                                );
                              })}
                              {activeAgents.size === 0 && (
                                <span className="text-xs text-slate-400">لا يوجد وكلاء نشطون حالياً</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="mt-auto border-t bg-slate-50 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-slate-500">
          <p>مصنع الوكلاء الذكي — نظام تطوير برمجيات ذاتي بالذكاء الاصطناعي</p>
          <p className="mt-1 text-xs">يعمل بالكامل في الذاكرة — بدون قاعدة بيانات</p>
        </div>
      </footer>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
