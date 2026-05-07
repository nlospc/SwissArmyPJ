import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from 'antd';
import { ChevronDown } from 'lucide-react';
import { ChangeFeed } from '@/components/dashboard/ChangeFeed';
import { UpcomingMilestones } from '@/components/dashboard/UpcomingMilestones';
import { RiskSummary } from '@/components/dashboard/RiskSummary';
export function TopWidgetDrawer({ changeFeed, upcomingMilestones, riskSummary, loading, }) {
    const [isOpen, setIsOpen] = useState(false);
    return (_jsxs("div", { className: "border-b bg-theme-container theme-transition", children: [_jsxs("div", { className: "flex items-center justify-between px-8 py-3", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("h2", { className: "text-sm font-semibold text-theme-secondary theme-transition", children: "Quick Overview" }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-theme-secondary theme-transition", children: [upcomingMilestones.length > 0 && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "font-medium", children: upcomingMilestones.length }), " milestones"] })), changeFeed.length > 0 && (_jsxs(_Fragment, { children: [_jsx("span", { children: "\u2022" }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "font-medium", children: changeFeed.length }), " recent changes"] })] }))] })] }), _jsxs(Button, { type: "text", size: "small", onClick: () => setIsOpen(!isOpen), children: [_jsx("span", { className: "text-xs", children: isOpen ? 'Hide Details' : 'Show Details' }), _jsx(ChevronDown, { className: `h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`, style: { marginLeft: 8 } })] })] }), isOpen && (_jsx("div", { className: "px-8 pb-6", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [_jsx(ChangeFeed, { events: changeFeed, loading: loading }), _jsx(UpcomingMilestones, { milestones: upcomingMilestones, loading: loading }), _jsx(RiskSummary, { summary: riskSummary, loading: loading })] }) }))] }));
}
