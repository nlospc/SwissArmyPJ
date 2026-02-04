import { useState } from 'react';
import { ArrowUpDown, Search, Filter, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProjectHealth } from '@/stores/useDashboardStore';

interface ProjectTableProps {
  projects: ProjectHealth[];
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

export function ProjectTable({ projects }: ProjectTableProps) {
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
    // Search filter
    if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filters.statuses.length > 0 && !filters.statuses.includes(project.status)) {
      return false;
    }

    // Owner filter
    if (filters.owners.length > 0 && !filters.owners.includes(project.owner)) {
      return false;
    }

    // Progress range filter
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
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
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted'
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
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted'
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
            <thead className="bg-muted/50 border-b">
              <tr>
                <SortableHeader
                  field="status"
                  label="Status"
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="name"
                  label="Project"
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="owner"
                  label="Owner"
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="progress"
                  label="Progress"
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="h-12 px-4 text-left text-sm font-medium text-muted-foreground">
                  Tasks
                </th>
                <SortableHeader
                  field="nextMilestone"
                  label="Next Milestone"
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="h-12 px-4 text-center text-sm font-medium text-muted-foreground">
                  Blockers
                </th>
                <th className="h-12 px-4 text-center text-sm font-medium text-muted-foreground">
                  Risks
                </th>
                <th className="h-12 px-4 text-center text-sm font-medium text-muted-foreground w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="h-32 text-center text-muted-foreground">
                    No projects found matching your filters
                  </td>
                </tr>
              ) : (
                sortedProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => {
                      // Navigate to project detail
                      console.log('Navigate to project:', project.id);
                    }}
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
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {project.owner || '—'}
                    </td>

                    {/* Progress */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${project.progressPercent}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
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
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {formatDate(project.nextMilestone.date)}
                            <MilestoneStatusBadge status={project.nextMilestone.status} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Blockers */}
                    <td className="px-4 py-3 text-center">
                      {project.blockerCount > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                          {project.blockerCount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Risks */}
                    <td className="px-4 py-3 text-center">
                      {project.highRiskCount > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                          {project.highRiskCount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show more options
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
        <div className="border-t bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
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
      className="h-12 px-4 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
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
