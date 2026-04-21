import { 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Target,
  ArrowUpDown,
  Filter,
  Download,
  Plus,
  Search
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: 'on-track' | 'at-risk' | 'blocked';
  progress: number;
  milestonesOnTrack: number;
  milestonesTotal: number;
  risks: number;
  blockers: number;
  lastUpdate: string;
  owner: string;
  dueDate: string;
  budget: string;
  budgetStatus: 'under' | 'on-track' | 'over';
}

interface ChangeEvent {
  id: string;
  type: 'status' | 'milestone' | 'risk' | 'task';
  project: string;
  description: string;
  timestamp: string;
  user: string;
}

const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'ERP Migration',
    status: 'on-track',
    progress: 68,
    milestonesOnTrack: 7,
    milestonesTotal: 10,
    risks: 2,
    blockers: 0,
    lastUpdate: '2 hours ago',
    owner: 'Alex Chen',
    dueDate: '2026-06-30',
    budget: '$2.4M',
    budgetStatus: 'on-track'
  },
  {
    id: 'proj-002',
    name: 'Cloud Infrastructure Upgrade',
    status: 'at-risk',
    progress: 45,
    milestonesOnTrack: 3,
    milestonesTotal: 8,
    risks: 5,
    blockers: 1,
    lastUpdate: '5 hours ago',
    owner: 'Jordan Lee',
    dueDate: '2026-05-15',
    budget: '$1.8M',
    budgetStatus: 'over'
  },
  {
    id: 'proj-003',
    name: 'Mobile App Development',
    status: 'on-track',
    progress: 82,
    milestonesOnTrack: 9,
    milestonesTotal: 10,
    risks: 1,
    blockers: 0,
    lastUpdate: '1 day ago',
    owner: 'Sam Taylor',
    dueDate: '2026-03-31',
    budget: '$950K',
    budgetStatus: 'under'
  },
  {
    id: 'proj-004',
    name: 'Security Compliance Initiative',
    status: 'blocked',
    progress: 23,
    milestonesOnTrack: 2,
    milestonesTotal: 12,
    risks: 8,
    blockers: 3,
    lastUpdate: '3 hours ago',
    owner: 'Riley Morgan',
    dueDate: '2026-04-15',
    budget: '$1.2M',
    budgetStatus: 'on-track'
  },
  {
    id: 'proj-005',
    name: 'Data Warehouse Modernization',
    status: 'on-track',
    progress: 91,
    milestonesOnTrack: 11,
    milestonesTotal: 12,
    risks: 0,
    blockers: 0,
    lastUpdate: '30 minutes ago',
    owner: 'Pat Kim',
    dueDate: '2026-02-28',
    budget: '$3.1M',
    budgetStatus: 'on-track'
  }
];

const mockChanges: ChangeEvent[] = [
  {
    id: 'ch-001',
    type: 'milestone',
    project: 'ERP Migration',
    description: 'Milestone "Database Schema Complete" marked as done',
    timestamp: '2 hours ago',
    user: 'Alex Chen'
  },
  {
    id: 'ch-002',
    type: 'risk',
    project: 'Cloud Infrastructure Upgrade',
    description: 'New risk flagged: "Vendor SLA concerns" (High)',
    timestamp: '3 hours ago',
    user: 'Jordan Lee'
  },
  {
    id: 'ch-003',
    type: 'status',
    project: 'Security Compliance Initiative',
    description: 'Project status changed from At Risk to Blocked',
    timestamp: '3 hours ago',
    user: 'Sam Taylor'
  },
  {
    id: 'ch-004',
    type: 'task',
    project: 'Mobile App Development',
    description: '12 tasks updated via MSP file sync',
    timestamp: '5 hours ago',
    user: 'System'
  },
  {
    id: 'ch-005',
    type: 'milestone',
    project: 'Data Warehouse Modernization',
    description: 'Milestone "Production Deployment" completed 2 days early',
    timestamp: '6 hours ago',
    user: 'Alex Chen'
  }
];

interface PortfolioDashboardProps {
  onProjectSelect: (projectId: string) => void;
}

export function PortfolioDashboard({ onProjectSelect }: PortfolioDashboardProps) {
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'on-track':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'at-risk':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'blocked':
        return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'on-track':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'at-risk':
        return <AlertCircle className="w-3 h-3" />;
      case 'blocked':
        return <AlertTriangle className="w-3 h-3" />;
    }
  };

  const getBudgetStatusColor = (status: Project['budgetStatus']) => {
    switch (status) {
      case 'under':
        return 'text-green-600';
      case 'on-track':
        return 'text-slate-600';
      case 'over':
        return 'text-red-600';
    }
  };

  const totalProjects = mockProjects.length;
  const onTrackProjects = mockProjects.filter(p => p.status === 'on-track').length;
  const atRiskProjects = mockProjects.filter(p => p.status === 'at-risk').length;
  const blockedProjects = mockProjects.filter(p => p.status === 'blocked').length;
  const totalRisks = mockProjects.reduce((sum, p) => sum + p.risks, 0);
  const totalBlockers = mockProjects.reduce((sum, p) => sum + p.blockers, 0);
  const avgProgress = Math.round(mockProjects.reduce((sum, p) => sum + p.progress, 0) / totalProjects);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Portfolio Overview</h1>
            <p className="text-slate-500 mt-1">
              {totalProjects} active projects • Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">New Project</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Filter</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors">
              <Download className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Export</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">On Track</div>
            <div className="text-2xl font-bold text-green-600">{onTrackProjects}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">At Risk</div>
            <div className="text-2xl font-bold text-yellow-600">{atRiskProjects}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Blocked</div>
            <div className="text-2xl font-bold text-red-600">{blockedProjects}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Avg Progress</div>
            <div className="text-2xl font-bold text-slate-900">{avgProgress}%</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Active Risks</div>
            <div className="text-2xl font-bold text-yellow-600">{totalRisks}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Blockers</div>
            <div className="text-2xl font-bold text-red-600">{totalBlockers}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Projects Table */}
        <div className="flex-1 bg-white border-r border-slate-200 flex flex-col">
          {/* Search Bar */}
          <div className="border-b border-slate-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Table Header */}
          <div className="border-b border-slate-200 bg-slate-50">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <div className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-slate-900">
                Project <ArrowUpDown className="w-3 h-3" />
              </div>
              <div className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-slate-900">
                Status <ArrowUpDown className="w-3 h-3" />
              </div>
              <div className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-slate-900">
                Progress <ArrowUpDown className="w-3 h-3" />
              </div>
              <div className="col-span-2">Milestones</div>
              <div className="col-span-1 text-center">Risks</div>
              <div className="col-span-1 text-center">Blockers</div>
              <div className="col-span-2">Owner</div>
              <div className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-slate-900">
                Due Date <ArrowUpDown className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-auto">
            {mockProjects.map((project, index) => (
              <div
                key={project.id}
                onClick={() => onProjectSelect(project.id)}
                className={`grid grid-cols-12 gap-4 px-4 py-4 border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                }`}
              >
                {/* Project Name */}
                <div className="col-span-3">
                  <div className="font-medium text-slate-900 mb-0.5">{project.name}</div>
                  <div className="text-xs text-slate-500">{project.budget}</div>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    {project.status === 'on-track' ? 'On Track' : project.status === 'at-risk' ? 'At Risk' : 'Blocked'}
                  </span>
                </div>

                {/* Progress */}
                <div className="col-span-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          project.progress >= 70 ? 'bg-green-500' :
                          project.progress >= 40 ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700 w-8">{project.progress}%</span>
                  </div>
                </div>

                {/* Milestones */}
                <div className="col-span-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(project.milestonesOnTrack / project.milestonesTotal) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-600 whitespace-nowrap">
                    {project.milestonesOnTrack}/{project.milestonesTotal}
                  </span>
                </div>

                {/* Risks */}
                <div className="col-span-1 text-center">
                  {project.risks > 0 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                      {project.risks}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </div>

                {/* Blockers */}
                <div className="col-span-1 text-center">
                  {project.blockers > 0 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      {project.blockers}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </div>

                {/* Owner */}
                <div className="col-span-2">
                  <div className="text-sm text-slate-700">{project.owner}</div>
                </div>

                {/* Due Date */}
                <div className="col-span-1">
                  <div className="text-xs text-slate-600">
                    {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer */}
          <div className="border-t border-slate-200 px-4 py-2 bg-slate-50">
            <div className="text-xs text-slate-500">
              Showing {mockProjects.length} of {mockProjects.length} projects
            </div>
          </div>
        </div>

        {/* Activity Feed Sidebar */}
        <div className="w-80 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </h2>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="divide-y divide-slate-100">
              {mockChanges.map((change) => (
                <div key={change.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      change.type === 'milestone' ? 'bg-blue-100' :
                      change.type === 'risk' ? 'bg-yellow-100' :
                      change.type === 'status' ? 'bg-purple-100' :
                      'bg-slate-100'
                    }`}>
                      {change.type === 'milestone' && <Target className="w-4 h-4 text-blue-600" />}
                      {change.type === 'risk' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                      {change.type === 'status' && <Activity className="w-4 h-4 text-purple-600" />}
                      {change.type === 'task' && <CheckCircle2 className="w-4 h-4 text-slate-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        {change.project}
                      </p>
                      <p className="text-sm text-slate-600 mb-2">
                        {change.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{change.timestamp}</span>
                        <span>•</span>
                        <span>{change.user}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
