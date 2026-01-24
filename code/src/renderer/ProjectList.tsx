import { useStore } from './store';
import { formatCurrency, formatDateRange } from './utils';
import { PlusIcon, SearchIcon, FilterIcon } from './icons';
import {
  CalendarIcon,
  TaskIcon,
  CurrencyIcon,
  CheckCircleIcon,
} from './icons';

export function ProjectList() {
  const { projects, setCurrentProject } = useStore();

  const getProjectProgress = (tasks: any[]) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'done').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const getBudgetUsed = (budget: number, spent: number) => {
    return budget > 0 ? Math.round((spent / budget) * 100) : 0;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title mb-1">Projects</h1>
          <p className="section-subtitle">
            Manage your project portfolio and timelines
          </p>
        </div>
        <button className="btn btn-primary">
          <PlusIcon className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search projects..."
            className="pl-10 input"
          />
        </div>
        <button className="btn btn-secondary">
          <FilterIcon className="w-4 h-4" />
          All Status
        </button>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => {
          const progress = getProjectProgress(project.tasks);
          const budgetUsed = getBudgetUsed(project.budget, project.spent);
          const isActive = project.status === 'active';
          const isCompleted = project.status === 'completed';

          return (
            <div
              key={project.id}
              className="card hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setCurrentProject(project.id)}
            >
              {/* Project Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-text-primary mb-1">
                      {project.name}
                    </h3>
                    <p className="text-sm text-text-tertiary line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <span className="badge badge-completed">
                      <CheckCircleIcon className="w-3 h-3" />
                      Completed
                    </span>
                  ) : isActive ? (
                    <span className="badge badge-active">
                      <CheckCircleIcon className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="badge badge-pending">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-text-tertiary">Progress</span>
                  <span className="text-xs font-medium text-text-tertiary">
                    {progress}%
                  </span>
                </div>
                <div className="progress-bar h-1.5">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Project Stats */}
              <div className="pt-4 border-t border-border-light">
                <div className="grid grid-cols-2 gap-4">
                  {/* Timeline */}
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">
                      Timeline
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3 h-3 text-text-tertiary" />
                      <span className="text-sm text-text-primary font-medium">
                        {formatDateRange(project.startDate, project.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Work Packages */}
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">
                      Work Packages
                    </div>
                    <div className="text-sm text-text-primary font-medium">
                      {project.tasks?.length || 0} tasks
                    </div>
                  </div>

                  {/* Budget Used */}
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">
                      Budget Used
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-medium text-text-primary">
                        {budgetUsed}%
                      </span>
                      <span className="text-xs text-text-tertiary">
                        ({formatCurrency(project.spent)})
                      </span>
                    </div>
                  </div>

                  {/* Budget Planned */}
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">
                      Budget Planned
                    </div>
                    <div className="text-sm text-text-primary font-medium">
                      {formatCurrency(project.budget)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
