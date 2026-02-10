import React, { useEffect, useMemo, useState } from 'react';

import { useDashboardStore } from '@/stores/useDashboardStore';

import { useProjectStore } from '@/stores/useProjectStore';

import { Card, Button, Alert, Space, Typography } from 'antd';

import { ReloadOutlined } from '@ant-design/icons';

import { formatDistanceToNow } from 'date-fns';

import type { ProjectHealth } from '@/stores/useDashboardStore';

import type { Project } from '@/shared/types';



// Import dashboard sub-components

import { ProjectTable } from '@/components/dashboard/ProjectTable';

import { TopWidgetDrawer } from '@/components/dashboard/TopWidgetDrawer';

import { ProjectDetailDrawer } from '@/components/dashboard/ProjectDetailDrawer';

const { Title, Text } = Typography;

export function DashboardPage() {

  // Get real project data from ProjectStore (same as Gantt chart)

  const { projects, loadProjects, isLoading: projectsLoading } = useProjectStore();



  // State for project detail drawer

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Get dashboard metrics from DashboardStore
  const {
    changeFeed,
    upcomingMilestones,
    riskSummary,
    loading,
    error,
    lastRefreshed,
    refreshAll,
  } = useDashboardStore();

  // Convert real projects to ProjectHealth format for dashboard
  const projectHealthList = useMemo((): ProjectHealth[] => {
    return projects.map(project => ({
      id: project.id,
      uuid: project.uuid,
      name: project.name,
      owner: project.owner || 'Unassigned',
      status: (project.status === 'done' ? 'on_track' :
               project.status === 'blocked' ? 'blocked' :
               project.status === 'in_progress' ? 'on_track' : 'at_risk') as any,
      progressPercent: 0, // TODO: Calculate from work items
      doneTasks: 0, // TODO: Calculate from work items
      totalTasks: 0, // TODO: Calculate from work items
      nextMilestone: null, // TODO: Get from work items
      blockerCount: 0, // TODO: Calculate
      highRiskCount: 0, // TODO: Calculate
    }));
  }, [projects]);

  useEffect(() => {
    // Load real project data
    loadProjects();
    // Load dashboard metrics
    refreshAll();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadProjects();
      refreshAll();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshAll, loadProjects]);

  const handleRefresh = () => {

    loadProjects();

    refreshAll();

  };



  const handleProjectClick = (projectHealth: ProjectHealth) => {

    // Find the full project object from projects array

    const project = projects.find((p) => p.id === projectHealth.id);

    if (project) {

      setSelectedProject(project);

      setDrawerOpen(true);

    }

  };



  const handleDrawerClose = () => {

    setDrawerOpen(false);

    // Don't clear selectedProject immediately to allow animation

    setTimeout(() => setSelectedProject(null), 300);

  };

  if (error) {
    return (
      <div className="p-8">
        <Alert
          message="Error Loading Dashboard"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <Title level={2} className="mb-1">Portfolio Dashboard</Title>
            <Text type="secondary">
              30-second context recovery for your IT portfolio
            </Text>
          </div>
          <Space>
            {lastRefreshed && (
              <Text type="secondary" className="text-sm">
                Last refreshed: {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
              </Text>
            )}
            <Button
              onClick={handleRefresh}
              icon={<ReloadOutlined spin={loading || projectsLoading} />}
              loading={loading || projectsLoading}
            >
              Refresh
            </Button>
          </Space>
        </div>
      </div>

      {/* Top Widget Drawer */}
      <TopWidgetDrawer
        changeFeed={changeFeed}
        upcomingMilestones={upcomingMilestones}
        riskSummary={riskSummary}
        loading={loading}
      />

      {/* Main Content */}
      <div className="px-8 pt-6 space-y-6">
        {/* Project Health Table */}
        <Card
          title={<Title level={4} className="mb-0">Project Health</Title>}
        >
          <ProjectTable projects={projectHealthList} onProjectClick={handleProjectClick} />
        </Card>
      </div>

      {/* Project Detail Drawer */}
      <ProjectDetailDrawer
        project={selectedProject}
        open={drawerOpen}
        onClose={handleDrawerClose}
      />
    </div>
  );
}
