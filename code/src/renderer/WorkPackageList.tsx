import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useStore } from './store';
import { formatCurrency } from './utils';
import {
  ArrowLeftIcon,
  PlusIcon,
  CheckCircleIcon,
  CalendarIcon,
  ChartBarIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  MilestoneTypeIcon,
  TaskTypeIcon,
  PhaseTypeIcon,
  BugTypeIcon,
  ChevronDownIcon,
  ArrowsPointingOutIcon,
} from './icons';
import { Modal } from './components/Modal';
import { WorkPackageForm } from './components/WorkPackageForm';
import type { WorkPackage, WorkPackageType } from '@shared/types';

// Inline simplified Gantt chart for the toggleable view
const MiniGanttChart: FC<{
  workPackages: WorkPackage[];
  onViewFullGantt: () => void;
}> = ({ workPackages, onViewFullGantt }) => {
  // Get date range
  const dates = workPackages
    .filter(wp => wp.start_date && wp.end_date)
    .flatMap(wp => [
      new Date(wp.start_date!).getTime(),
      new Date(wp.end_date!).getTime()
    ]);

  if (dates.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
        No tasks with dates to display on timeline
      </div>
    );
  }

  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const padding = (maxDate - minDate) * 0.1;
  const rangeStart = new Date(minDate - padding);
  const rangeEnd = new Date(maxDate + padding);
  const totalRange = rangeEnd.getTime() - rangeStart.getTime();

  const getBarStyle = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const left = ((start - rangeStart.getTime()) / totalRange) * 100;
    const width = Math.max(((end - start) / totalRange) * 100, 1);
    return { left: `${left}%`, width: `${width}%` };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return '#00C950';
      case 'in_progress': return '#2B7FFF';
      case 'blocked': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPosition = ((today.getTime() - rangeStart.getTime()) / totalRange) * 100;

  return (
    <div className="relative h-24 bg-background-secondary rounded p-4">
      {/* Today marker */}
      {todayPosition >= 0 && todayPosition <= 100 && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{ left: `${todayPosition}%` }}
        >
          <div className="absolute top-0 -translate-x-1/2 -translate-y-full bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
            Today
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 h-full overflow-x-auto">
        {workPackages.map((wp) => {
          if (!wp.start_date || !wp.end_date) return null;

          const barStyle = getBarStyle(wp.start_date, wp.end_date);
          const statusColor = getStatusColor(wp.status);

          return (
            <div
              key={wp.id}
              className="relative h-8 rounded flex items-center px-2 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              style={{
                ...barStyle,
                backgroundColor: `${statusColor}20`,
                border: `2px solid ${statusColor}`,
                minWidth: '80px',
              }}
              title={wp.name}
              onClick={onViewFullGantt}
            >
              <span className="text-xs font-medium text-text-primary truncate">
                {wp.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function WorkPackageList() {
  const {
    projects,
    currentProject,
    setCurrentProject,
    workPackages,
    fetchWorkPackages,
    createWorkPackage,
    updateWorkPackage,
    deleteWorkPackage,
    isLoading,
    error,
    setView,
  } = useStore();

  const [filter, setFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkPackage, setEditingWorkPackage] = useState<WorkPackage | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGantt, setShowGantt] = useState(false);

  useEffect(() => {
    if (currentProject?.id) {
      fetchWorkPackages(currentProject.id);
    }
  }, [currentProject?.id, fetchWorkPackages]);

  const getFilteredTasks = () => {
    if (filter === 'all') return workPackages;
    return workPackages.filter(task => task.status === filter);
  };

  const getTaskStats = (task: WorkPackage) => {
    return {
      total: 1,
      completed: task.status === 'done' ? 1 : 0,
      progress: task.progress,
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

  type IconComponent = FC<{ className?: string }>;
  const getTypeMeta = (type: WorkPackageType): { label: string; Icon: IconComponent; pillClass: string; tileClass: string; iconClass: string } => {
    switch (type) {
      case 'milestone':
        return {
          label: 'Milestone',
          Icon: MilestoneTypeIcon,
          pillClass: 'bg-purple-50 text-purple-700 border-purple-200',
          tileClass: 'bg-purple-50 border-purple-200',
          iconClass: 'text-purple-700',
        };
      case 'phase':
        return {
          label: 'Phase',
          Icon: PhaseTypeIcon,
          pillClass: 'bg-amber-50 text-amber-800 border-amber-200',
          tileClass: 'bg-amber-50 border-amber-200',
          iconClass: 'text-amber-800',
        };
      case 'bug':
        return {
          label: 'Issue',
          Icon: BugTypeIcon,
          pillClass: 'bg-rose-50 text-rose-700 border-rose-200',
          tileClass: 'bg-rose-50 border-rose-200',
          iconClass: 'text-rose-700',
        };
      case 'task':
      default:
        return {
          label: 'Task',
          Icon: TaskTypeIcon,
          pillClass: 'bg-slate-50 text-slate-700 border-slate-200',
          tileClass: 'bg-slate-50 border-slate-200',
          iconClass: 'text-slate-700',
        };
    }
  };

  const handleCreateWorkPackage = async (data: any) => {
    setIsSubmitting(true);
    const response = await createWorkPackage(data);
    if (response.success) {
      setIsModalOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleUpdateWorkPackage = async (data: any) => {
    if (!editingWorkPackage) return;
    setIsSubmitting(true);
    const response = await updateWorkPackage(editingWorkPackage.id, data);
    if (response.success) {
      setIsModalOpen(false);
      setEditingWorkPackage(undefined);
    }
    setIsSubmitting(false);
  };

  const handleDeleteWorkPackage = async (task: WorkPackage) => {
    if (!confirm(`Are you sure you want to delete "${task.name}"?`)) {
      return;
    }
    await deleteWorkPackage(task.id);
  };

  const handleOpenCreateModal = () => {
    setEditingWorkPackage(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: WorkPackage) => {
    setEditingWorkPackage(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWorkPackage(undefined);
  };

  const filteredTasks = getFilteredTasks();

  if (!currentProject) {
    return null;
  }

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
              <h1 className="section-title">{currentProject.name}</h1>
              {getStatusBadge(currentProject.status)}
            </div>
            <p className="section-subtitle">
              {currentProject.description || 'No description'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGantt(!showGantt)}
            className={`btn btn-secondary flex items-center gap-2 ${showGantt ? 'bg-primary/10 border-primary' : ''}`}
            title={showGantt ? 'Hide Timeline' : 'Show Timeline'}
          >
            <ArrowsPointingOutIcon className="w-4 h-4" />
            {showGantt ? 'Hide Timeline' : 'Show Timeline'}
          </button>
          <select
            className="input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            <PlusIcon className="w-4 h-4" />
            New Work Package
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Project Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-start justify-between mb-2">
            <span className="text-2xl font-bold text-text-primary">
              {workPackages.length}
            </span>
            <ChartBarIcon className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-xs text-text-tertiary">Total Work Packages</p>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between mb-2">
            <span className="text-2xl font-bold text-text-primary">
              {workPackages.filter(t => t.status === 'done').length}
            </span>
            <CheckCircleIcon className="w-5 h-5 text-success" />
          </div>
          <p className="text-xs text-text-tertiary">Completed</p>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between mb-2">
            <span className="text-2xl font-bold text-text-primary">
              {workPackages.filter(t => t.status === 'in_progress').length}
            </span>
            <CheckCircleIcon className="w-5 h-5 text-primary" />
          </div>
          <p className="text-xs text-text-tertiary">In Progress</p>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between mb-2">
            <span className="text-2xl font-bold text-text-primary">
              {formatCurrency(currentProject.budget_actual)}
            </span>
            <UserIcon className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-xs text-text-tertiary">Budget Used</p>
        </div>
      </div>

      {/* Collapsible Timeline/Gantt Section */}
      {showGantt && (
        <div className="mb-6 border border-border rounded-lg bg-white overflow-hidden">
          <div className="bg-background-secondary px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowsPointingOutIcon className="w-4 h-4 text-text-tertiary" />
              <span className="text-sm font-medium text-text-secondary">Timeline Overview</span>
            </div>
            <button
              onClick={() => setView('gantt')}
              className="btn btn-ghost text-xs flex items-center gap-1.5 text-primary"
            >
              Open Full Gantt View
              <ChevronDownIcon className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4">
            <MiniGanttChart
              workPackages={filteredTasks}
              onViewFullGantt={() => setView('gantt')}
            />
          </div>
        </div>
      )}

      {/* Task List */}
      {isLoading && workPackages.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary">Loading work packages...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary">
          {filter !== 'all'
            ? 'No work packages match your filter'
            : 'No work packages yet. Create your first task to get started!'}
        </div>
      ) : (
        <div className="flex-1 overflow-auto border border-border rounded-lg bg-white">
          <table className="w-full">
            <thead className="sticky top-0 bg-white border-b border-border-light">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Work Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
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
                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTasks.map((task) => {
                const stats = getTaskStats(task);
                const startDate = task.start_date ? new Date(task.start_date) : null;
                const endDate = task.end_date ? new Date(task.end_date) : null;
                const typeMeta = getTypeMeta(task.type);

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-background-hover transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${typeMeta.tileClass}`}>
                          <typeMeta.Icon className={`w-4 h-4 ${typeMeta.iconClass}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-text-primary">
                              {task.name}
                            </h3>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${typeMeta.pillClass}`}>
                              <typeMeta.Icon className="w-3.5 h-3.5" />
                              {typeMeta.label}
                            </span>
                          </div>
                          <p className="text-xs text-text-tertiary line-clamp-1">
                            {task.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4 text-text-muted" />
                        <span className="text-sm text-text-primary">
                          {startDate && endDate
                            ? `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                            : startDate
                              ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : endDate
                                ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'Not set'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-text-tertiary">
                              {stats.completed} of {stats.total}
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
                        {formatCurrency(task.budget_planned)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(task)}
                          className="p-1.5 rounded-md hover:bg-background-hover text-text-secondary hover:text-primary transition-colors"
                          title="Edit work package"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWorkPackage(task)}
                          className="p-1.5 rounded-md hover:bg-background-hover text-text-secondary hover:text-red-500 transition-colors"
                          title="Delete work package"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingWorkPackage ? 'Edit Work Package' : 'New Work Package'}
        size="lg"
      >
        <WorkPackageForm
          workPackage={editingWorkPackage}
          projectId={currentProject.id}
          availableProjects={projects}
          onSubmit={editingWorkPackage ? handleUpdateWorkPackage : handleCreateWorkPackage}
          onCancel={handleCloseModal}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  );
}
