/**
 * Portfolio Page with Timeline View
 * Displays all projects in an interactive Gantt chart
 */

import React, { useState, useEffect } from 'react';
import { Typography } from 'antd';
import { ProjectGanttChart } from '@/components/gantt/ProjectGanttChart';
import { WorkItemGanttChart } from '@/components/gantt/WorkItemGanttChart';
import { useProjectStore } from '@/stores/useProjectStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { useI18n } from '@/hooks/useI18n';
import type { Project } from '@/shared/types';

const { Title, Text } = Typography;

type ViewMode = 'projects' | 'workitems';

export function PortfolioPage() {
  const { projects, loadProjects, isLoading: projectsLoading } = useProjectStore();
  const { workItems, loadAllWorkItems, isLoading: workItemsLoading } = useWorkItemStore();
  const { t } = useI18n();

  const [viewMode, setViewMode] = useState<ViewMode>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    // Load data on mount
    loadProjects();
    loadAllWorkItems();
  }, []);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setViewMode('workitems');
  };

  const handleBack = () => {
    setSelectedProject(null);
    setViewMode('projects');
  };

  const handleWorkItemClick = (workItem: any) => {
    // Navigate to work item detail or open modal
    console.log('Work item clicked:', workItem);
    // TODO: Implement work item detail view
  };

  const isLoading = projectsLoading || workItemsLoading;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-theme-border bg-theme-bg-container px-8 py-6">
        <div>
          <Title level={2} className="mb-2">
            {t('portfolio.title')}
          </Title>
          <Text type="secondary">
            {viewMode === 'projects'
              ? 'Overview of all projects and their timelines'
              : `Project timeline: ${selectedProject?.name}`}
          </Text>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-theme-bg-layout">
        {viewMode === 'projects' ? (
          <ProjectGanttChart
            projects={projects}
            workItems={workItems}
            viewMode="month"
            loading={isLoading}
            onProjectClick={handleProjectClick}
            onWorkItemClick={handleWorkItemClick}
          />
        ) : selectedProject ? (
          <WorkItemGanttChart
            project={selectedProject}
            workItems={workItems.filter((w) => w.project_id === selectedProject.id)}
            viewMode="month"
            loading={isLoading}
            onBack={handleBack}
            onWorkItemClick={handleWorkItemClick}
          />
        ) : null}
      </div>
    </div>
  );
}
