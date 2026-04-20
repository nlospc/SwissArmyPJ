import React, { useEffect, useMemo } from 'react';
import {
  Alert, Avatar, Button, Card, Empty, List, Progress, Space, Tag, Typography,
} from 'antd';
import {
  ArrowLeftOutlined, CalendarOutlined, ClockCircleOutlined,
  FlagOutlined, ProfileOutlined, TeamOutlined, WarningOutlined,
} from '@ant-design/icons';

import { useProjectStore } from '@/stores/useProjectStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { useUIStore } from '@/stores/useUIStore';
import { useI18n } from '@/hooks/useI18n';
import type { Project, WorkItem } from '@/shared/types';

const { Title, Text, Paragraph } = Typography;

const projectStatusColorMap: Record<Project['status'], string> = {
  not_started: 'default',
  in_progress: 'processing',
  done: 'success',
  blocked: 'error',
};

const priorityColorMap: Record<'low' | 'medium' | 'high' | 'critical', string> = {
  low: 'green',
  medium: 'gold',
  high: 'orange',
  critical: 'red',
};

type Copy = {
  back: string;
  empty: string;
  goProjects: string;
  goal: string;
  goalText: string;
  progress: string;
  currentPhase: string;
  nextMilestone: string;
  activeRisks: string;
  collaborators: string;
  currentFacts: string;
  timeline: string;
  portfolio: string;
  tags: string;
  scale: string;
  ungrouped: string;
  noTags: string;
  recentMilestones: string;
  recentUpdates: string;
  riskAlert: string;
  noRisk: string;
  nextSteps: string;
  ownerTbd: string;
  noDescription: string;
  noMilestones: string;
  noUpdates: string;
  search: string;
  statusLabels: Record<Project['status'], string>;
  nextAction1: string;
  nextAction2: string;
  nextAction3: string;
};

const copyByLanguage: Record<'zh' | 'en', Copy> = {
  zh: {
    back: '返回项目列表',
    empty: '先从项目列表选择一个项目',
    goProjects: '去项目列表',
    goal: '工作台目标',
    goalText: '让项目经理在几十秒内看清：当前阶段、关键里程碑、主要风险、最近更新。',
    progress: '整体完成度',
    currentPhase: '当前阶段',
    nextMilestone: '下个里程碑',
    activeRisks: '活跃风险',
    collaborators: '协作人数',
    currentFacts: '项目当前事实',
    timeline: '时间边界',
    portfolio: '项目组合',
    tags: '关键标签',
    scale: '工作包规模',
    ungrouped: '未分组',
    noTags: '暂无标签',
    recentMilestones: '近期里程碑',
    recentUpdates: '最近更新',
    riskAlert: '风险提醒',
    noRisk: '当前没有活跃风险',
    nextSteps: '推荐下一步',
    ownerTbd: '待分配负责人',
    noDescription: '这个项目还没有补充描述。建议先把目标、当前阶段、关键风险写进来。',
    noMilestones: '还没有里程碑',
    noUpdates: '还没有更新记录',
    search: '去搜索',
    statusLabels: {
      not_started: '未开始',
      in_progress: '进行中',
      done: '已完成',
      blocked: '受阻',
    },
    nextAction1: '先补充项目画布，明确目标、范围、关键里程碑。',
    nextAction2: '再补干系人面板，把关键人和沟通策略挂上去。',
    nextAction3: '然后接风险登记册和证据区，形成可追溯闭环。',
  },
  en: {
    back: 'Back to Projects',
    empty: 'Select a project from the list first',
    goProjects: 'Go to Projects',
    goal: 'Workbench Goal',
    goalText: 'Help PMs understand phase, milestones, risks, and recent updates within seconds.',
    progress: 'Overall Progress',
    currentPhase: 'Current Phase',
    nextMilestone: 'Next Milestone',
    activeRisks: 'Active Risks',
    collaborators: 'Collaborators',
    currentFacts: 'Current Project Facts',
    timeline: 'Timeline',
    portfolio: 'Portfolio',
    tags: 'Key Tags',
    scale: 'Work Package Scale',
    ungrouped: 'Ungrouped',
    noTags: 'No tags yet',
    recentMilestones: 'Recent Milestones',
    recentUpdates: 'Recent Updates',
    riskAlert: 'Risk Alerts',
    noRisk: 'No active risks right now',
    nextSteps: 'Recommended Next Steps',
    ownerTbd: 'Owner TBD',
    noDescription: 'This project has no description yet. Start by documenting goals, phase, and key risks.',
    noMilestones: 'No milestones yet',
    noUpdates: 'No recent updates yet',
    search: 'Go to Search',
    statusLabels: {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      done: 'Done',
      blocked: 'Blocked',
    },
    nextAction1: 'Add a project canvas first to clarify goals, scope, and key milestones.',
    nextAction2: 'Then add stakeholder panels so key people and communication strategy are visible.',
    nextAction3: 'After that, connect risk register and evidence areas for a traceable loop.',
  },
};

function formatDate(value: string | null) {
  return value || 'TBD';
}

function sortByDate(items: WorkItem[]) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.end_date || left.start_date || left.updated_at).getTime();
    const rightTime = new Date(right.end_date || right.start_date || right.updated_at).getTime();
    return leftTime - rightTime;
  });
}

export function ProjectWorkbenchPage() {
  const { projects, loadProjects } = useProjectStore();
  const { workItems, loadAllWorkItems } = useWorkItemStore();
  const { selectedProjectId, setCurrentView } = useUIStore();
  const { language } = useI18n();
  const copy = copyByLanguage[language];

  useEffect(() => {
    void Promise.all([loadProjects(), loadAllWorkItems()]);
  }, [loadProjects, loadAllWorkItems]);

  const project = useMemo(
    () => projects.find((item) => item.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  );

  const projectWorkItems = useMemo(() => {
    if (!project) return [];
    return workItems.filter((item) => item.project_id === project.id);
  }, [project, workItems]);

  const metrics = useMemo(() => {
    const milestones = projectWorkItems.filter((item) => item.type === 'milestone');
    const risks = projectWorkItems.filter((item) => item.type === 'issue' || item.type === 'clash');
    const phases = projectWorkItems.filter((item) => item.type === 'phase');
    const completedCount = projectWorkItems.filter((item) => item.status === 'done').length;
    const progress = projectWorkItems.length === 0 ? 0 : Math.round((completedCount / projectWorkItems.length) * 100);
    const currentPhase = phases.find((item) => item.status === 'in_progress') || phases[0] || null;
    const nextMilestone = sortByDate(milestones.filter((item) => item.status !== 'done'))[0] || null;
    const activeRisks = risks.filter((item) => item.status !== 'done');
    const owners = new Set(projectWorkItems.map((item) => item.owner).filter(Boolean)).size;
    const recentUpdates = [...projectWorkItems]
      .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())
      .slice(0, 6);

    return {
      milestones,
      phases,
      progress,
      currentPhase,
      nextMilestone,
      activeRisks,
      owners,
      recentUpdates,
    };
  }, [projectWorkItems]);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 px-8 dark:bg-slate-950">
        <Empty description={copy.empty} image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={() => setCurrentView('projects')}>
            {copy.goProjects}
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 px-8 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <Button icon={<ArrowLeftOutlined />} onClick={() => setCurrentView('projects')}>
              {copy.back}
            </Button>
            <div>
              <Space wrap>
                <Title level={2} className="!mb-0">{project.name}</Title>
                <Tag color={projectStatusColorMap[project.status]}>{copy.statusLabels[project.status]}</Tag>
                {metrics.activeRisks.length > 0 && <Tag color="red">{metrics.activeRisks.length} {copy.activeRisks}</Tag>}
              </Space>
              <Paragraph className="mb-0 mt-2 max-w-4xl text-slate-500 dark:text-slate-400">
                {project.description || copy.noDescription}
              </Paragraph>
            </div>
          </div>

          <Card size="small" className="xl:w-[320px]">
            <Text type="secondary">{copy.goal}</Text>
            <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{copy.goalText}</div>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card><Text type="secondary">{copy.progress}</Text><Progress percent={metrics.progress} className="mt-3" /></Card>
          <Card><Text type="secondary">{copy.currentPhase}</Text><div className="mt-3 text-lg font-semibold">{metrics.currentPhase?.title || '-'}</div></Card>
          <Card><Text type="secondary">{copy.nextMilestone}</Text><div className="mt-3 text-lg font-semibold">{metrics.nextMilestone?.title || '-'}</div></Card>
          <Card><Text type="secondary">{copy.activeRisks}</Text><div className="mt-3 text-lg font-semibold text-red-600">{metrics.activeRisks.length}</div></Card>
          <Card><Text type="secondary">{copy.collaborators}</Text><div className="mt-3 text-lg font-semibold">{metrics.owners || 1}</div></Card>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {/* Current facts */}
            <Card title={<span className="font-semibold">{copy.currentFacts}</span>} extra={<Tag>{project.owner || copy.ownerTbd}</Tag>}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                  <div className="text-xs text-slate-500">{copy.timeline}</div>
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                    <CalendarOutlined /> {formatDate(project.start_date)} → {formatDate(project.end_date)}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                  <div className="text-xs text-slate-500">{copy.portfolio}</div>
                  <div className="mt-2 text-sm font-medium">{project.portfolio_id ? `Portfolio #${project.portfolio_id}` : copy.ungrouped}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                  <div className="text-xs text-slate-500">{copy.tags}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {project.tags?.length ? project.tags.map((tag) => <Tag key={tag}>{tag}</Tag>) : <Text type="secondary">{copy.noTags}</Text>}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                  <div className="text-xs text-slate-500">{copy.scale}</div>
                  <div className="mt-2 text-sm font-medium">{projectWorkItems.length} / {metrics.phases.length} / {metrics.milestones.length}</div>
                </div>
              </div>
            </Card>

            {/* Milestones */}
            <Card title={<span className="font-semibold">{copy.recentMilestones}</span>} extra={<Button type="link" onClick={() => setCurrentView('search')}>{copy.search}</Button>}>
              {metrics.milestones.length === 0 ? (
                <Empty description={copy.noMilestones} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <List
                  dataSource={sortByDate(metrics.milestones).slice(0, 6)}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<FlagOutlined />} />}
                        title={
                          <Space>
                            <span>{item.title}</span>
                            <Tag color={projectStatusColorMap[item.status as Project['status']]}>{copy.statusLabels[item.status as Project['status']]}</Tag>
                          </Space>
                        }
                        description={`${copy.timeline}: ${formatDate(item.end_date || item.start_date)}`}
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>

            {/* Recent updates */}
            <Card title={<span className="font-semibold">{copy.recentUpdates}</span>}>
              {metrics.recentUpdates.length === 0 ? (
                <Empty description={copy.noUpdates} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <List
                  dataSource={metrics.recentUpdates}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<ClockCircleOutlined />} />}
                        title={
                          <Space>
                            <span>{item.title}</span>
                            <Tag>{item.type}</Tag>
                          </Space>
                        }
                        description={`${item.owner || copy.ownerTbd} · ${formatDate(item.updated_at)}`}
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </div>

          {/* Sidebar cards */}
          <div className="space-y-6">
            <Card title={<span className="font-semibold">{copy.riskAlert}</span>}>
              {metrics.activeRisks.length === 0 ? (
                <Alert type="success" showIcon message={copy.noRisk} />
              ) : (
                <div className="space-y-3">
                  {metrics.activeRisks.slice(0, 5).map((risk) => (
                    <div key={risk.id} className="rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">{risk.title}</div>
                          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{risk.owner || copy.ownerTbd}</div>
                        </div>
                        <Tag color={risk.priority ? priorityColorMap[risk.priority as 'low' | 'medium' | 'high' | 'critical'] : 'default'}>
                          {risk.priority || '-'}
                        </Tag>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title={<span className="font-semibold">{copy.nextSteps}</span>}>
              <div className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <div className="flex gap-2"><ProfileOutlined className="mt-1" /> {copy.nextAction1}</div>
                <div className="flex gap-2"><TeamOutlined className="mt-1" /> {copy.nextAction2}</div>
                <div className="flex gap-2"><WarningOutlined className="mt-1" /> {copy.nextAction3}</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
