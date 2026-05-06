import React from 'react';
import { ArrowLeftOutlined, MoreOutlined, PlusOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Dropdown, Progress, Space, Tag, Typography } from 'antd';

import type { Project } from '@/shared/types';
import type { WorkbenchSnapshot } from '@/shared/types/workbench';

const { Text } = Typography;

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
    <div data-sap-workbench-header className="flex h-[52px] shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex min-w-0 items-center gap-3">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} aria-label={copy.back} />

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <Text strong className="max-w-[360px] truncate text-base text-slate-950 dark:text-slate-50">
              {project.name}
            </Text>
            <Tag color={statusColorMap[project.status]} className="shrink-0">
              {copy.statusLabels[project.status]}
            </Tag>
            {snapshot.activeRiskCount > 0 && (
              <Tag color="red" className="shrink-0">
                {snapshot.activeRiskCount}
              </Tag>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <UserOutlined />
            <span className="truncate">{project.owner || copy.ownerTbd}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="hidden w-40 items-center gap-2 md:flex">
          <Text type="secondary" className="text-xs">
            {copy.progress}
          </Text>
          <Progress percent={snapshot.progress} size="small" showInfo={false} className="mb-0 flex-1" />
          <Text className="text-xs">{snapshot.progress}%</Text>
        </div>
        <Space size={8}>
          <Button icon={<RobotOutlined />}>AI Suggest</Button>
          <Button type="primary" icon={<PlusOutlined />}>
            Add Item
          </Button>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'phase', label: copy.currentPhase },
                { key: 'milestone', label: copy.nextMilestone },
                { key: 'description', label: project.description || copy.noDescription },
              ],
            }}
          >
            <Button type="text" icon={<MoreOutlined />} aria-label="More actions" />
          </Dropdown>
        </Space>
      </div>
    </div>
  );
}
