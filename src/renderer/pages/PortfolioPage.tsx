import React from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function PortfolioPage() {
  const { projects } = useProjectStore();
  const { workItems } = useWorkItemStore();

  // Calculate KPIs
  const totalProjects = projects.length;
  const totalWorkItems = workItems.length;
  const blockedProjects = projects.filter(p => p.status === 'blocked').length;
  const blockedWorkItems = workItems.filter(w => w.status === 'blocked').length;
  const blockedCount = blockedProjects + blockedWorkItems;
  const atRiskCount = workItems.filter(w => w.type === 'issue').length;

  const statusCounts = {
    not_started: projects.filter(p => p.status === 'not_started').length + workItems.filter(w => w.status === 'not_started').length,
    in_progress: projects.filter(p => p.status === 'in_progress').length + workItems.filter(w => w.status === 'in_progress').length,
    done: projects.filter(p => p.status === 'done').length + workItems.filter(w => w.status === 'done').length,
    blocked: blockedCount,
  };

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const getPercentage = (count: number) => total > 0 ? (count / total) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'blocked': return 'bg-red-500';
      case 'not_started': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done': return <Badge className="bg-green-600">Done</Badge>;
      case 'in_progress': return <Badge className="bg-blue-600">In Progress</Badge>;
      case 'blocked': return <Badge variant="destructive">Blocked</Badge>;
      case 'not_started': return <Badge variant="secondary">Not Started</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio Dashboard</h1>
        <p className="text-muted-foreground">Overview of all projects and work items</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Work Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalWorkItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{atRiskCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Open issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{blockedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex h-8 w-full overflow-hidden rounded-md">
              {statusCounts.done > 0 && (
                <div
                  className="bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${getPercentage(statusCounts.done)}%` }}
                >
                  {statusCounts.done > 0 && statusCounts.done}
                </div>
              )}
              {statusCounts.in_progress > 0 && (
                <div
                  className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${getPercentage(statusCounts.in_progress)}%` }}
                >
                  {statusCounts.in_progress > 0 && statusCounts.in_progress}
                </div>
              )}
              {statusCounts.blocked > 0 && (
                <div
                  className="bg-red-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${getPercentage(statusCounts.blocked)}%` }}
                >
                  {statusCounts.blocked > 0 && statusCounts.blocked}
                </div>
              )}
              {statusCounts.not_started > 0 && (
                <div
                  className="bg-gray-300 flex items-center justify-center text-xs text-gray-700 font-medium"
                  style={{ width: `${getPercentage(statusCounts.not_started)}%` }}
                >
                  {statusCounts.not_started > 0 && statusCounts.not_started}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>Done ({statusCounts.done})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span>In Progress ({statusCounts.in_progress})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span>Blocked ({statusCounts.blocked})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded" />
                <span>Not Started ({statusCounts.not_started})</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No projects found</p>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      {project.owner && (
                        <p className="text-sm text-muted-foreground">Owner: {project.owner}</p>
                      )}
                    </div>
                    {getStatusBadge(project.status)}
                  </div>
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {project.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {(project.start_date || project.end_date) && (
                    <p className="text-xs text-muted-foreground">
                      {project.start_date} → {project.end_date}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
