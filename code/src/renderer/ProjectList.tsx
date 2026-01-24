import { useState, useEffect } from 'react';
import { useStore } from './store';
import { formatCurrency, formatDateRange } from './utils';
import { PlusIcon, SearchIcon, PencilIcon, TrashIcon } from './icons';
import { Modal } from './components/Modal';
import { ProjectForm } from './components/ProjectForm';
import type { Project } from '@shared/types';

export function ProjectList() {
  const {
    projects,
    setCurrentProject,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    isLoading,
    error,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const getFilteredProjects = () => {
    let filtered = projects;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    return filtered;
  };

  const getProjectProgress = (_projectId: number) => {
    // This would ideally come from work packages, but for now we'll use a placeholder
    return 0;
  };

  const getBudgetUsed = (budget: number, spent: number) => {
    return budget > 0 ? Math.round((spent / budget) * 100) : 0;
  };

  const handleCreateProject = async (data: any) => {
    setIsSubmitting(true);
    const response = await createProject(data);
    if (response.success) {
      setIsModalOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleUpdateProject = async (data: any) => {
    if (!editingProject) return;
    setIsSubmitting(true);
    const response = await updateProject(editingProject.id, data);
    if (response.success) {
      setIsModalOpen(false);
      setEditingProject(undefined);
    }
    setIsSubmitting(false);
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This will also delete all work packages and dependencies.`)) {
      return;
    }
    await deleteProject(project.id);
  };

  const handleOpenCreateModal = () => {
    setEditingProject(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(undefined);
  };

  const filteredProjects = getFilteredProjects();

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
        <button onClick={handleOpenCreateModal} className="btn btn-primary">
          <PlusIcon className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search projects..."
            className="pl-10 input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Loading State */}
      {isLoading && projects.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary">
          {searchQuery || statusFilter !== 'all'
            ? 'No projects match your filters'
            : 'No projects yet. Create your first project to get started!'}
        </div>
      ) : (
        /* Project Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const progress = getProjectProgress(project.id);
            const budgetUsed = getBudgetUsed(project.budget_planned, project.budget_actual);
            const isActive = project.status === 'active';
            const isCompleted = project.status === 'completed';

            return (
              <div
                key={project.id}
                className="card hover:border-primary/30 transition-colors cursor-pointer group"
              >
                {/* Project Header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1" onClick={() => setCurrentProject(project)}>
                      <h3 className="text-base font-semibold text-text-primary mb-1">
                        {project.name}
                      </h3>
                      <p className="text-sm text-text-tertiary line-clamp-2">
                        {project.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEditModal(project); }}
                        className="p-1.5 rounded-md hover:bg-background-hover text-text-secondary hover:text-primary transition-colors"
                        title="Edit project"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(project); }}
                        className="p-1.5 rounded-md hover:bg-background-hover text-text-secondary hover:text-red-500 transition-colors"
                        title="Delete project"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <span className="badge badge-completed">
                        Completed
                      </span>
                    ) : isActive ? (
                      <span className="badge badge-active">
                        Active
                      </span>
                    ) : project.status === 'on_hold' ? (
                      <span className="badge badge-pending">
                        On Hold
                      </span>
                    ) : (
                      <span className="badge badge-pending">
                        Cancelled
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
                      <div className="text-sm text-text-primary font-medium">
                        {formatDateRange(project.start_date ?? undefined, project.end_date ?? undefined)}
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
                          ({formatCurrency(project.budget_actual)})
                        </span>
                      </div>
                    </div>

                    {/* Budget Planned */}
                    <div className="col-span-2">
                      <div className="text-xs text-text-tertiary mb-1">
                        Budget Planned
                      </div>
                      <div className="text-sm text-text-primary font-medium">
                        {formatCurrency(project.budget_planned)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProject ? 'Edit Project' : 'New Project'}
        size="md"
      >
        <ProjectForm
          project={editingProject}
          onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
          onCancel={handleCloseModal}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  );
}
