import React from 'react';
import { CalendarOutlined, ClockCircleOutlined, FlagOutlined } from '@ant-design/icons';
import { Card, Empty, List, Space, Tag, Typography } from 'antd';

import type { Project, WorkItem } from '@/shared/types';

const { Text } = Typography;

const projectStatusColorMap: Record<Project['status'], string> = {
  not_started: 'default',
  in_progress: 'processing',
  done: 'success',
  blocked: 'error',
};

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
  phases: WorkItem[];
  milestones: WorkItem[];
  copy: WorkbenchTimelineCopy;
}

function sortByDate(items: WorkItem[]) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.end_date || left.start_date || left.updated_at).getTime();
    const rightTime = new Date(right.end_date || right.start_date || right.updated_at).getTime();
    return leftTime - rightTime;
  });
}

export function WorkbenchTimelinePanel({ phases, milestones, copy }: WorkbenchTimelinePanelProps) {
  const currentPhase = phases.find((item) => item.status === 'in_progress') || phases[0] || null;
  const nextMilestone = sortByDate(milestones.filter((item) => item.status !== 'done'))[0] || null;
  const recentMilestones = sortByDate(milestones).slice(0, 6);

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-3">
          <div>
            <Text type="secondary">{copy.title}</Text>
            <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{copy.subtitle}</div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
              <div className="text-xs text-slate-500">{copy.currentPhase}</div>
              <div className="mt-2 font-medium text-slate-900 dark:text-slate-100">{currentPhase?.title || copy.noPhase}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
              <div className="text-xs text-slate-500">{copy.nextMilestone}</div>
              <div className="mt-2 font-medium text-slate-900 dark:text-slate-100">{nextMilestone?.title || copy.noMilestones}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
              <div className="text-xs text-slate-500">{copy.timelineSummary}</div>
              <div className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">{phases.length} {copy.phases} / {milestones.length} {copy.milestones}</div>
            </div>
          </div>
        </div>
      </Card>

      <Card title={<span className="font-semibold">{copy.recentMilestones}</span>}>
        {recentMilestones.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={copy.noMilestones} />
        ) : (
          <List
            dataSource={recentMilestones}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<FlagOutlined className="text-slate-400" />}
                  title={
                    <Space>
                      <span>{item.title}</span>
                      <Tag color={projectStatusColorMap[item.status as Project['status']]}>{item.status}</Tag>
                    </Space>
                  }
                  description={
                    <Space size="middle" className="text-xs text-slate-500 dark:text-slate-400">
                      <span><CalendarOutlined /> {item.end_date || item.start_date || 'TBD'}</span>
                      <span><ClockCircleOutlined /> {item.updated_at}</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
