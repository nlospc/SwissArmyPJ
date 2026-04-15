import { useEffect, useState } from 'react';
import { 
  Inbox, 
  LayoutDashboard, 
  FolderKanban, 
  Calendar,
  Search,
  Settings as SettingsIcon
} from 'lucide-react';
import { storage } from './lib/storage';
import { loadSampleData } from './lib/sampleData';
import { InboxPage } from './pages/InboxPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { TimelinePage } from './pages/TimelinePage';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';

type View = 'inbox' | 'portfolio' | 'projects' | 'timeline' | 'search' | 'settings';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('inbox');
  const [isLoading, setIsLoading] = useState(true);
  const [unprocessedCount, setUnprocessedCount] = useState(0);

  useEffect(() => {
    async function initializeApp() {
      try {
        await storage.init();
        await loadSampleData();
        await updateUnprocessedCount();
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoading(false);
      }
    }
    initializeApp();
  }, []);

  async function updateUnprocessedCount() {
    const items = await storage.getAll('inboxItems');
    const count = items.filter(item => !item.processed).length;
    setUnprocessedCount(count);
  }

  const handleInboxChange = () => {
    updateUnprocessedCount();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Initializing SwissArmyPM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="font-bold text-xl">SwissArmyPM</h1>
          <p className="text-sm text-slate-400 mt-1">Local-first PM</p>
        </div>
        
        <nav className="flex-1 p-4">
          <button
            onClick={() => setCurrentView('inbox')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
              currentView === 'inbox'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Inbox className="w-5 h-5" />
            <span className="flex-1 text-left font-medium">Inbox</span>
            {unprocessedCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unprocessedCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setCurrentView('portfolio')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
              currentView === 'portfolio'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="flex-1 text-left font-medium">Portfolio</span>
          </button>
          
          <button
            onClick={() => setCurrentView('projects')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
              currentView === 'projects'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FolderKanban className="w-5 h-5" />
            <span className="flex-1 text-left font-medium">Projects</span>
          </button>
          
          <button
            onClick={() => setCurrentView('timeline')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
              currentView === 'timeline'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="flex-1 text-left font-medium">Timeline</span>
          </button>

          <div className="my-4 border-t border-slate-700" />
          
          <button
            onClick={() => setCurrentView('search')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
              currentView === 'search'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="flex-1 text-left font-medium">Search</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'settings'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="flex-1 text-left font-medium">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {currentView === 'inbox' && <InboxPage onInboxChange={handleInboxChange} />}
        {currentView === 'portfolio' && <PortfolioPage />}
        {currentView === 'projects' && <ProjectsPage />}
        {currentView === 'timeline' && <TimelinePage />}
        {currentView === 'search' && <SearchPage />}
        {currentView === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}
