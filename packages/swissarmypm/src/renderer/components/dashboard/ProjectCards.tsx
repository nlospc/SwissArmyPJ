import React from 'react';
import { Card, Tag, Progress, Button } from 'antd';
import { AlertCircle, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import type { ProjectHealth, HealthStatus } from '@/stores/useDashboardStore';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardsProps {
  projects: ProjectHealth[];
  loading: boolean;
}

const healthConfig = {
  on_track: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'On Track',
  },
  at_risk: {
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'At Risk',
  },
  critical: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Critical',
  },
  blocked: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    label: 'Blocked',
  },
};

export function ProjectCards({ projects, loading }: ProjectCardsProps) {
  const setCurrentView = useUIStore((state) => state.setCurrentView);

  const handleProjectClick = (projectId: number) => {
    console.log('Navigate to project:', projectId);
    setCurrentView('dashboard');
  };

  const getStatusIcon = (status: HealthStatus) => {
    const config = healthConfig[status];
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  const getMilestoneStatusTag = (status: string) => {
    switch (status) {
      case 'on_track':
        return <Tag color="green">On Track</Tag>;
      case 'at_risk':
        return <Tag color="orange">At Risk</Tag>;
      case 'overdue':
        return <Tag color="red">Overdue</Tag>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card title="Project Health Cards">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Project Health Cards"
      extra={
        <Button size="small">
          <Plus className="h-4 w-4" style={{ marginRight: 8 }} />
          New Project
        </Button>
      }
    >
      {projects.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No active projects</p>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const config = healthConfig[project.status];

            return (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${config.borderColor}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(project.status)}
                    <h3 className="font-semibold">{project.name}</h3>
                  </div>
                  <Tag className={config.bgColor}>
                    {project.progressPercent}%
                  </Tag>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                    <span>
                      {project.doneTasks}/{project.totalTasks} tasks done
                    </span>
                    {project.blockerCount > 0 && (
                      <span className="text-red-600 font-medium">
                        {project.blockerCount} blockers
                      </span>
                    )}
                  </div>

                  <Progress percent={project.progressPercent} showInfo={false} strokeWidth={6} />

                  {project.nextMilestone && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-500 dark:text-gray-400">
                          {project.nextMilestone.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getMilestoneStatusTag(project.nextMilestone.status)}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(project.nextMilestone.date), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
