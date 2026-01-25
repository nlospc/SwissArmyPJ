import { useState, useCallback } from 'react';
import { useGanttStore } from '../../stores/useGanttStore';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  TaskTypeIcon,
  MilestoneTypeIcon,
  PhaseTypeIcon,
  BugTypeIcon,
} from '../../icons';
import type { WorkPackage } from '@shared/types';
import type { Column, SortConfig } from './TableHeaderRow';
import type { CellConfig } from './InlineCellEditor';
import { InlineCellEditor } from './InlineCellEditor';

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

interface TaskTableProps {
  tasks: WorkPackage[];
  expandedTasks: Set<number>;
  onToggleExpand: (taskId: number) => void;
  selectedTaskId: number | null;
  onEditTask: (task: WorkPackage) => void;
  onDeleteTask: (taskId: number) => void;
  columns: Column[];
  sortConfig?: SortConfig;
}

export const TaskTable = ({
  tasks,
  expandedTasks,
  onToggleExpand,
  selectedTaskId,
  onEditTask,
  onDeleteTask,
  columns,
}: TaskTableProps) => {
  const [editingCell, setEditingCell] = useState<{ key: string; taskId: number } | null>(null);
  const { updateWorkPackage } = useGanttStore();

  const visibleColumns = columns.filter((c) => c.visible);

  // Calculate total width for table
  const totalWidth = visibleColumns.reduce((sum, col) => {
    return sum + (col.key === 'subject' ? 220 : col.width);
  }, 80); // +80px for action buttons

  // Cell definitions
  const cells: CellConfig[] = [
    {
      key: 'id',
      type: 'text',
      getValue: (wp) => wp.id,
      getDisplay: (wp) => String(wp.id),
      className: 'text-text-tertiary text-xs',
    },
    {
      key: 'type',
      type: 'select',
      options: { type: 'select', options: TYPE_OPTIONS },
      getValue: (wp) => wp.type,
      getDisplay: (wp) => {
        const typeMap: Record<string, string> = {
          task: 'Task',
          phase: 'Phase',
          milestone: 'Milestone',
          bug: 'Issue',
        };
        return typeMap[wp.type] || wp.type;
      },
      className: 'text-xs capitalize',
    },
    {
      key: 'subject',
      type: 'text',
      options: { type: 'text', placeholder: 'Task name' },
      getValue: (wp) => wp.name,
      getDisplay: (wp) => wp.name,
      className: 'text-sm font-medium text-text-primary',
    },
    {
      key: 'status',
      type: 'select',
      options: { type: 'select', options: STATUS_OPTIONS },
      getValue: (wp) => wp.status,
      getDisplay: (wp) => wp.status.replace('_', ' '),
      className: 'text-xs',
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
      className: 'text-xs',
    },
  ];

  const handleCellClick = useCallback(
    (taskId: number, cellKey: string) => {
      const cell = cells.find((c) => c.key === cellKey);
      if (!cell || cell.key === 'id' || cell.key === 'duration') {
        return;
      }
      setEditingCell({ key: cellKey, taskId });
    },
    [cells]
  );

  const handleCellSave = useCallback(
    async (taskId: number, cellKey: string, value: string) => {
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
        await updateWorkPackage(taskId, updateData);
      }
    },
    [updateWorkPackage, cells]
  );

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
  }, []);

  return (
    <table
      className="w-full border-collapse"
      style={{ tableLayout: 'fixed', width: `${totalWidth}px` }}
    >
      <thead className="sticky top-0 z-20 bg-white">
        <tr className="border-b border-border">
          {visibleColumns.map((col) => (
            <th
              key={col.key}
              className="text-left text-xs font-medium text-text-secondary uppercase tracking-wide border-r border-border-light last:border-r-0"
              style={{
                width: col.key === 'subject' ? '220px' : `${col.width}px`,
                height: '40px',
                padding: '0 8px',
              }}
            >
              <div className="flex items-center">
                <span>{col.label}</span>
              </div>
            </th>
          ))}
          <th
            className="text-left border-l border-border-light"
            style={{ width: '80px', height: '40px', padding: '0 4px' }}
          >
            {/* Action column header */}
          </th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => {
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
          const hasChildren = false;
          const isExpanded = expandedTasks.has(task.id);
          const isSelected = selectedTaskId === task.id;

          return (
            <tr
              key={task.id}
              className={`border-b border-border-light hover:bg-background-hover transition-colors ${
                isSelected ? 'bg-background-hover' : ''
              }`}
              style={{ height: '34px' }}
            >
              {visibleColumns.map((col) => {
                const cell = cells.find((c) => c.key === col.key);
                if (!cell) return null;

                const value = cell.getValue(task);
                const displayValue = cell.getDisplay ? cell.getDisplay(task) : String(value ?? '');
                const isEditing = editingCell?.key === col.key && editingCell?.taskId === task.id;

                return (
                  <td
                    key={col.key}
                    className="border-r border-border-light last:border-r-0 align-middle"
                    style={{
                      width: col.key === 'subject' ? '220px' : `${col.width}px`,
                      padding: '0 8px',
                    }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {/* Caret (only for subject column) */}
                      {col.key === 'subject' && !isEditing && (
                        <>
                          {hasChildren && (
                            <button
                              className="flex-shrink-0 text-text-tertiary hover:text-text-primary"
                              style={{ width: '16px', height: '16px' }}
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
                          <TypeIcon className={`w-4 h-4 flex-shrink-0 ${typeIconClass}`} />
                        </>
                      )}

                      {/* Status/Priority color indicator */}
                      {col.key === 'status' && !isEditing && (
                        <div
                          className="flex-shrink-0 rounded-full"
                          style={{ width: '8px', height: '8px', backgroundColor: statusColor }}
                        />
                      )}
                      {col.key === 'priority' && !isEditing && (
                        <div
                          className="flex-shrink-0 rounded-full"
                          style={{ width: '8px', height: '8px', backgroundColor: priorityColor }}
                        />
                      )}

                      {/* Cell content or editor */}
                      {!isEditing && (
                        <span className={`truncate ${cell.className || ''}`}>
                          {displayValue}
                        </span>
                      )}

                      {/* Inline editor */}
                      {isEditing && (
                        <InlineCellEditor
                          type={cell.type}
                          value={value}
                          options={cell.options}
                          onSave={(val) => handleCellSave(task.id, col.key, val)}
                          onCancel={handleCellCancel}
                          position={{ left: 0, top: 0, width: '100%' }}
                          inPlace
                        />
                      )}
                    </div>
                  </td>
                );
              })}

              {/* Action buttons */}
              <td className="border-l border-border-light align-middle" style={{ width: '80px', padding: '0 4px' }}>
                <div className="flex items-center gap-1">
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
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

// Calculate duration in days
const calculateDuration = (start: string | null, end: string | null): number => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const DAY_MS = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS));
};
