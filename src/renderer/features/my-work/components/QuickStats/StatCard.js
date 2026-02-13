import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from 'antd';
const variantStyles = {
    default: { borderColor: undefined, background: undefined, iconColor: '#6b7280' },
    success: { borderColor: '#86efac', background: '#f0fdf4', iconColor: '#16a34a' },
    warning: { borderColor: '#fcd34d', background: '#fffbeb', iconColor: '#d97706' },
    danger: { borderColor: '#fca5a5', background: '#fef2f2', iconColor: '#dc2626' },
};
export function StatCard({ icon: Icon, label, value, subtext, variant = 'default', className, }) {
    const styles = variantStyles[variant];
    return (_jsx(Card, { className: `flex-1 min-w-[140px] ${className || ''}`, styles: { body: { padding: 16 } }, style: { borderColor: styles.borderColor, backgroundColor: styles.background }, children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 rounded-lg bg-theme-container", style: { color: styles.iconColor }, children: _jsx(Icon, { className: "h-5 w-5" }) }), _jsxs("div", { className: "flex flex-col gap-0.5", children: [_jsx("span", { className: "text-2xl font-semibold", children: value }), _jsx("span", { className: "text-xs text-theme-secondary", children: label }), subtext && (_jsx("span", { className: "text-[10px] text-theme-secondary", children: subtext }))] })] }) }));
}
