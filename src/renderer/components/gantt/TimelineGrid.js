import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Timeline Grid Component
 * Renders the background grid with weekend highlighting
 */
import React from 'react';
import { getTotalDays } from '@/lib/gantt-utils';
export function TimelineGrid({ dateRange, dayWidth, rowHeight, totalRows }) {
    const totalDays = getTotalDays(dateRange);
    const gridHeight = totalRows * rowHeight;
    const getLineStyle = (index) => ({
        left: `${index * dayWidth}px`,
    });
    const getRowStyle = (index) => ({
        top: `${index * rowHeight}px`,
        height: `${rowHeight}px`,
    });
    const isWeekend = (dayIndex) => {
        const date = new Date(dateRange.startDate);
        date.setDate(date.getDate() + dayIndex);
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
    };
    return (_jsxs("div", { className: "relative overflow-hidden", style: { height: `${gridHeight}px` }, children: [Array.from({ length: totalDays + 1 }).map((_, index) => (_jsx(React.Fragment, { children: isWeekend(index) && (_jsx("div", { className: "absolute top-0 bottom-0 bg-theme-bg-spotlight/30", style: {
                        left: `${index * dayWidth}px`,
                        width: `${dayWidth}px`,
                    } })) }, index))), Array.from({ length: totalDays + 1 }).map((_, index) => (_jsx("div", { className: "absolute top-0 bottom-0 border-r border-theme-border/20", style: getLineStyle(index) }, index))), Array.from({ length: totalRows + 1 }).map((_, index) => (_jsx("div", { className: "absolute left-0 right-0 border-b border-theme-border/20", style: getRowStyle(index) }, index))), _jsx(TimelineTodayLine, { dateRange: dateRange, dayWidth: dayWidth, gridHeight: gridHeight })] }));
}
function TimelineTodayLine({ dateRange, dayWidth, gridHeight, }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(dateRange.startDate);
    startDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    if (daysDiff < 0 || daysDiff > getTotalDays(dateRange)) {
        return null;
    }
    return (_jsx("div", { className: "absolute top-0 bottom-0 w-0.5 bg-primary z-10", style: {
            left: `${daysDiff * dayWidth + dayWidth / 2}px`,
            height: `${gridHeight}px`,
        } }));
}
