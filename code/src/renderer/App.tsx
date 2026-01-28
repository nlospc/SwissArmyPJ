import { useState, useEffect } from 'react';
import { useStore } from './store';
import { ProjectList } from './ProjectList';
import { WorkPackageList } from './WorkPackageList';
import { GanttPage } from './pages/GanttPage';
import { InboxPage } from './InboxPage';
import { SearchPage } from './SearchPage';
import { SettingsPage } from './SettingsPage';
import {
  FolderIcon,
  ChartBarIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  CogIcon,
  BellIcon,
  CalendarIcon,
} from './icons';
import { Agentation } from 'agentation';

function App() {
  const { view, setView, currentProject, setCurrentProject, fetchProjects } = useStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  const [today] = useState(() => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  });

  const navigationItems = [
    { id: 'projects', label: 'Projects', icon: FolderIcon },
    { id: 'gantt', label: 'Gantt Chart', icon: ChartBarIcon },
    { id: 'inbox', label: 'Inbox', icon: InboxIcon },
    { id: 'search', label: 'Search', icon: MagnifyingGlassIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon },
  ];

  return (
    <>
      <div className="flex h-screen bg-background-secondary">
      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-border flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border">
          <h1 className="text-base font-bold text-text-primary">
            SwissArmyPM
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = view === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setView(item.id);
                      if (item.id === 'projects' && currentProject) {
                        setCurrentProject(null);
                      }
                    }}
                    className={`sidebar-link w-full ${
                      isActive ? 'sidebar-link-active' : ''
                    }`}
                  >
                    <Icon className="sidebar-icon" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <CalendarIcon className="w-4 h-4" />
            <span>Today: {today}</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn btn-ghost p-2">
              <BellIcon className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">
              SA
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {view === 'projects' && !currentProject && <ProjectList />}
          {view === 'projects' && currentProject && <WorkPackageList />}
          {view === 'gantt' && <GanttPage />}
          {view === 'inbox' && <InboxPage />}
          {view === 'search' && <SearchPage />}
          {view === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
    {/* Agentation - Visual feedback tool for AI coding collaboration */}
    {import.meta.env.DEV && <Agentation />}
    </>
  );
}

export default App;
