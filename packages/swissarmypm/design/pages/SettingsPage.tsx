import { useState } from 'react';
import { Download, Upload, RefreshCw, AlertCircle, CheckCircle2, Moon, Sun, Monitor } from 'lucide-react';
import { storage } from '../lib/storage';
import { loadSampleData } from '../lib/sampleData';

export function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [workspaceName, setWorkspaceName] = useState('Enterprise IT');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [message, setMessage] = useState('');

  const handleExport = async () => {
    try {
      const data = await storage.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `swissarmypm-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage('Data exported successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      setMessage('Failed to export data');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        await storage.importData(text);
        
        setMessage('Data imported successfully. Reloading...');
        setShowSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (error) {
        setMessage('Failed to import data. Please check the file format.');
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
      }
    };
    input.click();
  };

  const handleResetData = async () => {
    if (!confirm('Are you sure you want to reset all data? This will delete everything and reload sample data.')) {
      return;
    }
    
    try {
      // Clear all stores
      await storage.clear('workspaces');
      await storage.clear('portfolios');
      await storage.clear('projects');
      await storage.clear('workItems');
      await storage.clear('inboxItems');
      
      // Reload sample data
      await loadSampleData();
      
      setMessage('Data reset successfully. Reloading...');
      setShowSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage('Failed to reset data');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your workspace preferences and data</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Success/Error Messages */}
          {showSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Success</p>
                <p className="text-sm text-green-700 mt-1">{message}</p>
              </div>
            </div>
          )}
          
          {showError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{message}</p>
              </div>
            </div>
          )}

          {/* Appearance Section */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Appearance</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    theme === 'light'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  <span className="font-medium">Light</span>
                </button>
                
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  <span className="font-medium">Dark</span>
                </button>
                
                <button
                  onClick={() => setTheme('system')}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    theme === 'system'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                  <span className="font-medium">System</span>
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Note: Theme switching is a visual demo only. Actual theme changes are not implemented in this prototype.
              </p>
            </div>
          </div>

          {/* Workspace Section */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Workspace</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Workspace Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-sm text-slate-500 mt-2">
                This name appears in the application header
              </p>
            </div>
          </div>

          {/* Data Management Section */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Data Management</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Export Data</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Download all your data as a JSON file. This includes portfolios, projects, work items, and inbox items.
                </p>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h3 className="font-medium text-slate-900 mb-2">Import Data</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Import data from a previously exported JSON file. This will replace all existing data.
                </p>
                <button
                  onClick={handleImport}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Import JSON
                </button>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h3 className="font-medium text-slate-900 mb-2">Reset to Sample Data</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Delete all current data and reload the original sample dataset. This action cannot be undone.
                </p>
                <button
                  onClick={handleResetData}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Demo Data
                </button>
              </div>
            </div>
          </div>

          {/* AI Provider Section */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Providers (Optional)</h2>
            
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 mb-3">
                AI features are optional and disabled by default. SwissArmyPM works fully without any AI integration.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-200">
                  <div>
                    <div className="font-medium text-slate-900">OpenAI</div>
                    <div className="text-xs text-slate-500">GPT-4 and GPT-3.5</div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                    Not Configured
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-200">
                  <div>
                    <div className="font-medium text-slate-900">Anthropic</div>
                    <div className="text-xs text-slate-500">Claude models</div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                    Not Configured
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-200">
                  <div>
                    <div className="font-medium text-slate-900">Ollama (Local)</div>
                    <div className="text-xs text-slate-500">Run models locally</div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                    Not Configured
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 mt-3">
                AI configuration is for demonstration purposes only in this prototype.
              </p>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">About</h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Version</span>
                <span className="font-medium text-slate-900">1.0.0 (Demo)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Data Storage</span>
                <span className="font-medium text-slate-900">IndexedDB (Local)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Build Date</span>
                <span className="font-medium text-slate-900">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
