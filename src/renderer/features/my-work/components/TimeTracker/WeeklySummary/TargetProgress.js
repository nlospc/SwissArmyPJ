import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { theme } from 'antd';
import { formatMinutes } from '@/features/my-work/utils/timeFormatters';
export function TargetProgress({ data, loading }) {
    const { token } = theme.useToken();
    if (loading) {
        return (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "h-4 rounded animate-pulse", style: { backgroundColor: token.colorFillSecondary } }), _jsx("div", { className: "h-8 rounded animate-pulse", style: { backgroundColor: token.colorFillSecondary } })] }));
    }
    if (!data) {
        return null;
    }
    const percentage = Math.min(100, (data.weeklyActual / data.weeklyTarget) * 100);
    const isOverTarget = data.weeklyActual > data.weeklyTarget;
    const remaining = Math.max(0, data.weeklyTarget - data.weeklyActual);
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-medium", style: { color: token.colorText }, children: "Weekly Target" }), _jsxs("span", { className: "text-sm font-semibold", style: {
                            color: isOverTarget
                                ? token.colorSuccess
                                : token.colorText,
                        }, children: [Math.round(percentage), "%"] })] }), _jsxs("div", { className: "relative h-8 rounded-full overflow-hidden", style: { backgroundColor: token.colorFillSecondary }, children: [_jsx("div", { className: "absolute inset-0", style: { backgroundColor: token.colorBorderSecondary } }), _jsx("div", { className: "absolute top-0 left-0 h-full rounded-full transition-all duration-500", style: {
                            width: `${percentage}%`,
                            background: isOverTarget
                                ? `linear-gradient(to right, ${token.colorSuccess}, ${token.colorSuccessBg})`
                                : `linear-gradient(to right, ${token.colorPrimary}, ${token.colorPrimaryBg})`,
                        } }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("span", { className: "text-xs font-semibold", style: {
                                color: isOverTarget ? '#fff' : token.colorText,
                            }, children: formatMinutes(data.weeklyActual) }) })] }), _jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsxs("div", { style: { color: token.colorTextSecondary }, children: ["Target:", ' ', _jsx("span", { className: "font-medium", style: { color: token.colorText }, children: formatMinutes(data.weeklyTarget) })] }), isOverTarget ? (_jsxs("div", { className: "font-medium", style: { color: token.colorSuccess }, children: ["\uD83C\uDFAF Exceeded by ", formatMinutes(data.weeklyActual - data.weeklyTarget), "!"] })) : (_jsxs("div", { style: { color: token.colorTextSecondary }, children: [formatMinutes(remaining), " remaining"] }))] }), percentage >= 100 && (_jsx("div", { className: "mt-3 p-3 rounded-lg", style: {
                    backgroundColor: token.colorSuccessBg,
                    borderColor: token.colorSuccessBorder,
                    border: '1px solid',
                }, children: _jsx("p", { className: "text-sm font-medium", style: { color: token.colorSuccess }, children: "\uD83C\uDF89 Amazing work! You've hit your weekly target!" }) })), percentage >= 75 && percentage < 100 && (_jsx("div", { className: "mt-3 p-3 rounded-lg", style: {
                    backgroundColor: token.colorInfoBg,
                    borderColor: token.colorInfoBorder,
                    border: '1px solid',
                }, children: _jsxs("p", { className: "text-sm font-medium", style: { color: token.colorInfo }, children: ["\uD83D\uDCAA Almost there! Just ", formatMinutes(remaining), " more to reach your target."] }) })), percentage >= 50 && percentage < 75 && (_jsx("p", { className: "mt-2 text-xs text-center", style: { color: token.colorTextSecondary }, children: "Keep going! You're making good progress." })), percentage < 50 && percentage > 0 && (_jsxs("p", { className: "mt-2 text-xs text-center", style: { color: token.colorTextSecondary }, children: [formatMinutes(remaining), " to go. You've got this!"] }))] }));
}
