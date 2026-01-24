import { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import type { GanttTask, WorkPackage } from '@shared/types';

interface GanttChartProps {
  projectId: number;
}

type ZoomLevel = 'day' | 'week' | 'month' | 'quarter';

export default function GanttChart({ projectId }: GanttChartProps) {
  const { projects, workPackages, setGanttTasks, updateWorkPackage } = useProjectStore();
  const [ganttTasks, setLocalGanttTasks] = useState<GanttTask[]>([]);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
  const [viewStart, setViewStart] = useState<string>('');
  const [viewEnd, setViewEnd] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [draggingTask, setDraggingTask] = useState<{ id: number; startX: number; originalStart: string; originalEnd: string } | null>(null);
  const ganttRef = useRef<HTMLDivElement>(null);

  const project = projects.find(p => p.id === projectId);

  useEffect(() => {
    loadGanttData();
  }, [projectId, workPackages]);

  const loadGanttData = async () => {
    try {
      const result = await window.electronAPI.gantt.getState(projectId);
      if (result.success && result.data) {
        setLocalGanttTasks(result.data);
        setGanttTasks(result.data);
        
        // Set default view range
        if (result.data.length > 0) {
          const dates = result.data.flatMap(t => [t.start_date, t.end_date].filter(Boolean) as string[]);
          if (dates.length > 0) {
            const minDate = new Date(Math.min(...dates.map(d => new Date(d).getTime())));
            const maxDate = new Date(Math.max(...dates.map(d => new Date(d).getTime())));
            
            // Add some padding
            minDate.setDate(minDate.getDate() - 7);
            maxDate.setDate(maxDate.getDate() + 14);
            
            setViewStart(minDate.toISOString().split('T')[0]);
            setViewEnd(maxDate.toISOString().split('T')[0]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load Gantt data:', error);
    }
  };

  const getDaysInRange = (): Date[] => {
    if (!viewStart || !viewEnd) return [];
    
    const start = new Date(viewStart);
    const end = new Date(viewEnd);
    const days: Date[] = [];
    
    let current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getDayWidth = (): number => {
    switch (zoomLevel) {
      case 'day': return 50;
      case 'week': return 20;
      case 'month': return 5;
      case 'quarter': return 2;
      default: return 20;
    }
  };

  const getDatePosition = (date: string): number => {
    if (!viewStart) return 0;
    const taskDate = new Date(date);
    const startDate = new Date(viewStart);
    const diffDays = Math.floor((taskDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    return diffDays * getDayWidth();
  };

  const getTaskWidth = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return diffDays * getDayWidth();
  };

  const handleMouseDown = (task: GanttTask, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDraggingTask({
      id: task.id,
      startX: e.clientX,
      originalStart: task.start_date,
      originalEnd: task.end_date,
    });
    setSelectedTaskId(task.id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTask || !ganttRef.current) return;
    
    const deltaX = e.clientX - draggingTask.startX;
    const dayWidth = getDayWidth();
    const deltaDays = Math.round(deltaX / dayWidth);
    
    if (deltaDays === 0) return;
    
    const task = ganttTasks.find(t => t.id === draggingTask.id);
    if (!task || !task.start_date || !task.end_date) return;
    
    const originalStart = new Date(draggingTask.originalStart);
    const originalEnd = new Date(draggingTask.originalEnd);
    const duration = (originalEnd.getTime() - originalStart.getTime()) / (24 * 60 * 60 * 1000);
    
    const newStart = new Date(originalStart.getTime() + deltaDays * 24 * 60 * 60 * 1000);
    const newEnd = new Date(newStart.getTime() + duration * 24 * 60 * 60 * 1000);
    
    setLocalGanttTasks(prev => prev.map(t => 
      t.id === draggingTask.id 
        ? { ...t, start_date: newStart.toISOString().split('T')[0], end_date: newEnd.toISOString().split('T')[0] }
        : t
    ));
  };

  const handleMouseUp = async () => {
    if (!draggingTask) return;
    
    const task = ganttTasks.find(t => t.id === draggingTask.id);
    if (task && task.start_date && task.end_date) {
      const originalStart = draggingTask.originalStart;
      const originalEnd = draggingTask.originalEnd;
      
      if (task.start_date !== originalStart || task.end_date !== originalEnd) {
        // Save changes
        await window.electronAPI.gantt.updateTaskDates(task.id, task.start_date, task.end_date);
        updateWorkPackage(task.id, { start_date: task.start_date, end_date: task.end_date });
      }
    }
    
    setDraggingTask(null);
  };

  const handleZoomChange = (newZoom: ZoomLevel) => {
    setZoomLevel(newZoom);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!viewStart || !viewEnd) return;
    
    const start = new Date(viewStart);
    const end = new Date(viewEnd);
    const rangeDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    
    if (direction === 'prev') {
      start.setDate(start.getDate() - rangeDays);
      end.setDate(end.getDate() - rangeDays);
    } else {
      start.setDate(start.getDate() + rangeDays);
      end.setDate(end.getDate() + rangeDays);
    }
    
    setViewStart(start.toISOString().split('T')[0]);
    setViewEnd(end.toISOString().split('T')[0]);
  };

  const renderTimeHeader = () => {
    const days = getDaysInRange();
    const dayWidth = getDayWidth();
    
    return (
      <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        {days.map((day, index) => {
          const isWeekStart = day.getDay() === 1;
          const isMonthStart = day.getDate() === 1;
          
          return (
            <div
              key={index}
              className="flex-shrink-0 border-r border-gray-200 text-xs text-center"
              style={{ width: `${dayWidth}px` }}
            >
              {zoomLevel === 'day' && (
                <div className="p-1">
                  <div className="font-semibold">{day.getDate()}</div>
                  <div className="text-gray-500">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                </div>
              )}
              {zoomLevel === 'week' && isWeekStart && (
                <div className="p-1">
                  <div className="font-semibold">{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
              )}
              {zoomLevel === 'month' && isMonthStart && (
                <div className="p-1">
                  <div className="font-semibold">{day.toLocaleDateString('en-US', { month: 'short' })}</div>
                </div>
              )}
              {zoomLevel === 'quarter' && isMonthStart && day.getDate() <= 7 && (
                <div className="p-1">
                  <div className="font-semibold">{day.toLocaleDateString('en-US', { month: 'short' })}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTaskRow = (task: GanttTask) => {
    const dayWidth = getDayWidth();
    const left = task.start_date ? getDatePosition(task.start_date) : 0;
    const width = task.start_date && task.end_date ? getTaskWidth(task.start_date, task.end_date) : 0;
    const isSelected = selectedTaskId === task.id;
    const isCritical = task.isCritical;
    
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'todo': return 'bg-gray-400';
        case 'in_progress': return 'bg-blue-500';
        case 'done': return 'bg-green-500';
        case 'blocked': return 'bg-red-500';
        default: return 'bg-gray-400';
      }
    };

    return (
      <div
        key={task.id}
        className={`h-10 border-b border-gray-200 relative flex items-center ${
          isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
        }`}
        onClick={() => setSelectedTaskId(task.id)}
      >
        <div className="absolute inset-0 flex items-center px-2">
          <div
            className={`h-6 rounded text-white text-xs px-2 cursor-move flex items-center ${
              isCritical ? 'ring-2 ring-red-500' : ''
            } ${getStatusColor(task.status)}`}
            style={{
              left: `${left}px`,
              width: `${Math.max(width, 50)}px`,
            }}
            onMouseDown={(e) => handleMouseDown(task, e)}
          >
            <span className="truncate">{task.name}</span>
            {task.progress > 0 && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-black/20 rounded-l"
                style={{ width: `${task.progress}%` }}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDependencies = () => {
    const dayWidth = getDayWidth();
    
    return (
      <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
        {ganttTasks.flatMap(task =>
          task.dependencies.map(dep => {
            const pred = ganttTasks.find(t => t.id === dep.predecessor_id);
            if (!pred || !pred.end_date || !task.start_date) return null;
            
            const x1 = getDatePosition(pred.end_date) + dayWidth / 2;
            const y1 = ganttTasks.indexOf(pred) * 40 + 20;
            const x2 = getDatePosition(task.start_date) + dayWidth / 2;
            const y2 = ganttTasks.indexOf(task) * 40 + 20;
            
            const midX = (x1 + x2) / 2;
            
            return (
              <g key={`${dep.predecessor_id}-${dep.successor_id}`}>
                <path
                  d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              </g>
            );
          })
        )}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
          </marker>
        </defs>
      </svg>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Gantt Chart</h2>
          {project && <p className="text-gray-600">{project.name}</p>}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleNavigate('prev')}
            className="btn btn-secondary"
          >
            ←
          </button>
          <button
            onClick={() => handleNavigate('next')}
            className="btn btn-secondary"
          >
            →
          </button>
          <select
            value={zoomLevel}
            onChange={(e) => handleZoomChange(e.target.value as ZoomLevel)}
            className="input w-32"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
          </select>
        </div>
      </div>

      <div
        ref={ganttRef}
        className="flex-1 border border-gray-200 rounded-lg overflow-auto bg-white"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setDraggingTask(null)}
      >
        <div className="min-w-full">
          {renderTimeHeader()}
          
          <div className="relative">
            {renderDependencies()}
            
            <div className="relative">
              {ganttTasks.map(task => renderTaskRow(task))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>To Do</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Done</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 ring-2 ring-red-500 rounded"></div>
          <span>Critical Path</span>
        </div>
      </div>
    </div>
  );
}
