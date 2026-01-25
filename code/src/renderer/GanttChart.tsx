import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useGanttStore } from './stores/useGanttStore';
import { useStore } from './store';
import {
  PlusIcon,
  DownloadIcon,
  MinusIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowsPointingOutIcon,
  ArrowLeftIcon,
  MilestoneTypeIcon,
  TaskTypeIcon,
  PhaseTypeIcon,
  BugTypeIcon,
  ExclamationTriangleIcon,
} from './icons';
import type { Project, WorkPackage, Dependency, WorkPackageType } from '@shared/types';

type RenderUnit = 'day' | 'week' | 'month';

// Color mappings
const STATUS_COLORS = {
  active: '#2B7FFF',
  completed: '#00C950',
  on_hold: '#FE9A00',
  cancelled: '#D4D4D4',
} as const;

const WP_STATUS_COLORS: Record<string, string> = {
  todo: '#6B7280',
  in_progress: '#2B7FFF',
  done: '#00C950',
  blocked: '#DC2626',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6B7280',
  medium: '#FE9A00',
  high: '#DC2626',
  critical: '#7C3AED',
};

const getStatusColor = (status: string) => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.active;
};

const getWPStatusColor = (status: string) => {
  return WP_STATUS_COLORS[status] || WP_STATUS_COLORS.todo;
};

const getPriorityColor = (priority: string) => {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Scale pixel calculations (v1.0 constraints)
const PIXELS_PER_DAY = {
  day: 24,   // Day scale: 1 day = 24px
  week: 8,   // Week scale: 1 day = 8px
  month: 2,  // Month scale: 1 day = 2px
} as const;

const formatLocalISODate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseLocalISODate = (iso: string) => {
  const [y, m, d] = iso.split('-').map((v) => Number(v));
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const clampDateOnly = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeekMonday = (date: Date) => {
  const d = clampDateOnly(date);
  const day = d.getDay(); // 0..6 (Sun..Sat)
  const diff = day === 0 ? -6 : 1 - day; // Monday as start
  d.setDate(d.getDate() + diff);
  return d;
};

const endOfWeekSunday = (date: Date) => {
  const start = startOfWeekMonday(date);
  const d = new Date(start);
  d.setDate(d.getDate() + 6);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = (date: Date) => {
  const d = clampDateOnly(date);
  d.setDate(1);
  return d;
};

const endOfMonth = (date: Date) => {
  const d = clampDateOnly(date);
  d.setMonth(d.getMonth() + 1, 0);
  return d;
};

const isSameDay = (a: Date, b: Date) => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const isBetweenInclusive = (d: Date, a: Date, b: Date) => {
  const t = d.getTime();
  const from = Math.min(a.getTime(), b.getTime());
  const to = Math.max(a.getTime(), b.getTime());
  return t >= from && t <= to;
};

const snapStartForUnit = (date: Date, unit: RenderUnit) => {
  switch (unit) {
    case 'day':
      return clampDateOnly(date);
    case 'week':
      return startOfWeekMonday(date);
    case 'month':
      return startOfMonth(date);
  }
};

const snapEndForUnit = (date: Date, unit: RenderUnit) => {
  switch (unit) {
    case 'day':
      return clampDateOnly(date);
    case 'week':
      return endOfWeekSunday(date);
    case 'month':
      return endOfMonth(date);
  }
};

// Timeline generation (render strategy only; data always stays at date-level)
const generateTimeline = (viewStart: Date, viewEnd: Date, unit: RenderUnit) => {
  const timeline: {
    label: string;
    subLabel?: string;
    start: Date;
    end: Date;
    isMajor: boolean;
  }[] = [];

  const from = clampDateOnly(viewStart);
  const to = clampDateOnly(viewEnd);

  let cursor = new Date(from);

  const push = (start: Date, end: Date, label: string, subLabel?: string) => {
    timeline.push({ start, end, label, subLabel, isMajor: true });
  };

  switch (unit) {
    case 'day': {
      while (cursor <= to) {
        const start = new Date(cursor);
        const end = new Date(cursor);
        end.setDate(end.getDate() + 1);

        const isMonthBoundary = cursor.getDate() === 1;
        const subLabel = isMonthBoundary
          ? cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          : undefined;

        push(start, end, String(cursor.getDate()), subLabel);
        cursor.setDate(cursor.getDate() + 1);
      }
      break;
    }
    case 'week': {
      while (cursor <= to) {
        const start = new Date(cursor);
        const end = new Date(cursor);
        end.setDate(end.getDate() + 7);

        const weekNum = Math.ceil(
          (startOfWeekMonday(start).getTime() - new Date(start.getFullYear(), 0, 1).getTime()) /
            (DAY_MS * 7)
        );
        push(
          start,
          end,
          `W${weekNum}`,
          start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );
        cursor = end;
      }
      break;
    }
    case 'month': {
      while (cursor <= to) {
        const start = new Date(cursor);
        const end = new Date(cursor);
        end.setMonth(end.getMonth() + 1);
        push(start, end, start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
        cursor = end;
      }
      break;
    }
  }

  return timeline;
};

const RangeCalendar = ({
  month,
  start,
  end,
  onChangeMonth,
  onPickDay,
}: {
  month: Date;
  start: Date | null;
  end: Date | null;
  onChangeMonth: (nextMonth: Date) => void;
  onPickDay: (day: Date) => void;
}) => {
  const firstOfMonth = startOfMonth(month);
  const daysInMonth = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = startOfWeekMonday(firstOfMonth).getTime();
  const leadingEmpty = Math.round((firstOfMonth.getTime() - firstWeekday) / DAY_MS);

  const weeks: Array<Array<Date | null>> = [];
  let dayCounter = 1 - leadingEmpty;
  for (let w = 0; w < 6; w++) {
    const row: Array<Date | null> = [];
    for (let i = 0; i < 7; i++) {
      if (dayCounter < 1 || dayCounter > daysInMonth) {
        row.push(null);
      } else {
        const d = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), dayCounter);
        d.setHours(0, 0, 0, 0);
        row.push(d);
      }
      dayCounter++;
    }
    weeks.push(row);
  }

  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    const d = new Date(month);
    d.setMonth(d.getMonth() - 1, 1);
    onChangeMonth(d);
  };
  const nextMonth = () => {
    const d = new Date(month);
    d.setMonth(d.getMonth() + 1, 1);
    onChangeMonth(d);
  };

  const hasRange = Boolean(start && end);

  return (
    <div className="w-[280px] select-none">
      <div className="flex items-center justify-between mb-2">
        <button className="btn btn-ghost p-1" onClick={prevMonth} title="Previous month" type="button">
          <ChevronRightIcon className="w-4 h-4 rotate-180" />
        </button>
        <div className="text-sm font-medium text-text-primary">{monthLabel}</div>
        <button className="btn btn-ghost p-1" onClick={nextMonth} title="Next month" type="button">
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[10px] text-text-tertiary mb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-center py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((d, idx) => {
          if (!d) return <div key={idx} className="h-9" />;

          const selectedStart = start ? isSameDay(d, start) : false;
          const selectedEnd = end ? isSameDay(d, end) : false;
          const inRange = start && end ? isBetweenInclusive(d, start, end) : false;
          const pending = Boolean(start && !end);
          const pendingHighlight = pending && start ? isSameDay(d, start) : false;

          const bg =
            selectedStart || selectedEnd
              ? 'bg-primary text-white'
              : inRange
                ? 'bg-primary/10 text-text-primary'
                : pendingHighlight
                  ? 'bg-primary/10 text-text-primary'
                  : 'hover:bg-background-hover text-text-primary';

          return (
            <button
              key={idx}
              type="button"
              className={`h-9 rounded-md text-sm transition-colors ${bg}`}
              onClick={() => onPickDay(d)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {!hasRange && (
        <div className="text-[10px] text-text-tertiary mt-2">
          Click start date, then end date (auto-close).
        </div>
      )}
    </div>
  );
};

// Calculate bar position and width
const calculateBarStyle = (
  startDate: Date | null,
  endDate: Date | null,
  viewStart: Date,
  viewEnd: Date
) => {
  if (!startDate || !endDate) {
    return { left: '0%', width: '0%', visible: false };
  }

  const startMs = startDate.getTime();
  const rawEndMs = endDate.getTime();
  const endMs = rawEndMs <= startMs ? startMs + DAY_MS : rawEndMs;

  const totalDuration = viewEnd.getTime() - viewStart.getTime();
  if (totalDuration <= 0) {
    return { left: '0%', width: '0%', visible: false };
  }

  const startOffset = Math.max(0, startMs - viewStart.getTime());
  const duration = Math.min(endMs, viewEnd.getTime()) - Math.max(startMs, viewStart.getTime());

  return {
    left: `${(startOffset / totalDuration) * 100}%`,
    width: `${Math.max(0, (duration / totalDuration) * 100)}%`,
    visible: duration > 0,
  };
};

// Today Marker Component
interface TodayMarkerProps {
  viewStart: Date;
  viewEnd: Date;
  headerHeight: number;
}

const TodayMarker = ({ viewStart, viewEnd, headerHeight }: TodayMarkerProps) => {
  const today = clampDateOnly(new Date());
  const totalDuration = viewEnd.getTime() - viewStart.getTime();

  // Only show if today is within the view
  if (today.getTime() < viewStart.getTime() || today.getTime() > viewEnd.getTime()) {
    return null;
  }

  const position = ((today.getTime() - viewStart.getTime()) / totalDuration) * 100;

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
      style={{ left: `calc(520px + ${position}%)`, marginTop: `${headerHeight}px` }}
    >
      <div className="absolute top-0 -translate-x-1/2 -translate-y-full bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
        Today
      </div>
    </div>
  );
};

// Dependency Lines Component (FS-only for v1.0)
interface DependencyLinesProps {
  dependencies: Dependency[];
  workPackages: WorkPackage[];
  viewStart: Date;
  viewEnd: Date;
  taskRowHeight: number;
  headerHeight: number;
}

const DependencyLines = ({
  dependencies,
  workPackages,
  viewStart,
  viewEnd,
  taskRowHeight,
  headerHeight,
}: DependencyLinesProps) => {
  const taskMap = new Map(workPackages.map((wp) => [wp.id, wp]));
  const taskIndexMap = new Map(workPackages.map((wp, index) => [wp.id, index]));

  // Filter only FS (Finish-to-Start) dependencies for v1.0
  const fsDependencies = dependencies.filter((dep) => dep.type === 'finish_to_start');

  const lines = fsDependencies
    .map((dep) => {
      const predecessor = taskMap.get(dep.predecessor_id);
      const successor = taskMap.get(dep.successor_id);

      if (!predecessor || !successor) return null;

      const predIndex = taskIndexMap.get(dep.predecessor_id);
      const succIndex = taskIndexMap.get(dep.successor_id);

      if (predIndex === undefined || succIndex === undefined) return null;

      const predEnd = predecessor.end_date ? new Date(predecessor.end_date) : null;
      const succStart = successor.start_date ? new Date(successor.start_date) : null;

      if (!predEnd || !succStart) return null;

      const totalDuration = viewEnd.getTime() - viewStart.getTime();
      if (totalDuration <= 0) return null;

      // Check for conflict (FS violation: successor.start < predecessor.finish)
      const hasConflict = succStart.getTime() < predEnd.getTime();

      const predX = ((predEnd.getTime() - viewStart.getTime()) / totalDuration) * 100;
      const succX = ((succStart.getTime() - viewStart.getTime()) / totalDuration) * 100;
      const predY = headerHeight + (predIndex + 0.5) * taskRowHeight;
      const succY = headerHeight + (succIndex + 0.5) * taskRowHeight;

      // Simple FS connector: right of pred -> left of succ
      const midX = (predX + succX) / 2;
      const path = `M ${predX} ${predY} L ${midX} ${predY} L ${midX} ${succY} L ${succX} ${succY}`;

      return { id: dep.id, path, hasConflict };
    })
    .filter((line): line is { id: number; path: string; hasConflict: boolean } => line !== null);

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ top: `${headerHeight}px`, left: '520px', right: 0 }}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
        </marker>
        <marker
          id="arrowhead-conflict"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#DC2626" />
        </marker>
      </defs>
      {lines.map((line) => (
        <path
          key={line.id}
          d={line.path}
          stroke={line.hasConflict ? "#DC2626" : "#9CA3AF"}
          strokeWidth="2"
          fill="none"
          markerEnd={line.hasConflict ? "url(#arrowhead-conflict)" : "url(#arrowhead)"}
          opacity={line.hasConflict ? "1" : "0.6"}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
};

// Project Row Component
interface ProjectRowProps {
  project: Project;
  viewStart: Date;
  viewEnd: Date;
  onClick: (projectId: number) => void;
}

const ProjectRow = ({ project, viewStart, viewEnd, onClick }: ProjectRowProps) => {
  const barStyle = calculateBarStyle(
    project.start_date ? new Date(project.start_date) : null,
    project.end_date ? new Date(project.end_date) : null,
    viewStart,
    viewEnd
  );

  const statusColor = getStatusColor(project.status);

  return (
    <div className="flex border-b border-border-light hover:bg-background-hover transition-colors cursor-pointer group">
      <div className="w-[520px] p-4 border-r border-border-light flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: statusColor }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">
            {project.name}
          </div>
          <div className="text-xs text-text-tertiary mt-1">
            {project.status.replace('_', ' ')}
          </div>
        </div>
        <ChevronRightIcon className="w-4 h-4 text-text-tertiary group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
      <div className="flex-1 relative h-[60px] p-3">
        {barStyle.visible && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-8 rounded cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              left: barStyle.left,
              width: barStyle.width,
              backgroundColor: `${statusColor}20`,
              border: `2px solid ${statusColor}`,
            }}
            onClick={() => onClick(project.id)}
          >
            <div className="flex items-center h-full px-3">
              <div
                className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: statusColor }}
              >
                <ChartBarIcon className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-xs font-medium text-text-primary ml-2 truncate">
                {project.name}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Work Package Row Component with Drag Support
interface WorkPackageRowProps {
  task: WorkPackage & { type?: WorkPackageType; hasConflict?: boolean };
  viewStart: Date;
  viewEnd: Date;
  level: number;
  expandedTasks: Set<number>;
  onToggleExpand: (taskId: number) => void;
  onSelectTask: (taskId: number) => void;
  selectedTaskId: number | null;
  onEditTask: (task: WorkPackage) => void;
  onDeleteTask: (taskId: number) => void;
  onBeginDrag: (
    task: WorkPackage,
    kind: 'move' | 'resize_start' | 'resize_end' | 'milestone_move',
    e: React.MouseEvent
  ) => void;
  isDragging: boolean;
}

const WorkPackageRow = ({
  task,
  viewStart,
  viewEnd,
  level,
  expandedTasks,
  onToggleExpand,
  onSelectTask,
  selectedTaskId,
  onEditTask,
  onDeleteTask,
  onBeginDrag,
  isDragging,
}: WorkPackageRowProps) => {
  const barStyle = calculateBarStyle(
    task.start_date ? new Date(task.start_date) : null,
    task.end_date ? new Date(task.end_date) : null,
    viewStart,
    viewEnd
  );

  const statusColor = getWPStatusColor(task.status);
  const priorityColor = getPriorityColor(task.priority);
  const hasChildren = false;
  const isMilestone = task.type === 'milestone';
  const hasConflict = task.hasConflict || false;

  const TypeIcon = useMemo(() => {
    switch (task.type) {
      case 'milestone':
        return MilestoneTypeIcon;
      case 'phase':
        return PhaseTypeIcon;
      case 'bug':
        return BugTypeIcon;
      case 'task':
      default:
        return TaskTypeIcon;
    }
  }, [task.type]);

  const typeIconClass = useMemo(() => {
    switch (task.type) {
      case 'milestone':
        return 'text-purple-600';
      case 'phase':
        return 'text-amber-600';
      case 'bug':
        return 'text-rose-600';
      case 'task':
      default:
        return 'text-slate-500';
    }
  }, [task.type]);

  return (
    <div
      className={`flex border-b border-border-light hover:bg-background-hover transition-colors ${
        selectedTaskId === task.id ? 'bg-background-hover' : ''
      }`}
      style={{ paddingLeft: `${level * 16 + 12}px` }}
    >
      <div className="w-[520px] px-3 border-r border-border-light flex items-center justify-between h-[34px]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren && (
            <button
              className="flex-shrink-0 text-text-tertiary hover:text-text-primary"
              onClick={() => onToggleExpand(task.id)}
            >
              {expandedTasks.has(task.id) ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <TypeIcon className={`w-4 h-4 flex-shrink-0 ${typeIconClass}`} />
              <div className="text-sm font-medium text-text-primary truncate">{task.name}</div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: priorityColor }}
                title={`Priority: ${task.priority}`}
              />
              <span className="text-xs text-text-tertiary">{task.progress}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1 text-text-tertiary hover:text-text-primary hover:bg-background-hover rounded"
            onClick={() => onEditTask(task)}
            title="Edit task"
          >
            <PencilIcon className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 text-text-tertiary hover:text-red-500 hover:bg-red-50 rounded"
            onClick={() => onDeleteTask(task.id)}
            title="Delete task"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative h-[34px] px-2">
        {barStyle.visible && (
          <>
            {isMilestone ? (
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-[20px] h-[20px] cursor-pointer hover:opacity-80 transition-opacity ${
                  hasConflict ? 'ring-2 ring-red-500 ring-offset-2' : ''
                }`}
                style={{
                  left: `calc(${barStyle.left} + ${parseFloat(barStyle.width) / 2 - 3.5}%)`,
                  transform: 'rotate(45deg)',
                  backgroundColor: hasConflict ? '#DC2626' : statusColor,
                }}
                onClick={() => onSelectTask(task.id)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onBeginDrag(task, 'milestone_move', e);
                }}
                title={`Milestone: ${task.name}${hasConflict ? ' (Dependency Conflict!)' : ''}`}
              />
            ) : (
              <div
                className={`absolute top-1/2 -translate-y-1/2 h-[18px] rounded border-2 flex items-center px-2 cursor-pointer transition-opacity ${
                  isDragging ? 'opacity-50' : 'hover:opacity-80'
                }`}
                style={{
                  left: barStyle.left,
                  width: barStyle.width,
                  backgroundColor: hasConflict ? '#FEE2E2' : `${statusColor}20`,
                  borderColor: hasConflict ? '#DC2626' : statusColor,
                }}
                onClick={() => onSelectTask(task.id)}
                onMouseDown={(e) => onBeginDrag(task, 'move', e)}
                title={hasConflict ? 'Dependency Conflict! This task violates dependency constraints.' : task.name}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onBeginDrag(task, 'resize_start', e);
                  }}
                  title="Resize start"
                />
                <div
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onBeginDrag(task, 'resize_end', e);
                  }}
                  title="Resize end"
                />
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {hasConflict && <ExclamationTriangleIcon className="w-3 h-3 text-red-600 flex-shrink-0" />}
                  <div
                    className="w-3 h-3 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: hasConflict ? '#DC2626' : statusColor }}
                  >
                    <span className="text-[8px] font-bold text-white">{task.progress}</span>
                  </div>
                  <span className="text-[10px] font-medium text-text-primary truncate">{task.name}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Task Modal
interface TaskModalProps {
  task: WorkPackage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<WorkPackage>) => void;
  onDelete?: () => void;
}

const TaskModal = ({ task, isOpen, onClose, onSave, onDelete }: TaskModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    progress: 0,
    status: 'todo' as 'todo' | 'in_progress' | 'done' | 'blocked',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    type: 'task' as WorkPackageType,
    budget_planned: 0,
  });
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [rangeMonth, setRangeMonth] = useState(() => startOfMonth(new Date()));
  const [draftStart, setDraftStart] = useState<Date | null>(null);
  const [draftEnd, setDraftEnd] = useState<Date | null>(null);
  const rangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        description: task.description || '',
        start_date: task.start_date || '',
        end_date: task.end_date || '',
        progress: task.progress,
        status: task.status,
        priority: task.priority,
        type: task.type,
        budget_planned: task.budget_planned,
      });
    }
  }, [task]);

  useEffect(() => {
    if (!isRangeOpen) return;

    const onMouseDown = (e: MouseEvent) => {
      if (!rangeRef.current) return;
      if (rangeRef.current.contains(e.target as Node)) return;

      // Close -> if only picked start, default end=start
      if (draftStart && !draftEnd) {
        const s = formatLocalISODate(draftStart);
        setFormData((prev) => ({ ...prev, start_date: s, end_date: s }));
      }
      setIsRangeOpen(false);
    };

    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [draftEnd, draftStart, isRangeOpen]);

  if (!isOpen) return null;

  const openRangePicker = () => {
    const start = formData.start_date ? parseLocalISODate(formData.start_date) : clampDateOnly(new Date());
    const end = formData.end_date ? parseLocalISODate(formData.end_date) : null;

    setDraftStart(start);
    setDraftEnd(end);
    setRangeMonth(startOfMonth(start));
    setIsRangeOpen(true);
  };

  const handlePickDay = (day: Date) => {
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(day);
      setDraftEnd(null);
      return;
    }

    const from = draftStart;
    const to = day;
    const start = from.getTime() <= to.getTime() ? from : to;
    const end = from.getTime() <= to.getTime() ? to : from;

    setDraftStart(start);
    setDraftEnd(end);

    const startIso = formatLocalISODate(start);
    const endIso = formatLocalISODate(end);
    setFormData((prev) => ({ ...prev, start_date: startIso, end_date: endIso }));
    setIsRangeOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button className="p-1 text-text-tertiary hover:text-text-primary" onClick={onClose}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Dates</label>
              <button
                type="button"
                onClick={openRangePicker}
                className="w-full px-3 py-2 border border-border rounded-md text-left hover:bg-background-hover transition-colors flex items-center justify-between"
              >
                <span className="text-sm text-text-primary">
                  {formData.start_date && formData.end_date
                    ? `${formData.start_date} → ${formData.end_date}`
                    : 'Pick date range'}
                </span>
                <CalendarIcon className="w-4 h-4 text-text-tertiary" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Quick</label>
              <button
                type="button"
                className="w-full px-3 py-2 border border-border rounded-md text-left hover:bg-background-hover transition-colors"
                onClick={() => {
                  const today = clampDateOnly(new Date());
                  const iso = formatLocalISODate(today);
                  setFormData((prev) => ({ ...prev, start_date: iso, end_date: iso }));
                }}
              >
                Set to today
              </button>
            </div>
          </div>
          {isRangeOpen && (
            <div className="relative">
              <div
                ref={rangeRef}
                className="absolute right-0 mt-2 bg-white border border-border rounded-lg shadow-xl p-3 z-50"
              >
                <RangeCalendar
                  month={rangeMonth}
                  start={draftStart}
                  end={draftEnd}
                  onChangeMonth={(m) => setRangeMonth(startOfMonth(m))}
                  onPickDay={handlePickDay}
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    className="text-sm text-text-secondary hover:text-text-primary"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, start_date: '', end_date: '' }));
                      setDraftStart(null);
                      setDraftEnd(null);
                      setIsRangeOpen(false);
                    }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (draftStart && !draftEnd) {
                        const iso = formatLocalISODate(draftStart);
                        setFormData((prev) => ({ ...prev, start_date: iso, end_date: iso }));
                      }
                      setIsRangeOpen(false);
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => {
                  const nextStatus = e.target.value as any;
                  const nextProgress = progressFromStatus(nextStatus, formData.progress);
                  setFormData({ ...formData, status: nextStatus, progress: nextProgress });
                }}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as WorkPackageType })}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="task">Task</option>
                <option value="phase">Phase</option>
                <option value="milestone">Milestone</option>
                <option value="bug">Issue</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Progress: {formData.progress}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => {
                const nextProgress = clampProgress(parseInt(e.target.value, 10));
                const nextStatus = statusFromProgress(nextProgress, formData.status);
                setFormData({ ...formData, progress: nextProgress, status: nextStatus });
              }}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Budget Planned</label>
            <input
              type="number"
              value={formData.budget_planned}
              onChange={(e) => setFormData({ ...formData, budget_planned: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-border">
          {onDelete && task && (
            <button className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-md" onClick={onDelete}>
              Delete
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button className="px-4 py-2 text-text-secondary hover:bg-background-hover rounded-md" onClick={onClose}>
              Cancel
            </button>
            <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90" onClick={() => onSave(formData)}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function GanttChart() {
  const { projects, setCurrentProject } = useStore();
  const {
    workPackages,
    dependencies,
    selectedProjectId,
    selectedTaskId,
    timelineWindow,
    selectedStatus,
    isLoading,
    error,
    selectProject,
    setSelectedTaskId,
    setSelectedStatus,
    setTimelineWindow,
    zoomTimeline,
    updateWorkPackage,
    createWorkPackage,
    deleteWorkPackage,
  } = useGanttStore();

  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkPackage | null>(null);
  const [scale, setScale] = useState<RenderUnit>('week'); // User-selected scale
  const ganttRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [dragState, setDragState] = useState<{
    taskId: number;
    kind: 'move' | 'resize_start' | 'resize_end' | 'milestone_move';
    startX: number;
    originalStart: Date;
    originalEnd: Date;
  } | null>(null);
  const [dragTooltip, setDragTooltip] = useState<{
    x: number;
    y: number;
    start: string;
    end: string;
    hint: string;
  } | null>(null);

  const [panState, setPanState] = useState<{
    startX: number;
    originalFrom: Date;
    originalTo: Date;
  } | null>(null);

  // View mode: 'projects' or 'workpackages'
  const [viewMode, setViewMode] = useState<'projects' | 'workpackages'>('projects');

  // Load projects on mount
  useEffect(() => {
    if (projects.length === 0) {
      useGanttStore.getState().loadProjects();
    }
  }, [projects.length]);

  const viewStart = timelineWindow.from;
  const viewEnd = timelineWindow.to;
  const renderUnit = scale; // Use user-selected scale
  const windowSpanDays = useMemo(
    () => Math.max(1, Math.round((viewEnd.getTime() - viewStart.getTime()) / DAY_MS)),
    [viewEnd, viewStart]
  );

  // Generate timeline
  const timeline = useMemo(() => {
    return generateTimeline(viewStart, viewEnd, renderUnit);
  }, [viewStart, viewEnd, renderUnit]);

  // Filter work packages by status
  const filteredWorkPackages = useMemo(() => {
    if (!selectedStatus) return workPackages;
    return workPackages.filter((wp) => wp.status === selectedStatus);
  }, [workPackages, selectedStatus]);

  // Handle auto-zoom
  const handleAutoZoom = useCallback(() => {
    if (viewMode === 'projects') {
      if (projects.length === 0) return;
      const dates = projects.flatMap(p => [
        p.start_date ? new Date(p.start_date).getTime() : Date.now(),
        p.end_date ? new Date(p.end_date).getTime() : Date.now()
      ]).filter(d => !isNaN(d));
      
      if (dates.length === 0) return;
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const padding = (maxDate - minDate) * 0.1;
      const newStart = new Date(minDate - padding);
      const newEnd = new Date(maxDate + padding);
      setTimelineWindow(newStart, newEnd);
    } else {
      if (filteredWorkPackages.length === 0) return;
      const dates = filteredWorkPackages.flatMap(wp => [
        wp.start_date ? new Date(wp.start_date).getTime() : Date.now(),
        wp.end_date ? new Date(wp.end_date).getTime() : Date.now()
      ]).filter(d => !isNaN(d));
      
      if (dates.length === 0) return;
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const padding = (maxDate - minDate) * 0.1;
      const newStart = new Date(minDate - padding);
      const newEnd = new Date(maxDate + padding);
      setTimelineWindow(newStart, newEnd);
    }
  }, [viewMode, projects, filteredWorkPackages, setTimelineWindow]);

  // Handle project click (drill down)
  const handleProjectClick = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      selectProject(projectId);
      setViewMode('workpackages');
    }
  };

  // Handle back to projects view
  const handleBackToProjects = () => {
    setViewMode('projects');
    selectProject(null);
    setCurrentProject(null);
  };

  // Handle task selection
  const handleSelectTask = (taskId: number) => {
    setSelectedTaskId(taskId);
  };

  // Handle task edit
  const handleEditTask = (task: WorkPackage) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  // Handle task delete
  const handleDeleteTask = async (taskId: number) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteWorkPackage(taskId);
    }
  };

  // Handle modal save
  const handleModalSave = async (data: Partial<WorkPackage>) => {
    if (editingTask) {
      await updateWorkPackage(editingTask.id, data);
    } else {
      await createWorkPackage({
        ...data,
        project_id: selectedProjectId!,
      });
    }
    setShowTaskModal(false);
    setEditingTask(null);
  };

  // Handle modal delete
  const handleModalDelete = async () => {
    if (editingTask) {
      await handleDeleteTask(editingTask.id);
    }
    setShowTaskModal(false);
    setEditingTask(null);
  };

  // Handle zoom in
  const handleZoomIn = () => {
    zoomTimeline(0.75);
  };

  // Handle zoom out
  const handleZoomOut = () => {
    zoomTimeline(1 / 0.75);
  };

  const getAnchorDateForClientX = (clientX: number) => {
    if (!ganttRef.current) return null;
    const rect = ganttRef.current.getBoundingClientRect();
    const timelineWidth = getTimelineWidthPx();
    if (!timelineWidth) return null;

    const x = clientX - rect.left - 320;
    const clampedX = Math.min(timelineWidth, Math.max(0, x));
    const spanMs = viewEnd.getTime() - viewStart.getTime();
    if (spanMs <= 0) return null;

    return new Date(viewStart.getTime() + (clampedX / timelineWidth) * spanMs);
  };

  const handleGanttWheel = (e: React.WheelEvent) => {
    // Ctrl/⌘ + wheel => timeline zoom (keep cursor date anchored)
    if (!e.ctrlKey && !e.metaKey) return;
    if (!ganttRef.current) return;

    const rect = ganttRef.current.getBoundingClientRect();
    if (e.clientX - rect.left < 320) return; // ignore wheel over table

    e.preventDefault();

    const anchor = getAnchorDateForClientX(e.clientX);
    const factor = e.deltaY > 0 ? 1 / 0.75 : 0.75;
    zoomTimeline(factor, anchor ?? undefined);
  };

  const handlePanStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (dragState) return;

    e.preventDefault();
    setPanState({ startX: e.clientX, originalFrom: viewStart, originalTo: viewEnd });
  };

  const handlePanMove = useCallback(
    (e: MouseEvent) => {
      if (!panState) return;

      const timelineWidth = getTimelineWidthPx();
      if (!timelineWidth) return;

      const spanMs = panState.originalTo.getTime() - panState.originalFrom.getTime();
      if (spanMs <= 0) return;

      const spanDays = spanMs / DAY_MS;
      const deltaX = e.clientX - panState.startX;
      const deltaDays = Math.round((-deltaX / timelineWidth) * spanDays);

      const nextFrom = new Date(panState.originalFrom.getTime() + deltaDays * DAY_MS);
      const nextTo = new Date(panState.originalTo.getTime() + deltaDays * DAY_MS);
      setTimelineWindow(nextFrom, nextTo);
    },
    [panState, setTimelineWindow]
  );

  const handlePanEnd = useCallback(() => {
    if (!panState) return;
    setPanState(null);
  }, [panState]);

  // Handle new task
  const handleNewTask = () => {
    if (!selectedProjectId) {
      alert('Please select a project first');
      return;
    }
    setEditingTask(null);
    setShowTaskModal(true);
  };

  // Handle export
  const handleExport = () => {
    if (filteredWorkPackages.length === 0) {
      alert('No tasks to export');
      return;
    }

    const exportData = filteredWorkPackages.map((wp) => ({
      Name: wp.name,
      Description: wp.description || '',
      'Start Date': wp.start_date || '',
      'End Date': wp.end_date || '',
      Progress: `${wp.progress}%`,
      Status: wp.status,
      Priority: wp.priority,
      'Budget Planned': wp.budget_planned,
    }));

    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData.map((row) =>
      Object.values(row)
        .map((value) => {
          const strValue = String(value || '');
          if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        })
        .join(',')
    );
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gantt-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Drag handlers
  const getTimelineWidthPx = () => {
    if (!ganttRef.current) return null;
    return Math.max(1, ganttRef.current.clientWidth - 320);
  };

  const handleBeginDrag = (
    task: WorkPackage,
    kind: 'move' | 'resize_start' | 'resize_end' | 'milestone_move',
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (task.scheduling_mode === 'automatic') return;
    if (!task.start_date || !task.end_date) return;

    const originalStart = parseLocalISODate(task.start_date);
    const originalEnd = parseLocalISODate(task.end_date);

    setDragState({
      taskId: task.id,
      kind,
      startX: e.clientX,
      originalStart,
      originalEnd,
    });
    setSelectedTaskId(task.id);

    setDragTooltip({
      x: e.clientX,
      y: e.clientY,
      start: task.start_date,
      end: task.end_date,
      hint: 'Ctrl/⌘: day precision • Shift: lock duration',
    });
  };

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState) return;

      const timelineWidth = getTimelineWidthPx();
      if (!timelineWidth) return;

      const spanMs = viewEnd.getTime() - viewStart.getTime();
      if (spanMs <= 0) return;

      const spanDays = spanMs / DAY_MS;
      const deltaX = e.clientX - dragState.startX;
      const deltaDays = Math.round((deltaX / timelineWidth) * spanDays);

      const ctrlPrecision = e.ctrlKey || e.metaKey;
      const snapUnit: RenderUnit = ctrlPrecision ? 'day' : renderUnit;
      const lockDuration = e.shiftKey;

      const originalStart = dragState.originalStart;
      const originalEnd = dragState.originalEnd;
      const originalDurationMs = Math.max(DAY_MS, originalEnd.getTime() - originalStart.getTime());

      let nextStart = new Date(originalStart.getTime());
      let nextEnd = new Date(originalEnd.getTime());

      if (dragState.kind === 'move' || (lockDuration && dragState.kind !== 'milestone_move')) {
        nextStart = new Date(originalStart.getTime() + deltaDays * DAY_MS);
        nextEnd = new Date(originalEnd.getTime() + deltaDays * DAY_MS);

        // Snap by shifting the whole bar (preserve duration)
        const snappedStart = snapStartForUnit(nextStart, snapUnit);
        const shiftMs = snappedStart.getTime() - nextStart.getTime();
        nextStart = snappedStart;
        nextEnd = new Date(nextEnd.getTime() + shiftMs);
      } else if (dragState.kind === 'resize_start') {
        nextStart = new Date(originalStart.getTime() + deltaDays * DAY_MS);
        nextStart = snapStartForUnit(nextStart, snapUnit);
        nextEnd = new Date(originalStart.getTime() + originalDurationMs);
      } else if (dragState.kind === 'resize_end') {
        nextStart = new Date(originalStart.getTime());
        nextEnd = new Date(originalEnd.getTime() + deltaDays * DAY_MS);
        nextEnd = snapEndForUnit(nextEnd, snapUnit);
      } else if (dragState.kind === 'milestone_move') {
        const moved = new Date(originalStart.getTime() + deltaDays * DAY_MS);
        const snapped = snapStartForUnit(moved, snapUnit);
        nextStart = snapped;
        nextEnd = snapped;
      }

      // Clamp to avoid inverted ranges (keep at least 1 day for bars; milestones stay 0-day)
      if (dragState.kind !== 'milestone_move') {
        if (nextEnd.getTime() - nextStart.getTime() < DAY_MS) {
          nextEnd = new Date(nextStart.getTime() + DAY_MS);
        }
      }

      const nextStartIso = formatLocalISODate(nextStart);
      const nextEndIso = formatLocalISODate(nextEnd);

      useGanttStore.setState((state) => ({
        workPackages: state.workPackages.map((wp) =>
          wp.id === dragState.taskId ? { ...wp, start_date: nextStartIso, end_date: nextEndIso } : wp
        ),
      }));

      setDragTooltip({
        x: e.clientX,
        y: e.clientY,
        start: nextStartIso,
        end: nextEndIso,
        hint: `${snapUnit} snap${ctrlPrecision ? ' (precision override)' : ''} • Shift: lock duration`,
      });
    },
    [dragState, renderUnit, viewEnd, viewStart]
  );

  const handleDragEnd = useCallback(async () => {
    if (!dragState) return;

    const originalStartIso = formatLocalISODate(dragState.originalStart);
    const originalEndIso = formatLocalISODate(dragState.originalEnd);

    const currentState = useGanttStore.getState();
    const updatedTask = currentState.workPackages.find((wp) => wp.id === dragState.taskId);

    if (
      updatedTask &&
      updatedTask.start_date &&
      updatedTask.end_date &&
      (updatedTask.start_date !== originalStartIso || updatedTask.end_date !== originalEndIso)
    ) {
      await updateWorkPackage(dragState.taskId, {
        start_date: updatedTask.start_date,
        end_date: updatedTask.end_date,
      });
    }

    setDragState(null);
    setDragTooltip(null);
  }, [dragState, updateWorkPackage]);

  // Set up drag event listeners
  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [dragState, handleDragMove, handleDragEnd]);

  // Set up pan event listeners (viewport window)
  useEffect(() => {
    if (!panState) return;

    window.addEventListener('mousemove', handlePanMove);
    window.addEventListener('mouseup', handlePanEnd);
    return () => {
      window.removeEventListener('mousemove', handlePanMove);
      window.removeEventListener('mouseup', handlePanEnd);
    };
  }, [panState, handlePanEnd, handlePanMove]);

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {viewMode === 'workpackages' && (
            <button
              className="btn btn-secondary flex items-center gap-2"
              onClick={handleBackToProjects}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Projects
            </button>
          )}
          <div>
            <h1 className="section-title mb-1">
              {viewMode === 'projects' ? 'Project Timeline' : currentProject?.name || 'Work Packages'}
            </h1>
            <p className="section-subtitle">
              {viewMode === 'projects'
                ? 'Click on any project to view its work packages'
                : 'Viewing and managing work packages'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'workpackages' && (
            <>
              <button className="btn btn-secondary" onClick={handleNewTask}>
                <PlusIcon className="w-4 h-4" />
                New Task
              </button>
              <button className="btn btn-secondary" onClick={handleExport}>
                <DownloadIcon className="w-4 h-4" />
                Export
              </button>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-tertiary">Zoom:</span>
            <button
              className="btn btn-ghost p-1"
              onClick={handleZoomIn}
              title="Zoom In (Ctrl/⌘ + Wheel)"
            >
              <MinusIcon className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-text-secondary capitalize">
              {renderUnit} · {windowSpanDays}d
            </span>
            <button
              className="btn btn-ghost p-1"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            <button className="btn btn-ghost p-1" onClick={handleAutoZoom} title="Auto-zoom to fit">
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Scale Selector */}
          <div className="flex items-center bg-background-secondary rounded border border-border">
            <button
              className={`px-2 py-1 text-xs ${scale === 'day' ? 'text-primary bg-background-hover' : 'text-text-tertiary'}`}
              onClick={() => setScale('day')}
            >
              Day
            </button>
            <button
              className={`px-2 py-1 text-xs ${scale === 'week' ? 'text-primary bg-background-hover' : 'text-text-tertiary'}`}
              onClick={() => setScale('week')}
            >
              Week
            </button>
            <button
              className={`px-2 py-1 text-xs ${scale === 'month' ? 'text-primary bg-background-hover' : 'text-text-tertiary'}`}
              onClick={() => setScale('month')}
            >
              Month
            </button>
          </div>

          {viewMode === 'workpackages' && (
            <div className="flex items-center gap-2">
              <button
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                  selectedStatus === 'done' ? 'text-text-primary bg-background-hover' : 'text-text-tertiary'
                }`}
                onClick={() => setSelectedStatus(selectedStatus === 'done' ? null : 'done')}
              >
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: WP_STATUS_COLORS.done }} />
                Done
              </button>
              <button
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                  selectedStatus === 'in_progress' ? 'text-text-primary bg-background-hover' : 'text-text-tertiary'
                }`}
                onClick={() => setSelectedStatus(selectedStatus === 'in_progress' ? null : 'in_progress')}
              >
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: WP_STATUS_COLORS.in_progress }} />
                In Progress
              </button>
              <button
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                  selectedStatus === 'todo' ? 'text-text-primary bg-background-hover' : 'text-text-tertiary'
                }`}
                onClick={() => setSelectedStatus(selectedStatus === 'todo' ? null : 'todo')}
              >
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: WP_STATUS_COLORS.todo }} />
                To Do
              </button>
              <button
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                  selectedStatus === 'blocked' ? 'text-text-primary bg-background-hover' : 'text-text-tertiary'
                }`}
                onClick={() => setSelectedStatus(selectedStatus === 'blocked' ? null : 'blocked')}
              >
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: WP_STATUS_COLORS.blocked }} />
                Blocked
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button className="text-red-500 hover:text-red-700" onClick={() => useGanttStore.getState().clearError()}>
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Gantt Chart */}
      <div ref={ganttRef} className="flex-1 overflow-auto border border-border rounded-lg bg-white" onWheel={handleGanttWheel}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-text-tertiary">Loading...</div>
          </div>
        ) : viewMode === 'projects' ? (
          // Projects View
          projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <ChartBarIcon className="w-16 h-16 text-text-tertiary mb-4" />
              <p className="text-text-tertiary">No projects found. Create your first project to get started.</p>
            </div>
          ) : (
            <>
              {/* Timeline Header */}
              <div className="sticky top-0 z-20 bg-white border-b border-border-light">
                <div className="flex min-w-max">
                  <div className="w-[520px] p-3.5 text-xs font-medium text-text-secondary uppercase tracking-wide border-r border-border">
                    Project Name
                  </div>
                  <div className="flex-1 flex" ref={timelineRef} onMouseDown={handlePanStart} onDoubleClick={handleAutoZoom}>
                    {timeline.map((item, index) => (
                      <div
                        key={index}
                        className={`flex-1 p-3.5 text-center border-r border-border-light ${item.isMajor ? 'bg-gray-50' : ''}`}
                      >
                        <div className="text-xs font-medium text-text-secondary">{item.label}</div>
                        {item.subLabel && (
                          <div className="text-[10px] text-text-tertiary mt-0.5">{item.subLabel}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Project Rows */}
              <div className="min-w-max relative">
                {/* Today Marker */}
                <TodayMarker viewStart={viewStart} viewEnd={viewEnd} headerHeight={50} />

                {projects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    viewStart={viewStart}
                    viewEnd={viewEnd}
                    onClick={handleProjectClick}
                  />
                ))}
              </div>
            </>
          )
        ) : (
          // Work Packages View
          filteredWorkPackages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <ChartBarIcon className="w-16 h-16 text-text-tertiary mb-4" />
              <p className="text-text-tertiary mb-4">No tasks found. Create your first task to get started.</p>
              <button className="btn btn-primary" onClick={handleNewTask}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Create First Task
              </button>
            </div>
          ) : (
            <>
              {/* Timeline Header */}
              <div className="sticky top-0 z-20 bg-white border-b border-border-light">
                <div className="flex min-w-max">
                  <div className="w-[520px] p-3.5 text-xs font-medium text-text-secondary uppercase tracking-wide border-r border-border">
                    Task Name
                  </div>
                  <div className="flex-1 flex" ref={timelineRef} onMouseDown={handlePanStart} onDoubleClick={handleAutoZoom}>
                    {timeline.map((item, index) => (
                      <div
                        key={index}
                        className={`flex-1 p-3.5 text-center border-r border-border-light ${item.isMajor ? 'bg-gray-50' : ''}`}
                      >
                        <div className="text-xs font-medium text-text-secondary">{item.label}</div>
                        {item.subLabel && (
                          <div className="text-[10px] text-text-tertiary mt-0.5">{item.subLabel}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gantt Rows Container */}
              <div className="relative">
                {/* Today Marker */}
                <TodayMarker viewStart={viewStart} viewEnd={viewEnd} headerHeight={56} />

                {/* Dependency Lines Overlay */}
                <DependencyLines
                  dependencies={dependencies}
                  workPackages={filteredWorkPackages}
                  viewStart={viewStart}
                  viewEnd={viewEnd}
                  taskRowHeight={34}
                  headerHeight={56}
                />

                {/* Gantt Rows */}
                <div className="min-w-max">
                  {filteredWorkPackages.map((task) => (
                    <WorkPackageRow
                      key={task.id}
                      task={task}
                      viewStart={viewStart}
                      viewEnd={viewEnd}
                      level={0}
                      expandedTasks={expandedTasks}
                      onToggleExpand={(taskId) => {
                        const newExpanded = new Set(expandedTasks);
                        if (newExpanded.has(taskId)) {
                          newExpanded.delete(taskId);
                        } else {
                          newExpanded.add(taskId);
                        }
                        setExpandedTasks(newExpanded);
                      }}
                      onSelectTask={handleSelectTask}
                      selectedTaskId={selectedTaskId}
                      onEditTask={handleEditTask}
                      onDeleteTask={handleDeleteTask}
                      onBeginDrag={handleBeginDrag}
                      isDragging={dragState?.taskId === task.id}
                    />
                  ))}
                </div>
              </div>
            </>
          )
        )}
      </div>

      {/* Drag Tooltip */}
      {dragTooltip && (
        <div
          className="fixed z-[60] bg-white border border-border rounded-md shadow-lg px-3 py-2 text-xs text-text-secondary pointer-events-none"
          style={{ left: `${dragTooltip.x + 12}px`, top: `${dragTooltip.y + 12}px` }}
        >
          <div className="font-medium text-text-primary mb-1">Schedule</div>
          <div className="flex gap-2">
            <span className="text-text-tertiary">Start:</span>
            <span className="font-mono">{dragTooltip.start}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-text-tertiary">End:</span>
            <span className="font-mono">{dragTooltip.end}</span>
          </div>
          <div className="text-[10px] text-text-tertiary mt-1">{dragTooltip.hint}</div>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        task={editingTask}
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onSave={handleModalSave}
        onDelete={editingTask ? handleModalDelete : undefined}
      />

      {/* Drag hint */}
      {dragState && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          Drag to reschedule task (release to save)
        </div>
      )}
    </div>
  );
}
