import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useUIStore } from '@/stores/useUIStore';
import { useInboxStore } from '@/stores/useInboxStore';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { Button, Badge, Tooltip } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { FolderKanban, LayoutDashboard, Inbox, Search, Settings } from 'lucide-react';
export function Sidebar() {
    const { currentView, setCurrentView } = useUIStore();
    const { getUnprocessedCount } = useInboxStore();
    const { isDark, toggleTheme } = useTheme();
    const { t } = useI18n();
    const unprocessedCount = getUnprocessedCount();
    const navItems = [
        { id: 'projects', icon: _jsx(FolderKanban, { className: "h-4 w-4" }), labelKey: 'nav.projects' },
        { id: 'workbench', icon: _jsx(LayoutDashboard, { className: "h-4 w-4" }), labelKey: 'nav.workbench' },
        { id: 'inbox', icon: _jsx(Inbox, { className: "h-4 w-4" }), labelKey: 'nav.inbox', badge: unprocessedCount },
        { id: 'search', icon: _jsx(Search, { className: "h-4 w-4" }), labelKey: 'nav.search' },
        { id: 'settings', icon: _jsx(Settings, { className: "h-4 w-4" }), labelKey: 'nav.settings' },
    ];
    return (_jsxs("div", { className: "w-64 border-r border-gray-200 bg-white h-full flex flex-col dark:border-gray-700 dark:bg-gray-900", children: [_jsx("div", { className: "p-4 border-b border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-gray-900 dark:text-gray-100", children: t('app.name') }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: "PM Workspace MVP" })] }), _jsx(Tooltip, { title: isDark ? '切换到亮色模式' : '切换到暗色模式', children: _jsx(Button, { type: "text", icon: isDark ? _jsx(SunOutlined, { className: "h-4 w-4" }) : _jsx(MoonOutlined, { className: "h-4 w-4" }), onClick: toggleTheme }) })] }) }), _jsx("nav", { className: "flex-1 p-4 space-y-2", children: navItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (_jsxs(Button, { type: isActive ? 'primary' : 'text', className: "w-full justify-start h-10", icon: item.icon, onClick: () => setCurrentView(item.id), children: [t(item.labelKey), item.badge !== undefined && item.badge > 0 && _jsx(Badge, { count: item.badge, className: "ml-auto" })] }, item.id));
                }) }), _jsx("div", { className: "p-4 border-t border-gray-200 text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { children: "v1.0.0" }), _jsx("span", { children: isDark ? '🌙 暗色' : '☀️ 亮色' })] }) })] }));
}
