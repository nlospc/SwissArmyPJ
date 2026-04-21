/**

 * Portfolio Page with Table and Timeline Views

 * Displays all projects in both table and interactive Gantt chart

 */



import React, { useState, useEffect, useRef, useCallback } from 'react';

import { ExcelGanttChart } from '@/components/gantt/ExcelGanttChart';

import { WorkItemExcelGantt } from '@/components/gantt/WorkItemExcelGantt';

import { ProjectsTableView } from '@/components/portfolio/ProjectsTableView';

import { useProjectStore } from '@/stores/useProjectStore';

import { useWorkItemStore } from '@/stores/useWorkItemStore';

import { useI18n } from '@/hooks/useI18n';

import type { Project } from '@/shared/types';



type ViewMode = 'projects' | 'workitems';

// Excel-like Gantt Chart Split Pane Component

// - Left pane: frozen (vertical scroll only)

// - Right pane: timeline (horizontal + vertical scroll)

// - Vertical scroll is synchronized between panes

interface ResizableSplitPaneProps {

  left: React.ReactNode;

  right: React.ReactNode;

  defaultLeftWidth?: number;

  minLeftWidth?: number;

  maxLeftWidth?: number;

}



function ResizableSplitPane({

  left,

  right,

  defaultLeftWidth = 40,

  minLeftWidth = 20,

  maxLeftWidth = 60,

}: ResizableSplitPaneProps) {

  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);

  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const leftPaneRef = useRef<HTMLDivElement>(null);

  const rightPaneRef = useRef<HTMLDivElement>(null);



  // Handle resize

  const handleMouseDown = useCallback((e: React.MouseEvent) => {

    e.preventDefault();

    setIsDragging(true);

  }, []);



  useEffect(() => {

    const handleMouseMove = (e: MouseEvent) => {

      if (!isDragging || !containerRef.current) return;



      const containerRect = containerRef.current.getBoundingClientRect();

      const containerWidth = containerRect.width;

      const newLeftWidth = ((e.clientX - containerRect.left) / containerWidth) * 100;



      const clampedWidth = Math.max(

        minLeftWidth,

        Math.min(maxLeftWidth, newLeftWidth)

      );



      setLeftWidth(clampedWidth);

    };



    const handleMouseUp = () => {

      setIsDragging(false);

    };



    if (isDragging) {

      document.addEventListener('mousemove', handleMouseMove);

      document.addEventListener('mouseup', handleMouseUp);

      

      return () => {

        document.removeEventListener('mousemove', handleMouseMove);

        document.removeEventListener('mouseup', handleMouseUp);

      };

    }

  }, [isDragging, minLeftWidth, maxLeftWidth]);



  // Synchronize vertical scroll from left to right

  const handleLeftScroll = useCallback(() => {

    if (!leftPaneRef.current || !rightPaneRef.current) return;

    

    const leftScrollTop = leftPaneRef.current.scrollTop;

    rightPaneRef.current.scrollTop = leftScrollTop;

  }, []);



  // Synchronize vertical scroll from right to left

  const handleRightScroll = useCallback(() => {

    if (!leftPaneRef.current || !rightPaneRef.current) return;

    

    const rightScrollTop = rightPaneRef.current.scrollTop;

    leftPaneRef.current.scrollTop = rightScrollTop;

  }, []);



  return (

    <div 

      ref={containerRef}

      className="flex h-full w-full overflow-hidden"

    >

      {/* Left Pane - Frozen (vertical scroll only) */}

      <div

        ref={leftPaneRef}

        style={{ width: leftWidth + '%' }}

        className="flex-shrink-0 overflow-y-auto overflow-x-hidden border-r border-gray-200 dark:border-gray-700"

        onScroll={handleLeftScroll}

      >

        {left}

      </div>



      {/* Resizable Divider */}

      <div

        className={`

          flex-shrink-0 w-1 cursor-col-resize bg-gray-200 dark:bg-gray-700

          hover:bg-blue-500 transition-colors relative z-10 flex-shrink-0

          ${isDragging ? 'bg-blue-500' : ''}

        `}

        onMouseDown={handleMouseDown}

      >

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-8 -ml-1.5 bg-gray-400 hover:bg-blue-500 rounded flex items-center justify-center">

          <div className="w-0.5 h-4 bg-white dark:bg-gray-600 mx-0.5"></div>

        </div>

      </div>



      {/* Right Pane - Timeline (horizontal + vertical scroll) */}

      <div 

        ref={rightPaneRef}

        className="flex-1 overflow-auto"

        onScroll={handleRightScroll}

      >

        {right}

      </div>

    </div>

  );

}



export function PortfolioPage() {

  const { projects, loadProjects, isLoading: projectsLoading } = useProjectStore();

  const { workItems = [], loadAllWorkItems, isLoading: workItemsLoading, isSaving } = useWorkItemStore();

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

  const handleProjectUpdate = async (projectId: number, updates: Partial<Project>) => {
    // Update project in the store (will sync both table and timeline)
    const { updateProject } = useProjectStore.getState();
    await updateProject(projectId, updates);
  };

  const handleWorkItemUpdate = async (workItemId: number, updates: Partial<any>) => {
    const { updateWorkItem } = useWorkItemStore.getState();
    return await updateWorkItem(workItemId, updates);
  };

  const handleWorkItemCreate = async (dto: any) => {
    const { createWorkItem } = useWorkItemStore.getState();
    return await createWorkItem(dto);
  };

  const handleWorkItemDelete = async (workItemId: number) => {
    const { deleteWorkItem } = useWorkItemStore.getState();
    return await deleteWorkItem(workItemId);
  };



  const isLoading = projectsLoading || workItemsLoading;

  return (
    <div className="h-full flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900 min-h-0">

        {viewMode === 'projects' ? (
          <div className="h-full p-4">
            <ExcelGanttChart
              projects={projects}
              workItems={workItems}
              loading={isLoading}
              onProjectClick={handleProjectClick}
              onProjectUpdate={handleProjectUpdate}
              viewMode="month"
            />
          </div>
        ) : selectedProject ? (
          <div className="h-full">
            <WorkItemExcelGantt
              project={selectedProject}
              workItems={workItems.filter((w) => w.project_id === selectedProject.id)}
              loading={isLoading}
              isSaving={isSaving}
              onBack={handleBack}
              onWorkItemUpdate={handleWorkItemUpdate}
              onWorkItemCreate={handleWorkItemCreate}
              onWorkItemDelete={handleWorkItemDelete}
            />
          </div>
        ) : null}

      </div>
    </div>
  );
}
