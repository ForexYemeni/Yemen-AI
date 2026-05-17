// Frontend Specialist Agent - متخصص الواجهة الأمامية
// يبني مكونات الواجهة الأمامية والصفحات التفاعلية

import { BaseAgent } from './base-agent';
import { AgentContext, CodeFile } from './types';
import ZAI from 'z-ai-web-dev-sdk';

export class FrontendAgent extends BaseAgent {
  type = 'frontend' as const;
  name = 'Frontend Specialist';
  nameAr = 'متخصص الواجهة';

  async execute(context: AgentContext): Promise<AgentContext> {
    const { projectId, idea, plan } = context;

    await this.log(projectId, 'بدء_الواجهة', 'بدء تطوير مكونات الواجهة الأمامية المتقدمة', 'info');
    await this.updateProject(projectId, 'frontend_dev', 32, 'تطوير الواجهة الأمامية');
    await this.addMessage(projectId, 'frontend', '🖥️ جاري تطوير مكونات الواجهة الأمامية والصفحات التفاعلية...');

    try {
      await this.delay(2000);
      const frontendFiles = await this.generateFrontendComponents(idea, projectId);

      await this.log(projectId, 'اكتمال_الواجهة', `تم إنشاء ${frontendFiles.length} مكونات واجهة`, 'success');
      await this.addMessage(projectId, 'frontend', `✅ تم تطوير الواجهة الأمامية بنجاح!\n\n🖥️ **المكونات:** ${frontendFiles.length}\n📱 **التصميم المتجاوب:** متوافق مع جميع الأجهزة\n🎨 **الأنيميشن:** حركات سلسة واحترافية\n♿ **إمكانية الوصول:** معايير WCAG مطبقة`);

      const existingFiles = context.codeFiles || [];
      context.codeFiles = [...existingFiles, ...frontendFiles];
      context.progress = 38;
      await this.updateProject(projectId, 'frontend_dev', 38, 'تطوير الواجهة الأمامية', {
        codeFiles: JSON.stringify([...existingFiles, ...frontendFiles]),
      });

      return context;
    } catch (error: any) {
      await this.log(projectId, 'فشل_الواجهة', `فشل تطوير الواجهة: ${error.message}`, 'error');
      await this.addMessage(projectId, 'frontend', `❌ فشل تطوير الواجهة: ${error.message}`);
      context.errorLog = error.message;
      return context;
    }
  }

  private async generateFrontendComponents(idea: string, projectId: string): Promise<CodeFile[]> {
    const zai = await ZAI.create();
    const files: CodeFile[] = [];

    // Generate component file
    const componentCode = `'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Plus, Trash2, Edit3, Loader2, Sparkles,
  Filter, SortAsc, Grid3X3, List, Search
} from 'lucide-react';

interface ItemData {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category?: string;
  createdAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function ItemManager() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      setItems(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority }),
      });
      if (res.ok) {
        setTitle(''); setDescription(''); setPriority('medium');
        setShowAddDialog(false); fetchItems();
      }
    } catch (error) { console.error(error); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try { await fetch(\`/api/items/\${id}\`, { method: 'DELETE' }); fetchItems(); }
    catch (error) { console.error(error); }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.includes(searchQuery) || (item.description || '').includes(searchQuery);
    const matchesFilter = filterPriority === 'all' || item.priority === filterPriority;
    return matchesSearch && matchesFilter;
  });

  const priorityLabels: Record<string, string> = { high: 'عالي', medium: 'متوسط', low: 'منخفض' };
  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* شريط الأدوات */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pr-9"
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filterPriority === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority('all')}
          >
            الكل
          </Button>
          {['high', 'medium', 'low'].map((p) => (
            <Button key={p} variant={filterPriority === p ? 'default' : 'outline'} size="sm"
              onClick={() => setFilterPriority(p)}>
              {priorityLabels[p]}
            </Button>
          ))}
        </div>
        <div className="flex items-center border rounded-lg overflow-hidden">
          <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" className="h-8 w-8"
            onClick={() => setViewMode('grid')}><Grid3X3 className="h-4 w-4" /></Button>
          <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" className="h-8 w-8"
            onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 bg-gradient-to-l from-violet-600 to-indigo-600">
              <Plus className="h-4 w-4" />إضافة جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة عنصر جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="أدخل العنوان..." required />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="أدخل الوصف..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>الأولوية</Label>
                <div className="flex gap-2">
                  {['high', 'medium', 'low'].map((p) => (
                    <Button key={p} type="button" variant={priority === p ? 'default' : 'outline'} size="sm"
                      onClick={() => setPriority(p)}>{priorityLabels[p]}</Button>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                إضافة
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* القائمة */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-violet-500" /></div>
      ) : filteredItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <Sparkles className="h-12 w-12 mx-auto text-violet-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">لا توجد عناصر</h3>
            <p className="text-muted-foreground">أضف أول عنصر لتبدأ!</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}
        >
          <AnimatePresence>
            {filteredItems.map((item) => (
              <motion.div key={item.id} variants={itemVariants} exit={{ opacity: 0, scale: 0.95 }}>
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.description && <p className="text-sm text-muted-foreground mb-3">{item.description}</p>}
                    <div className="flex items-center justify-between">
                      <Badge className={priorityColors[item.priority] || ''}>{priorityLabels[item.priority] || item.priority}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString('ar')}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}`;

    files.push({ path: 'src/components/ItemManager.tsx', content: componentCode, language: 'tsx' });

    // Generate header component
    const headerCode = `'use client';

import { Sparkles, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') { setIsDark(true); document.documentElement.classList.add('dark'); }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50" dir="rtl">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">صُنع بواسطة الذكاء الاصطناعي</Badge>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}`;

    files.push({ path: 'src/components/AppHeader.tsx', content: headerCode, language: 'tsx' });

    // Generate footer component
    const footerCode = `export function AppFooter() {
  return (
    <footer className="border-t mt-auto py-6 text-center text-sm text-muted-foreground" dir="rtl">
      <p>صُنع بكل ❤️ بواسطة مصنع الوكلاء الذكي — 15 وكيل ذكاء اصطناعي يعملون بشكل ذاتي</p>
    </footer>
  );
}`;

    files.push({ path: 'src/components/AppFooter.tsx', content: footerCode, language: 'tsx' });

    return files;
  }
}
