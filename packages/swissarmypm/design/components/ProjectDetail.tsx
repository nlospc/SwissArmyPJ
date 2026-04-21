import { 
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Calendar,
  FileText,
  Download
} from 'lucide-react';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

interface Milestone {
  id: string;
  name: string;
  date: string;
  status: 'completed' | 'on-track' | 'at-risk' | 'missed';
}

interface Risk {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'mitigating' | 'closed';
  owner: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: string;
}

const projectData: Record<string, any> = {
  'proj-001': {
    name: 'ERP Migration',
    status: 'on-track',
    progress: 68,
    description: 'Migration of legacy ERP system to cloud-based SAP S/4HANA platform',
    startDate: '2026-01-15',
    endDate: '2026-06-30',
    budget: '$2.4M',
    team: 12,
    milestones: [
      { id: 'm1', name: 'Requirements Sign-off', date: '2026-02-01', status: 'completed' },
      { id: 'm2', name: 'Design Review', date: '2026-03-15', status: 'on-track' },
      { id: 'm3', name: 'Dev Environment Setup', date: '2026-04-01', status: 'on-track' },
      { id: 'm4', name: 'UAT Complete', date: '2026-05-30', status: 'on-track' },
      { id: 'm5', name: 'Production Cutover', date: '2026-06-30', status: 'on-track' }
    ],
    risks: [
      { id: 'r1', title: 'Data migration complexity higher than estimated', severity: 'medium', status: 'mitigating', owner: 'Alex Chen' },
      { id: 'r2', title: 'Key stakeholder availability during UAT', severity: 'low', status: 'open', owner: 'Jordan Lee' }
    ],
    activities: [
      { id: 'a1', type: 'milestone', description: 'Requirements Sign-off completed', timestamp: '2 days ago', user: 'Alex Chen' },
      { id: 'a2', type: 'task', description: '15 tasks updated from MSP sync', timestamp: '3 days ago', user: 'System' },
      { id: 'a3', type: 'risk', description: 'New risk identified: Data migration complexity', timestamp: '5 days ago', user: 'Pat Kim' }
    ]
  },
  'proj-002': {
    name: 'Cloud Infrastructure Upgrade',
    status: 'at-risk',
    progress: 45,
    description: 'Upgrade and modernization of cloud infrastructure across all regions',
    startDate: '2025-12-01',
    endDate: '2026-05-15',
    budget: '$1.8M',
    team: 8,
    milestones: [
      { id: 'm1', name: 'Architecture Review', date: '2025-12-15', status: 'completed' },
      { id: 'm2', name: 'Region 1 Migration', date: '2026-02-15', status: 'at-risk' },
      { id: 'm3', name: 'Region 2 Migration', date: '2026-03-30', status: 'on-track' },
      { id: 'm4', name: 'Load Testing', date: '2026-04-30', status: 'on-track' },
      { id: 'm5', name: 'Final Cutover', date: '2026-05-15', status: 'on-track' }
    ],
    risks: [
      { id: 'r1', title: 'Vendor SLA concerns for uptime guarantee', severity: 'high', status: 'open', owner: 'Jordan Lee' },
      { id: 'r2', title: 'Network bandwidth constraints in Region 2', severity: 'medium', status: 'mitigating', owner: 'Sam Taylor' },
      { id: 'r3', title: 'Budget overrun due to additional storage needs', severity: 'high', status: 'open', owner: 'Alex Chen' }
    ],
    activities: [
      { id: 'a1', type: 'risk', description: 'Risk escalated: Vendor SLA concerns', timestamp: '1 day ago', user: 'Jordan Lee' },
      { id: 'a2', type: 'status', description: 'Project status changed to At Risk', timestamp: '2 days ago', user: 'Jordan Lee' },
      { id: 'a3', type: 'task', description: 'Region 1 migration tasks delayed by 1 week', timestamp: '3 days ago', user: 'Sam Taylor' }
    ]
  }
};

export function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const project = projectData[projectId];

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Project Not Found</h2>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'at-risk':
      case 'mitigating':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'blocked':
      case 'missed':
      case 'open':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'at-risk':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'missed':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="h-full overflow-auto bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="p-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Portfolio</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{project.name}</h1>
              <p className="text-slate-600 max-w-2xl">{project.description}</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <FileText className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">View Timeline</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-6 gap-4">
            <div>
              <span className="text-sm text-slate-500 block mb-1">Status</span>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                {project.status.replace('-', ' ').toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-sm text-slate-500 block mb-1">Progress</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-900">{project.progress}%</span>
              </div>
            </div>
            <div>
              <span className="text-sm text-slate-500 block mb-1">Timeline</span>
              <span className="text-sm font-medium text-slate-900">
                {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-sm text-slate-500 block mb-1">Budget</span>
              <span className="text-sm font-medium text-slate-900">{project.budget}</span>
            </div>
            <div>
              <span className="text-sm text-slate-500 block mb-1">Team Size</span>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-900">{project.team} members</span>
              </div>
            </div>
            <div>
              <span className="text-sm text-slate-500 block mb-1">Risks</span>
              <span className={`text-sm font-medium ${project.risks.length > 3 ? 'text-red-600' : 'text-slate-900'}`}>
                {project.risks.length} active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Milestones */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Milestones
              </h2>
              <div className="space-y-3">
                {project.milestones.map((milestone: Milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    {getMilestoneIcon(milestone.status)}
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{milestone.name}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {new Date(milestone.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(milestone.status)}`}>
                      {milestone.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risks */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Active Risks
              </h2>
              <div className="space-y-3">
                {project.risks.map((risk: Risk) => (
                  <div
                    key={risk.id}
                    className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-slate-900 flex-1">{risk.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(risk.severity)}`}>
                        {risk.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-500">Owner:</span>
                      <span className="text-slate-900">{risk.owner}</span>
                      <span className="text-slate-300">•</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(risk.status)}`}>
                        {risk.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Chart */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Progress Trend
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Completed Tasks</span>
                    <span className="font-medium text-slate-900">68%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '68%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">On Schedule</span>
                    <span className="font-medium text-slate-900">85%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Budget Used</span>
                    <span className="font-medium text-slate-900">52%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '52%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {project.activities.map((activity: Activity) => (
                  <div key={activity.id} className="text-sm">
                    <p className="text-slate-700 mb-1">{activity.description}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{activity.timestamp}</span>
                      <span>•</span>
                      <span>{activity.user}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
