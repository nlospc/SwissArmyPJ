import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card, Tag, Progress, Button, theme } from 'antd';
import { AlertCircle, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { formatDistanceToNow } from 'date-fns';
export function ProjectCards({ projects, loading }) {
    const { token } = theme.useToken();
    const setCurrentView = useUIStore((state) => state.setCurrentView);
    const handleProjectClick = (projectId) => {
        console.log('Navigate to project:', projectId);
        setCurrentView('dashboard');
    };
    const getStatusIcon = (status) => {
        const config = React.useMemo(() => {
            switch (status) {
                case 'on_track':
                    return {
                        icon: CheckCircle,
                        color: token.colorSuccess,
                        bgColor: token.colorSuccessBg,
                        borderColor: token.colorBorderSecondary,
                    };
                case 'at_risk':
                    return {
                        icon: AlertCircle,
                        color: token.colorWarning,
                        bgColor: token.colorWarningBg,
                        borderColor: token.colorBorderSecondary,
                    };
                case 'critical':
                    return {
                        icon: XCircle,
                        color: token.colorError,
                        bgColor: token.colorErrorBg,
                        borderColor: token.colorBorderSecondary,
                    };
                case 'blocked':
                    return {
                        icon: XCircle,
                        color: token.colorError,
                        bgColor: token.colorErrorBg,
                        borderColor: token.colorBorder,
                    };
                default:
                    return {
                        icon: CheckCircle,
                        color: token.colorSuccess,
                        bgColor: token.colorSuccessBg,
                        borderColor: token.colorBorderSecondary,
                    };
            }
        }, [status, token]);
        const Icon = config.icon;
        return _jsx(Icon, { className: "h-4 w-4", style: { color: config.color } });
    };
    const getMilestoneStatusTag = (status) => {
        switch (status) {
            case 'on_track':
                return _jsx(Tag, { color: "green", children: "On Track" });
            case 'at_risk':
                return _jsx(Tag, { color: "orange", children: "At Risk" });
            case 'overdue':
                return _jsx(Tag, { color: "red", children: "Overdue" });
            default:
                return null;
        }
    };
    if (loading) {
        return (_jsx(Card, { title: "Project Health Cards", children: _jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => (_jsx("div", { className: "h-24 animate-pulse rounded", style: { backgroundColor: token.colorBgLayout } }, i))) }) }));
    }
    return (_jsx(Card, { title: "Project Health Cards", extra: _jsxs(Button, { size: "small", children: [_jsx(Plus, { className: "h-4 w-4", style: { marginRight: 8 } }), "New Project"] }), children: projects.length === 0 ? (_jsx("p", { className: "text-center py-8", style: { color: token.colorTextSecondary }, children: "No active projects" })) : (_jsx("div", { className: "space-y-3", children: projects.map((project) => {
                const statusConfig = React.useMemo(() => {
                    switch (project.status) {
                        case 'on_track':
                            return {
                                color: token.colorSuccess,
                                bgColor: token.colorSuccessBg,
                                borderColor: token.colorBorderSecondary,
                            };
                        case 'at_risk':
                            return {
                                color: token.colorWarning,
                                bgColor: token.colorWarningBg,
                                borderColor: token.colorBorderSecondary,
                            };
                        case 'critical':
                            return {
                                color: token.colorError,
                                bgColor: token.colorErrorBg,
                                borderColor: token.colorBorderSecondary,
                            };
                        case 'blocked':
                            return {
                                color: token.colorError,
                                bgColor: token.colorErrorBg,
                                borderColor: token.colorBorder,
                            };
                        default:
                            return {
                                color: token.colorSuccess,
                                bgColor: token.colorSuccessBg,
                                borderColor: token.colorBorderSecondary,
                            };
                    }
                }, [project.status, token]);
                return (_jsxs("div", { onClick: () => handleProjectClick(project.id), className: "border rounded-lg p-4 cursor-pointer transition-colors", style: {
                        borderColor: statusConfig.borderColor,
                    }, onMouseEnter: (e) => {
                        e.currentTarget.style.backgroundColor = token.colorBgContainer;
                    }, onMouseLeave: (e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }, children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [getStatusIcon(project.status), _jsx("h3", { className: "font-semibold", children: project.name })] }), _jsxs(Tag, { style: { backgroundColor: statusConfig.bgColor }, children: [project.progressPercent, "%"] })] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between", style: { color: token.colorTextSecondary }, children: [_jsxs("span", { children: [project.doneTasks, "/", project.totalTasks, " tasks done"] }), project.blockerCount > 0 && (_jsxs("span", { style: { color: token.colorError, fontWeight: 500 }, children: [project.blockerCount, " blockers"] }))] }), _jsx(Progress, { percent: project.progressPercent, showInfo: false, strokeWidth: 6 }), project.nextMilestone && (_jsxs("div", { className: "flex items-center justify-between pt-2 border-t", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "h-3 w-3", style: { color: token.colorTextSecondary } }), _jsx("span", { style: { color: token.colorTextSecondary }, children: project.nextMilestone.name })] }), _jsxs("div", { className: "flex items-center gap-2", children: [getMilestoneStatusTag(project.nextMilestone.status), _jsx("span", { className: "text-xs", style: { color: token.colorTextSecondary }, children: formatDistanceToNow(new Date(project.nextMilestone.date), { addSuffix: true }) })] })] }))] })] }, project.id));
            }) })) }));
}
