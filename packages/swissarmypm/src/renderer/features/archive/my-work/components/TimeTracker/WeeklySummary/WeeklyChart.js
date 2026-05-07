import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { theme } from 'antd';
import { formatMinutes } from '@/features/my-work/utils/timeFormatters';
import { formatRelativeDate } from '@/features/my-work/utils/timeFormatters';
export function WeeklyChart({ data, loading }) {
    const { token } = theme.useToken();
    if (loading) {
        return (_jsx("div", { className: "space-y-3", children: _jsx("div", { className: "h-32 rounded-lg animate-pulse", style: { backgroundColor: token.colorFillSecondary } }) }));
    }
    if (!data || data.days.length === 0) {
        return (_jsx("div", { className: "text-center py-8", style: { color: token.colorTextSecondary }, children: _jsx("p", { children: "No weekly data available" }) }));
    }
    // Find max value for scaling (minimum 60 minutes to avoid tiny bars)
    const maxMinutes = Math.max(60, ...data.days.map((d) => d.totalMinutes));
    // Get today's date for highlighting
    const today = new Date().toISOString().split('T')[0];
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-medium", style: { color: token.colorText }, children: "This Week" }), _jsxs("span", { className: "text-xs", style: { color: token.colorTextSecondary }, children: [formatMinutes(data.weeklyActual), " / ", formatMinutes(data.weeklyTarget)] })] }), _jsx("div", { className: "flex items-end justify-between gap-2 h-32", children: data.days.map((day) => {
                    const percentage = Math.min(100, (day.totalMinutes / maxMinutes) * 100);
                    const isToday = day.date === today;
                    const hasData = day.totalMinutes > 0;
                    return (_jsxs("div", { className: "flex-1 flex flex-col items-center gap-1 group", children: [_jsx("div", { className: "relative w-full flex items-end justify-center h-24", children: _jsx("div", { className: "w-full max-w-[40px] rounded-t-md transition-all duration-200", style: {
                                        height: `${Math.max(4, percentage)}%`,
                                        backgroundColor: isToday
                                            ? token.colorPrimary
                                            : hasData
                                                ? token.colorInfo
                                                : token.colorFillSecondary,
                                    }, onMouseEnter: (e) => {
                                        if (!isToday && hasData) {
                                            e.currentTarget.style.backgroundColor = token.colorPrimaryBg;
                                        }
                                    }, onMouseLeave: (e) => {
                                        e.currentTarget.style.backgroundColor = isToday
                                            ? token.colorPrimary
                                            : hasData
                                                ? token.colorInfo
                                                : token.colorFillSecondary;
                                    }, title: `
                    ${formatRelativeDate(day.date)}
                    ${formatMinutes(day.totalMinutes)}
                    ${day.pomodoroCount} 🍅
                  ` }) }), _jsx("span", { className: "text-[10px] font-medium tabular-nums", style: {
                                    color: isToday
                                        ? token.colorPrimary
                                        : token.colorTextSecondary,
                                }, children: formatRelativeDate(day.date) })] }, day.date));
                }) }), _jsxs("div", { className: "flex items-center justify-center gap-4 text-xs", style: { color: token.colorTextSecondary }, children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: "w-3 h-3 rounded-sm", style: { backgroundColor: token.colorPrimary } }), _jsx("span", { children: "Today" })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: "w-3 h-3 rounded-sm", style: { backgroundColor: token.colorInfo } }), _jsx("span", { children: "Logged" })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: "w-3 h-3 rounded-sm", style: { backgroundColor: token.colorFillSecondary } }), _jsx("span", { children: "Empty" })] })] })] }));
}
