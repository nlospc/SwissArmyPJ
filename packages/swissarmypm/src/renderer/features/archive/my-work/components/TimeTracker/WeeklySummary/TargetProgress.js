import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatMinutes } from '@/features/my-work/utils/timeFormatters';
export function TargetProgress({ data, loading }) {
    if (loading) {
        return (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" }), _jsx("div", { className: "h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" })] }));
    }
    if (!data) {
        return null;
    }
    const percentage = Math.min(100, (data.weeklyActual / data.weeklyTarget) * 100);
    const isOverTarget = data.weeklyActual > data.weeklyTarget;
    const remaining = Math.max(0, data.weeklyTarget - data.weeklyActual);
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: "Weekly Target" }), _jsxs("span", { className: `
          text-sm font-semibold
          ${isOverTarget
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-900 dark:text-gray-100'}
        `, children: [Math.round(percentage), "%"] })] }), _jsxs("div", { className: "relative h-8 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gray-200 dark:bg-gray-700" }), _jsx("div", { className: `
            absolute top-0 left-0 h-full rounded-full transition-all duration-500
            ${isOverTarget
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600'}
          `, style: { width: `${percentage}%` } }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("span", { className: `
            text-xs font-semibold
            ${isOverTarget ? 'text-white' : 'text-gray-700 dark:text-gray-300'}
          `, children: formatMinutes(data.weeklyActual) }) })] }), _jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsxs("div", { className: "text-gray-500 dark:text-gray-400", children: ["Target: ", _jsx("span", { className: "font-medium text-gray-700 dark:text-gray-300", children: formatMinutes(data.weeklyTarget) })] }), isOverTarget ? (_jsxs("div", { className: "text-green-600 dark:text-green-400 font-medium", children: ["\uD83C\uDFAF Exceeded by ", formatMinutes(data.weeklyActual - data.weeklyTarget), "!"] })) : (_jsxs("div", { className: "text-gray-500 dark:text-gray-400", children: [formatMinutes(remaining), " remaining"] }))] }), percentage >= 100 && (_jsx("div", { className: "mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg", children: _jsx("p", { className: "text-sm text-green-800 dark:text-green-300 font-medium", children: "\uD83C\uDF89 Amazing work! You've hit your weekly target!" }) })), percentage >= 75 && percentage < 100 && (_jsx("div", { className: "mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg", children: _jsxs("p", { className: "text-sm text-blue-800 dark:text-blue-300 font-medium", children: ["\uD83D\uDCAA Almost there! Just ", formatMinutes(remaining), " more to reach your target."] }) })), percentage >= 50 && percentage < 75 && (_jsx("p", { className: "mt-2 text-xs text-gray-600 dark:text-gray-400 text-center", children: "Keep going! You're making good progress." })), percentage < 50 && percentage > 0 && (_jsxs("p", { className: "mt-2 text-xs text-gray-600 dark:text-gray-400 text-center", children: [formatMinutes(remaining), " to go. You've got this!"] }))] }));
}
