import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Typography } from 'antd';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { GanttBar } from './GanttBar';
const { Text } = Typography;
export function GanttRow({ group, dateRange, dayWidth, barHeight, rowHeight, rowIndex, onToggleExpand, onBarClick, }) {
    const rowTop = rowIndex * rowHeight;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "absolute left-0 right-0 flex items-center border-b border-theme-border/20 bg-theme-bg-container hover:bg-theme-bg-spotlight/30 transition-colors", style: {
                    top: `${rowTop}px`,
                    height: `${rowHeight}px`,
                }, children: [_jsx("div", { className: "flex items-center justify-center w-8 cursor-pointer text-theme-secondary hover:text-theme-text", style: { paddingLeft: '8px' }, onClick: () => onToggleExpand?.(group.id), children: group.expanded !== false ? (_jsx(ChevronDown, { className: "h-4 w-4" })) : (_jsx(ChevronRight, { className: "h-4 w-4" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx(Text, { ellipsis: { tooltip: group.name }, className: "font-medium text-sm", children: group.name }), _jsxs(Text, { type: "secondary", className: "ml-2 text-xs", children: ["(", group.bars.length, " items)"] })] })] }), group.expanded !== false &&
                group.bars.map((bar, barIndex) => (_jsx(GanttBar, { bar: bar, dateRange: dateRange, dayWidth: dayWidth, barHeight: barHeight, rowIndex: rowIndex + barIndex + 1, rowHeight: rowHeight, onClick: onBarClick }, bar.id)))] }));
}
