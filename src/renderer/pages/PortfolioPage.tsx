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

      case 'done': return 'bg-emerald-500';

      case 'in_progress': return 'bg-indigo-500';

      case 'blocked': return 'bg-rose-500';

      case 'not_started': return 'bg-slate-200';

      default: return 'bg-slate-200';

    }

  };



  const getStatusBadge = (status: string) => {

    switch (status) {

      case 'done': return <Badge className="bg-emerald-600 hover:bg-emerald-700">Done</Badge>;

      case 'in_progress': return <Badge className="bg-indigo-600 hover:bg-indigo-700">In Progress</Badge>;

      case 'blocked': return <Badge className="bg-rose-600 hover:bg-rose-700">Blocked</Badge>;

      case 'not_started': return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-300">Not Started</Badge>;

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

            <div className="text-3xl font-bold text-amber-600">{atRiskCount}</div>

            <p className="text-xs text-muted-foreground mt-1">Open issues</p>

          </CardContent>

        </Card>



        <Card>

          <CardHeader className="pb-2">

            <CardTitle className="text-sm font-medium text-muted-foreground">Blocked</CardTitle>

          </CardHeader>

          <CardContent>

            <div className="text-3xl font-bold text-rose-600">{blockedCount}</div>
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
                  className="bg-emerald-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${getPercentage(statusCounts.done)}%` }}
                >
                  {statusCounts.done > 0 && statusCounts.done}
                </div>
              )}
              {statusCounts.in_progress > 0 && (
                <div
                  className="bg-indigo-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${getPercentage(statusCounts.in_progress)}%` }}
                >
                  {statusCounts.in_progress > 0 && statusCounts.in_progress}
                </div>
              )}
              {statusCounts.blocked > 0 && (
                <div
                  className="bg-rose-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${getPercentage(statusCounts.blocked)}%` }}
                >
                  {statusCounts.blocked > 0 && statusCounts.blocked}
                </div>
              )}
              {statusCounts.not_started > 0 && (
                <div
                  className="bg-slate-200 flex items-center justify-center text-xs text-slate-700 font-medium"
                  style={{ width: `${getPercentage(statusCounts.not_started)}%` }}
                >
                  {statusCounts.not_started > 0 && statusCounts.not_started}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded" />
                <span>Done ({statusCounts.done})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded" />
                <span>In Progress ({statusCounts.in_progress})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded" />
                <span>Blocked ({statusCounts.blocked})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-200 rounded" />
                <span>Not Started ({statusCounts.not_started})</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Owner</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Tags</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Start</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">End</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-8">No projects found</td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-3 font-medium">{project.name}</td>
                      <td className="px-6 py-3 text-muted-foreground">{project.owner || '—'}</td>
                      <td className="px-6 py-3">{getStatusBadge(project.status)}</td>
                      <td className="px-6 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {project.tags?.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{project.start_date || '—'}</td>
                      <td className="px-6 py-3 text-muted-foreground">{project.end_date || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
