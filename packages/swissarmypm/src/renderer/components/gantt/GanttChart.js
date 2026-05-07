import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Main Gantt Chart Component
 * Interactive timeline with zoom controls
 */
import { useState } from 'react';
import { Card, Button, Space, Radio, Tooltip, Typography } from 'antd';
import { ZoomIn, ZoomOut, RotateCcw, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { TimelineHeader } from './TimelineHeader';
import { TimelineGrid } from './TimelineGrid';
import { getTotalDays } from '@/lib/gantt-utils';
import { DEFAULT_GANTT_CONFIG } from '@/types/gantt';
const { Text } = Typography;
export function GanttChart({ data, config: userConfig, onBarClick, onExport }) {
    const [viewMode, setViewMode] = useState('month');
    const [zoom, setZoom] = useState(1);
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const config = { ...DEFAULT_GANTT_CONFIG, ...userConfig };
    const dayWidth = config.dayWidth * zoom;
    const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 3));
    const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.5));
    const handleResetZoom = () => setZoom(1);
    const handleToggleExpand = (groupId) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            }
            else {
                next.add(groupId);
            }
            return next;
        });
    };
    const handleExport = () => {
        if (onExport) {
            onExport();
        }
    };
    // Calculate total rows (groups + expanded bars)
    const totalRows = data.groups.reduce((acc, group) => {
        const isExpanded = expandedGroups.has(group.id) || group.expanded !== false;
        return acc + 1 + (isExpanded ? group.bars.length : 0);
    }, 0);
    // Calculate timeline width
    const totalDays = getTotalDays(data.dateRange);
    const timelineWidth = (totalDays + 1) * dayWidth;
    // Prepare groups with expanded state
    const groupsWithExpansion = data.groups.map((group) => ({
        ...group,
        expanded: expandedGroups.has(group.id) || group.expanded !== false,
    }));
    return (_jsx(Card, { className: "w-full", bodyStyle: { padding: 0 }, extra: _jsxs(Space, { size: "middle", children: [_jsxs(Radio.Group, { value: viewMode, onChange: (e) => setViewMode(e.target.value), optionType: "button", buttonStyle: "solid", size: "small", children: [_jsx(Radio.Button, { value: "day", children: "Day" }), _jsx(Radio.Button, { value: "week", children: "Week" }), _jsx(Radio.Button, { value: "month", children: "Month" }), _jsx(Radio.Button, { value: "quarter", children: "Quarter" })] }), _jsxs(Space, { size: "small", children: [_jsx(Tooltip, { title: "Zoom Out", children: _jsx(Button, { type: "text", size: "small", icon: _jsx(ZoomOut, { className: "h-4 w-4" }), onClick: handleZoomOut, disabled: zoom <= 0.5 }) }), _jsxs(Text, { className: "text-xs text-theme-secondary w-12 text-center", children: [Math.round(zoom * 100), "%"] }), _jsx(Tooltip, { title: "Zoom In", children: _jsx(Button, { type: "text", size: "small", icon: _jsx(ZoomIn, { className: "h-4 w-4" }), onClick: handleZoomIn, disabled: zoom >= 3 }) }), _jsx(Tooltip, { title: "Reset Zoom", children: _jsx(Button, { type: "text", size: "small", icon: _jsx(RotateCcw, { className: "h-4 w-4" }), onClick: handleResetZoom }) })] }), onExport && (_jsx(Tooltip, { title: "Export", children: _jsx(Button, { type: "text", size: "small", icon: _jsx(Download, { className: "h-4 w-4" }), onClick: handleExport }) }))] }), children: _jsxs("div", { className: "flex flex-col h-full overflow-hidden", children: [_jsx("div", { className: "relative", style: {
                        marginLeft: '280px', // Left panel width
                        width: `calc(100% - 280px)`,
                    }, children: _jsx(TimelineHeader, { dateRange: data.dateRange, viewMode: viewMode, dayWidth: dayWidth }) }), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx("div", { className: "flex-shrink-0 bg-theme-layout border-r border-theme-border overflow-hidden", style: { width: '280px' }, children: groupsWithExpansion.map((group, groupIndex) => {
                                const isExpanded = group.expanded;
                                const rowTop = calculateRowTop(groupsWithExpansion.slice(0, groupIndex), config.rowHeight);
                                return (_jsx("div", { className: "absolute left-0 right-0 border-b border-theme-border/20 hover:bg-theme-bg-spotlight/30 transition-colors", style: {
                                        top: `${rowTop}px`,
                                        height: `${config.rowHeight}px`,
                                    }, children: _jsxs("div", { className: "flex items-center h-full px-4", children: [_jsx("div", { className: "flex items-center justify-center w-6 cursor-pointer text-theme-secondary hover:text-theme-text", onClick: () => handleToggleExpand(group.id), children: isExpanded ? (_jsx(ChevronDown, { className: "h-4 w-4" })) : (_jsx(ChevronRight, { className: "h-4 w-4" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx(Text, { ellipsis: { tooltip: group.name }, className: "font-medium text-sm", children: group.name }), _jsxs(Text, { type: "secondary", className: "ml-2 text-xs", children: ["(", group.bars.length, ")"] })] })] }) }, group.id));
                            }) }), _jsx("div", { className: "flex-1 overflow-auto", children: _jsxs("div", { className: "relative", style: { width: `${timelineWidth}px`, height: `${totalRows * config.rowHeight}px` }, children: [_jsx(TimelineGrid, { dateRange: data.dateRange, dayWidth: dayWidth, rowHeight: config.rowHeight, totalRows: totalRows }), groupsWithExpansion.map((group, groupIndex) => {
                                        const baseRowTop = calculateRowTop(groupsWithExpansion.slice(0, groupIndex), config.rowHeight);
                                        const relativeRowIndex = Math.floor(baseRowTop / config.rowHeight);
                                        return group.bars.map((bar, barIndex) => (_jsx(GanttBar, { bar: bar, dateRange: data.dateRange, dayWidth: dayWidth, barHeight: config.barHeight, rowIndex: relativeRowIndex + barIndex + 1, rowHeight: config.rowHeight, onClick: onBarClick }, bar.id)));
                                    })] }) })] })] }) }));
}
function calculateRowTop(groups, rowHeight) {
    return groups.reduce((acc, group) => {
        const isExpanded = group.expanded !== false;
        return acc + rowHeight + (isExpanded ? group.bars.length * rowHeight : 0);
    }, 0);
}
