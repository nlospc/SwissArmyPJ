import { useState, useEffect } from 'react';
import { Search, Plus, X, ChevronRight, ChevronDown } from 'lucide-react';
import { storage, Project, WorkItem, generateId } from '../lib/storage';

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [expandedWorkItems, setExpandedWorkItems] = useState<Set<string>>(new Set());
  const [showAddWorkItem, setShowAddWorkItem] = useState(false);
  const [newWorkItem, setNewWorkItem] = useState({
    type: 'task' as WorkItem['type'],
    title: '',
    status: 'not_started' as WorkItem['status']
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [proj, wi] = await Promise.all([
      storage.getAll('projects'),
      storage.getAll('workItems')
    ]);
    setProjects(proj);
    setWorkItems(wi);
  }

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProjectWorkItems = (projectId: string) => {
    return workItems.filter(wi => wi.projectId === projectId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'blocked':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'milestone':
        return 'bg-purple-100 text-purple-700';
      case 'issue':
        return 'bg-red-100 text-red-700';
      case 'clash':
        return 'bg-orange-100 text-orange-700';
      case 'phase':
        return 'bg-indigo-100 text-indigo-700';
      case 'remark':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedWorkItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedWorkItems(newExpanded);
  };

  const handleAddWorkItem = async () => {
    if (!selectedProject || !newWorkItem.title.trim()) return;

    const item: WorkItem = {
      id: generateId('wi'),
      projectId: selectedProject.id,
      type: newWorkItem.type,
      title: newWorkItem.title,
      status: newWorkItem.status,
      level: 1,
      createdAt: new Date().toISOString()
    };

    await storage.add('workItems', item);
    await loadData();
    setShowAddWorkItem(false);
    setNewWorkItem({ type: 'task', title: '', status: 'not_started' });
  };

  return (
    <div className="h-full flex bg-slate-50">
      {/* Left Panel - Project List */}
      <div className="w-2/5 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Projects</h1>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {['all', 'in_progress', 'blocked', 'not_started', 'done'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-auto">
          {filteredProjects.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>No projects found</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filteredProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedProject?.id === project.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="font-medium text-slate-900 mb-2">{project.name}</div>
                  <div className="flex items-center gap-2 text-xs mb-2">
                    <span className={`px-2 py-1 rounded ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-600">{project.owner}</span>
                  </div>
                  {project.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {project.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Project Detail */}
      <div className="flex-1 flex flex-col">
        {!selectedProject ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Select a project
              </h3>
              <p className="text-slate-500">
                Choose a project from the left to view details
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Project Header */}
            <div className="bg-white border-b border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedProject.name}</h2>
              
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="text-sm text-slate-500 block mb-1">Owner</span>
                  <span className="text-sm font-medium text-slate-900">{selectedProject.owner}</span>
                </div>
                <div>
                  <span className="text-sm text-slate-500 block mb-1">Status</span>
                  <span className={`inline-block text-xs px-2 py-1 rounded ${getStatusColor(selectedProject.status)}`}>
                    {selectedProject.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-slate-500 block mb-1">Start Date</span>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : 'TBD'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-slate-500 block mb-1">End Date</span>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : 'TBD'}
                  </span>
                </div>
              </div>

              {selectedProject.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {selectedProject.tags.map(tag => (
                    <span key={tag} className="text-sm px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Work Items Section */}
            <div className="flex-1 overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Work Items</h3>
                  <button
                    onClick={() => setShowAddWorkItem(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Work Item
                  </button>
                </div>

                {/* Add Work Item Form */}
                {showAddWorkItem && (
                  <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-900">New Work Item</h4>
                      <button
                        onClick={() => setShowAddWorkItem(false)}
                        className="p-1 hover:bg-slate-200 rounded"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select
                          value={newWorkItem.type}
                          onChange={(e) => setNewWorkItem({ ...newWorkItem, type: e.target.value as WorkItem['type'] })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="task">Task</option>
                          <option value="issue">Issue</option>
                          <option value="milestone">Milestone</option>
                          <option value="phase">Phase</option>
                          <option value="remark">Remark</option>
                          <option value="clash">Clash</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={newWorkItem.title}
                          onChange={(e) => setNewWorkItem({ ...newWorkItem, title: e.target.value })}
                          placeholder="Enter work item title"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select
                          value={newWorkItem.status}
                          onChange={(e) => setNewWorkItem({ ...newWorkItem, status: e.target.value as WorkItem['status'] })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>
                      <button
                        onClick={handleAddWorkItem}
                        disabled={!newWorkItem.title.trim()}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Work Item
                      </button>
                    </div>
                  </div>
                )}

                {/* Work Items Table */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  {getProjectWorkItems(selectedProject.id).filter(wi => wi.level === 1).length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <p>No work items yet</p>
                      <p className="text-sm mt-1">Click "Add Work Item" to get started</p>
                    </div>
                  ) : (
                    <div>
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                        <div className="col-span-5">Title</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-3">Dates</div>
                      </div>
                      
                      {/* Table Body */}
                      {getProjectWorkItems(selectedProject.id)
                        .filter(wi => wi.level === 1)
                        .map(workItem => {
                          const children = getProjectWorkItems(selectedProject.id).filter(
                            wi => wi.parentId === workItem.id
                          );
                          const isExpanded = expandedWorkItems.has(workItem.id);
                          
                          return (
                            <div key={workItem.id}>
                              {/* Parent Row */}
                              <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="col-span-5 flex items-center gap-2">
                                  {children.length > 0 && (
                                    <button
                                      onClick={() => toggleExpand(workItem.id)}
                                      className="p-0.5 hover:bg-slate-200 rounded"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-slate-600" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-slate-600" />
                                      )}
                                    </button>
                                  )}
                                  <span className="text-sm text-slate-900 font-medium">{workItem.title}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className={`inline-block text-xs px-2 py-1 rounded ${getTypeColor(workItem.type)}`}>
                                    {workItem.type.toUpperCase()}
                                  </span>
                                </div>
                                <div className="col-span-2">
                                  <span className={`inline-block text-xs px-2 py-1 rounded ${getStatusColor(workItem.status)}`}>
                                    {workItem.status.replace('_', ' ').toUpperCase()}
                                  </span>
                                </div>
                                <div className="col-span-3 text-sm text-slate-600">
                                  {workItem.startDate && workItem.endDate
                                    ? `${new Date(workItem.startDate).toLocaleDateString()} - ${new Date(workItem.endDate).toLocaleDateString()}`
                                    : workItem.startDate
                                    ? new Date(workItem.startDate).toLocaleDateString()
                                    : 'No dates'}
                                </div>
                              </div>
                              
                              {/* Child Rows */}
                              {isExpanded && children.map(child => (
                                <div key={child.id} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                                  <div className="col-span-5 flex items-center gap-2 pl-8">
                                    <span className="text-sm text-slate-700">{child.title}</span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className={`inline-block text-xs px-2 py-1 rounded ${getTypeColor(child.type)}`}>
                                      {child.type.toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className={`inline-block text-xs px-2 py-1 rounded ${getStatusColor(child.status)}`}>
                                      {child.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="col-span-3 text-sm text-slate-600">
                                    {child.startDate && child.endDate
                                      ? `${new Date(child.startDate).toLocaleDateString()} - ${new Date(child.endDate).toLocaleDateString()}`
                                      : child.startDate
                                      ? new Date(child.startDate).toLocaleDateString()
                                      : 'No dates'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
