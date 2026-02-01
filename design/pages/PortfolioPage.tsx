import { useState, useEffect } from 'react';
import { 
  Search,
  ChevronDown,
  Plus,
  Upload,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  Filter,
  X,
  ArrowUpRight,
  Calendar,
  Circle,
  Diamond,
  Square,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { storage, Portfolio, Project, WorkItem } from '../lib/storage';

export function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('all');
  const [todos, setTodos] = useState<Array<{id: string; text: string; done: boolean; dueDate?: string; priority?: 'low' | 'medium' | 'high'}>>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [upcomingView, setUpcomingView] = useState<'7days' | '30days'>('7days');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    loadData();
    loadTodos();
  }, []);

  async function loadData() {
    const [pf, proj, wi] = await Promise.all([
      storage.getAll('portfolios'),
      storage.getAll('projects'),
      storage.getAll('workItems')
    ]);
    setPortfolios(pf);
    setProjects(proj);
    setWorkItems(wi);
  }

  function loadTodos() {
    const saved = localStorage.getItem('portfolio-todos');
    if (saved) {
      setTodos(JSON.parse(saved));
    }
  }

  function saveTodos(newTodos: Array<{id: string; text: string; done: boolean; dueDate?: string; priority?: 'low' | 'medium' | 'high'}>) {
    setTodos(newTodos);
    localStorage.setItem('portfolio-todos', JSON.stringify(newTodos));
  }

  function addTodoForDate(date: Date) {
    if (!newTodo.trim()) return;
    
    const todo = {
      id: Date.now().toString(),
      text: newTodo,
      done: false,
      dueDate: date.toISOString().split('T')[0],
      priority: newTodoPriority
    };
    saveTodos([...todos, todo]);
    setNewTodo('');
    setNewTodoPriority('medium');
    setQuickAddVisible(false);
  }

  function toggleTodo(id: string) {
    saveTodos(todos.map(t => t.id === id ? {...t, done: !t.done} : t));
  }

  function deleteTodo(id: string) {
    saveTodos(todos.filter(t => t.id !== id));
  }

  function handleDateClick(date: Date) {
    setSelectedDate(date);
    setQuickAddVisible(true);
  }

  function getTodosForDate(date: Date): typeof todos {
    const dateStr = date.toISOString().split('T')[0];
    return todos.filter(t => t.dueDate === dateStr);
  }

  function getTodoCountForDate(date: Date): number {
    return getTodosForDate(date).length;
  }

  // Filter data
  const filteredProjects = selectedPortfolio === 'all' 
    ? projects 
    : projects.filter(p => p.portfolioId === selectedPortfolio);

  const filteredWorkItems = workItems.filter(wi => 
    filteredProjects.some(p => p.id === wi.projectId)
  );

  // Calculate stats
  const stats = {
    totalProjects: filteredProjects.length,
    onTrack: filteredProjects.filter(p => p.status === 'in_progress' || p.status === 'done').length,
    atRisk: filteredProjects.filter(p => p.status === 'blocked').length,
    notStarted: filteredProjects.filter(p => p.status === 'not_started').length,
  };

  const workItemStats = {
    total: filteredWorkItems.length,
    done: filteredWorkItems.filter(wi => wi.status === 'done').length,
    inProgress: filteredWorkItems.filter(wi => wi.status === 'in_progress').length,
    blocked: filteredWorkItems.filter(wi => wi.status === 'blocked').length,
    notStarted: filteredWorkItems.filter(wi => wi.status === 'not_started').length,
  };

  // Calculate upcoming items
  const now = new Date();
  const daysAhead = upcomingView === '7days' ? 7 : 30;
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  
  const upcomingMilestones = workItems.filter(wi => {
    if (wi.type !== 'milestone') return false;
    if (!wi.startDate) return false;
    if (!filteredProjects.some(p => p.id === wi.projectId)) return false;
    const date = new Date(wi.startDate);
    return date >= now && date <= futureDate;
  }).sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());

  const upcomingWorkItems = workItems.filter(wi => {
    if (wi.type === 'milestone') return false;
    if (!wi.dueDate) return false;
    if (wi.status === 'done') return false;
    if (!filteredProjects.some(p => p.id === wi.projectId)) return false;
    const date = new Date(wi.dueDate);
    return date >= now && date <= futureDate;
  }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  // Risks and blocked items
  const risks = workItems.filter(wi => 
    (wi.type === 'issue' || wi.type === 'clash') && 
    wi.status !== 'done' &&
    filteredProjects.some(p => p.id === wi.projectId)
  );

  const blockedItems = workItems.filter(wi => 
    wi.status === 'blocked' &&
    filteredProjects.some(p => p.id === wi.projectId)
  );

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'blocked': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'not_started': return 'bg-slate-50 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done': return 'Done';
      case 'in_progress': return 'In Progress';
      case 'blocked': return 'Blocked';
      case 'not_started': return 'Not Started';
      default: return status;
    }
  };

  const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'medium': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'low': return 'bg-slate-50 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getCurrentPortfolioName = () => {
    if (selectedPortfolio === 'all') return 'All Projects';
    const pf = portfolios.find(p => p.id === selectedPortfolio);
    return pf?.name || 'Portfolio';
  };

  const selectedDateTodos = getTodosForDate(selectedDate);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between mb-6">
            {/* Left: Title & Subtitle */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Portfolio Overview</h1>
              <p className="text-sm text-slate-500 mt-1">{getCurrentPortfolioName()}</p>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* New dropdown - Primary only */}
              <div className="relative">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm">
                  <Plus className="w-4 h-4" />
                  New
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Secondary actions - Neutral */}
              <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium">
                <Upload className="w-4 h-4" />
                Import CSV
              </button>

              <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium">
                <RefreshCw className="w-4 h-4" />
                Sync
              </button>

              <button className="p-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, work items, risks..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Portfolio Selector & Filters */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            {/* Segmented Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedPortfolio('all')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedPortfolio === 'all'
                    ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Projects
              </button>
              {portfolios.map(pf => (
                <button
                  key={pf.id}
                  onClick={() => setSelectedPortfolio(pf.id)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedPortfolio === pf.id
                      ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {pf.name}
                </button>
              ))}
            </div>

            {/* Filter chips & count */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  Status
                </button>
                <button className="px-3 py-1 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  Risk
                </button>
              </div>
              <span className="text-sm text-slate-500">
                {filteredProjects.length} projects, {filteredWorkItems.length} items
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto p-6 space-y-6">
          
          {/* 1. KPI Overview - 4 Compact Cards with Low Saturation */}
          <div className="grid grid-cols-4 gap-4">
            {/* Total Projects KPI */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Target className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Projects</div>
                    <div className="text-2xl font-bold text-slate-900 mt-0.5">{stats.totalProjects}</div>
                  </div>
                </div>
              </div>
              {/* Mini segmented bar - Low saturation */}
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-400" 
                  style={{ width: `${stats.totalProjects ? (stats.onTrack / stats.totalProjects) * 100 : 0}%` }}
                />
                <div 
                  className="bg-rose-400" 
                  style={{ width: `${stats.totalProjects ? (stats.atRisk / stats.totalProjects) * 100 : 0}%` }}
                />
                <div 
                  className="bg-slate-300" 
                  style={{ width: `${stats.totalProjects ? (stats.notStarted / stats.totalProjects) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                <span>{stats.onTrack} on track</span>
                <span>{stats.atRisk} at risk</span>
              </div>
            </div>

            {/* Work Items KPI */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Work Items</div>
                    <div className="text-2xl font-bold text-slate-900 mt-0.5">{workItemStats.total}</div>
                  </div>
                </div>
              </div>
              {/* Mini segmented bar - Low saturation */}
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-400" 
                  style={{ width: `${workItemStats.total ? (workItemStats.done / workItemStats.total) * 100 : 0}%` }}
                />
                <div 
                  className="bg-blue-400" 
                  style={{ width: `${workItemStats.total ? (workItemStats.inProgress / workItemStats.total) * 100 : 0}%` }}
                />
                <div 
                  className="bg-rose-400" 
                  style={{ width: `${workItemStats.total ? (workItemStats.blocked / workItemStats.total) * 100 : 0}%` }}
                />
                <div 
                  className="bg-slate-300" 
                  style={{ width: `${workItemStats.total ? (workItemStats.notStarted / workItemStats.total) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 flex-wrap">
                <span>{workItemStats.done} done</span>
                <span>{workItemStats.inProgress} active</span>
              </div>
            </div>

            {/* At Risk KPI - Subdued */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center relative">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    {risks.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">At Risk</div>
                    <div className="text-2xl font-bold text-slate-900 mt-0.5">{risks.length}</div>
                  </div>
                </div>
                {risks.length > 0 && (
                  <button className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium hover:bg-amber-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    Review
                  </button>
                )}
              </div>
              {risks.length > 0 ? (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-600 truncate">
                    {risks[0].title}
                  </div>
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-400">No active risks</div>
                </div>
              )}
            </div>

            {/* Blocked KPI - Subdued */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center relative">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    {blockedItems.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Blocked</div>
                    <div className="text-2xl font-bold text-slate-900 mt-0.5">{blockedItems.length}</div>
                  </div>
                </div>
                {blockedItems.length > 0 && (
                  <button className="px-2 py-1 bg-rose-50 text-rose-700 rounded text-xs font-medium hover:bg-rose-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    Unblock
                  </button>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-600">
                  {blockedItems.length} items impacted
                </div>
              </div>
            </div>
          </div>

          {/* 2. Core Analysis - Portfolio Health + Calendar & To-Do */}
          <div className="grid grid-cols-12 gap-6">
            {/* Portfolio Health - 8 cols */}
            <div className="col-span-8 bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Portfolio Health</h2>
              
              {/* Stacked bar chart - Low saturation */}
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">Project Status Distribution</span>
                    <span className="text-slate-500">{stats.totalProjects} total</span>
                  </div>
                  <div className="h-6 bg-slate-100 rounded-lg overflow-hidden flex">
                    {stats.onTrack > 0 && (
                      <div 
                        className="bg-emerald-400 flex items-center justify-center text-slate-700 text-xs font-medium"
                        style={{ width: `${(stats.onTrack / stats.totalProjects) * 100}%` }}
                      >
                        {stats.onTrack > 0 && `${stats.onTrack}`}
                      </div>
                    )}
                    {stats.atRisk > 0 && (
                      <div 
                        className="bg-rose-400 flex items-center justify-center text-slate-700 text-xs font-medium"
                        style={{ width: `${(stats.atRisk / stats.totalProjects) * 100}%` }}
                      >
                        {stats.atRisk > 0 && `${stats.atRisk}`}
                      </div>
                    )}
                    {stats.notStarted > 0 && (
                      <div 
                        className="bg-slate-300 flex items-center justify-center text-slate-600 text-xs font-medium"
                        style={{ width: `${(stats.notStarted / stats.totalProjects) * 100}%` }}
                      >
                        {stats.notStarted > 0 && `${stats.notStarted}`}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-emerald-400" />
                      <span>On Track ({stats.onTrack})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-rose-400" />
                      <span>At Risk ({stats.atRisk})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-slate-300" />
                      <span>Not Started ({stats.notStarted})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Projects Summary */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Top Projects</h3>
                <div className="space-y-2">
                  {filteredProjects.slice(0, 3).map(project => {
                    const projectMilestone = upcomingMilestones.find(m => m.projectId === project.id);
                    return (
                      <div key={project.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 truncate text-sm">{project.name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                                {getStatusLabel(project.status)}
                              </span>
                            </div>
                            {projectMilestone && (
                              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                <Diamond className="w-3 h-3" />
                                <span>{projectMilestone.title}</span>
                                <span>•</span>
                                <span>{new Date(projectMilestone.startDate!).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-400" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Calendar & Day To-Do - 4 cols */}
            <div className="col-span-4 bg-white rounded-lg border border-slate-200 p-5">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const newMonth = new Date(calendarMonth);
                      newMonth.setMonth(newMonth.getMonth() - 1);
                      setCalendarMonth(newMonth);
                    }}
                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <button 
                    onClick={() => {
                      setCalendarMonth(new Date());
                      setSelectedDate(new Date());
                    }}
                    className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => {
                      const newMonth = new Date(calendarMonth);
                      newMonth.setMonth(newMonth.getMonth() + 1);
                      setCalendarMonth(newMonth);
                    }}
                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="mb-4">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-xs font-medium text-slate-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const year = calendarMonth.getFullYear();
                    const month = calendarMonth.getMonth();
                    const firstDay = new Date(year, month, 1);
                    const lastDay = new Date(year, month + 1, 0);
                    const startingDayOfWeek = firstDay.getDay();
                    const daysInMonth = lastDay.getDate();
                    
                    const days = [];
                    const today = new Date();
                    
                    // Empty cells before month starts
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(
                        <div key={`empty-${i}`} className="aspect-square" />
                      );
                    }
                    
                    // Days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day);
                      const dateStr = date.toISOString().split('T')[0];
                      const selectedDateStr = selectedDate.toISOString().split('T')[0];
                      const isToday = date.toDateString() === today.toDateString();
                      const isSelected = dateStr === selectedDateStr;
                      const todoCount = getTodoCountForDate(date);
                      
                      days.push(
                        <button
                          key={day}
                          onClick={() => handleDateClick(date)}
                          className={`aspect-square rounded-md flex flex-col items-center justify-center relative transition-all text-sm font-medium ${
                            isToday 
                              ? 'bg-blue-500 text-white hover:bg-blue-600 ring-2 ring-blue-200' 
                              : isSelected
                              ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-300'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{day}</span>
                          
                          {/* To-do indicators */}
                          {todoCount > 0 && !isToday && (
                            <div className="absolute bottom-1 flex gap-0.5">
                              {Array.from({ length: Math.min(todoCount, 3) }).map((_, i) => (
                                <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-blue-400'}`} />
                              ))}
                              {todoCount > 3 && (
                                <span className="text-[8px] text-blue-600 ml-0.5">+{todoCount - 3}</span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    }
                    
                    return days;
                  })()}
                </div>
              </div>

              {/* Quick Add Input */}
              {quickAddVisible && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs font-medium text-blue-900 mb-2">
                    Add to {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTodoForDate(selectedDate)}
                    placeholder="Task description..."
                    autoFocus
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm mb-2"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      <button
                        onClick={() => setNewTodoPriority('low')}
                        className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                          newTodoPriority === 'low'
                            ? 'bg-slate-200 text-slate-900'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Low
                      </button>
                      <button
                        onClick={() => setNewTodoPriority('medium')}
                        className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                          newTodoPriority === 'medium'
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Med
                      </button>
                      <button
                        onClick={() => setNewTodoPriority('high')}
                        className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                          newTodoPriority === 'high'
                            ? 'bg-rose-200 text-rose-900'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        High
                      </button>
                    </div>
                    <button
                      onClick={() => addTodoForDate(selectedDate)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setQuickAddVisible(false);
                        setNewTodo('');
                      }}
                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* Day Agenda */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">
                    {selectedDate.toDateString() === new Date().toDateString() 
                      ? 'Today' 
                      : selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </h3>
                  {selectedDateTodos.length > 0 && (
                    <span className="text-xs text-slate-500">{selectedDateTodos.length} tasks</span>
                  )}
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedDateTodos.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400">No tasks for this day</p>
                      <button 
                        onClick={() => setQuickAddVisible(true)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Add a task
                      </button>
                    </div>
                  ) : (
                    selectedDateTodos.slice(0, 5).map(todo => (
                      <div
                        key={todo.id}
                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                      >
                        <input
                          type="checkbox"
                          checked={todo.done}
                          onChange={() => toggleTodo(todo.id)}
                          className="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${todo.done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {todo.text}
                          </p>
                          {todo.priority && (
                            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getPriorityColor(todo.priority)}`}>
                              {todo.priority}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="p-0.5 hover:bg-rose-100 rounded transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3 text-rose-600" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {selectedDateTodos.length > 5 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <button className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium">
                      View all {selectedDateTodos.length} tasks
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Risks & Upcoming */}
          <div className="grid grid-cols-12 gap-6">
            {/* Risks & Blockers - 8 cols */}
            <div className="col-span-8 bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">Risks & Blockers</h2>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-xs font-medium">
                    Create Risk
                  </button>
                  <button className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors text-xs font-medium">
                    Mark Resolved
                  </button>
                </div>
              </div>

              {blockedItems.length === 0 && risks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">No active risks or blockers</p>
                  <p className="text-xs text-slate-500 mt-1">All systems running smoothly</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* High Priority Section */}
                  {blockedItems.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">High Priority</div>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                      {blockedItems.slice(0, 3).map(item => (
                        <div key={item.id} className="flex items-start gap-3 p-3 border border-rose-100 rounded-lg bg-rose-50/30 hover:bg-rose-50/50 transition-colors cursor-pointer group mb-2">
                          <div className="w-1 h-full bg-rose-400 rounded-full flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-xs font-medium border border-rose-200">
                                    BLOCKED
                                  </span>
                                  <span className="text-xs text-slate-600">{item.type.toUpperCase()}</span>
                                </div>
                                <div className="text-sm font-medium text-slate-900 truncate">{item.title}</div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                  <span className="truncate">{getProjectName(item.projectId)}</span>
                                  <span>•</span>
                                  <span>Updated {Math.floor(Math.random() * 3) + 1}h ago</span>
                                </div>
                              </div>
                              <button className="px-2.5 py-1 bg-white border border-rose-200 text-rose-700 rounded text-xs font-medium hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                Open
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Medium Priority Section */}
                  {risks.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Medium Priority</div>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                      {risks.slice(0, 2).map(item => (
                        <div key={item.id} className="flex items-start gap-3 p-3 border border-amber-100 rounded-lg bg-amber-50/30 hover:bg-amber-50/50 transition-colors cursor-pointer group mb-2">
                          <div className="w-1 h-full bg-amber-400 rounded-full flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium border border-amber-200">
                                    RISK
                                  </span>
                                  <span className="text-xs text-slate-600">{item.type.toUpperCase()}</span>
                                </div>
                                <div className="text-sm font-medium text-slate-900 truncate">{item.title}</div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                  <span className="truncate">{getProjectName(item.projectId)}</span>
                                  <span>•</span>
                                  <span>Updated {Math.floor(Math.random() * 5) + 1}h ago</span>
                                </div>
                              </div>
                              <button className="px-2.5 py-1 bg-white border border-amber-200 text-amber-700 rounded text-xs font-medium hover:bg-amber-50 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                Open
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Upcoming Agenda - 4 cols */}
            <div className="col-span-4 bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">Upcoming</h2>
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setUpcomingView('7days')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      upcomingView === '7days'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    7 days
                  </button>
                  <button
                    onClick={() => setUpcomingView('30days')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      upcomingView === '30days'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    30 days
                  </button>
                </div>
              </div>

              {/* Agenda List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {upcomingMilestones.length === 0 && upcomingWorkItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">No upcoming items in next {upcomingView === '7days' ? '7' : '30'} days</p>
                    <button className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Add milestone
                    </button>
                  </div>
                ) : (
                  <>
                    {upcomingMilestones.map(milestone => (
                      <div key={milestone.id} className="p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer group">
                        <div className="flex items-start gap-2">
                          <Diamond className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">{milestone.title}</div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                              <span className="truncate">{getProjectName(milestone.projectId)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(milestone.startDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                    
                    {upcomingWorkItems.map(item => (
                      <div key={item.id} className="p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer group">
                        <div className="flex items-start gap-2">
                          <Square className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">{item.title}</div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                              <span className="truncate">{getProjectName(item.projectId)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Due {new Date(item.dueDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 4. Projects Table */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">All Projects</h2>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs font-medium">
                    Compact
                  </button>
                  <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-xs font-medium">
                    Columns
                  </button>
                </div>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-900">No projects found</p>
                <p className="text-xs text-slate-500 mt-1">Create your first project to get started</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 mx-auto shadow-sm">
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Work Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Risk
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Last Update
                      </th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProjects.map(project => {
                      const projectWorkItems = workItems.filter(wi => wi.projectId === project.id);
                      const completedItems = projectWorkItems.filter(wi => wi.status === 'done').length;
                      const progress = projectWorkItems.length > 0 
                        ? Math.round((completedItems / projectWorkItems.length) * 100) 
                        : 0;
                      const projectRisks = risks.filter(r => r.projectId === project.id).length;
                      const isBlocked = blockedItems.some(b => b.projectId === project.id);
                      
                      return (
                        <tr key={project.id} className="hover:bg-slate-50 cursor-pointer transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-slate-900">{project.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                              {getStatusLabel(project.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                                <div 
                                  className="h-full bg-blue-400 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-slate-600 min-w-[32px]">{progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-600">
                              {completedItems} / {projectWorkItems.length}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {isBlocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-medium border border-rose-200">
                                <AlertTriangle className="w-3 h-3" />
                                Blocked
                              </span>
                            ) : projectRisks > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200">
                                <AlertTriangle className="w-3 h-3" />
                                {projectRisks}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-slate-500">
                              {Math.floor(Math.random() * 5) + 1}h ago
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <ArrowUpRight className="w-4 h-4 text-slate-400" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
