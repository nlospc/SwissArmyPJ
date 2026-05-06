import React from 'react';

import { WorkItemExcelGantt } from '@/components/gantt/WorkItemExcelGantt';
import type { CreateWorkItemDTO, Project, UpdateWorkItemDTO, WorkItem } from '@/shared/types';

type WorkbenchTimelineCopy = {
  title: string;
  subtitle: string;
  currentPhase: string;
  nextMilestone: string;
  recentMilestones: string;
  noPhase: string;
  noMilestones: string;
  timelineSummary: string;
  phases: string;
  milestones: string;
};

interface WorkbenchTimelinePanelProps {
  project: Project;
  workItems: WorkItem[];
  phases: WorkItem[];
  milestones: WorkItem[];
  copy: WorkbenchTimelineCopy;
  loading?: boolean;
  isSaving?: boolean;
  onWorkItemUpdate: (id: number, data: UpdateWorkItemDTO) => Promise<{ success: boolean; error?: string }>;
  onWorkItemCreate: (data: CreateWorkItemDTO) => Promise<{ success: boolean; error?: string }>;
  onWorkItemDelete: (id: number) => Promise<{ success: boolean; error?: string }>;
}

export function WorkbenchTimelinePanel({
  project,
  workItems,
  loading,
  isSaving,
  onWorkItemUpdate,
  onWorkItemCreate,
  onWorkItemDelete,
}: WorkbenchTimelinePanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-slate-950">
      <WorkItemExcelGantt
        key={`workitem-gantt-${project.id}`}
        project={project}
        workItems={workItems}
        loading={loading}
        isSaving={isSaving}
        onWorkItemUpdate={onWorkItemUpdate}
        onWorkItemCreate={onWorkItemCreate}
        onWorkItemDelete={onWorkItemDelete}
      />
    </div>
  );
}
