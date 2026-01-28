import type { WorkPackage } from '@shared/types';
import type { FlatRow } from '@/hooks/gantt/useTaskHierarchy';
import type { Column, SortConfig, ColumnKey } from '@/hooks/gantt/useColumnConfig';
import { WP_STATUS_COLORS, PRIORITY_COLORS } from '@/utils/colors';
import { ChevronRightIcon } from '@/icons';

interface TaskTablePanelProps {
  rows: FlatRow[];
  columns: Column[];
  totalWidth: number;
  sortConfig: SortConfig;
  selectedTaskId: number | null;
  onToggleExpand: (id: number) => void;
  onSelectTask: (id: number) => void;
  onEditTask: (task: WorkPackage) => void;
  onToggleSort: (key: ColumnKey) => void;
}

export function TaskTablePanel({
  rows, columns, totalWidth, sortConfig, selectedTaskId,
  onToggleExpand, onSelectTask, onEditTask, onToggleSort,
}: TaskTablePanelProps) {
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse" style={{ minWidth: totalWidth }}>
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left text-xs font-medium text-text-secondary uppercase tracking-wide px-2 ${
                  col.sortable ? 'cursor-pointer hover:text-text-primary' : ''
                }`}
                style={{ width: col.width, height: 40 }}
                onClick={() => col.sortable && onToggleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {sortConfig?.key === col.key && (
                    <span className="text-primary">{sortConfig.direction === 'asc' ? '\u2191' : '\u2193'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ wp, depth, hasChildren, isExpanded }) => (
            <tr
              key={wp.id}
              className={`border-b border-border-light hover:bg-background-hover cursor-pointer ${
                selectedTaskId === wp.id ? 'bg-primary/5' : ''
              }`}
              style={{ height: 34 }}
              onClick={() => onSelectTask(wp.id)}
              onDoubleClick={() => onEditTask(wp)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-2 text-sm text-text-primary truncate" style={{ width: col.width }}>
                  {renderCell(col.key, wp, depth, hasChildren, isExpanded, onToggleExpand)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(
  key: string,
  wp: WorkPackage,
  depth: number,
  hasChildren: boolean,
  isExpanded: boolean,
  onToggleExpand: (id: number) => void,
): React.ReactNode {
  switch (key) {
    case 'id':
      return <span className="text-text-tertiary">{wp.id}</span>;
    case 'type': {
      const labels: Record<string, string> = { task: 'Task', phase: 'Phase', milestone: 'Milestone', bug: 'Issue' };
      return <span className="text-xs">{labels[wp.type] || wp.type}</span>;
    }
    case 'subject':
      return (
        <div className="flex items-center gap-1" style={{ paddingLeft: depth * 20 }}>
          {hasChildren && (
            <button
              className="p-0.5 hover:bg-background-hover rounded"
              onClick={(e) => { e.stopPropagation(); onToggleExpand(wp.id); }}
            >
              <ChevronRightIcon className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          )}
          <span className="truncate font-medium">{wp.name}</span>
        </div>
      );
    case 'status': {
      const color = WP_STATUS_COLORS[wp.status] || '#6B7280';
      const label = wp.status.replace('_', ' ');
      return (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs capitalize">{label}</span>
        </div>
      );
    }
    case 'startDate':
      return <span className="text-xs text-text-secondary">{wp.start_date || '-'}</span>;
    case 'finishDate':
      return <span className="text-xs text-text-secondary">{wp.end_date || '-'}</span>;
    case 'duration':
      if (wp.start_date && wp.end_date) {
        const days = Math.max(1, Math.round((new Date(wp.end_date).getTime() - new Date(wp.start_date).getTime()) / 86400000));
        return <span className="text-xs text-text-tertiary">{days}d</span>;
      }
      return <span className="text-xs text-text-tertiary">-</span>;
    case 'priority': {
      const color = PRIORITY_COLORS[wp.priority] || '#6B7280';
      return (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs capitalize">{wp.priority}</span>
        </div>
      );
    }
    default:
      return null;
  }
}
