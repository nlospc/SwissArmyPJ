import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Empty,
  Input,
  Progress,
  Segmented,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowRightOutlined,
  CalendarOutlined,
  FolderOpenOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';

import { useProjectStore } from '@/stores/useProjectStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { useUIStore } from '@/stores/useUIStore';
import type { Project, WorkItem } from '@/shared/types';

const { Title, Text, Paragraph } = Typography;

type StatusFilter = 'all' | Project['status'];

const statusLabelMap: Record<Project['status'], string> = {
  not_started: '未开始',
  in_progress: '进行中',
  done: '已完成',
  blocked: '受阻',
};

const statusColorMap: Record<Project['status'], string> = {
  not_started: 'default',
  in_progress: 'processing',
  done: 'success',
  blocked: 'error',
};

function getProjectProgress(workItems: WorkItem[]): number {
  if (workItems.length === 0) return 0;
  const doneCount = workItems.filter((item) => item.status === 'done').length;
  return Math.round((doneCount / workItems.length) * 100);
}

function getProjectHealth(project: Project, workItems: WorkItem[]) {
  const blockedItems = workItems.filter((item) => item.status === 'blocked').length;
  const criticalRisks = workItems.filter(
    (item) => (item.type === 'issue' || item.type === 'clash') && item.priority === 'critical',
  ).length;

  if (project.status === 'blocked' || blockedItems > 0 || criticalRisks > 0) {
    return { label: '高风险', color: 'red' as const };
  }

  if (project.status === 'in_progress') {
    return { label: '推进中', color: 'blue' as const };
  }

  if (project.status === 'done') {
    return { label: '稳定', color: 'green' as const };
  }

  return { label: '待启动', color: 'default' as const };
}

function getNextMilestone(workItems: WorkItem[]): WorkItem | null {
  return workItems
    .filter((item) => item.type === 'milestone' && item.end_date)
    .sort((left, right) => new Date(left.end_date || 0).getTime() - new Date(right.end_date || 0).getTime())[0] || null;
}

export function ProjectsPage() {
  const { projects, loadProjects, isLoading } = useProjectStore();
  const { workItems, loadAllWorkItems } = useWorkItemStore();
  const { selectedProjectId, setSelectedProjectId, setCurrentView } = useUIStore();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    void Promise.all([loadProjects(), loadAllWorkItems()]);
  }, [loadProjects, loadAllWorkItems]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const haystack = [project.name, project.owner || '', project.description || '', ...(project.tags || [])]
        .join(' ')
        .toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [projects, query, statusFilter]);

  const summary = useMemo(() => {
    const active = projects.filter((project) => project.status === 'in_progress').length;
    const blocked = projects.filter((project) => project.status === 'blocked').length;
    const done = projects.filter((project) => project.status === 'done').length;
    const owners = new Set(projects.map((project) => project.owner).filter(Boolean)).size;

    return { total: projects.length, active, blocked, done, owners };
  }, [projects]);

  return (
    <div className="h-full overflow-auto bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-8 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Title level={2} className="mb-1">项目列表</Title>
            <Paragraph className="mb-0 text-slate-500 dark:text-slate-400">
              先找到项目，再进入工作台维护项目当前事实。
            </Paragraph>
          </div>

          <Space wrap>
            <Input
              allowClear
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索项目名、负责人、标签"
              prefix={<SearchOutlined />}
              style={{ width: 320 }}
            />
            <Segmented<StatusFilter>
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { label: '全部', value: 'all' },
                { label: '进行中', value: 'in_progress' },
                { label: '受阻', value: 'blocked' },
                { label: '未开始', value: 'not_started' },
                { label: '已完成', value: 'done' },
              ]}
            />
          </Space>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <Text type="secondary">项目总数</Text>
            <div className="mt-2 text-3xl font-semibold">{summary.total}</div>
          </Card>
          <Card>
            <Text type="secondary">推进中</Text>
            <div className="mt-2 text-3xl font-semibold text-blue-600">{summary.active}</div>
          </Card>
          <Card>
            <Text type="secondary">受阻</Text>
            <div className="mt-2 text-3xl font-semibold text-red-600">{summary.blocked}</div>
          </Card>
          <Card>
            <Text type="secondary">已完成</Text>
            <div className="mt-2 text-3xl font-semibold text-green-600">{summary.done}</div>
          </Card>
          <Card>
            <Text type="secondary">负责人</Text>
            <div className="mt-2 text-3xl font-semibold">{summary.owners}</div>
          </Card>
        </div>

        <Card
          title={<span className="font-semibold">当前项目</span>}
          loading={isLoading}
          bodyStyle={{ padding: 16 }}
        >
          {filteredProjects.length === 0 ? (
            <Empty description="没有符合条件的项目" />
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project) => {
                const projectWorkItems = workItems.filter((item) => item.project_id === project.id);
                const progress = getProjectProgress(projectWorkItems);
                const nextMilestone = getNextMilestone(projectWorkItems);
                const health = getProjectHealth(project, projectWorkItems);
                const isSelected = selectedProjectId === project.id;

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setCurrentView('workbench');
                    }}
                    className={[
                      'w-full rounded-2xl border bg-white p-5 text-left transition-all dark:bg-slate-900',
                      isSelected
                        ? 'border-blue-500 shadow-sm ring-2 ring-blue-100 dark:ring-blue-900/40'
                        : 'border-slate-200 hover:border-blue-300 hover:shadow-sm dark:border-slate-800',
                    ].join(' ')}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Title level={4} className="!mb-0">{project.name}</Title>
                          <Tag color={statusColorMap[project.status]}>{statusLabelMap[project.status]}</Tag>
                          <Tag color={health.color}>{health.label}</Tag>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                          <span><TeamOutlined /> {project.owner || '待分配负责人'}</span>
                          <span><FolderOpenOutlined /> {project.portfolio_id ? `组合 #${project.portfolio_id}` : '未分组'}</span>
