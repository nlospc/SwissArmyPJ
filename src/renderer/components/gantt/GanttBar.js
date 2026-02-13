import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * GanttBar - Renders a single timeline bar or milestone
 */
import { useMemo } from 'react';
import { Typography, Tooltip } from 'antd';
import { calculateBarPosition, getStatusColor, getItemIcon } from './timeline-utils';
import { useTimeline } from './TimelineProvider';
const { Text } = Typography;
export function GanttBar({ item, index, rowHeight, viewStart, onDragStart, onDragEnd, onClick, selected, }) {
    const { columnWidth, scale } = useTimeline();
    const barPosition = useMemo(() => {
        return calculateBarPosition(item.startDate, item.endDate, viewStart, columnWidth, scale);
    }, [item.startDate, item.endDate, viewStart, columnWidth, scale]);
    if (!barPosition) {
        return null;
    }
    const { x, width } = barPosition;
    const color = getStatusColor(item.status);
    const icon = getItemIcon(item.type);
    const top = index * rowHeight + 8; // 8px padding top
    const height = rowHeight - 16; // 16px total padding
    const handleClick = (e) => {
        e.stopPropagation();
        onClick?.(item);
    };
    const handleMouseDown = (e) => {
        e.stopPropagation();
        onDragStart?.(item, e);
    };
    if (item.isMilestone) {
        // Render as diamond marker
        return (_jsx(Tooltip, { title: _jsxs("div", { children: [_jsx("div", { children: item.name }), _jsxs("div", { children: [icon, " ", item.type] }), _jsxs("div", { children: ["Status: ", item.status] }), _jsxs("div", { children: ["Date: ", item.startDate?.format('YYYY-MM-DD')] }), item.assignee && _jsxs("div", { children: ["Assignee: ", item.assignee] })] }), children: _jsxs("g", { transform: `translate(${x + width / 2}, ${top + height / 2})`, onClick: handleClick, onMouseDown: handleMouseDown, style: { cursor: 'pointer' }, children: [_jsx("polygon", { points: "0,-12 12,0 0,12 -12,0", fill: color, stroke: selected ? '#1890ff' : 'white', strokeWidth: selected ? 3 : 2 }), _jsx("text", { x: 0, y: 4, textAnchor: "middle", fontSize: 12, fill: "white", pointerEvents: "none", children: icon })] }) }));
    }
    // Render as bar
    const progressWidth = width * ((item.progress || 0) / 100);
    return (_jsx(Tooltip, { title: _jsxs("div", { children: [_jsx("div", { children: item.name }), _jsxs("div", { children: [icon, " ", item.type] }), _jsxs("div", { children: [item.startDate?.format('YYYY-MM-DD'), " - ", item.endDate?.format('YYYY-MM-DD')] }), _jsxs("div", { children: ["Status: ", item.status] }), item.assignee && _jsxs("div", { children: ["Assignee: ", item.assignee] }), item.progress !== undefined && _jsxs("div", { children: ["Progress: ", item.progress, "%"] })] }), children: _jsxs("g", { onClick: handleClick, onMouseDown: handleMouseDown, style: { cursor: 'pointer' }, children: [_jsx("rect", { x: x, y: top, width: width, height: height, rx: 4, fill: color, fillOpacity: 0.2, stroke: selected ? '#1890ff' : color, strokeWidth: selected ? 2 : 1 }), item.progress !== undefined && item.progress > 0 && (_jsx("rect", { x: x, y: top, width: progressWidth, height: height, rx: 4, fill: color, fillOpacity: 0.8 })), width > 60 && (_jsx("text", { x: x + 8, y: top + height / 2 + 4, fontSize: 12, fill: "white", pointerEvents: "none", children: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name })), _jsx("circle", { cx: x + width - 8, cy: top + height / 2, r: 4, fill: color })] }) }));
}
