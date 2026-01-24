import { useState } from 'react';
import { useStore } from './store';
import { MagnifyingGlassIcon, XMarkIcon } from './icons';

interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'file';
  title: string;
  description?: string;
  project?: string;
  status?: string;
  updatedAt: Date;
}

const MOCK_SEARCH_RESULTS: SearchResult[] = [];

export function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const searchTypes = [
    { id: 'all', label: 'All Types' },
    { id: 'projects', label: 'Projects' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'files', label: 'Files' },
  ];

  const filteredResults = MOCK_SEARCH_RESULTS.filter(result => {
    const matchesType = selectedType === 'all' || result.type === selectedType;
    const matchesQuery = searchQuery === '' ||
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesQuery;
  });

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title mb-1">Search</h1>
          <p className="section-subtitle">
            Search across projects, tasks, and files
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 mb-6">
        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary px-4 py-2 text-sm flex items-center gap-2">
            {searchTypes.find(t => t.id === selectedType)?.label}
            <XMarkIcon className="w-3 h-3 opacity-50" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-3xl">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, description, or content..."
            className="pl-10 input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <MagnifyingGlassIcon className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Start searching
          </h2>
          <p className="text-sm text-text-tertiary max-w-md mx-auto">
            Enter keywords to search across all your projects and tasks
          </p>
        </div>
      </div>
    </div>
  );
}
