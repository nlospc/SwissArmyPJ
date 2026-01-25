import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, AdjustmentsHorizontalIcon } from '../../icons';
import type { WorkPackage } from '@shared/types';

export type ColumnKey = 'id' | 'type' | 'subject' | 'status' | 'startDate' | 'finishDate' | 'duration' | 'priority';

export interface Column {
  key: ColumnKey;
  label: string;
  width: number;
  visible: boolean;
  sortable: boolean;
}

const DEFAULT_COLUMNS: Column[] = [
  { key: 'id', label: 'ID', width: 80, visible: true, sortable: true },
  { key: 'type', label: 'Type', width: 90, visible: true, sortable: false },
  { key: 'subject', label: 'Subject', width: 220, visible: true, sortable: false }, // flex column
  { key: 'status', label: 'Status', width: 100, visible: true, sortable: true },
  { key: 'startDate', label: 'Start', width: 120, visible: true, sortable: true },
  { key: 'finishDate', label: 'Finish', width: 120, visible: true, sortable: true },
  { key: 'duration', label: 'Duration', width: 100, visible: true, sortable: false },
  { key: 'priority', label: 'Priority', width: 100, visible: true, sortable: true },
];

export type SortConfig = {
  key: ColumnKey | null;
  direction: 'asc' | 'desc';
} | null;

interface TableHeaderRowProps {
  columns?: Column[];
  onColumnVisibilityChange?: (columns: Column[]) => void;
  sortConfig?: SortConfig;
  onSortChange?: (sortConfig: SortConfig) => void;
}

export const TableHeaderRow = ({
  columns = DEFAULT_COLUMNS,
  onColumnVisibilityChange,
  sortConfig,
  onSortChange,
}: TableHeaderRowProps) => {
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const columnPickerRef = useRef<HTMLDivElement>(null);

  // Close column picker when clicking outside
  useEffect(() => {
    if (!showColumnPicker) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target as Node)) {
        setShowColumnPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnPicker]);

  const handleSort = (key: ColumnKey) => {
    if (!onSortChange) return;

    if (sortConfig?.key === key) {
      // Toggle direction
      onSortChange(sortConfig.direction === 'asc' ? { key, direction: 'desc' } : null);
    } else {
      // New sort column, default to asc
      onSortChange({ key, direction: 'asc' });
    }
  };

  const handleColumnToggle = (key: ColumnKey) => {
    if (!onColumnVisibilityChange) return;

    const updatedColumns = columns.map((col) =>
      col.key === key ? { ...col, visible: !col.visible } : col
    );
    onColumnVisibilityChange(updatedColumns);
  };

  const visibleColumns = columns.filter((c) => c.visible);

  return (
    <div className="flex border-b border-border bg-white">
      {/* Column headers */}
      {visibleColumns.map((col) => (
        <div
          key={col.key}
          className={`flex items-center border-r border-border-light last:border-r-0 ${
            col.sortable ? 'cursor-pointer hover:bg-background-hover' : ''
          } ${col.key === 'subject' ? 'flex-1 min-w-[220px]' : ''}`}
          style={{ width: col.key === 'subject' ? undefined : `${col.width}px`, height: '40px', paddingLeft: '8px', paddingRight: '8px' }}
          onClick={() => col.sortable && handleSort(col.key)}
        >
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            {col.label}
          </span>
          {col.sortable && sortConfig?.key === col.key && (
            <span className="ml-auto">
              {sortConfig.direction === 'asc' ? (
                <ChevronDownIcon className="w-3 h-3 text-primary" />
              ) : (
                <ChevronDownIcon className="w-3 h-3 text-primary rotate-180" />
              )}
            </span>
          )}
        </div>
      ))}

      {/* Column picker trigger */}
      <div className="relative">
        <button
          className="flex items-center justify-center px-2 h-full border-l border-border-light hover:bg-background-hover"
          onClick={() => setShowColumnPicker(!showColumnPicker)}
          title="Column settings"
        >
          <AdjustmentsHorizontalIcon className="w-4 h-4 text-text-tertiary" />
        </button>

        {/* Column picker dropdown */}
        {showColumnPicker && (
          <div
            ref={columnPickerRef}
            className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg py-1 z-50 min-w-[180px]"
          >
            <div className="px-3 py-1.5 text-xs font-medium text-text-tertiary border-b border-border-light">
              Visible columns
            </div>
            {columns.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-background-hover cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={col.visible}
                  onChange={() => handleColumnToggle(col.key)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-text-primary">{col.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to sort work packages
export const sortWorkPackages = (
  workPackages: WorkPackage[],
  sortConfig: SortConfig
): WorkPackage[] => {
  if (!sortConfig) return workPackages;

  const { key, direction } = sortConfig;
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...workPackages].sort((a, b) => {
    let comparison = 0;

    switch (key) {
      case 'id':
        comparison = a.id - b.id;
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'priority':
        const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1) -
                    (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1);
        break;
      case 'startDate':
        if (!a.start_date) comparison = -1;
        else if (!b.start_date) comparison = 1;
        else comparison = new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        break;
      case 'finishDate':
        if (!a.end_date) comparison = -1;
        else if (!b.end_date) comparison = 1;
        else comparison = new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        break;
      default:
        return 0;
    }

    return comparison * multiplier;
  });
};
