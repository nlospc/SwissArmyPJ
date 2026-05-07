import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { generateDateHeaders } from '@/lib/gantt-utils';
export function TimelineHeader({ dateRange, viewMode, dayWidth }) {
    const headers = generateDateHeaders(dateRange, viewMode);
    const getHeaderStyle = (index) => ({
        left: `${index * dayWidth}px`,
        width: `${dayWidth}px`,
    });
    return (_jsx("div", { className: "relative border-b border-theme-border h-12 bg-theme-layout overflow-hidden", children: headers.map((header, index) => (_jsxs("div", { className: "absolute top-0 bottom-0 flex items-center justify-center text-xs border-r border-theme-border/30", style: getHeaderStyle(index), children: [_jsx("span", { className: `
              ${header.isToday ? 'font-bold text-primary' : 'text-theme-secondary'}
              ${header.isWeekend ? 'opacity-50' : ''}
            `, children: header.label }), header.isToday && (_jsx("div", { className: "absolute bottom-0 left-0 right-0 h-0.5 bg-primary" }))] }, index))) }));
}
