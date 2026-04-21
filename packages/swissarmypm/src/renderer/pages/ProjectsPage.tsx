import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightOutlined,
  CalendarOutlined,
  FolderOpenOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Button, Card, Empty, Input, Progress, Segmented, Space, Tag, Typography } from 'antd';

import { useI18n } from '@/hooks/useI18n';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUIStore } from '@/stores/useUIStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import type { Project, WorkItem } from '@/shared/types';

const { Title, Text, Paragraph } = Typography;

type StatusFilter = 'all' | Project['status'];

type Copy = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  currentProjects: string;
  noProjects: string;
  total: string;
  active: string;
  blocked: string;
  done: string;
  owners: string;
  progress: string;
  workItems: string;
  nextMilestone: string;
  openWorkbench: string;
  noMilestone: string;
  unassignedOwner: string;
  ungrouped: string;
  healthBlocked: string;
  healthMoving: string;
  healthStable: string;
  healthPending: string;
  statusLabels: Record<Project['status'], string>;
  filterLabels: Record<StatusFilter, string>;
};

const copyByLanguage: Record<'zh' | 'en', Copy> = {
  zh: {
    title: '项目列表',
    subtitle: '项目列表是进入 Project Workspace 的入口。先找到项目，再进入工作台维护项目当前事实。',
    searchPlaceholder: '搜索项目名、负责人、标签',
    currentProjects: '当前项目',
    noProjects: '没有符合条件的项目',
    total: '项目总数',
    active: '推进中',
    blocked: '受阻',
    done: '已完成',
    owners: '负责人',
    progress: '完成度',
    workItems: '工作项',
    nextMilestone: '下个里程碑',
    openWorkbench: '进入工作台',
    noMilestone: '暂无',
    unassignedOwner: '待分配负责人',
    ungrouped: '未分组',
    healthBlocked: '高风险',
    healthMoving: '推进中',
    healthStable: '稳定',
    healthPending: '待启动',
    statusLabels: {
      not_started: '未开始',
      in_progress: '进行中',
      done: '已完成',
      blocked: '受阻',
    },
    filterLabels: {
      all: '全部',
      not_started: '未开始',
      in_progress: '进行中',
      done: '已完成',
      blocked: '受阻',
    },
  },
  en: {
    title: 'Projects',
    subtitle: 'Projects is the entry point into the Project Workspace. Start from a project, then maintain current facts in the workbench.',
    searchPlaceholder: 'Search by project, owner, or tag',
    currentProjects: 'Current Projects',
    noProjects: 'No projects match the current filter',
    total: 'Total Projects',
    active: 'Active',
    blocked: 'Blocked',
    done: 'Done',
    owners: 'Owners',
    progress: 'Progress',
    workItems: 'Work Items',
    nextMilestone: 'Next Milestone',
    openWorkbench: 'Open Workbench',
    noMilestone: 'None',
    unassignedOwner: 'Owner TBD',
    ungrouped: 'Ungrouped',
    healthBlocked: 'High Risk',
    healthMoving: 'Moving',
    healthStable: 'Stable',
    healthPending: 'Pending',
    statusLabels: {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      done: 'Done',
      blocked: 'Blocked',
    },
    filterLabels: {
      all: 'All',
      not_started: 'Not Started',
      in_progress: 'In Progress',
      done: 'Done',
      blocked: 'Blocked',
    },
  },
};

const statusColorMap: Record<Project['status'], string> = {
  not_started: 'default',
  in_progress: 'processing',
  done: 'success',
  blocked: 'error',
};

function sortByDate(items: WorkItem[]) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.end_date || left.start_date || left.updated_at).getTime();
    const rightTime = new Date(right.end_date || right.start_date || right.updated_at).getTime();
    return leftTime - rightTime;
  });
}

function getProjectProgress(workItems: WorkItem[]): number {
  if (workItems.length === 0) return 0;
  const doneCount = workItems.filter((item) => item.status === 'done').length;
  return Math.round((doneCount / workItems.length) * 100);
}

function getProjectHealth(project: Project, workItems: WorkItem[], copy: Copy) {
  const blockedItems = workItems.filter((item) => item.status === 'blocked').length;
  const criticalRisks = workItems.filter(
    (item) => (item.type === 'issue' || item.type === 'clash') && item.priority === 'critical',
  ).length;

  if (project.status === 'blocked' || blockedItems > 0 || criticalRisks > 0) {
    return { label: copy.healthBlocked, color: 'red' as const };
  }

  if (project.status === 'in_progress') {
    return { label: copy.healthMoving, color: 'blue' as const };
  }

  if (project.status === 'done') {
    return { label: copy.healthStable, color: 'green' as const };
  }

  return { label: copy.healthPending, color: 'default' as const };
}

function getNextMilestone(workItems: WorkItem[]): WorkItem | null {
  const milestones = sortByDate(
    workItems.filter((item) => item.type === 'milestone' && item.status !== 'done'),
  );
  return milestones[0] || null;
}

export function ProjectsPage() {
  const { projects, loadProjects, isLoading } = useProjectStore();
  const { workItems, loadAllWorkItems } = useWorkItemStore();
  const { selectedProjectId, setSelectedProjectId, setCurrentView } = useUIStore();
  const { language } = useI18n();
  const copy = copyByLanguage[language];

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    void Promise.all([loadProjects(), loadAllWorkItems()]);
  }, [loadProjects, loadAllWorkItems]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return projects.filter((project) => {
      const haystack = [project.name, project.owner || '', project.description || '', ...(project.tags || [])]
        .join(' ')
        .toLowerCase();
      const matchesQuery = normalizedQuery.length === 0 || haystack.includes(normalizedQuery);
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
            <Title level={2} className="mb-1">{copy.title}</Title>
            <Paragraph className="mb-0 text-slate-500 dark:text-slate-400">
              {copy.subtitle}
            </Paragraph>
          </div>

          <Space wrap>
            <Input
              allowClear
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              prefix={<SearchOutlined />}
              style={{ width: 320 }}
            />
            <Segmented<StatusFilter>
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { label: copy.filterLabels.all, value: 'all' },
                { label: copy.filterLabels.in_progress, value: 'in_progress' },
                { label: copy.filterLabels.blocked, value: 'blocked' },
                { label: copy.filterLabels.not_started, value: 'not_started' },
                { label: copy.filterLabels.done, value: 'done' },
              ]}
            />
          </Space>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <Text type="secondary">{copy.total}</Text>
            <div className="mt-2 text-3xl font-semibold">{summary.total}</div>
          </Card>
          <Card>
            <Text type="secondary">{copy.active}</Text>
            <div className="mt-2 text-3xl font-semibold text-blue-600">{summary.active}</div>
          </Card>
          <Card>
            <Text type="secondary">{copy.blocked}</Text>
            <div className="mt-2 text-3xl font-semibold text-red-600">{summary.blocked}</div>
          </Card>
          <Card>
            <Text type="secondary">{copy.done}</Text>
            <div className="mt-2 text-3xl font-semibold text-green-600">{summary.done}</div>
          </Card>
          <Card>
            <Text type="secondary">{copy.owners}</Text>
            <div className="mt-2 text-3xl font-semibold">{summary.owners}</div>
          </Card>
        </div>

        <Card title={<span className="font-semibold">{copy.currentProjects}</span>} loading={isLoading}>
          {filteredProjects.length === 0 ? (
            <Empty description={copy.noProjects} />
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => {
                const projectWorkItems = workItems.filter((item) => item.project_id === project.id);
                const progress = getProjectProgress(projectWorkItems);
                const nextMilestone = getNextMilestone(projectWorkItems);
                const health = getProjectHealth(project, projectWorkItems, copy);
                const isSelected = selectedProjectId === project.id;

                return (
                  <div
                    key={project.id}
                    className={[
                      'rounded-2xl border p-5 transition-all',
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 shadow-sm dark:border-blue-500 dark:bg-blue-950/20'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900',
                    ].join(' ')}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Title level={4} className="!mb-0">{project.name}</Title>
                          <Tag color={statusColorMap[project.status]}>{copy.statusLabels[project.status]}</Tag>
                          <Tag color={health.color}>{health.label}</Tag>
                        </div>

                        <Paragraph className="mb-0 mt-3 text-slate-500 dark:text-slate-400">
                          {project.description || '-'}
                        </Paragraph>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                          <span><TeamOutlined /> {project.owner || copy.unassignedOwner}</span>
                          <span><FolderOpenOutlined /> {project.portfolio_id ? `#${project.portfolio_id}` : copy.ungrouped}</span>
                          <span><CalendarOutlined /> {nextMilestone?.title || copy.noMilestone}</span>
                        </div>

                        {project.tags && project.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {project.tags.map((tag) => (
                              <Tag key={tag}>{tag}</Tag>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="w-full space-y-3 xl:w-[280px]">
                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <Text type="secondary">{copy.progress}</Text>
                            <Text>{progress}%</Text>
                          </div>
                          <Progress percent={progress} size="small" />
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                            <Text type="secondary">{copy.workItems}</Text>
                            <div className="mt-1 text-lg font-semibold">{projectWorkItems.length}</div>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                            <Text type="secondary">{copy.nextMilestone}</Text>
                            <div className="mt-1 truncate text-sm font-semibold">
                              {nextMilestone?.end_date || nextMilestone?.start_date || copy.noMilestone}
                            </div>
                          </div>
                        </div>

                        <Button
                          type={isSelected ? 'primary' : 'default'}
                          icon={<ArrowRightOutlined />}
                          block
                          onClick={() => {
                            setSelectedProjectId(project.id);
                            setCurrentView('workbench');
                          }}
                        >
                          {copy.openWorkbench}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
