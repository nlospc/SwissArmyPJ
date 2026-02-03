import React, { useEffect, useState } from 'react';
import { Agentation } from 'agentation';
import { Sidebar } from './components/features/Sidebar';
import { useUIStore } from './stores/useUIStore';
import { useWorkspaceStore } from './stores/useWorkspaceStore';
import { usePortfolioStore } from './stores/usePortfolioStore';
import { useProjectStore } from './stores/useProjectStore';
import { useWorkItemStore } from './stores/useWorkItemStore';
import { useInboxStore } from './stores/useInboxStore';
import { useTodoStore } from './stores/useTodoStore';
import { loadSampleData } from './lib/sampleData';

// Pages (will be imported as we create them)
import { PortfolioPage } from './pages/PortfolioPage';
import { InboxPage } from './pages/InboxPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { MyWorkPage } from './features/my-work';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  const { currentView } = useUIStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const workspaceStore = useWorkspaceStore();
  const portfolioStore = usePortfolioStore();
  const projectStore = useProjectStore();
  const workItemStore = useWorkItemStore();
  const inboxStore = useInboxStore();
  const todoStore = useTodoStore();

  useEffect(() => {
    async function initialize() {
      try {
        setIsLoading(true);

        // Load workspace
        await workspaceStore.loadWorkspace();

        // Check if we need to load sample data
        await projectStore.loadProjects();
        if (projectStore.projects.length === 0) {
          console.log('Loading sample data...');
          await loadSampleData();
        }

        // Load all data
        await Promise.all([
          portfolioStore.loadPortfolios(),
          projectStore.loadProjects(),
          workItemStore.loadAllWorkItems(),
          inboxStore.loadInboxItems(),
          todoStore.loadTodos(),
        ]);

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading SwissArmyPM...</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center text-destructive">
          <p className="font-semibold mb-2">Failed to initialize</p>
          <p className="text-sm text-muted-foreground">Please check the console for errors</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {currentView === 'portfolio' && <PortfolioPage />}
        {currentView === 'inbox' && <InboxPage />}
        {currentView === 'projects' && <ProjectsPage />}
        {currentView === 'my-work' && <MyWorkPage />}
        {currentView === 'search' && <SearchPage />}
        {currentView === 'settings' && <SettingsPage />}
      </main>
      {process.env.NODE_ENV === 'development' && <Agentation />}
    </div>
  );
}

export default App;
