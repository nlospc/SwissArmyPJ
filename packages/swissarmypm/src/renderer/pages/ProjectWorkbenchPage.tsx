import React, { useEffect, useMemo, useState } from 'react';
import { AppstoreOutlined, DeploymentUnitOutlined, FileSearchOutlined, FlagOutlined, InfoCircleOutlined, ProfileOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Card, Drawer, Empty, Typography } from 'antd';

import { WorkbenchCanvasPanel } from '@/features/workbench/components/WorkbenchCanvasPanel';
import { WorkbenchHeader } from '@/features/workbench/components/WorkbenchHeader';
import { WorkbenchInspector } from '@/features/workbench/components/WorkbenchInspector';
import { WorkbenchPlaceholderPanel } from '@/features/workbench/components/WorkbenchPlaceholderPanel';
import { WorkbenchRiskPanel } from '@/features/workbench/components/WorkbenchRiskPanel';
import { WorkbenchTimelinePanel } from '@/features/workbench/components/WorkbenchTimelinePanel';
import { useI18n } from '@/hooks/useI18n';
import { useWorkbenchLayoutMode } from '@/hooks/useWorkbenchLayoutMode';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUIStore } from '@/stores/useUIStore';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import type { Project, WorkItem } from '@/shared/types';
import type { WorkbenchModuleDefinition, WorkbenchModuleKey, WorkbenchSnapshot } from '@/shared/types/workbench';

const { Text } = Typography;

type Copy = {
  back: string;
  empty: string;
  goProjects: string;
  ownerTbd: string;
  noDescription: string;
  progress: string;
  currentPhase: string;
  nextMilestone: string;
  statusLabels: Record<Project['status'], string>;
  railTitle: string;
  modules: Record<WorkbenchModuleKey, { label: string; description: string }>;
  canvas: {
    title: string;
    subtitle: string;
    currentFacts: string;
    owner: string;
    portfolio: string;
    tags: string;
    health: string;
    noTags: string;
    ungrouped: string;
    healthy: string;
    caution: string;
    critical: string;
    keySignals: string;
    progress: string;
    workItems: string;
    activeRisks: string;
    nextMilestone: string;
    emptyMilestones: string;
    emptyRisks: string;
  };
  timeline: {
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
  risks: {
    title: string;
    subtitle: string;
    activeRisks: string;
    criticalRisks: string;
    noRisks: string;
    ownerTbd: string;
    status: string;
  };
  inspector: {
    title: string;
    activeModule: string;
    selectedProject: string;
    progress: string;
    workItems: string;
    risks: string;
    nextMilestone: string;
    recentUpdates: string;
    openDrawer: string;
    sourceHint: string;
  };
};

const copyByLanguage: Record<'zh' | 'en', Copy> = {
  zh: {
    back: '返回项目列表',
    empty: '先从项目列表选择一个项目',
    goProjects: '去项目列表',
    ownerTbd: '待分配负责人',
    noDescription: '这个项目还没有补充描述。建议先把目标、范围、关键风险写进来。',
    progress: '整体完成度',
    currentPhase: '当前阶段',
    nextMilestone: '下个里程碑',
    statusLabels: {
      not_started: '未开始',
      in_progress: '进行中',
      done: '已完成',
      blocked: '受阻',
    },
    railTitle: '项目工作区',
    modules: {
      canvas: { label: '项目画布', description: '项目当前事实与总体判断' },
      stakeholders: { label: '干系人', description: '关键角色、支持度与沟通动作' },
      timeline: { label: '时间计划', description: '阶段、里程碑与关键时间边界' },
      risks: { label: '风险登记册', description: '活跃风险、阻塞与跟进动作' },
      'work-packages': { label: '工作包', description: '执行台账、责任与交付' },
      evidence: { label: '证据', description: '会议、邮件与来源追踪' },
    },
    canvas: {
      title: '项目画布',
      subtitle: '把项目目标、当前状态、关键里程碑和主要风险放在同一块画布里，保证 PM 先看到当前真相。',
      currentFacts: '当前事实',
      owner: '负责人',
      portfolio: '项目组合',
      tags: '关键标签',
      health: '项目健康度',
      noTags: '暂无标签',
      ungrouped: '未分组',
      healthy: '稳定',
      caution: '需关注',
      critical: '高风险',
      keySignals: '关键指标',
      progress: '推进度',
      workItems: '工作项',
      activeRisks: '活跃风险',
      nextMilestone: '下个里程碑',
      emptyMilestones: '还没有里程碑',
      emptyRisks: '当前没有活跃风险',
    },
    timeline: {
      title: '时间计划',
      subtitle: '先落时间骨架：阶段、里程碑与最近计划变动。后续可继续接入 gantt 和更完整的 timeline 编辑。',
      currentPhase: '当前阶段',
      nextMilestone: '下个里程碑',
      recentMilestones: '近期里程碑',
      noPhase: '待补充',
      noMilestones: '还没有里程碑',
      timelineSummary: '时间结构',
      phases: '阶段',
      milestones: '里程碑',
    },
    risks: {
      title: '风险登记册',
      subtitle: '把 issue / clash 先收拢成风险骨架，主工作台里先让 PM 一眼看见活跃风险与优先级。',
      activeRisks: '活跃风险',
      criticalRisks: '关键风险',
      noRisks: '当前没有活跃风险',
      ownerTbd: '待分配负责人',
      status: '状态',
    },
    inspector: {
      title: '上下文面板',
      activeModule: '当前模块',
      selectedProject: '当前项目',
      progress: '推进度',
      workItems: '工作项',
      risks: '风险',
      nextMilestone: '下个里程碑',
      recentUpdates: '最近更新',
      openDrawer: '打开上下文面板',
      sourceHint: '后续这里承接来源、关联对象与最近更新。',
    },
  },
  en: {
    back: 'Back to Projects',
    empty: 'Select a project from the list first',
    goProjects: 'Go to Projects',
    ownerTbd: 'Owner TBD',
    noDescription: 'This project has no description yet. Start by documenting goals, scope, and key risks.',
    progress: 'Overall Progress',
    currentPhase: 'Current Phase',
    nextMilestone: 'Next Milestone',
    statusLabels: {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      done: 'Done',
      blocked: 'Blocked',
    },
    railTitle: 'Project Workspace',
    modules: {
      canvas: { label: 'Project Canvas', description: 'Current truth and PM summary' },
      stakeholders: { label: 'Stakeholders', description: 'Roles, support level, communication actions' },
      timeline: { label: 'Timeline Plan', description: 'Phases, milestones, and key dates' },
      risks: { label: 'Risk Register', description: 'Active risks, blockers, and next actions' },
      'work-packages': { label: 'Work Packages', description: 'Execution ledger, owners, deliverables' },
      evidence: { label: 'Evidence', description: 'Meetings, emails, and source traceability' },
    },
    canvas: {
      title: 'Project Canvas',
      subtitle: 'Keep goals, current status, milestones, and top risks in one canvas so PMs start from the current truth.',
      currentFacts: 'Current Facts',
      owner: 'Owner',
      portfolio: 'Portfolio',
      tags: 'Tags',
      health: 'Project Health',
      noTags: 'No tags yet',
      ungrouped: 'Ungrouped',
      healthy: 'Stable',
      caution: 'Needs Attention',
      critical: 'High Risk',
      keySignals: 'Key Signals',
      progress: 'Progress',
      workItems: 'Work Items',
      activeRisks: 'Active Risks',
      nextMilestone: 'Next Milestone',
      emptyMilestones: 'No milestones yet',
      emptyRisks: 'No active risks right now',
    },
    timeline: {
      title: 'Timeline Plan',
      subtitle: 'Establish the time skeleton first: phases, milestones, and recent planning changes. Gantt editing can attach next.',
      currentPhase: 'Current Phase',
      nextMilestone: 'Next Milestone',
      recentMilestones: 'Recent Milestones',
      noPhase: 'To be added',
      noMilestones: 'No milestones yet',
      timelineSummary: 'Timeline Structure',
      phases: 'phases',
      milestones: 'milestones',
    },
    risks: {
      title: 'Risk Register',
      subtitle: 'Start by consolidating issue / clash records into a visible risk skeleton so PMs can see active risk and priority at a glance.',
      activeRisks: 'Active Risks',
      criticalRisks: 'Critical Risks',
      noRisks: 'No active risks right now',
      ownerTbd: 'Owner TBD',
      status: 'Status',
    },
    inspector: {
      title: 'Context Panel',
      activeModule: 'Active Module',
      selectedProject: 'Selected Project',
      progress: 'Progress',
      workItems: 'Work Items',
      risks: 'Risks',
      nextMilestone: 'Next Milestone',
      recentUpdates: 'Recent Updates',
      openDrawer: 'Open Context Panel',
      sourceHint: 'This panel will later hold source links, related records, and recent changes.',
    },
  },
};

const moduleIcons: Record<WorkbenchModuleKey, React.ReactNode> = {
  canvas: <AppstoreOutlined />,
  stakeholders: <TeamOutlined />,
  timeline: <DeploymentUnitOutlined />,
  risks: <FlagOutlined />,
  'work-packages': <ProfileOutlined />,
  evidence: <FileSearchOutlined />,
};

function sortByDate(items: WorkItem[]) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.end_date || left.start_date || left.updated_at).getTime();
    const rightTime = new Date(right.end_date || right.start_date || right.updated_at).getTime();
    return leftTime - rightTime;
  });
}

function buildSnapshot(projectId: number, workItems: WorkItem[]): WorkbenchSnapshot {
  const milestones = workItems.filter((item) => item.type === 'milestone');
  const phases = workItems.filter((item) => item.type === 'phase');
  const activeRisks = workItems.filter((item) => (item.type === 'issue' || item.type === 'clash') && item.status !== 'done');
  const completedCount = workItems.filter((item) => item.status === 'done').length;
  const progress = workItems.length === 0 ? 0 : Math.round((completedCount / workItems.length) * 100);
  const currentPhase = phases.find((item) => item.status === 'in_progress') || phases[0] || null;
  const nextMilestone = sortByDate(milestones.filter((item) => item.status !== 'done'))[0] || null;
  const collaboratorCount = new Set(workItems.map((item) => item.owner).filter(Boolean)).size;

  return {
    projectId,
    progress,
    totalWorkItems: workItems.length,
    milestoneCount: milestones.length,
    activeRiskCount: activeRisks.length,
    collaboratorCount,
    currentPhaseTitle: currentPhase?.title || null,
    nextMilestoneTitle: nextMilestone?.title || null,
    nextMilestoneDate: nextMilestone?.end_date || nextMilestone?.start_date || null,
  };
}

export function ProjectWorkbenchPage() {
  const { projects, loadProjects } = useProjectStore();
  const { workItems, loadAllWorkItems } = useWorkItemStore();
  const { selectedProjectId, setCurrentView } = useUIStore();
  const { activeModule, setActiveModule, reset } = useWorkbenchStore();
  const { language } = useI18n();
  const { isCompactWorkbench } = useWorkbenchLayoutMode();
  const [isInspectorDrawerOpen, setInspectorDrawerOpen] = useState(false);
  const copy = copyByLanguage[language];

  useEffect(() => {
    void Promise.all([loadProjects(), loadAllWorkItems()]);
  }, [loadProjects, loadAllWorkItems]);

  useEffect(() => {
    if (!selectedProjectId) {
      reset();
    }
  }, [selectedProjectId, reset]);

  useEffect(() => {
    if (!isCompactWorkbench && isInspectorDrawerOpen) {
      setInspectorDrawerOpen(false);
    }
  }, [isCompactWorkbench, isInspectorDrawerOpen]);

  const project = useMemo(
    () => projects.find((item) => item.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  );

  const projectWorkItems = useMemo(() => {
    if (!project) return [];
    return workItems.filter((item) => item.project_id === project.id);
  }, [project, workItems]);

  const milestones = useMemo(
    () => sortByDate(projectWorkItems.filter((item) => item.type === 'milestone')),
    [projectWorkItems],
  );

  const phases = useMemo(
    () => sortByDate(projectWorkItems.filter((item) => item.type === 'phase')),
    [projectWorkItems],
  );

  const activeRisks = useMemo(
    () => projectWorkItems.filter((item) => (item.type === 'issue' || item.type === 'clash') && item.status !== 'done'),
    [projectWorkItems],
  );

  const recentUpdates = useMemo(
    () => [...projectWorkItems].sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()),
    [projectWorkItems],
  );

  const snapshot = useMemo(
    () => buildSnapshot(project?.id || 0, projectWorkItems),
    [project?.id, projectWorkItems],
  );

  const modules = useMemo<WorkbenchModuleDefinition[]>(() => [
    { key: 'canvas', label: copy.modules.canvas.label, description: copy.modules.canvas.description },
    { key: 'stakeholders', label: copy.modules.stakeholders.label, description: copy.modules.stakeholders.description },
    { key: 'timeline', label: copy.modules.timeline.label, description: copy.modules.timeline.description, count: snapshot.milestoneCount },
    { key: 'risks', label: copy.modules.risks.label, description: copy.modules.risks.description, count: snapshot.activeRiskCount },
    { key: 'work-packages', label: copy.modules['work-packages'].label, description: copy.modules['work-packages'].description, count: snapshot.totalWorkItems },
    { key: 'evidence', label: copy.modules.evidence.label, description: copy.modules.evidence.description },
  ], [copy, snapshot]);

  const activeModuleDefinition = modules.find((item) => item.key === activeModule) || modules[0];

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
      <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-6 xl:px-8">
        <WorkbenchHeader
          project={project}
          snapshot={snapshot}
          copy={{
            back: copy.back,
            ownerTbd: copy.ownerTbd,
            noDescription: copy.noDescription,
            progress: copy.progress,
            currentPhase: copy.currentPhase,
            nextMilestone: copy.nextMilestone,
            statusLabels: copy.statusLabels,
          }}
          onBack={() => setCurrentView('projects')}
        />

        <div className="overflow-x-auto pb-2">
          <div
            className={[
              'grid min-w-[1280px] items-start gap-6',
              isCompactWorkbench ? 'grid-cols-[240px_minmax(0,1fr)]' : 'grid-cols-[240px_minmax(0,1fr)_300px]',
            ].join(' ')}
          >
            <Card title={<span className="font-semibold">{copy.railTitle}</span>} bodyStyle={{ padding: 12 }}>
              <div className="space-y-2">
              {modules.map((module) => {
                const isActive = module.key === activeModule;
                return (
                  <button
                    key={module.key}
                    type="button"
                    onClick={() => setActiveModule(module.key)}
                    className={[
                      'w-full rounded-2xl border p-3 text-left transition-all',
                      isActive
                        ? 'border-blue-500 bg-blue-50 shadow-sm dark:border-blue-500 dark:bg-blue-950/20'
                        : 'border-slate-200 bg-white hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-slate-500 dark:text-slate-400">{moduleIcons[module.key]}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{module.label}</div>
                          {module.count !== undefined && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                              {module.count}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{module.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
              </div>
            </Card>

            <div className="min-w-0">
              {isCompactWorkbench && (
                <div className="mb-4 flex justify-end">
                  <Button icon={<InfoCircleOutlined />} onClick={() => setInspectorDrawerOpen(true)}>
                    {copy.inspector.openDrawer}
                  </Button>
                </div>
              )}

              {activeModule === 'canvas' && (
                <WorkbenchCanvasPanel
                  project={project}
                  snapshot={snapshot}
                  phases={phases}
                  milestones={milestones}
                  activeRisks={activeRisks}
                />
              )}

              {activeModule === 'timeline' && (
                <WorkbenchTimelinePanel
                  phases={phases}
                  milestones={milestones}
                  copy={copy.timeline}
                />
              )}

              {activeModule === 'risks' && (
                <WorkbenchRiskPanel
                  risks={activeRisks}
                  copy={copy.risks}
                />
              )}

              {activeModule === 'stakeholders' && (
                <WorkbenchPlaceholderPanel
                  title={copy.modules.stakeholders.label}
                  description={copy.modules.stakeholders.description}
                />
              )}

              {activeModule === 'work-packages' && (
                <WorkbenchPlaceholderPanel
                  title={copy.modules['work-packages'].label}
                  description={copy.modules['work-packages'].description}
                />
              )}

              {activeModule === 'evidence' && (
                <WorkbenchPlaceholderPanel
                  title={copy.modules.evidence.label}
                  description={copy.modules.evidence.description}
                />
              )}
            </div>

            {!isCompactWorkbench && (
              <WorkbenchInspector
                project={project}
                snapshot={snapshot}
                activeModule={activeModuleDefinition}
                recentUpdates={recentUpdates}
                copy={copy.inspector}
              />
            )}
          </div>
        </div>

        {isCompactWorkbench && (
          <Drawer
            title={
              <div>
                <div className="font-semibold">{copy.inspector.title}</div>
                <div className="mt-1 text-xs text-slate-500">{activeModuleDefinition.label}</div>
              </div>
            }
            placement="right"
            width={360}
            open={isInspectorDrawerOpen}
            onClose={() => setInspectorDrawerOpen(false)}
            maskClosable={true}
            keyboard={true}
          >
            <WorkbenchInspector
              project={project}
              snapshot={snapshot}
              activeModule={activeModuleDefinition}
              recentUpdates={recentUpdates}
              copy={copy.inspector}
              variant="drawer"
            />
          </Drawer>
        )}
      </div>
    </div>
  );
}
