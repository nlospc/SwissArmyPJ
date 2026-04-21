import React, { useMemo } from 'react';
import {
  AppstoreOutlined,
  AimOutlined,
  BulbOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  FlagOutlined,
  FolderOpenOutlined,
  LockOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Card, Empty, Tag, Tooltip, Typography } from 'antd';

import { useI18n } from '@/hooks/useI18n';
import type { Project, WorkItem } from '@/shared/types';
import type { WorkbenchSnapshot } from '@/shared/types/workbench';

const { Text, Paragraph } = Typography;

type CanvasBlockKey =
  | 'purpose'
  | 'objective'
  | 'sponsor'
  | 'requirements'
  | 'deliverables'
  | 'exclusions'
  | 'constraints'
  | 'phases'
  | 'milestones'
  | 'resources'
  | 'risks'
  | 'team'
  | 'stakeholders'
  | 'lessons';

type CanvasBlockTone = 'default' | 'normal' | 'risk' | 'issue';

interface CanvasBlock {
  key: CanvasBlockKey;
  title: string;
  titleEn: string;
  tooltip: string;
  lines: string[];
  note?: string;
  tone?: CanvasBlockTone;
}

interface WorkbenchCanvasPanelProps {
  project: Project;
  snapshot: WorkbenchSnapshot;
  phases: WorkItem[];
  milestones: WorkItem[];
  activeRisks: WorkItem[];
}

type Copy = {
  title: string;
  subtitle: string;
  derived: string;
  mixed: string;
  pendingModel: string;
  noData: string;
  ownerTbd: string;
  ungrouped: string;
  purposeEmpty: string;
  objectiveEmpty: string;
  sponsorEmpty: string;
  requirementsEmpty: string;
  deliverablesEmpty: string;
  exclusionsEmpty: string;
  constraintsEmpty: string;
  resourcesEmpty: string;
  milestonesEmpty: string;
  phasesEmpty: string;
  risksEmpty: string;
  teamEmpty: string;
  stakeholdersEmpty: string;
  lessonsEmpty: string;
};

const copyByLanguage: Record<'zh' | 'en', Copy> = {
  zh: {
    title: '项目画布',
    subtitle: '按 PMBOK 项目画布组织项目概览：在一个页面里并排呈现项目目的、目标、范围、阶段、风险、团队与经验，便于项目经理快速判断项目整体状态。',
    derived: '自动摘要',
    mixed: '半结构化',
    pendingModel: '待建模',
    noData: '暂无信息',
    ownerTbd: '待分配负责人',
    ungrouped: '未分组',
    purposeEmpty: '建议补充：为什么要做这个项目？要解决的根本问题是什么？',
    objectiveEmpty: '建议补充：项目成功的可衡量结果是什么？',
    sponsorEmpty: '待接入 Sponsor 正式字段。',
    requirementsEmpty: '待接入 Requirements 正式字段。',
    deliverablesEmpty: '待接入 Deliverables 正式字段。',
    exclusionsEmpty: '待接入 Scope Exclusion 正式字段。',
    constraintsEmpty: '暂无明确约束或假设摘要。',
    resourcesEmpty: '待接入 Resources 正式字段。',
    milestonesEmpty: '暂无里程碑。',
    phasesEmpty: '暂无项目阶段。',
    risksEmpty: '当前没有活跃风险。',
    teamEmpty: '暂无团队信息。',
    stakeholdersEmpty: '待接入 Stakeholders 正式模型。',
    lessonsEmpty: '待接入 Lessons Learned 正式字段。',
  },
  en: {
    title: 'Project Canvas',
    subtitle: 'Organize the project overview as a PMBOK-style canvas: purpose, objective, scope, phases, risks, team, and lessons presented side by side so PMs can assess the whole project in one place.',
    derived: 'Derived',
    mixed: 'Mixed',
    pendingModel: 'Pending Model',
    noData: 'No data yet',
    ownerTbd: 'Owner TBD',
    ungrouped: 'Ungrouped',
    purposeEmpty: 'Add why this project exists and what root problem it solves.',
    objectiveEmpty: 'Add the measurable outcomes that define project success.',
    sponsorEmpty: 'Formal Sponsor field is not modeled yet.',
    requirementsEmpty: 'Formal Requirements field is not modeled yet.',
    deliverablesEmpty: 'Formal Deliverables field is not modeled yet.',
    exclusionsEmpty: 'Formal Scope Exclusion field is not modeled yet.',
    constraintsEmpty: 'No explicit constraint / assumption summary yet.',
    resourcesEmpty: 'Formal Resources field is not modeled yet.',
    milestonesEmpty: 'No milestones yet.',
    phasesEmpty: 'No phases yet.',
    risksEmpty: 'No active risks right now.',
    teamEmpty: 'No team information yet.',
    stakeholdersEmpty: 'Formal Stakeholder model is not wired yet.',
    lessonsEmpty: 'Formal Lessons Learned field is not modeled yet.',
  },
};

const gridClassByKey: Record<CanvasBlockKey, string> = {
  purpose: 'xl:col-span-2',
  objective: 'xl:col-span-1',
  sponsor: 'xl:col-span-1',
  requirements: 'xl:col-span-1',
  deliverables: 'xl:col-span-1',
  exclusions: 'xl:col-span-1',
  constraints: 'xl:col-span-1',
  phases: 'xl:col-span-1',
  milestones: 'xl:col-span-1',
  resources: 'xl:col-span-1',
  risks: 'xl:col-span-1',
  team: 'xl:col-span-1',
  stakeholders: 'xl:col-span-1',
  lessons: 'xl:col-span-2',
};

function getToneClasses(tone: CanvasBlockTone = 'default') {
  if (tone === 'issue') {
    return {
      border: 'border-red-200 dark:border-red-900/50',
      top: 'bg-red-500',
      note: 'text-red-600 dark:text-red-300',
    };
  }
  if (tone === 'risk') {
    return {
      border: 'border-amber-200 dark:border-amber-900/50',
      top: 'bg-amber-500',
      note: 'text-amber-600 dark:text-amber-300',
    };
  }
  if (tone === 'normal') {
    return {
      border: 'border-emerald-200 dark:border-emerald-900/50',
      top: 'bg-emerald-500',
      note: 'text-emerald-600 dark:text-emerald-300',
    };
  }
  return {
    border: 'border-slate-200 dark:border-slate-800',
    top: 'bg-blue-600',
    note: 'text-slate-500 dark:text-slate-400',
  };
}

function summarizeDescription(project: Project) {
  if (!project.description) return [];
  return project.description
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function uniqueOwners(items: WorkItem[]) {
  return [...new Set(items.map((item) => item.owner).filter(Boolean))] as string[];
}

function formatDate(value: string | null) {
  return value || 'TBD';
}

function buildSponsorLines(project: Project, copy: Copy) {
  return [copy.sponsorEmpty, `${copy.ownerTbd !== 'Owner TBD' ? '当前项目负责人' : 'Current project owner'}: ${project.owner || copy.ownerTbd}`];
}

export function WorkbenchCanvasPanel({ project, snapshot, phases, milestones, activeRisks }: WorkbenchCanvasPanelProps) {
  const { language } = useI18n();
  const copy = copyByLanguage[language];

  const projectDescription = useMemo(() => summarizeDescription(project), [project]);
  const milestoneLines = useMemo(
    () => milestones.slice(0, 4).map((item) => `${item.title} · ${formatDate(item.end_date || item.start_date)}`),
    [milestones],
  );
  const phaseLines = useMemo(
    () => phases.slice(0, 4).map((item) => `${item.title}${item.status === 'in_progress' ? language === 'zh' ? '（当前）' : ' (Current)' : ''}`),
    [phases, language],
  );
  const riskLines = useMemo(
    () => activeRisks.slice(0, 4).map((item) => `${item.title}${item.priority ? ` · ${item.priority}` : ''}`),
    [activeRisks],
  );
  const teamLines = useMemo(
    () => uniqueOwners([...phases, ...milestones, ...activeRisks]).slice(0, 6),
    [phases, milestones, activeRisks],
  );

  const blocks = useMemo<CanvasBlock[]>(() => [
    {
      key: 'purpose',
      title: language === 'zh' ? '目的' : 'Purpose',
      titleEn: 'Purpose',
      tooltip: language === 'zh'
        ? '为什么开展这个项目？解决的根本问题或机会是什么？'
        : 'Why the project exists. What root problem or opportunity does it address?',
      lines: projectDescription.length ? projectDescription : [copy.purposeEmpty],
      note: copy.mixed,
    },
    {
      key: 'objective',
      title: language === 'zh' ? '目标' : 'Objective',
      titleEn: 'Objective',
      tooltip: language === 'zh'
        ? '衡量项目成功的可量化结果。'
        : 'Measurable outcomes indicating project success.',
      lines: snapshot.nextMilestoneTitle
        ? [
            language === 'zh' ? `围绕里程碑推进：${snapshot.nextMilestoneTitle}` : `Drive toward milestone: ${snapshot.nextMilestoneTitle}`,
            language === 'zh' ? `当前推进度：${snapshot.progress}%` : `Current progress: ${snapshot.progress}%`,
          ]
        : [copy.objectiveEmpty],
      note: copy.mixed,
    },
    {
      key: 'sponsor',
      title: language === 'zh' ? '发起人' : 'Sponsor',
      titleEn: 'Sponsor',
      tooltip: language === 'zh'
        ? '提供资源和支持，并对项目成功负责的个人或团体。'
        : 'The person or group providing resources and support for project success.',
      lines: buildSponsorLines(project, copy),
      note: copy.pendingModel,
    },
    {
      key: 'requirements',
      title: language === 'zh' ? '需求' : 'Requirements',
      titleEn: 'Requirements',
      tooltip: language === 'zh'
        ? '必须满足的高层级条件或能力。'
        : 'High-level conditions or capabilities that must be met.',
      lines: project.tags?.length ? project.tags.slice(0, 4) : [copy.requirementsEmpty],
      note: project.tags?.length ? copy.mixed : copy.pendingModel,
    },
    {
      key: 'deliverables',
      title: language === 'zh' ? '可交付物' : 'Deliverables',
      titleEn: 'Deliverables',
      tooltip: language === 'zh'
        ? '项目应产出的有形或无形结果。'
        : 'Tangible or intangible products, results, or capabilities produced.',
      lines: milestoneLines.length ? milestoneLines : [copy.deliverablesEmpty],
      note: milestoneLines.length ? copy.mixed : copy.pendingModel,
    },
    {
      key: 'exclusions',
      title: language === 'zh' ? '范围之外' : 'Exclusions',
      titleEn: 'Exclusions',
      tooltip: language === 'zh'
        ? '明确不包含的内容，避免范围蔓延。'
        : 'What is explicitly out of scope to prevent scope creep.',
      lines: [copy.exclusionsEmpty],
      note: copy.pendingModel,
    },
    {
      key: 'constraints',
      title: language === 'zh' ? '制约/假设' : 'Constraints',
      titleEn: 'Constraints',
      tooltip: language === 'zh'
        ? '影响项目执行的限制和默认假设。'
        : 'Limiting factors and assumptions affecting execution.',
      lines: [
        `${language === 'zh' ? '状态' : 'Status'}: ${project.status}`,
        `${language === 'zh' ? '计划区间' : 'Planned window'}: ${formatDate(project.start_date)} → ${formatDate(project.end_date)}`,
        activeRisks.length > 0
          ? language === 'zh' ? `当前存在 ${activeRisks.length} 个活跃风险` : `${activeRisks.length} active risks currently open`
          : copy.constraintsEmpty,
      ],
      note: copy.mixed,
      tone: activeRisks.length > 0 ? 'risk' : 'default',
    },
    {
      key: 'phases',
      title: language === 'zh' ? '项目阶段' : 'Project Phases',
      titleEn: 'Phases',
      tooltip: language === 'zh'
        ? '逻辑相关的活动集合，以完成特定成果为目标。'
        : 'Collections of related activities culminating in major deliverables.',
      lines: phaseLines.length ? phaseLines : [copy.phasesEmpty],
      note: phaseLines.length ? copy.derived : copy.pendingModel,
      tone: phaseLines.length ? 'normal' : 'default',
    },
    {
      key: 'milestones',
      title: language === 'zh' ? '里程碑' : 'Milestones',
      titleEn: 'Milestones',
      tooltip: language === 'zh'
        ? '项目进度中的关键时间点或重大事件。'
        : 'Significant points or events in the project timeline.',
      lines: milestoneLines.length ? milestoneLines : [copy.milestonesEmpty],
      note: milestoneLines.length ? copy.derived : copy.pendingModel,
      tone: milestoneLines.length ? 'normal' : 'default',
    },
    {
      key: 'resources',
      title: language === 'zh' ? '资源' : 'Resources',
      titleEn: 'Resources',
      tooltip: language === 'zh'
        ? '执行项目所需的资金、设备、材料或设施。'
        : 'Funding, equipment, materials, or facilities required.',
      lines: teamLines.length
        ? [
            language === 'zh' ? `当前识别到 ${snapshot.collaboratorCount || teamLines.length} 位协作相关 owner` : `${snapshot.collaboratorCount || teamLines.length} collaborating owners identified`,
            project.portfolio_id ? (language === 'zh' ? `归属组合：#${project.portfolio_id}` : `Portfolio assignment: #${project.portfolio_id}`) : copy.ungrouped,
          ]
        : [copy.resourcesEmpty],
      note: teamLines.length ? copy.mixed : copy.pendingModel,
    },
    {
      key: 'risks',
      title: language === 'zh' ? '风险' : 'Risks',
      titleEn: 'Risks',
      tooltip: language === 'zh'
        ? '会对项目目标产生影响的不确定事件。'
        : 'Uncertain events that affect project objectives.',
      lines: riskLines.length ? riskLines : [copy.risksEmpty],
      note: riskLines.length ? copy.derived : copy.derived,
      tone: riskLines.length >= 3 ? 'issue' : riskLines.length >= 1 ? 'risk' : 'normal',
    },
    {
      key: 'team',
      title: language === 'zh' ? '团队' : 'Team',
      titleEn: 'Team',
      tooltip: language === 'zh'
        ? '直接执行项目工作的内部成员。'
        : 'Individuals directly performing the work.',
      lines: teamLines.length ? teamLines : [copy.teamEmpty],
      note: teamLines.length ? copy.derived : copy.pendingModel,
    },
    {
      key: 'stakeholders',
      title: language === 'zh' ? '干系人' : 'Stakeholders',
      titleEn: 'Stakeholders',
      tooltip: language === 'zh'
        ? '可能影响项目或受项目影响的个人或团体。'
        : 'Individuals or groups who may affect or be affected by the project.',
      lines: [
        copy.stakeholdersEmpty,
        language === 'zh'
          ? '当前可先从负责人、风险 owner、里程碑 owner 派生候选人。'
          : 'Current candidates can be derived from project owner, risk owners, and milestone owners.',
      ],
      note: copy.pendingModel,
    },
    {
      key: 'lessons',
      title: language === 'zh' ? '经验总结' : 'Lessons Learned',
      titleEn: 'Lessons Learned',
      tooltip: language === 'zh'
        ? '项目过程中获得的知识，指导未来类似情况。'
        : 'Knowledge gained that guides future similar situations.',
      lines: [copy.lessonsEmpty],
      note: copy.pendingModel,
    },
  ], [project, snapshot, phases, milestones, activeRisks, teamLines, phaseLines, milestoneLines, riskLines, projectDescription, copy, language]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-3">
          <Text type="secondary">{copy.title}</Text>
          <Paragraph className="mb-0 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {copy.subtitle}
          </Paragraph>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {blocks.map((block) => {
          const tone = getToneClasses(block.tone);
          return (
            <Card
              key={block.key}
              bodyStyle={{ padding: 0 }}
              className={`${gridClassByKey[block.key]} overflow-hidden rounded-xl ${tone.border}`}
            >
              <div className={`h-1 w-full ${tone.top}`} />
              <div className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-slate-500 dark:text-slate-400">
                        {block.key === 'purpose' && <AimOutlined />}
                        {block.key === 'objective' && <TrophyOutlined />}
                        {block.key === 'sponsor' && <UserOutlined />}
                        {block.key === 'requirements' && <FileDoneOutlined />}
                        {block.key === 'deliverables' && <FlagOutlined />}
                        {block.key === 'exclusions' && <ExclamationCircleOutlined />}
                        {block.key === 'constraints' && <LockOutlined />}
                        {block.key === 'phases' && <AppstoreOutlined />}
                        {block.key === 'milestones' && <FlagOutlined />}
                        {block.key === 'resources' && <FolderOpenOutlined />}
                        {block.key === 'risks' && <ExclamationCircleOutlined />}
                        {block.key === 'team' && <TeamOutlined />}
                        {block.key === 'stakeholders' && <UserOutlined />}
                        {block.key === 'lessons' && <BulbOutlined />}
                      </div>
                      <div>
                        <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{block.title}</div>
                        <div className="text-[11px] uppercase tracking-wide text-blue-600 dark:text-blue-400">{block.titleEn}</div>
                      </div>
                    </div>
                  </div>
                  <Tooltip title={block.tooltip}>
                    <Tag className="cursor-help">?</Tag>
                  </Tooltip>
                </div>

                <div className="min-h-[120px] flex-1 rounded-lg bg-slate-50/70 p-3 dark:bg-slate-900/60">
                  {block.lines.length > 0 ? (
                    <div className="space-y-2">
                      {block.lines.map((line, index) => (
                        <div key={`${block.key}-${index}`} className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                          {line}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={copy.noData} />
                  )}
                </div>

                {block.note && (
                  <div className={`text-xs ${tone.note}`}>
                    {block.note}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
