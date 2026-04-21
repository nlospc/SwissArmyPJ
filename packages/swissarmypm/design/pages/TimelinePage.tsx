import { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Calendar } from 'lucide-react';
import { storage, Project, WorkItem } from '../lib/storage';

type ZoomLevel = 'day' | 'week' | 'month';

export function TimelinePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');

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

  const filteredProjects = selectedProject === 'all' ? projects : projects.filter(p => p.id === selectedProject);
  
  // Get work items for display
  const displayItems = expandedProjectId 
    ? workItems.filter(wi => wi.projectId === expandedProjectId && wi.startDate && wi.endDate)
    : [];

  // Calculate timeline range based on either projects or work items
  const allDates = expandedProjectId 
    ? displayItems.flatMap(wi => [
        wi.startDate ? new Date(wi.startDate) : null,
        wi.endDate ? new Date(wi.endDate) : null
      ]).filter(Boolean) as Date[]
    : filteredProjects.flatMap(p => [
        p.startDate ? new Date(p.startDate) : null,
        p.endDate ? new Date(p.endDate) : null
      ]).filter(Boolean) as Date[];

  const minDate = allDates.length > 0 
    ? new Date(Math.min(...allDates.map(d => d.getTime())))
    : new Date();
  const maxDate = allDates.length > 0
    ? new Date(Math.max(...allDates.map(d => d.getTime())))
    : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  // Generate month markers
  const months: { label: string; position: number }[] = [];
  const currentMonth = new Date(minDate);
  currentMonth.setDate(1);
  
  while (currentMonth <= maxDate) {
    const position = ((currentMonth.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100;
    months.push({
      label: currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      position
    });
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  const getItemPosition = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalRange = maxDate.getTime() - minDate.getTime();
    
    const left = ((start.getTime() - minDate.getTime()) / totalRange) * 100;
    const width = ((end.getTime() - start.getTime()) / totalRange) * 100;
    
    return { left: `${Math.max(0, left)}%`, width: `${Math.max(1, width)}%` };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-slate-400';
    }
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown';
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Timeline</h1>
            <p className="text-slate-500 mt-1">Visual schedule across work items</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1">
              <button
                onClick={() => setZoomLevel('day')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  zoomLevel === 'day' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setZoomLevel('week')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  zoomLevel === 'week' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setZoomLevel('month')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  zoomLevel === 'month' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      {allDates.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No timeline data
            </h3>
            <p className="text-slate-500">
              Projects need start and end dates to appear on the timeline
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="flex min-w-max">
            {/* Left Panel - Project/Work Item List */}
            <div className="w-96 border-r border-slate-200 flex-shrink-0">
              {/* Header */}
              <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase">
                  {expandedProjectId ? 'Work Items' : 'Projects'}
                </span>
                {expandedProjectId && (
                  <button
                    onClick={() => setExpandedProjectId(null)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ← Back to Projects
                  </button>
                )}
              </div>
              
              {/* Rows */}
              {expandedProjectId ? (
                // Show work items when project is expanded
                displayItems.map(item => (
                  <div
                    key={item.id}
                    className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    style={{ height: '60px' }}
                  >
                    <div className="flex items-center h-full gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {getProjectName(item.projectId)}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        item.type === 'milestone' ? 'bg-purple-100 text-purple-700' :
                        item.type === 'phase' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {item.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                // Show projects by default
                filteredProjects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => setExpandedProjectId(project.id)}
                    className="px-4 py-3 border-b border-slate-100 hover:bg-blue-50 transition-colors cursor-pointer"
                    style={{ height: '60px' }}
                  >
                    <div className="flex items-center h-full gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {project.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {project.owner} • {workItems.filter(wi => wi.projectId === project.id).length} work items
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        project.status === 'done' ? 'bg-green-100 text-green-700' :
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        project.status === 'blocked' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {project.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right Panel - Timeline Bars */}
            <div className="flex-1 relative bg-slate-50">
              {/* Month Headers */}
              <div className="sticky top-0 bg-white border-b border-slate-200 h-12 relative z-10">
                {months.map((month, idx) => (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 border-l border-slate-300"
                    style={{ left: `${month.position}%` }}
                  >
                    <div className="px-3 py-2 text-sm font-medium text-slate-700">
                      {month.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid Lines */}
              <div className="absolute inset-0 top-12 pointer-events-none">
                {months.map((month, idx) => (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 border-l border-slate-200"
                    style={{ left: `${month.position}%` }}
                  />
                ))}
              </div>

              {/* Timeline Bars */}
              <div className="relative">
                {expandedProjectId ? (
                  // Render work item bars
                  displayItems.map(item => {
                    const position = getItemPosition(item.startDate!, item.endDate!);
                    
                    return (
                      <div
                        key={item.id}
                        className="border-b border-slate-100"
                        style={{ height: '60px' }}
                      >
                        <div className="relative w-full h-full flex items-center px-4">
                          {item.type === 'milestone' ? (
                            // Diamond for milestones
                            <div
                              className="absolute"
                              style={{ left: position.left }}
                            >
                              <div className={`w-3 h-3 transform rotate-45 ${getStatusColor(item.status)} border-2 border-white shadow-sm`} />
                            </div>
                          ) : item.type === 'phase' ? (
                            // Bracket for phases
                            <div
                              className="absolute h-10 rounded-lg border-2 border-indigo-400 bg-indigo-50/50"
                              style={position}
                            >
                              <div className="px-2 py-1 text-xs font-medium text-indigo-700 truncate">
                                {item.title}
                              </div>
                            </div>
                          ) : (
                            // Regular bar for tasks
                            <div
                              className="absolute h-8 rounded group cursor-pointer"
                              style={position}
                            >
                              <div className={`h-full rounded ${getStatusColor(item.status)} shadow-sm group-hover:shadow-md transition-shadow`}>
                                <div className="px-2 py-1 text-xs font-medium text-white truncate">
                                  {item.status === 'in_progress' && `${item.title.substring(0, 20)}...`}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Render project bars
                  filteredProjects.map(project => {
                    if (!project.startDate || !project.endDate) return null;
                    const position = getItemPosition(project.startDate, project.endDate);
                    
                    return (
                      <div
                        key={project.id}
                        className="border-b border-slate-100"
                        style={{ height: '60px' }}
                      >
                        <div className="relative w-full h-full flex items-center px-4">
                          <div
                            className="absolute h-10 rounded cursor-pointer"
                            style={position}
                            onClick={() => setExpandedProjectId(project.id)}
                          >
                            <div className={`h-full rounded ${getStatusColor(project.status)} shadow-sm hover:shadow-md transition-shadow`}>
                              <div className="px-2 py-1 text-xs font-medium text-white truncate flex items-center h-full">
                                {project.name}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Today Marker */}
              <div
                className="absolute top-12 bottom-0 border-l-2 border-red-500 pointer-events-none z-20"
                style={{ 
                  left: `${((new Date().getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100}%` 
                }}
              >
                <div className="absolute -top-12 left-0 transform -translate-x-1/2">
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Today
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="border-t border-slate-200 p-4 bg-slate-50">
        <div className="flex items-center gap-6 text-sm">
          <span className="font-medium text-slate-600">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 bg-green-500 rounded" />
            <span className="text-slate-600">Done</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 bg-blue-500 rounded" />
            <span className="text-slate-600">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 bg-red-500 rounded" />
            <span className="text-slate-600">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 bg-slate-400 rounded" />
            <span className="text-slate-600">Not Started</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full" />
            <span className="text-slate-600">Milestone</span>
          </div>
        </div>
      </div>
    </div>
  );
}