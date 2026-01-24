import { useState } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import type { Project, ProjectInput } from '@shared/types';

interface ProjectListProps {
  onProjectSelect: (projectId: number) => void;
}

export default function ProjectList({ onProjectSelect }: ProjectListProps) {
  const { projects, addProject, updateProject, removeProject, isLoading, error } = useProjectStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProjectInput>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'active',
    budget_planned: 0,
  });

  const handleCreate = async () => {
    try {
      const result = await window.electronAPI.project.create(formData);
      if (result.success && result.data) {
        addProject(result.data);
        setIsCreating(false);
        setFormData({ name: '', description: '', start_date: '', end_date: '', status: 'active', budget_planned: 0 });
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      const result = await window.electronAPI.project.update(id, formData);
      if (result.success && result.data) {
        updateProject(id, result.data);
        setEditingId(null);
      }
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        const result = await window.electronAPI.project.delete(id);
        if (result.success) {
          removeProject(id);
        }
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setFormData({
      name: project.name,
      description: project.description || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      status: project.status,
      budget_planned: project.budget_planned,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading projects...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Projects</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="btn btn-primary"
        >
          + New Project
        </button>
      </div>

      {(isCreating || editingId !== null) && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {isCreating ? 'Create New Project' : 'Edit Project'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  className="input"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  className="input"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Budget Planned</label>
                <input
                  type="number"
                  className="input"
                  value={formData.budget_planned}
                  onChange={(e) => setFormData({ ...formData, budget_planned: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={isCreating ? handleCreate : () => editingId && handleUpdate(editingId)}
                className="btn btn-primary"
                disabled={!formData.name}
              >
                {isCreating ? 'Create' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                  setFormData({ name: '', description: '', start_date: '', end_date: '', status: 'active', budget_planned: 0 });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No projects yet</p>
            <p className="text-sm">Create your first project to get started</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onProjectSelect(project.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-gray-600 text-sm mb-2">{project.description}</p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-500">
                    {project.start_date && (
                      <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                    )}
                    {project.end_date && (
                      <span>End: {new Date(project.end_date).toLocaleDateString()}</span>
                    )}
                    {project.budget_planned > 0 && (
                      <span>Budget: ${project.budget_planned.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(project);
                    }}
                    className="btn btn-secondary text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
                    className="btn btn-danger text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
