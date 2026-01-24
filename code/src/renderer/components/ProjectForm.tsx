import { useState, useEffect } from 'react';
import type { Project, ProjectInput } from '@shared/types';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: ProjectInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProjectForm({ project, onSubmit, onCancel, isSubmitting = false }: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectInput>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'active',
    budget_planned: 0,
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        status: project.status,
        budget_planned: project.budget_planned,
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1.5">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input"
          placeholder="Enter project name"
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
          className="input min-h-[100px]"
          placeholder="Enter project description"
          rows={3}
        />
      </div>

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

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-1.5">
          Status
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          className="input"
        >
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
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
          {isSubmitting ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
