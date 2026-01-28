import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useGanttStore } from '@/stores/useGanttStore';
import { useStore } from '@/store';
import type { Project, WorkPackage, WorkPackageType } from '@shared/types';
import type { RenderUnit } from '@/utils/date';
import { DAY_MS, calculateBarStyle } from '@/utils/date';
import { getStatusColor } from '@/utils/colors';
import { sortWorkPackages } from '@/components/gantt/TableHeaderRow';
import { useTimelineNavigation } from '@/hooks/gantt/useTimelineNavigation';
import { useTaskHierarchy } from '@/hooks/gantt/useTaskHierarchy';
import { useColumnConfig } from '@/hooks/gantt/useColumnConfig';
import { useDragDrop } from '@/hooks/gantt/useDragDrop';
import { GanttTopBar } from './GanttTopBar';
import { SplitPane } from './SplitPane';
import { TaskTablePanel } from './table/TaskTablePanel';
import { TimelineCanvas } from './timeline/TimelineCanvas';
import {
  PlusIcon, XMarkIcon, ChartBarIcon, ChevronRightIcon,
} from '@/icons';
import { progressFromStatus, statusFromProgress, clampProgress } from '@/components/gantt/InlineCellEditor';

// ---- TaskModal (kept inline for now - will extract in Phase 4) ----
interface TaskModalProps {
  task: WorkPackage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<WorkPackage>) => void;
  onDelete?: () => void;
}

function TaskModal({ task, isOpen, onClose, onSave, onDelete }: TaskModalProps) {
  const [formData, setFormData] = useState({
    name: '', description: '', start_date: '', end_date: '',
    progress: 0, status: 'todo' as 'todo' | 'in_progress' | 'done' | 'blocked',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    type: 'task' as WorkPackageType, budget_planned: 0,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name, description: task.description || '',
        start_date: task.start_date || '', end_date: task.end_date || '',
        progress: task.progress, status: task.status,
        priority: task.priority, type: task.type, budget_planned: task.budget_planned,
      });
    }
  }, [task]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="p-1 text-text-tertiary hover:text-text-primary" onClick={onClose}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3} className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Start Date</label>
              <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">End Date</label>
              <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
              <select value={formData.status} onChange={(e) => {
                const s = e.target.value as any;
                setFormData({ ...formData, status: s, progress: progressFromStatus(s, formData.progress) });
              }} className="w-full px-3 py-2 border border-border rounded-md">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-border rounded-md">
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as WorkPackageType })}
                className="w-full px-3 py-2 border border-border rounded-md">
                <option value="task">Task</option><option value="phase">Phase</option>
                <option value="milestone">Milestone</option><option value="bug">Issue</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Progress: {formData.progress}%</label>
            <input type="range" min="0" max="100" value={formData.progress}
              onChange={(e) => {
                const p = clampProgress(parseInt(e.target.value, 10));
                setFormData({ ...formData, progress: p, status: statusFromProgress(p, formData.status) });
              }} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Budget Planned</label>
            <input type="number" value={formData.budget_planned}
              onChange={(e) => setFormData({ ...formData, budget_planned: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-border rounded-md" />
          </div>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-border">
          {onDelete && task && (
            <button className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-md" onClick={onDelete}>Delete</button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button className="px-4 py-2 text-text-secondary hover:bg-background-hover rounded-md" onClick={onClose}>Cancel</button>
            <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90" onClick={() => onSave(formData)}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- ProjectRow ----
function ProjectRow({ project, viewStart, viewEnd, onClick }: {
  project: Project; viewStart: Date; viewEnd: Date;
  onClick: (id: number) => void;
}) {
  const barStyle = calculateBarStyle(
    project.start_date ? new Date(project.start_date) : null,
    project.end_date ? new Date(project.end_date) : null,
    viewStart, viewEnd
  );
  const statusColor = getStatusColor(project.status);

  return (
    <div className="flex border-b border-border-light hover:bg-background-hover transition-colors cursor-pointer group">
      <div className="w-[520px] p-4 border-r border-border-light flex items-center gap-3">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">{project.name}</div>
          <div className="text-xs text-text-tertiary mt-1">{project.status.replace('_', ' ')}</div>
        </div>
        <ChevronRightIcon className="w-4 h-4 text-text-tertiary group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
      <div className="flex-1 relative h-[60px] p-3">
        {barStyle.visible && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-8 rounded cursor-pointer hover:opacity-80 transition-opacity"
            style={{ left: barStyle.left, width: barStyle.width, backgroundColor: `${statusColor}20`, border: `2px solid ${statusColor}` }}
            onClick={() => onClick(project.id)}
          >
            <div className="flex items-center h-full px-3">
              <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: statusColor }}>
                <ChartBarIcon className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-xs font-medium text-text-primary ml-2 truncate">{project.name}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main Component ----
export function GanttDrawer() {
  const { projects, setCurrentProject } = useStore();
  const ganttStore = useGanttStore();
  const {
    workPackages, dependencies, selectedProjectId, selectedTaskId,
    timelineWindow, selectedStatus, isLoading, error,
    selectProject, setSelectedTaskId, setSelectedStatus,
    zoomTimeline, updateWorkPackage, createWorkPackage, deleteWorkPackage,
  } = ganttStore;

  const [viewMode, setViewMode] = useState<'projects' | 'workpackages'>('projects');
  const [scale, setScale] = useState<RenderUnit>('week');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkPackage | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const ganttRef = useRef<HTMLDivElement>(null);

  const { visibleColumns, totalWidth, sortConfig, toggleSort } = useColumnConfig();

  const getTimelineWidthPx = useCallback(() => {
    if (!ganttRef.current) return null;
    const splitPane = ganttRef.current.querySelector('[data-left-width]');
    const leftWidth = splitPane ? Number(splitPane.getAttribute('data-left-width')) || 520 : 520;
    return Math.max(1, ganttRef.current.clientWidth - leftWidth - 4);
  }, []);

  const { handlePanStart, handleGanttWheel, handleAutoZoom } = useTimelineNavigation(getTimelineWidthPx);
  const { dragState, dragTooltip, handleBeginDrag } = useDragDrop(scale, getTimelineWidthPx);

  const viewStart = timelineWindow.from;
  const viewEnd = timelineWindow.to;
  const windowSpanDays = useMemo(
    () => Math.max(1, Math.round((viewEnd.getTime() - viewStart.getTime()) / DAY_MS)),
    [viewEnd, viewStart]
  );

  // Filter + sort
  const filteredWPs = useMemo(() => {
    let result = workPackages;
    if (selectedStatus) result = result.filter((wp) => wp.status === selectedStatus);
    return sortWorkPackages(result, sortConfig as any);
  }, [workPackages, selectedStatus, sortConfig]);

  const rows = useTaskHierarchy(filteredWPs, expandedTasks);

  // Load projects on mount
  useEffect(() => {
    if (projects.length === 0) useGanttStore.getState().loadProjects();
  }, [projects.length]);

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  const handleProjectClick = (projectId: number) => {
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      setCurrentProject(proj);
      selectProject(projectId);
      setViewMode('workpackages');
    }
  };

  const handleBack = () => {
    setViewMode('projects');
    selectProject(null);
    setCurrentProject(null);
  };

  const handleNewTask = () => {
    if (!selectedProjectId) { alert('Please select a project first'); return; }
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleExport = () => {
    if (filteredWPs.length === 0) { alert('No tasks to export'); return; }
    const data = filteredWPs.map((wp) => ({
      Name: wp.name, Description: wp.description || '',
      'Start Date': wp.start_date || '', 'End Date': wp.end_date || '',
      Progress: `${wp.progress}%`, Status: wp.status, Priority: wp.priority,
      'Budget Planned': wp.budget_planned,
    }));
    const headers = Object.keys(data[0]).join(',');
    const csvRows = data.map((row) =>
      Object.values(row).map((v) => {
        const s = String(v || '');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    );
    const blob = new Blob([`${headers}\n${csvRows.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `gantt-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleModalSave = async (data: Partial<WorkPackage>) => {
    if (editingTask) await updateWorkPackage(editingTask.id, data);
    else await createWorkPackage({ ...data, project_id: selectedProjectId! });
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleModalDelete = async () => {
    if (editingTask && confirm('Delete this task?')) {
      await deleteWorkPackage(editingTask.id);
    }
    setShowTaskModal(false);
    setEditingTask(null);
  };

  // Flatten rows to WP list for timeline
  const flatTasks = rows.map((r) => r.wp);

  return (
    <div className="p-6 h-full flex flex-col">
      <GanttTopBar
        viewMode={viewMode}
        projectName={currentProject?.name || null}
        scale={scale}
        windowSpanDays={windowSpanDays}
        selectedStatus={selectedStatus}
        onBack={handleBack}
        onSetScale={setScale}
        onZoomIn={() => zoomTimeline(0.75)}
        onZoomOut={() => zoomTimeline(1 / 0.75)}
        onAutoZoom={() => handleAutoZoom(viewMode === 'projects' ? projects : filteredWPs)}
        onSetStatus={setSelectedStatus}
        onNewTask={handleNewTask}
        onExport={handleExport}
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button className="text-red-500 hover:text-red-700" onClick={() => useGanttStore.getState().clearError()}>
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      <div ref={ganttRef} className="flex-1 overflow-auto border border-border rounded-lg bg-white"
        onWheel={(e) => handleGanttWheel(e, 520)}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-text-tertiary">Loading...</div>
          </div>
        ) : viewMode === 'projects' ? (
          projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <ChartBarIcon className="w-16 h-16 text-text-tertiary mb-4" />
              <p className="text-text-tertiary">No projects found. Create your first project to get started.</p>
            </div>
          ) : (
            <div className="min-w-max relative">
              {projects.map((project) => (
                <ProjectRow key={project.id} project={project} viewStart={viewStart} viewEnd={viewEnd} onClick={handleProjectClick} />
              ))}
            </div>
          )
        ) : flatTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <ChartBarIcon className="w-16 h-16 text-text-tertiary mb-4" />
            <p className="text-text-tertiary mb-4">No tasks found.</p>
            <button className="btn btn-primary" onClick={handleNewTask}>
              <PlusIcon className="w-4 h-4 mr-2" /> Create First Task
            </button>
          </div>
        ) : (
          <SplitPane
            left={
              <TaskTablePanel
                rows={rows}
                columns={visibleColumns}
                totalWidth={totalWidth}
                sortConfig={sortConfig}
                selectedTaskId={selectedTaskId}
                onToggleExpand={(id) => {
                  const next = new Set(expandedTasks);
                  next.has(id) ? next.delete(id) : next.add(id);
                  setExpandedTasks(next);
                }}
                onSelectTask={setSelectedTaskId}
                onEditTask={(wp) => { setEditingTask(wp); setShowTaskModal(true); }}
                onToggleSort={toggleSort}
              />
            }
            right={
              <TimelineCanvas
                tasks={flatTasks}
                dependencies={dependencies}
                viewStart={viewStart}
                viewEnd={viewEnd}
                renderUnit={scale}
                selectedTaskId={selectedTaskId}
                draggingTaskId={dragState?.taskId ?? null}
                onSelectTask={setSelectedTaskId}
                onBeginDrag={handleBeginDrag}
                onPanStart={handlePanStart}
                onAutoZoom={() => handleAutoZoom(filteredWPs)}
              />
            }
          />
        )}
      </div>

      {/* Drag tooltip */}
      {dragTooltip && (
        <div className="fixed z-[60] bg-white border border-border rounded-md shadow-lg px-3 py-2 text-xs text-text-secondary pointer-events-none"
          style={{ left: dragTooltip.x + 12, top: dragTooltip.y + 12 }}>
          <div className="font-medium text-text-primary mb-1">Schedule</div>
          <div className="flex gap-2"><span className="text-text-tertiary">Start:</span><span className="font-mono">{dragTooltip.start}</span></div>
          <div className="flex gap-2"><span className="text-text-tertiary">End:</span><span className="font-mono">{dragTooltip.end}</span></div>
          <div className="text-[10px] text-text-tertiary mt-1">{dragTooltip.hint}</div>
        </div>
      )}

      {dragState && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          Drag to reschedule task (release to save)
        </div>
      )}

      <TaskModal
        task={editingTask}
        isOpen={showTaskModal}
        onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
        onSave={handleModalSave}
        onDelete={editingTask ? handleModalDelete : undefined}
      />
    </div>
  );
}
