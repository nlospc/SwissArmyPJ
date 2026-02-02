import React from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { useInboxStore } from '@/stores/useInboxStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inbox, LayoutDashboard, FolderKanban, ListChecks, Search, Settings } from 'lucide-react';

export function Sidebar() {
  const { currentView, setCurrentView } = useUIStore();
  const { getUnprocessedCount } = useInboxStore();
  const unprocessedCount = getUnprocessedCount();

  const navItems = [
    { id: 'portfolio', icon: LayoutDashboard, label: 'Portfolio Dashboard' },
    { id: 'inbox', icon: Inbox, label: 'Inbox', badge: unprocessedCount },
    { id: 'projects', icon: FolderKanban, label: 'Projects' },
    { id: 'my-work', icon: ListChecks, label: 'My Work' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ] as const;

  return (
    <div className="w-64 border-r border-border bg-card h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold">SwissArmyPM</h1>
        <p className="text-sm text-muted-foreground">Project Management</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView(item.id as any)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border text-xs text-muted-foreground">
        <p>v1.0.0</p>
      </div>
    </div>
  );
}
