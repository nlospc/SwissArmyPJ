import { useState } from 'react';
import { useStore } from './store';
import { formatCurrency } from './utils';
import {
  ArrowLeftIcon,
  PlusIcon,
  FilterIcon,
  CheckCircleIcon,
  CalendarIcon,
  ChartBarIcon,
  UserIcon,
} from './icons';

export function WorkPackageList() {
  const { projects, currentProject, setCurrentProject } = useStore();
  const [filter, setFilter] = useState<string>('all');

  const project = projects.find(p => p.id === currentProject);
  const tasks = project?.tasks || [];

  const getFilteredTasks = () => {
    if (filter === 'all') return tasks;
    return tasks.filter(task => task.status === filter);
  };

  const getTaskStats = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return { total: 0, completed: 0, progress: 0 };
    return {
      total: 1,
      completed: task.status === 'done' ? 1 : 0,
      progress: task.status === 'done' ? 100 : task.status === 'in_progress' ? 50 : 0
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return (
          <span className="badge badge-completed">
            <CheckCircleIcon className="w-3 h-3" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="badge badge-active">
            <CheckCircleIcon className="w-3 h-3" />
            Active
          </span>
        );
      case 'blocked':
        return (
          <span className="badge badge-pending">
            Blocked
          </span>
        );
      default:
        return (
          <span className="badge badge-pending">
            Todo
          </span>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-badge-completed';
      case 'in_progress': return 'bg-badge-active';
      case 'blocked': return 'bg-badge-pending';
      default: return 'bg-border';
    }
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentProject(null)}
            className="btn btn-ghost p-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="section-title">{project?.name}</h1>
              {getStatusBadge(project?.status || 'active')}
            </div>
            <p className="section-subtitle">
              {project?.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary">
            <FilterIcon className="w-4 h-4" />
            {filter === 'all' ? 'All Status' : filter}
          </button>
          <button className="btn btn-primary">
            <PlusIcon className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-start justify-between mb-2">
            <span className="text-2xl font-bold text-text-primary">
              {tasks.length}
            </span>
            <ChartBarIcon className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-xs text-text-tertiary">Total Work Packages</p>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between mb-2">
            <span className="text-2xl font-bold text-text-primary">
              {tasks.filter(t => t.status === 'done').length}
            </span>
            <CheckCircleIcon className="w-5 h-5 text-success" />
          </div>
          <p className="text-xs text-text-tertiary">Completed</p>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between mb-2">
            <span className="text-2xl font-bold text-text-primary">
              {tasks.filter(t => t.status === 'in_progress').length}
            </span>
            <CheckCircleIcon className="w-5 h-5 text-primary" />
          </div>
          <p className="text-xs text-text-tertiary">In Progress</p>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between mb-2">
            <span className="text-2xl font-bold text-text-primary">
              {formatCurrency(project?.spent || 0)}
            </span>
            <UserIcon className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-xs text-text-tertiary">Budget Used</p>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-auto border border-border rounded-lg bg-white">
        <table className="w-full">
          <thead className="sticky top-0 bg-white border-b border-border-light">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Work Package
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Assignee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Timeline
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Budget
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredTasks.map((task) => {
              const stats = getTaskStats(task.id);
              const startDate = task.startDate ? new Date(task.startDate) : null;
              const endDate = task.endDate ? new Date(task.endDate) : null;

              return (
                <tr
                  key={task.id}
                  className="hover:bg-background-hover transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-text-tertiary">
                          {task.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-text-primary">
                            {task.name}
                          </h3>
                          {getStatusBadge(task.status)}
                        </div>
                        <p className="text-xs text-text-tertiary line-clamp-1">
                          {task.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {task.assignee?.charAt(0) || '?'}
                        </span>
                      </div>
                      <span className="text-sm text-text-primary">
                        {task.assignee || 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4 text-text-muted" />
                      <span className="text-sm text-text-primary">
                        {startDate && endDate
                          ? `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                          : 'Not set'
                        }
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-text-tertiary">
                            {stats.completed} of {stats.total} tasks
                          </span>
                          <span className="text-xs font-medium text-text-tertiary">
                            {stats.progress}%
                          </span>
                        </div>
                        <div className="progress-bar h-1.5">
                          <div
                            className={`progress-fill ${getStatusColor(task.status)}`}
                            style={{ width: `${stats.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-text-primary">
                      {formatCurrency(task.budget || 0)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
