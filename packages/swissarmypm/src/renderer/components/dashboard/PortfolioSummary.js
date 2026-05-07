import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, Tag } from 'antd';
import { AlertTriangle, Ban } from 'lucide-react';
export function PortfolioSummary({ metrics, loading }) {
    if (loading && !metrics) {
        return (_jsx(Card, { title: "Portfolio Summary", children: _jsx("div", { className: "h-20 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" }) }));
    }
    if (!metrics) {
        return null;
    }
    return (_jsx(Card, { title: "Portfolio Summary", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap gap-6 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-500 dark:text-gray-400", children: "Active Projects: " }), _jsx("span", { className: "font-semibold", children: metrics.activeProjects })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500 dark:text-gray-400", children: "Total Tasks: " }), _jsx("span", { className: "font-semibold", children: metrics.totalTasks })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500 dark:text-gray-400", children: "Open Issues: " }), _jsx("span", { className: "font-semibold", children: metrics.openIssues })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500 dark:text-gray-400", children: "Upcoming Milestones: " }), _jsx("span", { className: "font-semibold", children: metrics.upcomingMilestones })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [metrics.atRiskCount > 0 && (_jsxs(Tag, { color: "orange", children: [_jsx(AlertTriangle, { className: "h-3 w-3", style: { marginRight: 4, display: 'inline' } }), metrics.atRiskCount, " At Risk"] })), metrics.blockedCount > 0 && (_jsxs(Tag, { color: "red", children: [_jsx(Ban, { className: "h-3 w-3", style: { marginRight: 4, display: 'inline' } }), metrics.blockedCount, " Blocked"] })), metrics.atRiskCount === 0 && metrics.blockedCount === 0 && (_jsx(Tag, { color: "green", children: "All Projects On Track" }))] })] }) }));
}
