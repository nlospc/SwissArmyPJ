import React from 'react';
import { Card, List, Tag } from 'antd';

import type { Project, WorkItem } from '@/shared/types';
import type { WorkbenchModuleDefinition, WorkbenchSnapshot } from '@/shared/types/workbench';

type WorkbenchInspectorCopy = {
  title: string;
  activeModule: string;
  selectedProject: string;
  progress: string;
  workItems: string;
  risks: string;
  nextMilestone: string;
  recentUpdates: string;
  sourceHint: string;
};

interface WorkbenchInspectorProps {
  project: Project;
  snapshot: WorkbenchSnapshot;
  activeModule: WorkbenchModuleDefinition;
  recentUpdates: WorkItem[];
  copy: WorkbenchInspectorCopy;
  variant?: 'panel' | 'drawer';
}

export function WorkbenchInspector({
  project,
  snapshot,
  activeModule,
  recentUpdates,
  copy,
  variant = 'panel',
}: WorkbenchInspectorProps) {
  return (
    <div className="space-y-4">
      <Card title={variant === 'panel' ? <span className="font-semibold">{copy.title}</span> : undefined} size="small">
        <div className="space-y-3 text-sm">
          <div>
            <div className="text-xs text-slate-500">{copy.activeModule}</div>
            <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">{activeModule.label}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">{copy.selectedProject}</div>
            <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">{project.name}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-xs text-slate-500">{copy.progress}</div>
              <div className="mt-1 font-semibold">{snapshot.progress}%</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-xs text-slate-500">{copy.workItems}</div>
              <div className="mt-1 font-semibold">{snapshot.totalWorkItems}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-xs text-slate-500">{copy.risks}</div>
              <div className="mt-1 font-semibold text-red-600">{snapshot.activeRiskCount}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-xs text-slate-500">{copy.nextMilestone}</div>
              <div className="mt-1 font-semibold">{snapshot.nextMilestoneTitle || '-'}</div>
            </div>
          </div>
        </div>
      </Card>

      <Card size="small" title={<span className="font-semibold">{copy.recentUpdates}</span>}>
        <List
          size="small"
          dataSource={recentUpdates.slice(0, 5)}
          locale={{ emptyText: copy.sourceHint }}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={<span className="text-sm">{item.title}</span>}
                description={
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Tag>{item.type}</Tag>
                    <span>{item.updated_at}</span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
