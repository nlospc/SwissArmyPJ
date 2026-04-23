import React from 'react';
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

  const navItems: Array<{
    id: 'projects' | 'workbench' | 'inbox' | 'search' | 'settings';
    icon: React.ReactNode;
    labelKey: 'nav.projects' | 'nav.workbench' | 'nav.inbox' | 'nav.search' | 'nav.settings';
    badge?: number;
  }> = [
    { id: 'projects', icon: <FolderKanban className="h-4 w-4" />, labelKey: 'nav.projects' as const },
    { id: 'workbench', icon: <LayoutDashboard className="h-4 w-4" />, labelKey: 'nav.workbench' as const },
    { id: 'inbox', icon: <Inbox className="h-4 w-4" />, labelKey: 'nav.inbox' as const, badge: unprocessedCount },
    { id: 'search', icon: <Search className="h-4 w-4" />, labelKey: 'nav.search' as const },
    { id: 'settings', icon: <Settings className="h-4 w-4" />, labelKey: 'nav.settings' as const },
  ];

  return (
    <div className="w-64 border-r border-gray-200 bg-white h-full flex flex-col dark:border-gray-700 dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('app.name')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">PM Workspace MVP</p>
          </div>
          <Tooltip title={isDark ? '切换到亮色模式' : '切换到暗色模式'}>
            <Button type="text" icon={isDark ? <SunOutlined className="h-4 w-4" /> : <MoonOutlined className="h-4 w-4" />} onClick={toggleTheme} />
          </Tooltip>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <Button key={item.id} type={isActive ? 'primary' : 'text'} className="w-full justify-start h-10" icon={item.icon} onClick={() => setCurrentView(item.id)}>
              {t(item.labelKey)}
              {item.badge !== undefined && item.badge > 0 && <Badge count={item.badge} className="ml-auto" />}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
        <div className="flex items-center justify-between">
          <p>v1.0.0</p>
          <span>{isDark ? '🌙 暗色' : '☀️ 亮色'}</span>
        </div>
      </div>
    </div>
  );
}
