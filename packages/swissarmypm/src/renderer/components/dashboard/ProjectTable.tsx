import { useState } from 'react';

import { ArrowUpDown, Search, Filter, MoreVertical } from 'lucide-react';

import { Button, Input } from 'antd';

import type { ProjectHealth } from '@/stores/useDashboardStore';



interface ProjectTableProps {

  projects: ProjectHealth[];

  onProjectClick?: (project: ProjectHealth) => void;

}

type SortField = 'name' | 'status' | 'progress' | 'owner' | 'nextMilestone';
type SortOrder = 'asc' | 'desc';

interface FilterState {
  search: string;
  statuses: string[];
  portfolioId: string | null;
  owners: string[];
  progressRange: [number, number];
}

const STATUS_OPTIONS = [
  { value: 'on_track', label: 'On Track', color: 'text-green-500' },
  { value: 'at_risk', label: 'At Risk', color: 'text-yellow-500' },
  { value: 'critical', label: 'Critical', color: 'text-orange-500' },
  { value: 'blocked', label: 'Blocked', color: 'text-red-500' },
];

const STATUS_ICONS: Record<string, string> = {
  on_track: '🟢',
  at_risk: '🟡',
  critical: '🟠',
  blocked: '🚫',
};

export function ProjectTable({ projects, onProjectClick }: ProjectTableProps) {
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    statuses: [],
    portfolioId: null,
    owners: [],
    progressRange: [0, 100],
  });
  const [showFilters, setShowFilters] = useState(false);

  // Get unique owners from projects
  const uniqueOwners = Array.from(new Set(projects.map((p) => p.owner).filter(Boolean)));

  // Apply filters
  const filteredProjects = projects.filter((project) => {
    if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.statuses.length > 0 && !filters.statuses.includes(project.status)) {
      return false;
    }
    if (filters.owners.length > 0 && !filters.owners.includes(project.owner)) {
      return false;
    }
    if (
      project.progressPercent < filters.progressRange[0] ||
      project.progressPercent > filters.progressRange[1]
    ) {
      return false;
    }
    return true;
  });

  // Apply sorting
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'status':
        const statusOrder = { blocked: 0, critical: 1, at_risk: 2, on_track: 3 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
      case 'progress':
        comparison = a.progressPercent - b.progressPercent;
        break;
      case 'owner':
        comparison = a.owner.localeCompare(b.owner);
        break;
      case 'nextMilestone':
        const aDate = a.nextMilestone?.date ? new Date(a.nextMilestone.date).getTime() : 0;
        const bDate = b.nextMilestone?.date ? new Date(b.nextMilestone.date).getTime() : 0;
        comparison = aDate - bDate;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleStatusFilter = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      statuses: [],
      portfolioId: null,
      owners: [],
      progressRange: [0, 100],
    });
  };

  const activeFilterCount = [
    filters.search,
    filters.statuses.length,
    filters.owners.length,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" style={{ zIndex: 1 }} />
          <Input
            placeholder="Search projects..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ paddingLeft: 36 }}
          />
        </div>

        <Button
          size="small"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" style={{ marginRight: 8 }} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button type="text" size="small" onClick={clearFilters}>
            Clear all
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-theme-container">
          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleStatusFilter(option.value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                    filters.statuses.includes(option.value)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-theme-container hover:bg-theme-layout'
                  }`}
                >
                  {STATUS_ICONS[option.value]} {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Owner Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Owner</label>
            <div className="flex flex-wrap gap-2">
              {uniqueOwners.map((owner) => (
                <button
                  key={owner}
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      owners: prev.owners.includes(owner)
                        ? prev.owners.filter((o) => o !== owner)
                        : [...prev.owners, owner],
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                    filters.owners.includes(owner)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-theme-container hover:bg-theme-layout'
                  }`}
                >
                  {owner}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Range Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Progress: {filters.progressRange[0]}% - {filters.progressRange[1]}%
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.progressRange[0]}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    progressRange: [Number(e.target.value), prev.progressRange[1]],
                  }))
                }
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={filters.progressRange[1]}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    progressRange: [prev.progressRange[0], Number(e.target.value)],
                  }))
                }
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-theme-container border-b">
              <tr>
                <SortableHeader field="status" label="Status" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader field="name" label="Project" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader field="owner" label="Owner" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader field="progress" label="Progress" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                <th className="h-12 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Tasks</th>
                <SortableHeader field="nextMilestone" label="Next Milestone" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                <th className="h-12 px-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">Blockers</th>
                <th className="h-12 px-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">Risks</th>
                <th className="h-12 px-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="h-32 text-center text-gray-500 dark:text-gray-400">
                    No projects found matching your filters
                  </td>
                </tr>
              ) : (
                sortedProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-theme-container transition-colors cursor-pointer"
                    onClick={() => onProjectClick?.(project)}
                  >
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="text-xl">{STATUS_ICONS[project.status]}</span>
                    </td>

                    {/* Project Name */}
                    <td className="px-4 py-3">
                      <div className="font-medium">{project.name}</div>
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {project.owner || '—'}
                    </td>

                    {/* Progress */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="h-2 w-full bg-theme-layout rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${project.progressPercent}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {project.progressPercent}%
                        </div>
                      </div>
                    </td>

                    {/* Tasks */}
                    <td className="px-4 py-3 text-sm">
                      {project.doneTasks}/{project.totalTasks}
                    </td>

                    {/* Next Milestone */}
                    <td className="px-4 py-3">
                      {project.nextMilestone ? (
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">{project.nextMilestone.name}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(project.nextMilestone.date)}
                            <MilestoneStatusBadge status={project.nextMilestone.status} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
                      )}
                    </td>

                    {/* Blockers */}
                    <td className="px-4 py-3 text-center">
                      {project.blockerCount > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                          {project.blockerCount}
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">—</span>
                      )}
                    </td>

                    {/* Risks */}
                    <td className="px-4 py-3 text-center">
                      {project.highRiskCount > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                          {project.highRiskCount}
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <Button
                        type="text"
                        size="small"
                        style={{ height: 32, width: 32, padding: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t bg-theme-container px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
          Showing {sortedProjects.length} of {projects.length} projects
        </div>
      </div>
    </div>
  );
}

interface SortableHeaderProps {
  field: SortField;
  label: string;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

function SortableHeader({ field, label, sortField, sortOrder, onSort }: SortableHeaderProps) {
  const isActive = sortField === field;

  return (
    <th
      className="h-12 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={`h-3 w-3 transition-opacity ${
            isActive ? 'opacity-100' : 'opacity-30'
          } ${sortOrder === 'desc' && isActive ? 'rotate-180' : ''}`}
        />
      </div>
    </th>
  );
}

function MilestoneStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    on_track: { label: 'On Track', className: 'text-green-600' },
    at_risk: { label: 'At Risk', className: 'text-yellow-600' },
    overdue: { label: 'Overdue', className: 'text-red-600' },
  };

  const { label, className } = config[status] || config.on_track;

  return <span className={className}>• {label}</span>;
}

function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d overdue`;
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays <= 7) {
    return `${diffDays}d`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
