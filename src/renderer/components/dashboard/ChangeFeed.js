import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, Tag } from 'antd';
import { formatDistanceToNow } from 'date-fns';
const eventIcons = {
    created: '🟢',
    updated: '🟡',
    deleted: '🔴',
    completed: '✅',
    conflict: '⚠️',
    sync: '📁',
};
const eventLabels = {
    created: 'Created',
    updated: 'Updated',
    deleted: 'Deleted',
    completed: 'Completed',
    conflict: 'Conflict',
    sync: 'Sync',
};
export function ChangeFeed({ events, loading }) {
    if (loading) {
        return (_jsx(Card, { title: "Change Feed", children: _jsx("div", { className: "space-y-2", children: [1, 2, 3, 4, 5].map((i) => (_jsx("div", { className: "h-12 animate-pulse bg-theme-layout rounded" }, i))) }) }));
    }
    return (_jsx(Card, { title: "Change Feed", children: events.length === 0 ? (_jsx("p", { className: "text-center text-theme-secondary py-4 text-sm", children: "No recent changes" })) : (_jsx("div", { className: "space-y-1.5 max-h-[400px] overflow-y-auto", children: events.map((event) => {
                // Handle both 'action' and 'type' fields for compatibility
                const eventType = (event.type || event.action);
                return (_jsxs("div", { className: "flex items-start gap-2 p-2 rounded border border-theme-secondary hover:bg-theme-container transition-colors", children: [_jsx("span", { className: "text-lg flex-shrink-0", children: eventIcons[eventType] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium truncate leading-tight", children: event.details }), _jsxs("div", { className: "flex items-center gap-1.5 mt-0.5", children: [event.projectName && (_jsx("span", { className: "text-xs text-theme-secondary truncate", children: event.projectName })), event.projectName && _jsx("span", { className: "text-xs text-theme-secondary", children: "\u2022" }), _jsx("span", { className: "text-xs text-theme-secondary whitespace-nowrap", children: formatDistanceToNow(new Date(event.timestamp), { addSuffix: true }) })] })] }), _jsx(Tag, { className: "flex-shrink-0 text-xs", children: eventLabels[eventType] })] }, event.id));
            }) })) }));
}
