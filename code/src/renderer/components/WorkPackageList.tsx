import { useState, useEffect } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import type { WorkPackage, WorkPackageInput } from '@shared/types';

interface WorkPackageListProps {
  projectId: number;
}

export default function WorkPackageList({ projectId }: WorkPackageListProps) {
  const { workPackages, setWorkPackages, addWorkPackage, updateWorkPackage, removeWorkPackage, isLoading } = useProjectStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
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
    budget_planned: 0,
  });

  useEffect(() => {
    loadWorkPackages();
  }, [projectId]);

  const loadWorkPackages = async () => {
    try {
      const result = await window.electronAPI.workPackage.getByProject(projectId);
      if (result.success && result.data) {
        setWorkPackages(result.data);
      }
    } catch (error) {
      console.error('Failed to load work packages:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const result = await window.electronAPI.workPackage.create(formData);
      if (result.success && result.data) {
        addWorkPackage(result.data);
        setIsCreating(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create work package:', error);
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      const result = await window.electronAPI.workPackage.update(id, formData);
      if (result.success && result.data) {
        updateWorkPackage(id, result.data);
        setEditingId(null);
      }
    } catch (error) {
      console.error('Failed to update work package:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this work package?')) {
      try {
        const result = await window.electronAPI.workPackage.delete(id);
        if (result.success) {
          removeWorkPackage(id);
        }
      } catch (error) {
        console.error('Failed to delete work package:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: projectId,
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      duration_days: undefined,
      progress: 0,
      status: 'todo',
      priority: 'medium',
      budget_planned: 0,
    });
  };

  const startEdit = (wp: WorkPackage) => {
    setEditingId(wp.id);
    setFormData({
      project_id: projectId,
      name: wp.name,
      description: wp.description || '',
      start_date: wp.start_date || '',
      end_date: wp.end_date || '',
      duration_days: wp.duration_days || undefined,
      progress: wp.progress,
      status: wp.status,
      priority: wp.priority,
      budget_planned: wp.budget_planned,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading work packages...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Work Packages</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="btn btn-primary"
        >
          + New Work Package
        </button>
      </div>

      {(isCreating || editingId !== null) && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {isCreating ? 'Create New Work Package' : 'Edit Work Package'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Task name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description"
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
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Duration (days)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.duration_days || ''}
                  onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || undefined })}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Progress (%)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                  min="0"
                  max="100"
                />
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  className="input"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
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
                  resetForm();
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
        {workPackages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No work packages yet</p>
            <p className="text-sm">Create tasks to populate your project timeline</p>
          </div>
        ) : (
          workPackages.map((wp) => (
            <div key={wp.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{wp.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(wp.status)}`}>
                      {wp.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(wp.priority)}`}>
                      {wp.priority}
                    </span>
                  </div>
                  {wp.description && (
                    <p className="text-gray-600 text-sm mb-2">{wp.description}</p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-500">
                    {wp.start_date && (
                      <span>Start: {new Date(wp.start_date).toLocaleDateString()}</span>
                    )}
                    {wp.end_date && (
                      <span>End: {new Date(wp.end_date).toLocaleDateString()}</span>
                    )}
                    {wp.duration_days && (
                      <span>Duration: {wp.duration_days} days</span>
                    )}
                    <span>Progress: {wp.progress}%</span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${wp.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(wp)}
                    className="btn btn-secondary text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(wp.id)}
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
