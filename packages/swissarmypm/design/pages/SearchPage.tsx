import { useState, useEffect } from 'react';
import { Search as SearchIcon, FolderKanban, LayoutDashboard, FileText, Inbox } from 'lucide-react';
import { storage, Portfolio, Project, WorkItem, InboxItem } from '../lib/storage';

type SearchResult = {
  type: 'portfolio' | 'project' | 'workItem' | 'inbox';
  id: string;
  title: string;
  subtitle: string;
  data: Portfolio | Project | WorkItem | InboxItem;
};

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  async function performSearch(searchQuery: string) {
    setIsSearching(true);
    const lowerQuery = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    try {
      // Search portfolios
      const portfolios = await storage.getAll('portfolios');
      portfolios.forEach(pf => {
        if (
          pf.name.toLowerCase().includes(lowerQuery) ||
          pf.description.toLowerCase().includes(lowerQuery)
        ) {
          searchResults.push({
            type: 'portfolio',
            id: pf.id,
            title: pf.name,
            subtitle: pf.description,
            data: pf
          });
        }
      });

      // Search projects
      const projects = await storage.getAll('projects');
      projects.forEach(proj => {
        if (
          proj.name.toLowerCase().includes(lowerQuery) ||
          proj.owner.toLowerCase().includes(lowerQuery) ||
          proj.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        ) {
          searchResults.push({
            type: 'project',
            id: proj.id,
            title: proj.name,
            subtitle: `Owner: ${proj.owner} • Status: ${proj.status.replace('_', ' ')}`,
            data: proj
          });
        }
      });

      // Search work items
      const workItems = await storage.getAll('workItems');
      workItems.forEach(wi => {
        if (
          wi.title.toLowerCase().includes(lowerQuery) ||
          wi.notes?.toLowerCase().includes(lowerQuery)
        ) {
          const project = projects.find(p => p.id === wi.projectId);
          searchResults.push({
            type: 'workItem',
            id: wi.id,
            title: wi.title,
            subtitle: `${project?.name || 'Unknown'} • ${wi.type.toUpperCase()} • ${wi.status.replace('_', ' ')}`,
            data: wi
          });
        }
      });

      // Search inbox
      const inboxItems = await storage.getAll('inboxItems');
      inboxItems.forEach(item => {
        if (item.rawText.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            type: 'inbox',
            id: item.id,
            title: item.rawText.substring(0, 100) + (item.rawText.length > 100 ? '...' : ''),
            subtitle: `Inbox • ${item.processed ? 'Processed' : 'Unprocessed'} • ${new Date(item.createdAt).toLocaleDateString()}`,
            data: item
          });
        }
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'portfolio':
        return <LayoutDashboard className="w-5 h-5 text-blue-600" />;
      case 'project':
        return <FolderKanban className="w-5 h-5 text-green-600" />;
      case 'workItem':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'inbox':
        return <Inbox className="w-5 h-5 text-orange-600" />;
    }
  };

  const groupedResults = {
    portfolio: results.filter(r => r.type === 'portfolio'),
    project: results.filter(r => r.type === 'project'),
    workItem: results.filter(r => r.type === 'workItem'),
    inbox: results.filter(r => r.type === 'inbox')
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Search</h1>
        
        {/* Search Input */}
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across portfolios, projects, work items, and inbox..."
            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
            autoFocus
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {query.trim().length < 2 ? (
            <div className="text-center py-12">
              <SearchIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Start typing to search
              </h3>
              <p className="text-slate-500">
                Search across all portfolios, projects, work items, and inbox
              </p>
            </div>
          ) : results.length === 0 && !isSearching ? (
            <div className="text-center py-12">
              <SearchIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No results found
              </h3>
              <p className="text-slate-500">
                Try adjusting your search query
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Portfolios */}
              {groupedResults.portfolio.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 uppercase mb-3">
                    Portfolios ({groupedResults.portfolio.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedResults.portfolio.map(result => (
                      <div
                        key={result.id}
                        className="bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            {getIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 mb-1">{result.title}</h4>
                            <p className="text-sm text-slate-600">{result.subtitle}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {groupedResults.project.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 uppercase mb-3">
                    Projects ({groupedResults.project.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedResults.project.map(result => (
                      <div
                        key={result.id}
                        className="bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-50 rounded-lg">
                            {getIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 mb-1">{result.title}</h4>
                            <p className="text-sm text-slate-600">{result.subtitle}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Items */}
              {groupedResults.workItem.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 uppercase mb-3">
                    Work Items ({groupedResults.workItem.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedResults.workItem.map(result => (
                      <div
                        key={result.id}
                        className="bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            {getIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 mb-1">{result.title}</h4>
                            <p className="text-sm text-slate-600">{result.subtitle}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inbox */}
              {groupedResults.inbox.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 uppercase mb-3">
                    Inbox ({groupedResults.inbox.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedResults.inbox.map(result => (
                      <div
                        key={result.id}
                        className="bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-orange-50 rounded-lg">
                            {getIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 mb-1">{result.title}</h4>
                            <p className="text-sm text-slate-600">{result.subtitle}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
