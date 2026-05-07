import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, Tag, Progress, Button } from 'antd';
import { AlertCircle, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { formatDistanceToNow } from 'date-fns';
const healthConfig = {
    on_track: {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'On Track',
    },
    at_risk: {
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: 'At Risk',
    },
    critical: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Critical',
    },
    blocked: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300',
        label: 'Blocked',
    },
};
export function ProjectCards({ projects, loading }) {
    const setCurrentView = useUIStore((state) => state.setCurrentView);
    const handleProjectClick = (projectId) => {
        console.log('Navigate to project:', projectId);
        setCurrentView('dashboard');
    };
    const getStatusIcon = (status) => {
        const config = healthConfig[status];
        const Icon = config.icon;
        return _jsx(Icon, { className: `h-4 w-4 ${config.color}` });
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
        return (_jsx(Card, { title: "Project Health Cards", children: _jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => (_jsx("div", { className: "h-24 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" }, i))) }) }));
    }
    return (_jsx(Card, { title: "Project Health Cards", extra: _jsxs(Button, { size: "small", children: [_jsx(Plus, { className: "h-4 w-4", style: { marginRight: 8 } }), "New Project"] }), children: projects.length === 0 ? (_jsx("p", { className: "text-center text-gray-500 dark:text-gray-400 py-8", children: "No active projects" })) : (_jsx("div", { className: "space-y-3", children: projects.map((project) => {
                const config = healthConfig[project.status];
                return (_jsxs("div", { onClick: () => handleProjectClick(project.id), className: `border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${config.borderColor}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [getStatusIcon(project.status), _jsx("h3", { className: "font-semibold", children: project.name })] }), _jsxs(Tag, { className: config.bgColor, children: [project.progressPercent, "%"] })] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between text-gray-500 dark:text-gray-400", children: [_jsxs("span", { children: [project.doneTasks, "/", project.totalTasks, " tasks done"] }), project.blockerCount > 0 && (_jsxs("span", { className: "text-red-600 font-medium", children: [project.blockerCount, " blockers"] }))] }), _jsx(Progress, { percent: project.progressPercent, showInfo: false, strokeWidth: 6 }), project.nextMilestone && (_jsxs("div", { className: "flex items-center justify-between pt-2 border-t", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "h-3 w-3 text-gray-500 dark:text-gray-400" }), _jsx("span", { className: "text-gray-500 dark:text-gray-400", children: project.nextMilestone.name })] }), _jsxs("div", { className: "flex items-center gap-2", children: [getMilestoneStatusTag(project.nextMilestone.status), _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: formatDistanceToNow(new Date(project.nextMilestone.date), { addSuffix: true }) })] })] }))] })] }, project.id));
            }) })) }));
}
