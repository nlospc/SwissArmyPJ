import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { ConfigProvider, Spin, Alert, Button } from 'antd';
import { Agentation } from 'agentation';
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
    const [error, setError] = useState(null);
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
            }
            catch (err) {
                console.error('Failed to initialize app:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            }
            finally {
                setIsLoading(false);
            }
        }
        initialize();
    }, []);
    // Agentation callback - receives UI annotation data
    const handleAnnotationAdd = (annotation) => {
        console.log('Agentation Annotation:', {
            element: annotation.element,
            elementPath: annotation.elementPath,
            boundingBox: annotation.boundingBox,
            text: annotation.text,
        });
    };
    if (isLoading) {
        return (_jsx("div", { className: "h-full w-full flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(Spin, { size: "large" }), _jsx("p", { className: "mt-4 text-theme-secondary", children: t('app.loading') })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "h-full w-full flex items-center justify-center p-8", children: _jsx(Alert, { message: t('app.initFailed'), description: error, type: "error", showIcon: true, action: _jsx(Button, { type: "primary", icon: _jsx(ReloadOutlined, {}), onClick: () => window.location.reload(), children: t('app.retry') }) }) }));
    }
    if (!isInitialized) {
        return (_jsx("div", { className: "h-full w-full flex items-center justify-center", children: _jsxs("div", { className: "text-center text-red-500", children: [_jsx("p", { className: "font-semibold mb-2", children: t('app.initFailed') }), _jsx("p", { className: "text-sm text-theme-secondary", children: t('app.checkConsole') })] }) }));
    }
    return (_jsxs("div", { className: "flex h-full overflow-hidden", children: [_jsx(Sidebar, {}), _jsxs("main", { className: "flex-1 overflow-auto", children: [currentView === 'dashboard' && _jsx(DashboardPage, {}), currentView === 'portfolio' && _jsx(PortfolioPage, {}), currentView === 'inbox' && _jsx(InboxPage, {}), currentView === 'my-work' && _jsx(MyWorkPage, {}), currentView === 'search' && _jsx(SearchPage, {}), currentView === 'settings' && _jsx(SettingsPage, {})] }), process.env.NODE_ENV === 'development' && (_jsx(Agentation, { onAnnotationAdd: handleAnnotationAdd, copyToClipboard: true }))] }));
}
function App() {
    const { isDark } = useTheme();
    return (_jsx(ConfigProvider, { theme: getThemeConfig(isDark), children: _jsx(AppContent, {}) }));
}
export default App;
