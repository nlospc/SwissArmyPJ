import { useState, useCallback } from 'react';

export type ColumnKey = 'id' | 'type' | 'subject' | 'status' | 'startDate' | 'finishDate' | 'duration' | 'priority';

export interface Column {
  key: ColumnKey;
  label: string;
  width: number;
  visible: boolean;
  sortable: boolean;
}

export type SortConfig = {
  key: ColumnKey;
  direction: 'asc' | 'desc';
} | null;

const DEFAULT_COLUMNS: Column[] = [
  { key: 'id', label: 'ID', width: 80, visible: true, sortable: true },
  { key: 'type', label: 'Type', width: 90, visible: true, sortable: false },
  { key: 'subject', label: 'Subject', width: 220, visible: true, sortable: false },
  { key: 'status', label: 'Status', width: 100, visible: true, sortable: true },
  { key: 'startDate', label: 'Start', width: 120, visible: true, sortable: true },
  { key: 'finishDate', label: 'Finish', width: 120, visible: true, sortable: true },
  { key: 'duration', label: 'Duration', width: 100, visible: true, sortable: false },
  { key: 'priority', label: 'Priority', width: 100, visible: true, sortable: true },
];

export function useColumnConfig() {
  const [columns, setColumns] = useState<Column[]>(() => {
    try {
      const saved = localStorage.getItem('gantt-columns');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return DEFAULT_COLUMNS;
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const toggleColumn = useCallback((key: ColumnKey) => {
    setColumns(prev => {
      const next = prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c);
      localStorage.setItem('gantt-columns', JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleSort = useCallback((key: ColumnKey) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const visibleColumns = columns.filter(c => c.visible);
  const totalWidth = visibleColumns.reduce((sum, c) => sum + c.width, 0);

  return { columns, visibleColumns, totalWidth, sortConfig, toggleColumn, toggleSort };
}
