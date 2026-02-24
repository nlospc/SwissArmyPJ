import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useUIStore } from '@/stores/useUIStore';
import { useInboxStore } from '@/stores/useInboxStore';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { Button, Badge, Tooltip } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Inbox, LayoutDashboard, FolderKanban, ListChecks, Search, Settings } from 'lucide-react';
export function Sidebar() {
    const { currentView, setCurrentView } = useUIStore();
    const { getUnprocessedCount } = useInboxStore();
    const { isDark, toggleTheme } = useTheme();
    const { t } = useI18n();
    const unprocessedCount = getUnprocessedCount();
    const navItems = [
        { id: 'dashboard', icon: _jsx(LayoutDashboard, { className: "h-4 w-4" }), labelKey: 'nav.dashboard' },
        { id: 'portfolio', icon: _jsx(FolderKanban, { className: "h-4 w-4" }), labelKey: 'nav.portfolio' },
        { id: 'inbox', icon: _jsx(Inbox, { className: "h-4 w-4" }), labelKey: 'nav.inbox', badge: unprocessedCount },
        { id: 'my-work', icon: _jsx(ListChecks, { className: "h-4 w-4" }), labelKey: 'nav.myWork' },
        { id: 'search', icon: _jsx(Search, { className: "h-4 w-4" }), labelKey: 'nav.search' },
        { id: 'settings', icon: _jsx(Settings, { className: "h-4 w-4" }), labelKey: 'nav.settings' },
    ];
    return (_jsxs("div", { className: "w-64 border-r border-theme-secondary bg-theme-container h-full flex flex-col dark:border-gray-700 dark:bg-gray-900", children: [_jsx("div", { className: "p-4 border-b border-theme-secondary dark:border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold", children: t('app.name') }), _jsx("p", { className: "text-sm text-theme-secondary dark:text-theme-secondary", children: "Project Management" })] }), _jsx(Tooltip, { title: isDark ? '切换到亮色模式' : '切换到暗色模式', children: _jsx(Button, { type: "text", icon: isDark ? _jsx(SunOutlined, { className: "h-4 w-4" }) : _jsx(MoonOutlined, { className: "h-4 w-4" }), onClick: toggleTheme }) })] }) }), _jsx("nav", { className: "flex-1 p-4 space-y-2", children: navItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (_jsxs(Button, { type: isActive ? 'primary' : 'text', className: "w-full justify-start h-10", icon: item.icon, onClick: () => setCurrentView(item.id), children: [t(item.labelKey), item.badge !== undefined && item.badge > 0 && (_jsx(Badge, { count: item.badge, className: "ml-auto" }))] }, item.id));
                }) }), _jsx("div", { className: "p-4 border-t border-theme-secondary text-xs text-theme-secondary dark:border-gray-700 dark:text-theme-secondary", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { children: "v1.0.0" }), _jsx("span", { className: `text-xs ${isDark ? 'text-theme-secondary' : 'text-theme-secondary'}`, children: isDark ? '🌙 暗色' : '☀️ 亮色' })] }) })] }));
}
