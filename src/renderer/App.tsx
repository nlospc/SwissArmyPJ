import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme, Spin, Alert, Button } from 'antd';
import { Agentation, type Annotation } from 'agentation';
import { ReloadOutlined } from '@ant-design/icons';

import { Sidebar } from './components/features/Sidebar';
import { useTheme } from './hooks/useTheme';
import { useI18n } from './hooks/useI18n';
import { getThemeConfig } from './config/theme';
import { useUIStore } from './stores/useUIStore';
import { useWorkspaceStore } from './stores/useWorkspaceStore';
import { usePortfolioStore } from './stores/usePortfolioStore';
import { useProjectStore } from './stores/useProjectStore';
import { useWorkItemStore } from './stores/useWorkItemStore';
import { useInboxStore } from './stores/useInboxStore';
import { useTodoStore } from './stores/useTodoStore';
import { loadSampleData } from './lib/sampleData';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { InboxPage } from './pages/InboxPage';
import { MyWorkPage } from './features/my-work';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const { currentView } = useUIStore();
  const { t } = useI18n();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(null);

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
      } catch (err) {
        console.error('Failed to initialize app:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  // Agentation callback - receives UI annotation data
  const handleAnnotationAdd = (annotation: Annotation) => {
    console.log('Agentation Annotation:', {
      element: annotation.element,
      elementPath: annotation.elementPath,
      boundingBox: annotation.boundingBox,
      text: annotation.text,
    });
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center p-8">
        <Alert
          message={t('app.initFailed')}
          description={error}
          type="error"
          showIcon
          action={
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
            >
              {t('app.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center text-red-600 dark:text-red-400">
          <p className="font-semibold mb-2">{t('app.initFailed')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('app.checkConsole')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {currentView === 'dashboard' && <DashboardPage />}
        {currentView === 'portfolio' && <PortfolioPage />}
        {currentView === 'inbox' && <InboxPage />}
        {currentView === 'my-work' && <MyWorkPage />}
        {currentView === 'search' && <SearchPage />}
        {currentView === 'settings' && <SettingsPage />}
      </main>
      {process.env.NODE_ENV === 'development' && (
        <Agentation
          onAnnotationAdd={handleAnnotationAdd}
          copyToClipboard={true}
        />
      )}
    </div>
  );
}

function App() {
  const { isDark } = useTheme();

  return (
    <ConfigProvider theme={getThemeConfig(isDark)}>
      <AppContent />
    </ConfigProvider>
  );
}

export default App;
