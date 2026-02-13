import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, Tag } from 'antd';
import { Flag } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
export function UpcomingMilestones({ milestones, loading }) {
    const getStatusTag = (status) => {
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
        return (_jsx(Card, { title: _jsxs("span", { className: "flex items-center gap-2 text-base", children: [_jsx(Flag, { className: "h-4 w-4" }), " Upcoming Milestones"] }), children: _jsx("div", { className: "space-y-2", children: [1, 2, 3].map((i) => (_jsx("div", { className: "h-12 animate-pulse bg-theme-layout rounded" }, i))) }) }));
    }
    return (_jsx(Card, { title: _jsxs("span", { className: "flex items-center gap-2 text-base", children: [_jsx(Flag, { className: "h-4 w-4" }), " Upcoming Milestones"] }), extra: _jsxs(Tag, { children: [milestones.length, " total"] }), children: milestones.length === 0 ? (_jsx("p", { className: "text-center text-theme-secondary py-4 text-sm", children: "No upcoming milestones" })) : (_jsx("div", { className: "space-y-1.5 max-h-[400px] overflow-y-auto", children: milestones.map((milestone) => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded border border-theme-secondary hover:bg-theme-container transition-colors cursor-pointer", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: "font-medium truncate text-sm leading-tight", children: milestone.name }), _jsx("p", { className: "text-xs text-theme-secondary truncate mt-0.5", children: milestone.projectName })] }), _jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [_jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-sm font-medium", children: format(new Date(milestone.dueDate), 'MMM dd') }), _jsx("div", { className: "text-xs text-theme-secondary", children: formatDistanceToNow(new Date(milestone.dueDate), { addSuffix: true }) })] }), getStatusTag(milestone.status)] })] }, milestone.id))) })) }));
}
