import { useState, useEffect } from 'react';
import type { WorkPackage, WorkPackageInput, Project, WorkPackageType } from '@shared/types';
import { clampProgress, progressFromStatus, statusFromProgress } from '@shared/workPackageRules';

interface WorkPackageFormProps {
  workPackage?: WorkPackage;
  projectId: number;
  availableProjects: Project[];
  onSubmit: (data: WorkPackageInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function WorkPackageForm({
  workPackage,
  projectId,
  availableProjects,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: WorkPackageFormProps) {
  const [formData, setFormData] = useState<WorkPackageInput>({
    project_id: projectId,
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    duration_days: undefined,
    progress: 0,
    status: 'todo',
    priority: 'medium',
    type: 'task',
    parent_id: undefined,
    budget_planned: 0,
  });

  const [selectedProjectId, setSelectedProjectId] = useState(projectId);

  // Get work packages for the selected project (for parent selection)
  const getProjectWorkPackages = (pid: number): WorkPackage[] => {
    const project = availableProjects.find(p => p.id === pid);
    return (project as any)?.work_packages || [];
  };

  useEffect(() => {
    if (workPackage) {
      setFormData({
        project_id: workPackage.project_id,
        name: workPackage.name,
        description: workPackage.description || '',
        start_date: workPackage.start_date || '',
        end_date: workPackage.end_date || '',
        duration_days: workPackage.duration_days || undefined,
        progress: workPackage.progress,
        status: workPackage.status,
        priority: workPackage.priority,
        type: workPackage.type,
        parent_id: workPackage.parent_id || undefined,
        budget_planned: workPackage.budget_planned,
      });
      setSelectedProjectId(workPackage.project_id);
    }
  }, [workPackage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      project_id: selectedProjectId,
    });
  };

  const projectWorkPackages = getProjectWorkPackages(selectedProjectId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Project */}
      <div>
        <label htmlFor="project_id" className="block text-sm font-medium text-text-secondary mb-1.5">
          Project <span className="text-red-500">*</span>
        </label>
        <select
          id="project_id"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(Number(e.target.value))}
          className="input"
          disabled={!!workPackage} // Don't allow changing project when editing
        >
          {availableProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1.5">
          Work Package Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input"
          placeholder="Enter work package name"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1.5">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input min-h-[80px]"
          placeholder="Enter work package description"
          rows={2}
        />
      </div>

      {/* Parent Work Package */}
      {projectWorkPackages.length > 0 && (
        <div>
          <label htmlFor="parent_id" className="block text-sm font-medium text-text-secondary mb-1.5">
            Parent Work Package
          </label>
          <select
            id="parent_id"
            value={formData.parent_id || ''}
            onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? Number(e.target.value) : undefined })}
            className="input"
          >
            <option value="">None (Top-level)</option>
            {projectWorkPackages
              .filter(wp => wp.id !== workPackage?.id) // Can't be parent of itself
              .map((wp) => (
                <option key={wp.id} value={wp.id}>
                  {wp.name}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-text-secondary mb-1.5">
            Start Date
          </label>
          <input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-text-secondary mb-1.5">
            End Date
          </label>
          <input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="input"
          />
        </div>
      </div>

      {/* Duration */}
      <div>
        <label htmlFor="duration_days" className="block text-sm font-medium text-text-secondary mb-1.5">
          Duration (days)
        </label>
        <input
          id="duration_days"
          type="number"
          min="0"
          step="1"
          value={formData.duration_days || ''}
          onChange={(e) => setFormData({ ...formData, duration_days: e.target.value ? Number(e.target.value) : undefined })}
          className="input"
          placeholder="Leave empty to auto-calculate from dates"
        />
      </div>

      {/* Status and Priority */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-1.5">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => {
              const nextStatus = e.target.value as any;
              const nextProgress = progressFromStatus(nextStatus, formData.progress ?? 0);
              setFormData({ ...formData, status: nextStatus, progress: nextProgress });
            }}
            className="input"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-text-secondary mb-1.5">
            Priority
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            className="input"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-text-secondary mb-1.5">
            Type
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as WorkPackageType })}
            className="input"
          >
            <option value="task">Task</option>
            <option value="phase">Phase</option>
            <option value="milestone">Milestone</option>
            <option value="bug">Issue</option>
          </select>
        </div>
      </div>

      {/* Progress */}
      <div>
        <label htmlFor="progress" className="block text-sm font-medium text-text-secondary mb-1.5">
          Progress: {formData.progress}%
        </label>
        <input
          id="progress"
          type="range"
          min="0"
          max="100"
          value={formData.progress}
          onChange={(e) => {
            const nextProgress = clampProgress(Number(e.target.value));
            const nextStatus = statusFromProgress(nextProgress, formData.status ?? 'todo');
            setFormData({ ...formData, progress: nextProgress, status: nextStatus });
          }}
          className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Budget */}
      <div>
        <label htmlFor="budget_planned" className="block text-sm font-medium text-text-secondary mb-1.5">
          Planned Budget
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
          <input
            id="budget_planned"
            type="number"
            min="0"
            step="0.01"
            value={formData.budget_planned}
            onChange={(e) => setFormData({ ...formData, budget_planned: parseFloat(e.target.value) || 0 })}
            className="input pl-7"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !formData.name.trim()}
          className="btn btn-primary"
        >
          {isSubmitting ? 'Saving...' : workPackage ? 'Update Work Package' : 'Create Work Package'}
        </button>
      </div>
    </form>
  );
}
