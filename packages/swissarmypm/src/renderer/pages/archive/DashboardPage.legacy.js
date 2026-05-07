import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { Card, Button, Alert, Space, Typography } from 'antd';
import { ReloadOutlined, LeftOutlined } from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
// Import dashboard sub-components
import { ProjectTable } from '@/components/dashboard/ProjectTable';
import { TopWidgetDrawer } from '@/components/dashboard/TopWidgetDrawer';
import { DashboardProjectDetailView } from '@/components/dashboard/DashboardProjectDetailView';
const { Title, Text } = Typography;
export function DashboardPage() {
    // Get real project data from ProjectStore (same as Gantt chart)
    const { projects, loadProjects, isLoading: projectsLoading } = useProjectStore();
    // State for project detail view
    const [showProjectDetail, setShowProjectDetail] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    useEffect(() => {
        if (!showProjectDetail) {
            setDetailVisible(false);
            return;
        }
        setDetailVisible(false);
        const timer = setTimeout(() => setDetailVisible(true), 20);
        return () => clearTimeout(timer);
    }, [showProjectDetail]);
    // Get dashboard metrics from DashboardStore
    const { changeFeed, upcomingMilestones, riskSummary, loading, error, lastRefreshed, refreshAll, } = useDashboardStore();
    // Convert real projects to ProjectHealth format for dashboard
    const projectHealthList = useMemo(() => {
        return projects.map(project => ({
            id: project.id,
            uuid: project.uuid,
            name: project.name,
            owner: project.owner || 'Unassigned',
            status: (project.status === 'done' ? 'on_track' :
                project.status === 'blocked' ? 'blocked' :
                    project.status === 'in_progress' ? 'on_track' : 'at_risk'),
            progressPercent: 0, // TODO: Calculate from work items
            doneTasks: 0, // TODO: Calculate from work items
            totalTasks: 0, // TODO: Calculate from work items
            nextMilestone: null, // TODO: Get from work items
            blockerCount: 0, // TODO: Calculate
            highRiskCount: 0, // TODO: Calculate
        }));
    }, [projects]);
    useEffect(() => {
        // Load real project data
        loadProjects();
        // Load dashboard metrics
        refreshAll();
        // Auto-refresh every 5 minutes
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
    const handleProjectClick = (projectHealth) => {
        const project = projects.find((p) => p.id === projectHealth.id);
        if (project) {
            setSelectedProjectId(project.id);
            setShowProjectDetail(true);
        }
    };
    const handleProjectDetailClose = () => {
        setShowProjectDetail(false);
        setSelectedProjectId(null);
    };
    if (error) {
        return (_jsx("div", { className: "p-8", children: _jsx(Alert, { message: "Error Loading Dashboard", description: error, type: "error", showIcon: true, action: _jsx(Button, { size: "small", onClick: handleRefresh, children: "Retry" }) }) }));
    }
    return (_jsxs("div", { className: showProjectDetail ? 'h-full flex flex-col' : 'space-y-6', children: [!showProjectDetail && (_jsx("div", { className: "px-8 pb-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(Title, { level: 2, className: "mb-1", children: "Portfolio Dashboard" }), _jsx(Text, { type: "secondary", children: "30-second context recovery for your IT portfolio" })] }), _jsxs(Space, { children: [lastRefreshed && (_jsxs(Text, { type: "secondary", className: "text-sm", children: ["Last refreshed: ", formatDistanceToNow(lastRefreshed, { addSuffix: true })] })), _jsx(Button, { onClick: handleRefresh, icon: _jsx(ReloadOutlined, { spin: loading || projectsLoading }), loading: loading || projectsLoading, children: "Refresh" })] })] }) })), !showProjectDetail && (_jsx(TopWidgetDrawer, { changeFeed: changeFeed, upcomingMilestones: upcomingMilestones, riskSummary: riskSummary, loading: loading })), _jsx("div", { className: showProjectDetail ? 'flex-1 flex flex-col min-h-0 px-8 pt-4 pb-4' : 'px-8 pt-6 space-y-6', children: showProjectDetail ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx(Title, { level: 4, className: "mb-0", children: "Project Details" }), _jsx(Button, { size: "small", icon: _jsx(LeftOutlined, {}), onClick: handleProjectDetailClose, children: "Back to Dashboard" })] }), _jsx("div", { className: "flex-1 min-h-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900", style: {
                                transform: detailVisible ? 'translateX(0)' : 'translateX(16px)',
                                opacity: detailVisible ? 1 : 0,
                                transition: 'transform 220ms ease, opacity 220ms ease',
                            }, children: _jsx(DashboardProjectDetailView, { projectId: selectedProjectId, onClose: handleProjectDetailClose }) })] })) : (_jsx(Card, { title: _jsx(Title, { level: 4, className: "mb-0", children: "Project Health" }), children: _jsx(ProjectTable, { projects: projectHealthList, onProjectClick: handleProjectClick }) })) })] }));
}
