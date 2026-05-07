import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo } from 'react';
import { Alert, Avatar, Button, Card, Empty, List, Progress, Space, Tag, Typography, } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, ClockCircleOutlined, FlagOutlined, ProfileOutlined, TeamOutlined, WarningOutlined, } from '@ant-design/icons';
import { useProjectStore } from '@/stores/useProjectStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { useUIStore } from '@/stores/useUIStore';
import { useI18n } from '@/hooks/useI18n';
const { Title, Text, Paragraph } = Typography;
const projectStatusColorMap = {
    not_started: 'default',
    in_progress: 'processing',
    done: 'success',
    blocked: 'error',
};
const priorityColorMap = {
    low: 'green',
    medium: 'gold',
    high: 'orange',
    critical: 'red',
};
const copyByLanguage = {
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
function formatDate(value) {
    return value || 'TBD';
}
function sortByDate(items) {
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
    const project = useMemo(() => projects.find((item) => item.id === selectedProjectId) || null, [projects, selectedProjectId]);
    const projectWorkItems = useMemo(() => {
        if (!project)
            return [];
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
        return (_jsx("div", { className: "flex h-full items-center justify-center bg-slate-50 px-8 dark:bg-slate-950", children: _jsx(Empty, { description: copy.empty, image: Empty.PRESENTED_IMAGE_SIMPLE, children: _jsx(Button, { type: "primary", onClick: () => setCurrentView('projects'), children: copy.goProjects }) }) }));
    }
    return (_jsx("div", { className: "h-full overflow-auto bg-slate-50 dark:bg-slate-950", children: _jsxs("div", { className: "mx-auto max-w-7xl space-y-6 px-8 py-8", children: [_jsxs("div", { className: "flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between", children: [_jsxs("div", { className: "space-y-3", children: [_jsx(Button, { icon: _jsx(ArrowLeftOutlined, {}), onClick: () => setCurrentView('projects'), children: copy.back }), _jsxs("div", { children: [_jsxs(Space, { wrap: true, children: [_jsx(Title, { level: 2, className: "!mb-0", children: project.name }), _jsx(Tag, { color: projectStatusColorMap[project.status], children: copy.statusLabels[project.status] }), metrics.activeRisks.length > 0 && _jsxs(Tag, { color: "red", children: [metrics.activeRisks.length, " ", copy.activeRisks] })] }), _jsx(Paragraph, { className: "mb-0 mt-2 max-w-4xl text-slate-500 dark:text-slate-400", children: project.description || copy.noDescription })] })] }), _jsxs(Card, { size: "small", className: "xl:w-[320px]", children: [_jsx(Text, { type: "secondary", children: copy.goal }), _jsx("div", { className: "mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300", children: copy.goalText })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5", children: [_jsxs(Card, { children: [_jsx(Text, { type: "secondary", children: copy.progress }), _jsx(Progress, { percent: metrics.progress, className: "mt-3" })] }), _jsxs(Card, { children: [_jsx(Text, { type: "secondary", children: copy.currentPhase }), _jsx("div", { className: "mt-3 text-lg font-semibold", children: metrics.currentPhase?.title || '-' })] }), _jsxs(Card, { children: [_jsx(Text, { type: "secondary", children: copy.nextMilestone }), _jsx("div", { className: "mt-3 text-lg font-semibold", children: metrics.nextMilestone?.title || '-' })] }), _jsxs(Card, { children: [_jsx(Text, { type: "secondary", children: copy.activeRisks }), _jsx("div", { className: "mt-3 text-lg font-semibold text-red-600", children: metrics.activeRisks.length })] }), _jsxs(Card, { children: [_jsx(Text, { type: "secondary", children: copy.collaborators }), _jsx("div", { className: "mt-3 text-lg font-semibold", children: metrics.owners || 1 })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-6 xl:grid-cols-3", children: [_jsxs("div", { className: "space-y-6 xl:col-span-2", children: [_jsx(Card, { title: _jsx("span", { className: "font-semibold", children: copy.currentFacts }), extra: _jsx(Tag, { children: project.owner || copy.ownerTbd }), children: _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "rounded-xl bg-slate-50 p-4 dark:bg-slate-900", children: [_jsx("div", { className: "text-xs text-slate-500", children: copy.timeline }), _jsxs("div", { className: "mt-2 flex items-center gap-2 text-sm font-medium", children: [_jsx(CalendarOutlined, {}), " ", formatDate(project.start_date), " \u2192 ", formatDate(project.end_date)] })] }), _jsxs("div", { className: "rounded-xl bg-slate-50 p-4 dark:bg-slate-900", children: [_jsx("div", { className: "text-xs text-slate-500", children: copy.portfolio }), _jsx("div", { className: "mt-2 text-sm font-medium", children: project.portfolio_id ? `Portfolio #${project.portfolio_id}` : copy.ungrouped })] }), _jsxs("div", { className: "rounded-xl bg-slate-50 p-4 dark:bg-slate-900", children: [_jsx("div", { className: "text-xs text-slate-500", children: copy.tags }), _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: project.tags?.length ? project.tags.map((tag) => _jsx(Tag, { children: tag }, tag)) : _jsx(Text, { type: "secondary", children: copy.noTags }) })] }), _jsxs("div", { className: "rounded-xl bg-slate-50 p-4 dark:bg-slate-900", children: [_jsx("div", { className: "text-xs text-slate-500", children: copy.scale }), _jsxs("div", { className: "mt-2 text-sm font-medium", children: [projectWorkItems.length, " / ", metrics.phases.length, " / ", metrics.milestones.length] })] })] }) }), _jsx(Card, { title: _jsx("span", { className: "font-semibold", children: copy.recentMilestones }), extra: _jsx(Button, { type: "link", onClick: () => setCurrentView('search'), children: copy.search }), children: metrics.milestones.length === 0 ? (_jsx(Empty, { description: copy.noMilestones, image: Empty.PRESENTED_IMAGE_SIMPLE })) : (_jsx(List, { dataSource: sortByDate(metrics.milestones).slice(0, 6), renderItem: (item) => (_jsx(List.Item, { children: _jsx(List.Item.Meta, { avatar: _jsx(Avatar, { icon: _jsx(FlagOutlined, {}) }), title: _jsxs(Space, { children: [_jsx("span", { children: item.title }), _jsx(Tag, { color: projectStatusColorMap[item.status], children: copy.statusLabels[item.status] })] }), description: `${copy.timeline}: ${formatDate(item.end_date || item.start_date)}` }) })) })) }), _jsx(Card, { title: _jsx("span", { className: "font-semibold", children: copy.recentUpdates }), children: metrics.recentUpdates.length === 0 ? (_jsx(Empty, { description: copy.noUpdates, image: Empty.PRESENTED_IMAGE_SIMPLE })) : (_jsx(List, { dataSource: metrics.recentUpdates, renderItem: (item) => (_jsx(List.Item, { children: _jsx(List.Item.Meta, { avatar: _jsx(Avatar, { icon: _jsx(ClockCircleOutlined, {}) }), title: _jsxs(Space, { children: [_jsx("span", { children: item.title }), _jsx(Tag, { children: item.type })] }), description: `${item.owner || copy.ownerTbd} · ${formatDate(item.updated_at)}` }) })) })) })] }), _jsxs("div", { className: "space-y-6", children: [_jsx(Card, { title: _jsx("span", { className: "font-semibold", children: copy.riskAlert }), children: metrics.activeRisks.length === 0 ? (_jsx(Alert, { type: "success", showIcon: true, message: copy.noRisk })) : (_jsx("div", { className: "space-y-3", children: metrics.activeRisks.slice(0, 5).map((risk) => (_jsx("div", { className: "rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20", children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-slate-900 dark:text-slate-100", children: risk.title }), _jsx("div", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: risk.owner || copy.ownerTbd })] }), _jsx(Tag, { color: risk.priority ? priorityColorMap[risk.priority] : 'default', children: risk.priority || '-' })] }) }, risk.id))) })) }), _jsx(Card, { title: _jsx("span", { className: "font-semibold", children: copy.nextSteps }), children: _jsxs("div", { className: "space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx(ProfileOutlined, { className: "mt-1" }), " ", copy.nextAction1] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(TeamOutlined, { className: "mt-1" }), " ", copy.nextAction2] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(WarningOutlined, { className: "mt-1" }), " ", copy.nextAction3] })] }) })] })] })] }) }));
}
