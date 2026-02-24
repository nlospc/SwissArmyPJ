import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { Card, Button, Alert, Typography, Tag, Avatar, Progress, theme, Modal, InputNumber, } from 'antd';
import { ReloadOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { formatDistanceToNow, format } from 'date-fns';
import { DashboardProjectDetailView } from '@/components/dashboard/DashboardProjectDetailView';
const { Title, Text } = Typography;
export function DashboardPage() {
    const { token } = theme.useToken();
    const { projects, loadProjects, isLoading: projectsLoading } = useProjectStore();
    const [showProjectDetail, setShowProjectDetail] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [editingStatsOpen, setEditingStatsOpen] = useState(false);
    const [editableStats, setEditableStats] = useState({});
    const { changeFeed, upcomingMilestones, riskSummary, loading, error, lastRefreshed, refreshAll, projectHealthList, } = useDashboardStore();
    const projectHealthListFromStore = useMemo(() => {
        if (projectHealthList.length > 0) {
            return projectHealthList;
        }
        return projects.map((project) => {
            // Calculate progress based on work items: (done + in_progress) / total
            // This is a fallback calculation; actual progress should come from projectHealthList
            const progressPercent = 0; // Will be populated from actual project data
            return {
                id: project.id,
                uuid: project.uuid,
                name: project.name,
                owner: project.owner || 'Unassigned',
                status: project.status === 'done'
                    ? 'on_track'
                    : project.status === 'blocked'
                        ? 'blocked'
                        : project.status === 'in_progress'
                            ? 'on_track'
                            : 'at_risk',
                progressPercent,
                doneTasks: 0,
                totalTasks: 0,
                nextMilestone: null,
                blockerCount: 0,
                highRiskCount: 0,
            };
        });
    }, [projectHealthList, projects]);
    useEffect(() => {
        loadProjects();
        refreshAll();
        const interval = setInterval(() => {
            loadProjects();
            refreshAll();
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [refreshAll, loadProjects]);
    const handleRefresh = () => {
        loadProjects();
        refreshAll();
    };
    const handleProjectClick = (projectId) => {
        setSelectedProjectId(projectId);
        setShowProjectDetail(true);
    };
    const handleProjectDetailClose = () => {
        setShowProjectDetail(false);
        setSelectedProjectId(null);
    };
    const handleEditStats = (stats) => {
        const statMap = {};
        stats.forEach((stat) => {
            statMap[stat.label] = stat.value;
        });
        setEditableStats(statMap);
        setEditingStatsOpen(true);
    };
    const handleSaveStats = async () => {
        try {
            // Call API to save custom stats to Vault/settings
            const { ipc } = await import('@/lib/ipc');
            await ipc.settings.set('dashboardStats', JSON.stringify(editableStats));
            setEditingStatsOpen(false);
            // Optionally refresh the display
        }
        catch (error) {
            console.error('Failed to save stats:', error);
        }
    };
    const statusCounts = useMemo(() => {
        return projectHealthListFromStore.reduce((acc, project) => {
            acc.total += 1;
            if (project.status === 'on_track')
                acc.onTrack += 1;
            if (project.status === 'at_risk')
                acc.atRisk += 1;
            if (project.status === 'blocked' || project.status === 'critical')
                acc.blocked += 1;
            if (project.status === 'critical')
                acc.critical += 1;
            return acc;
        }, { total: 0, onTrack: 0, atRisk: 0, blocked: 0, critical: 0 });
    }, [projectHealthListFromStore]);
    const summaryStats = useMemo(() => [
        {
            label: 'Total Projects',
            value: statusCounts.total,
            accent: token.colorPrimary,
            highlight: token.colorPrimary,
        },
        {
            label: 'On Track',
            value: statusCounts.onTrack,
            accent: token.colorSuccess,
            highlight: token.colorSuccess,
        },
        {
            label: 'At Risk / Blocked',
            value: statusCounts.atRisk + statusCounts.blocked,
            accent: token.colorWarning,
            highlight: token.colorWarning,
        },
        {
            label: 'Critical Issues',
            value: riskSummary?.critical ?? statusCounts.critical,
            accent: token.colorError,
            highlight: token.colorError,
        },
    ], [riskSummary?.critical, statusCounts, token.colorError, token.colorPrimary, token.colorSuccess, token.colorWarning]);
    const attentionItems = useMemo(() => projectHealthListFromStore
        .filter((project) => project.status === 'critical' || project.blockerCount > 0 || project.status === 'blocked')
        .map((project) => {
        const owner = project.owner || 'Unassigned';
        const blockersText = project.blockerCount > 0 ? ` • ${project.blockerCount} blockers` : '';
        return {
            id: project.id,
            title: project.name,
            subtitle: `${owner}${blockersText}`,
            severity: project.status === 'critical' ? 'critical' : 'warning',
        };
    })
        .slice(0, 3), [projectHealthListFromStore]);
    const focusItems = useMemo(() => upcomingMilestones.slice(0, 3), [upcomingMilestones]);
    const contextItems = useMemo(() => changeFeed.slice(0, 3), [changeFeed]);
    const renderStatusTag = (status) => {
        const map = {
            on_track: { color: 'green', label: 'On Track' },
            at_risk: { color: 'orange', label: 'At Risk' },
            blocked: { color: 'red', label: 'Blocked' },
            critical: { color: 'magenta', label: 'Critical' },
        };
        const config = map[status] || map.on_track;
        return _jsx(Tag, { color: config.color, children: config.label });
    };
    const renderProgress = (percent, status) => {
        const colorMap = {
            on_track: token.colorPrimary,
            at_risk: token.colorWarning,
            blocked: token.colorError,
            critical: token.colorError,
        };
        return (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("div", { style: { width: 120 }, children: _jsx(Progress, { percent: percent, showInfo: false, strokeColor: colorMap[status], size: "small" }) }), _jsxs("span", { style: { color: token.colorTextSecondary, fontSize: 12 }, children: [percent, "%"] })] }));
    };
    if (error) {
        return (_jsx("div", { className: "p-8", children: _jsx(Alert, { message: "Error Loading Dashboard", description: error, type: "error", showIcon: true, action: _jsx(Button, { size: "small", onClick: handleRefresh, children: "Retry" }) }) }));
    }
    if (showProjectDetail) {
        return _jsx(DashboardProjectDetailView, { projectId: selectedProjectId, onClose: handleProjectDetailClose });
    }
    return (_jsxs("div", { className: "h-full flex flex-col", style: { background: token.colorBgLayout }, children: [_jsx("header", { className: "px-8 py-5 flex-shrink-0 border-b", style: {
                    background: token.colorBgContainer,
                    borderColor: token.colorSplit,
                    boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
                }, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(Title, { level: 2, style: { marginBottom: 4 }, children: "Portfolio Overview" }), _jsx(Text, { type: "secondary", children: "30-second context recovery for your IT portfolio" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [lastRefreshed && (_jsxs("span", { style: { color: token.colorTextSecondary, fontSize: 12 }, children: ["Last updated: ", formatDistanceToNow(lastRefreshed, { addSuffix: true })] })), _jsx(Button, { icon: _jsx(ReloadOutlined, { spin: loading || projectsLoading }), loading: loading || projectsLoading, onClick: handleRefresh, children: "Refresh" }), _jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), children: "New Project" })] })] }) }), _jsxs("main", { className: "flex-1 overflow-auto", children: [_jsxs("div", { className: "max-w-7xl mx-auto px-8 py-6 space-y-8", children: [_jsxs("section", { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { style: { fontSize: 16, fontWeight: 600 }, children: "Portfolio Summary" }), _jsx(Button, { type: "text", icon: _jsx(EditOutlined, {}), onClick: () => handleEditStats(summaryStats), title: "Edit stats (supports Vault sync)", children: "Edit" })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6", children: summaryStats.map((stat) => (_jsxs("div", { className: "rounded-xl p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow", style: {
                                                background: token.colorBgContainer,
                                                borderLeft: `4px solid ${stat.accent}`,
                                            }, onClick: () => handleEditStats(summaryStats), children: [_jsx("div", { style: { color: token.colorTextSecondary, fontWeight: 500 }, children: stat.label }), _jsx("div", { style: { fontSize: 32, fontWeight: 700, marginTop: 8, color: stat.highlight }, children: stat.value })] }, stat.label))) })] }), _jsxs("section", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx(Card, { styles: { body: { padding: 24 } }, title: _jsxs("div", { className: "flex items-center gap-2", style: { color: token.colorText }, children: [_jsx("span", { role: "img", "aria-label": "attention", children: "\u26A0\uFE0F" }), "Attention Needed"] }), children: attentionItems.length === 0 ? (_jsx(Text, { type: "secondary", children: "No blocking issues right now." })) : (_jsx("div", { className: "space-y-4", children: attentionItems.map((item) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { style: {
                                                                    color: item.severity === 'critical' ? token.colorError : token.colorWarning,
                                                                    fontWeight: 600,
                                                                }, children: item.title }), item.subtitle && (_jsx("div", { style: { color: token.colorTextSecondary, fontSize: 12 }, children: item.subtitle }))] }), _jsx(Button, { size: "small", type: "link", children: "View" })] }, item.id))) })) }), _jsx(Card, { styles: { body: { padding: 24 } }, title: _jsxs("div", { className: "flex items-center gap-2", style: { color: token.colorText }, children: [_jsx("span", { role: "img", "aria-label": "milestone", children: "\uD83D\uDCC5" }), "Upcoming Focus"] }), children: focusItems.length === 0 ? (_jsx(Text, { type: "secondary", children: "No upcoming milestones." })) : (_jsx("div", { className: "space-y-4", children: focusItems.map((item) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600 }, children: item.name }), _jsx("div", { style: { color: token.colorTextSecondary, fontSize: 12 }, children: item.projectName })] }), _jsx("div", { style: {
                                                            fontSize: 12,
                                                            padding: '2px 8px',
                                                            borderRadius: 6,
                                                            border: `1px solid ${token.colorPrimaryBorder}`,
                                                            color: token.colorPrimary,
                                                            background: token.colorPrimaryBg,
                                                        }, children: format(new Date(item.dueDate), 'MMM d') })] }, item.id))) })) }), _jsx(Card, { styles: { body: { padding: 24 } }, title: _jsxs("div", { className: "flex items-center gap-2", style: { color: token.colorText }, children: [_jsx("span", { role: "img", "aria-label": "feed", children: "\u26A1" }), "Recent Context"] }), children: contextItems.length === 0 ? (_jsx(Text, { type: "secondary", children: "Change feed empty." })) : (_jsx("div", { className: "space-y-4", children: contextItems.map((event) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { style: { fontSize: 13 }, children: event.details || `${event.entityType} updated` }), _jsx("div", { style: {
                                                            fontSize: 11,
                                                            color: token.colorTextSecondary,
                                                            background: token.colorFillTertiary,
                                                            borderRadius: 4,
                                                            padding: '2px 6px',
                                                        }, children: formatDistanceToNow(new Date(event.timestamp), { addSuffix: true }) })] }, event.id))) })) })] }), _jsx("section", { children: _jsx(Card, { styles: {
                                        body: { padding: 0 },
                                        header: { padding: '20px 24px' },
                                    }, title: _jsx("span", { style: { fontWeight: 600 }, children: "Active Projects" }), extra: _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { children: "Filter" }), _jsx(Button, { children: "Sort" })] }), children: _jsx("div", { className: "overflow-auto", children: _jsxs("table", { className: "w-full", style: { borderCollapse: 'separate', borderSpacing: 0 }, children: [_jsx("thead", { children: _jsx("tr", { children: ['Project Name', 'Owner', 'Status', 'Progress', 'Next Milestone'].map((heading, index) => (_jsx("th", { style: {
                                                                textAlign: 'left',
                                                                padding: '14px 20px',
                                                                background: token.colorFillTertiary,
                                                                color: token.colorTextSecondary,
                                                                fontWeight: 500,
                                                                borderBottom: `1px solid ${token.colorSplit}`,
                                                                borderTopLeftRadius: index === 0 ? 8 : 0,
                                                                borderTopRightRadius: index === 4 ? 8 : 0,
                                                            }, children: heading }, heading))) }) }), _jsx("tbody", { children: projectHealthListFromStore.map((project) => (_jsxs("tr", { onClick: () => handleProjectClick(Number(project.id)), style: { cursor: 'pointer' }, children: [_jsxs("td", { style: { padding: '16px 20px', borderBottom: `1px solid ${token.colorSplit}` }, children: [_jsx("div", { style: { fontWeight: 600 }, children: project.name }), _jsxs("div", { style: { color: token.colorTextSecondary, fontSize: 12, marginTop: 4 }, children: ["Owner: ", project.owner] })] }), _jsx("td", { style: { padding: '16px 20px', borderBottom: `1px solid ${token.colorSplit}` }, children: _jsx(Avatar, { size: "small", children: (project.owner || 'U').charAt(0).toUpperCase() }) }), _jsx("td", { style: { padding: '16px 20px', borderBottom: `1px solid ${token.colorSplit}` }, children: renderStatusTag(project.status) }), _jsx("td", { style: { padding: '16px 20px', borderBottom: `1px solid ${token.colorSplit}` }, children: renderProgress(project.progressPercent, project.status) }), _jsx("td", { style: { padding: '16px 20px', borderBottom: `1px solid ${token.colorSplit}` }, children: project.nextMilestone ? (_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600 }, children: project.nextMilestone.name }), _jsx("div", { style: { color: token.colorTextSecondary, fontSize: 12 }, children: format(new Date(project.nextMilestone.date), 'MMM d') })] })) : (_jsx("span", { style: { color: token.colorTextSecondary }, children: "\u2014" })) })] }, project.id))) })] }) }) }) })] }), _jsx(Modal, { open: editingStatsOpen, title: "Edit Portfolio Summary Stats", onCancel: () => setEditingStatsOpen(false), width: 500, footer: [
                            _jsx(Button, { onClick: () => setEditingStatsOpen(false), children: "Cancel" }, "cancel"),
                            _jsx(Button, { type: "primary", onClick: handleSaveStats, children: "Save Changes" }, "save"),
                        ], children: _jsxs("div", { className: "space-y-4", children: [_jsx("p", { style: { color: token.colorTextSecondary, fontSize: 12 }, children: "These values support Vault sync. Changes will be persisted and can be updated programmatically via API." }), summaryStats.map((stat) => (_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: 8, fontWeight: 500 }, children: stat.label }), _jsx(InputNumber, { value: editableStats[stat.label] || 0, onChange: (value) => setEditableStats({
                                                ...editableStats,
                                                [stat.label]: value || 0,
                                            }), style: { width: '100%' }, min: 0 })] }, stat.label)))] }) })] })] }));
}
