import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
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
    // Navigate to project detail
    console.log('Navigate to project:', projectId);
    setCurrentView('projects');
  };

  const getStatusIcon = (status: HealthStatus) => {
    const config = healthConfig[status];
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  const getMilestoneStatusBadge = (status: string) => {
    switch (status) {
      case 'on_track':
        return <Badge className="bg-green-600">On Track</Badge>;
      case 'at_risk':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          At Risk
        </Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Health Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Project Health Cards</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No active projects</p>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => {
              const config = healthConfig[project.status];

              return (
                <div
                  key={project.id}
                  onClick={() => handleProjectClick(project.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-muted/50 ${config.borderColor}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(project.status)}
                      <h3 className="font-semibold">{project.name}</h3>
                    </div>
                    <Badge variant="outline" className={config.bgColor}>
                      {project.progressPercent}%
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>
                        {project.doneTasks}/{project.totalTasks} tasks done
                      </span>
                      {project.blockerCount > 0 && (
                        <span className="text-red-600 font-medium">
                          {project.blockerCount} blockers
                        </span>
                      )}
                    </div>

                    <Progress value={project.progressPercent} className="h-1.5" />

                    {project.nextMilestone && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {project.nextMilestone.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getMilestoneStatusBadge(project.nextMilestone.status)}
                          <span className="text-xs text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}
