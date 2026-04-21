import React from 'react';
import { ArrowLeftOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Progress, Space, Tag, Typography } from 'antd';

import type { Project } from '@/shared/types';
import type { WorkbenchSnapshot } from '@/shared/types/workbench';

const { Title, Text, Paragraph } = Typography;

const statusColorMap: Record<Project['status'], string> = {
  not_started: 'default',
  in_progress: 'processing',
  done: 'success',
  blocked: 'error',
};

type WorkbenchHeaderCopy = {
  back: string;
  ownerTbd: string;
  noDescription: string;
  progress: string;
  currentPhase: string;
  nextMilestone: string;
  statusLabels: Record<Project['status'], string>;
};

interface WorkbenchHeaderProps {
  project: Project;
  snapshot: WorkbenchSnapshot;
  copy: WorkbenchHeaderCopy;
  onBack: () => void;
}

export function WorkbenchHeader({ project, snapshot, copy, onBack }: WorkbenchHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800/80 xl:flex-row xl:items-start xl:justify-between">
      <div className="space-y-3">
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          {copy.back}
        </Button>

        <div className="space-y-3">
          <Space wrap>
            <Title level={2} className="!mb-0">{project.name}</Title>
            <Tag color={statusColorMap[project.status]}>{copy.statusLabels[project.status]}</Tag>
            {snapshot.activeRiskCount > 0 && <Tag color="red">{snapshot.activeRiskCount}</Tag>}
          </Space>

          <Paragraph className="mb-0 max-w-4xl text-slate-500 dark:text-slate-400">
            {project.description || copy.noDescription}
          </Paragraph>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span><UserOutlined /> {project.owner || copy.ownerTbd}</span>
            <span><CalendarOutlined /> {(project.start_date || 'TBD')} → {(project.end_date || 'TBD')}</span>
          </div>
        </div>
      </div>

      <Card size="small" className="xl:w-[360px]">
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Text type="secondary">{copy.progress}</Text>
              <Text>{snapshot.progress}%</Text>
            </div>
            <Progress percent={snapshot.progress} size="small" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-xs text-slate-500">{copy.currentPhase}</div>
              <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">{snapshot.currentPhaseTitle || '-'}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-xs text-slate-500">{copy.nextMilestone}</div>
              <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">{snapshot.nextMilestoneTitle || '-'}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
