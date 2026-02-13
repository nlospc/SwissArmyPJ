import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Switch } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useTheme } from '@/hooks/useTheme';
/**
 * 主题切换按钮组件
 * 提供简洁的深色/亮色主题切换功能
 */
export const ThemeToggle = ({ className }) => {
    const { mode, toggleTheme, isDark } = useTheme();
    return (_jsxs("div", { className: `flex items-center gap-2 ${className || ''}`, children: [_jsx(SunOutlined, { className: isDark ? 'text-theme-secondary' : 'text-yellow-500' }), _jsx(Switch, { checked: isDark, onChange: toggleTheme, checkedChildren: "Dark", unCheckedChildren: "Light" }), _jsx(MoonOutlined, { className: isDark ? 'text-blue-300' : 'text-theme-secondary' }), _jsx("span", { className: "text-sm ml-2", style: { color: 'var(--ant-color-text-secondary)' }, children: isDark ? '深色模式' : '亮色模式' })] }));
};
export default ThemeToggle;
