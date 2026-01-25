import { useState, useRef, useCallback } from 'react';
import { useGanttStore } from '../../stores/useGanttStore';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  TaskTypeIcon,
  MilestoneTypeIcon,
  PhaseTypeIcon,
  BugTypeIcon,
  ExclamationTriangleIcon,
} from '../../icons';
import type { WorkPackage } from '@shared/types';
import type { Column, SortConfig } from './TableHeaderRow';
import type { CellConfig } from './InlineCellEditor';
import { InlineCellEditor } from './InlineCellEditor';

// Timeline utilities
const DAY_MS = 24 * 60 * 60 * 1000;

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

interface TaskTableRowProps {
  task: WorkPackage & { hasConflict?: boolean };
  level: number;
  isExpanded: boolean;
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
  columns: Column[];
  sortConfig?: SortConfig;
  viewStart: Date;
  viewEnd: Date;
}

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

const TYPE_OPTIONS = [
  { value: 'task', label: 'Task' },
  { value: 'phase', label: 'Phase' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'bug', label: 'Issue' },
];

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

// Calculate duration in days
const calculateDuration = (start: string | null, end: string | null): number => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const DAY_MS = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS));
};

export const TaskTableRow = ({
  task,
  isExpanded,
  onToggleExpand,
  onSelectTask,
  selectedTaskId,
  onEditTask,
  onDeleteTask,
  onBeginDrag,
  isDragging,
  columns,
  viewStart,
  viewEnd,
}: TaskTableRowProps) => {
  const [editingCell, setEditingCell] = useState<{ key: string; element: HTMLElement } | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const { updateWorkPackage } = useGanttStore();

  const hasChildren = false; // TODO: implement hierarchy

  const TypeIcon = {
    milestone: MilestoneTypeIcon,
    phase: PhaseTypeIcon,
    bug: BugTypeIcon,
    task: TaskTypeIcon,
  }[task.type] || TaskTypeIcon;

  const typeIconClass = {
    milestone: 'text-purple-600',
    phase: 'text-amber-600',
    bug: 'text-rose-600',
    task: 'text-slate-500',
  }[task.type] || 'text-slate-500';

  const statusColor = WP_STATUS_COLORS[task.status] || WP_STATUS_COLORS.todo;
  const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

  // Cell definitions
  const cells: CellConfig[] = [
    {
      key: 'id',
      type: 'text',
      getValue: (wp) => `#${wp.id}`,
      getDisplay: (wp) => `#${wp.id}`,
      className: 'text-text-tertiary text-xs',
    },
    {
      key: 'type',
      type: 'select',
      options: { type: 'select', options: TYPE_OPTIONS },
      getValue: (wp) => wp.type,
      getDisplay: (wp) => wp.type,
      className: 'text-xs capitalize',
    },
    {
      key: 'subject',
      type: 'text',
      options: { type: 'text', placeholder: 'Task name' },
      getValue: (wp) => wp.name,
      getDisplay: (wp) => wp.name,
      className: 'text-sm font-medium text-text-primary truncate',
    },
    {
      key: 'status',
      type: 'select',
      options: { type: 'select', options: STATUS_OPTIONS },
      getValue: (wp) => wp.status,
      getDisplay: (wp) => wp.status.replace('_', ' '),
      className: 'text-xs capitalize',
    },
    {
      key: 'startDate',
      type: 'date',
      options: { type: 'date' },
      getValue: (wp) => wp.start_date,
      getDisplay: (wp) => wp.start_date || '',
      className: 'text-xs text-text-secondary',
    },
    {
      key: 'finishDate',
      type: 'date',
      options: { type: 'date' },
      getValue: (wp) => wp.end_date,
      getDisplay: (wp) => wp.end_date || '',
      className: 'text-xs text-text-secondary',
    },
    {
      key: 'duration',
      type: 'text',
      getValue: (wp) => calculateDuration(wp.start_date, wp.end_date),
      getDisplay: (wp) => `${calculateDuration(wp.start_date, wp.end_date)}d`,
      className: 'text-xs text-text-tertiary',
    },
    {
      key: 'priority',
      type: 'select',
      options: { type: 'select', options: PRIORITY_OPTIONS },
      getValue: (wp) => wp.priority,
      getDisplay: (wp) => wp.priority,
      className: 'text-xs capitalize',
    },
  ];

  const visibleColumns = columns.filter((c) => c.visible);

  const handleCellClick = useCallback(
    (cellKey: string, e: React.MouseEvent) => {
      // Don't edit if clicking on action buttons or caret
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('input') || target.closest('select')) {
        return;
      }

      const cell = cells.find((c) => c.key === cellKey);
      if (!cell || cell.key === 'id' || cell.key === 'duration') {
        // ID and Duration are read-only
        return;
      }

      const targetElement = e.currentTarget as HTMLElement;
      setEditingCell({ key: cellKey, element: targetElement });
    },
    [cells]
  );

  const handleCellSave = useCallback(
    async (cellKey: string, value: string) => {
      setEditingCell(null);

      const cell = cells.find((c) => c.key === cellKey);
      if (!cell) return;

      const updateData: Partial<WorkPackage> = {};

      switch (cellKey) {
        case 'subject':
          updateData.name = value;
          break;
        case 'type':
          updateData.type = value as any;
          break;
        case 'status':
          updateData.status = value as any;
          break;
        case 'priority':
          updateData.priority = value as any;
          break;
        case 'startDate':
          updateData.start_date = value || undefined;
          break;
        case 'finishDate':
          updateData.end_date = value || undefined;
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await updateWorkPackage(task.id, updateData);
      }
    },
    [task.id, updateWorkPackage, cells]
  );

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
  }, []);

  // Calculate bar style
  const barStyle = (() => {
    const startDate = task.start_date ? new Date(task.start_date) : null;
    const endDate = task.end_date ? new Date(task.end_date) : null;
    return calculateBarStyle(startDate, endDate, viewStart, viewEnd);
  })();

  const isMilestone = task.type === 'milestone';
  const hasConflict = task.hasConflict || false;

  return (
    <>
      {/* Left panel - Table cells (separate row) */}
      <div
        ref={rowRef}
        className={`flex border-b border-border-light hover:bg-background-hover transition-colors ${
          selectedTaskId === task.id ? 'bg-background-hover' : ''
        }`}
        style={{ height: '34px' }}
      >
        {visibleColumns.map((col) => {
          const cell = cells.find((c) => c.key === col.key);
          if (!cell) return null;

          const value = cell.getValue(task);
          const displayValue = cell.getDisplay ? cell.getDisplay(task) : String(value ?? '');

          const isEditing = editingCell?.key === col.key;

          // Calculate position for editor
          const editorPosition = (() => {
            if (!isEditing || !rowRef.current) return undefined;
            const cellElement = rowRef.current.querySelector(`[data-cell-key="${col.key}"]`) as HTMLElement;
            if (!cellElement) return undefined;
            const rect = cellElement.getBoundingClientRect();
            return {
              left: 0,
              top: 0,
              width: rect.width,
            };
          })();

          return (
            <div
              key={col.key}
              data-cell-key={col.key}
              className={`flex items-center px-2 border-r border-border-light last:border-r-0 cursor-text ${
                col.key === 'subject' ? 'flex-1 min-w-[220px]' : ''
              }`}
              style={{ width: col.key === 'subject' ? undefined : `${col.width}px` }}
              onClick={(e) => handleCellClick(col.key, e)}
            >
              {/* Caret (only for subject column) */}
              {col.key === 'subject' && (
                <>
                  {hasChildren && (
                    <button
                      className="flex-shrink-0 text-text-tertiary hover:text-text-primary mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand(task.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="w-4 h-4" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <TypeIcon className={`w-4 h-4 flex-shrink-0 mr-2 ${typeIconClass}`} />
                </>
              )}

              {/* Status/Priority color indicator */}
              {col.key === 'status' && (
                <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: statusColor }} />
              )}
              {col.key === 'priority' && (
                <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: priorityColor }} />
              )}

              {/* Cell content or editor */}
              <span className={`truncate ${cell.className || ''}`}>
                {displayValue}
              </span>

              {/* Inline editor overlay */}
              {isEditing && editorPosition && (
                <InlineCellEditor
                  type={cell.type}
                  value={value}
                  options={cell.options}
                  onSave={(val) => handleCellSave(col.key, val)}
                  onCancel={handleCellCancel}
                  position={editorPosition}
                />
              )}
            </div>
          );
        })}

        {/* Action buttons */}
        <div className="flex items-center px-1 border-l border-border-light">
          <button
            className="p-1 text-text-tertiary hover:text-text-primary hover:bg-background-hover rounded"
            onClick={() => onEditTask(task)}
            title="Edit task"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            className="p-1 text-text-tertiary hover:text-red-500 hover:bg-red-50 rounded"
            onClick={() => onDeleteTask(task.id)}
            title="Delete task"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right panel - Timeline bar (separate row) */}
      <div
        className={`border-b border-border-light hover:bg-background-hover transition-colors ${
          selectedTaskId === task.id ? 'bg-background-hover' : ''
        }`}
        style={{ height: '34px' }}
      >
        {barStyle.visible ? (
          <>
            {isMilestone ? (
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-[20px] h-[20px] cursor-pointer hover:opacity-80 transition-opacity ${
                  hasConflict ? 'ring-2 ring-red-500 ring-offset-2' : ''
                }`}
                style={{
                  left: `calc(${barStyle.left} + ${parseFloat(barStyle.width) / 2 - 3.5}%)`,
                  transform: 'translateY(-50%) rotate(45deg)',
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
        ) : null}
      </div>
    </>
  );
};
