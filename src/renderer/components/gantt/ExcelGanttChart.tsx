/**
 * ExcelGanttChart - Excel-style split-pane Gantt chart
 *
 * Layout:
 * - Left: Frozen table (Name, Owner, Start, End, Days, Status) — resizable
 * - Divider: drag to resize left panel
 * - Right: Timeline with Gantt bars — horizontal + vertical scroll
 * - Both panels share synchronized vertical scroll
 */

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Tag, Input, Select, Button, Tooltip } from 'antd';
import {
  CalendarOutlined,
  DownloadOutlined,
  FilterOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';
import type { Project, WorkItem } from '@/shared/types';
import { getStatusColor } from './timeline-adapter';

interface ExcelGanttChartProps {
  projects: Project[];
  workItems?: WorkItem[];
  loading?: boolean;
  onProjectClick?: (project: Project) => void;
  onProjectUpdate?: (projectId: number, updates: Partial<Project>) => void;
  onExport?: () => void;
  viewMode?: 'year' | 'month' | 'day';
}

interface GanttRow {
  id: number;
  name: string;
  status: string;
  owner: string;
  startDate: Date | null;
  endDate: Date | null;
  duration: number;
  type: 'project' | 'workitem';
  portfolioId?: number;
}

const ROW_HEIGHT = 40;

// Left panel fixed-pixel column widths
const LEFT_COLS = { name: 220, owner: 110, start: 88, end: 88, days: 56, status: 74 };
const LEFT_PANEL_DEFAULT = Object.values(LEFT_COLS).reduce((a, b) => a + b, 0); // 636
const LEFT_PANEL_MIN = 360;
const LEFT_PANEL_MAX = 860;

export function ExcelGanttChart({
  projects,
  workItems = [],
  loading = false,
  onProjectClick,
  onProjectUpdate,
  onExport,
  viewMode: initialViewMode = 'month',
}: ExcelGanttChartProps) {
  const STORAGE_KEY_VIEW_MODE = 'gantt-view-mode';

  const [viewMode, setViewMode] = useState<'year' | 'month' | 'day'>(() => {
    if (initialViewMode) {
      const mode = initialViewMode as 'year' | 'month' | 'day';
      return (mode === 'year' || mode === 'month' || mode === 'day') ? mode : 'month';
    }
    const stored = localStorage.getItem(STORAGE_KEY_VIEW_MODE);
    if (stored) {
      const mode = stored as 'year' | 'month' | 'day';
      return (mode === 'year' || mode === 'month' || mode === 'day') ? mode : 'month';
    }
    return 'month';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ id: number; startX: number; startDate: Date } | null>(null);

  // Split-pane divider state
  const [leftWidth, setLeftWidth] = useState(LEFT_PANEL_DEFAULT);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);

  // Dynamic header height based on view mode
  const HEADER_HEIGHT = useMemo(() => {
    if (viewMode === 'day') return 72; // 3 rows: 24px each
    return 60; // 2 rows: 30px each
  }, [viewMode]);

  // Timeline scroll sync state
  const [timelineScrollLeft, setTimelineScrollLeft] = useState(0);
  const [isPanningTimeline, setIsPanningTimeline] = useState(false);
  const [panStartX, setPanStartX] = useState(0);
  const [panStartScrollLeft, setPanStartScrollLeft] = useState(0);

  // Virtualization state
  const [visibleColumnRange, setVisibleColumnRange] = useState({ start: 0, end: 0 });
  const [visibleRowRange, setVisibleRowRange] = useState({ start: 0, end: 0 });
  const BUFFER_COLUMNS = 5;
  const BUFFER_ROWS = 3;

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineHeaderRef = useRef<HTMLDivElement>(null);
  const timelineBodyRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Convert projects to rows
  const rows = useMemo((): GanttRow[] => {
    return projects
      .filter((project) => {
        const matchesSearch =
          !searchQuery ||
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.owner?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .map((project) => {
        const startDate = project.start_date ? new Date(project.start_date) : null;
        const endDate = project.end_date ? new Date(project.end_date) : null;
        const duration =
          startDate && endDate
            ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
        return {
          id: project.id,
          name: project.name,
          status: project.status,
          owner: project.owner || '—',
          startDate,
          endDate,
          duration,
          type: 'project' as const,
          portfolioId: project.portfolio_id,
        };
      });
  }, [projects, searchQuery, statusFilter]);

  // Calculate date range
  const { minDate, maxDate } = useMemo(() => {
    let min: Date | null = null;
    let max: Date | null = null;
    rows.forEach((row) => {
      if (row.startDate && (!min || row.startDate < min)) min = row.startDate;
      if (row.endDate && (!max || row.endDate > max)) max = row.endDate;
    });
    if (!min || !max) {
      const now = new Date();
      min = new Date(now.getFullYear(), now.getMonth(), 1);
      max = new Date(now.getFullYear(), now.getMonth() + 3, 0);
    }
    const paddedMin = new Date(min);
    paddedMin.setDate(paddedMin.getDate() - 14);
    const paddedMax = new Date(max);
    paddedMax.setDate(paddedMax.getDate() + 14);
    return { minDate: paddedMin, maxDate: paddedMax };
  }, [rows]);

  // Generate timeline columns
  const timelineColumns = useMemo(() => {
    if (viewMode === 'year') {
      const columns: Array<{ type: 'quarter'; date: Date; year: number; quarter: number; label: string }> = [];
      const currentDate = new Date(minDate);
      currentDate.setMonth(Math.floor(currentDate.getMonth() / 3) * 3);
      while (currentDate <= maxDate) {
        const year = currentDate.getFullYear();
        const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
        columns.push({ type: 'quarter', date: new Date(year, (quarter - 1) * 3, 1), year, quarter, label: `Q${quarter}` });
        currentDate.setMonth(currentDate.getMonth() + 3);
      }
      return columns;
    } else if (viewMode === 'month') {
      const columns: Array<{ type: 'month'; date: Date; year: number; month: number; label: string; daysInMonth: number }> = [];
      const currentDate = new Date(minDate);
      while (currentDate <= maxDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        columns.push({ type: 'month', date: new Date(year, month, 1), year, month, label: currentDate.toLocaleDateString('en-US', { month: 'short' }), daysInMonth });
        currentDate.setMonth(month + 1);
      }
      return columns;
    } else {
      const columns: Array<{ type: 'day'; date: Date; dayOfWeek: number; isWeekend: boolean; dayOfMonth: number }> = [];
      const currentDate = new Date(minDate);
      while (currentDate <= maxDate) {
        const dayOfWeek = currentDate.getDay();
        columns.push({ type: 'day', date: new Date(currentDate), dayOfWeek, isWeekend: dayOfWeek === 0 || dayOfWeek === 6, dayOfMonth: currentDate.getDate() });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return columns;
    }
  }, [minDate, maxDate, viewMode]);

  // Year headers (top band for all views)
  const yearHeaders = useMemo(() => {
    const headers: Array<{ year: number; startIndex: number; colspan: number }> = [];
    let currentYear = -1; let startIndex = 0; let colspan = 0;
    timelineColumns.forEach((col, idx) => {
      const year = col.date.getFullYear();
      if (year !== currentYear) {
        if (colspan > 0) headers.push({ year: currentYear, startIndex, colspan });
        currentYear = year; startIndex = idx; colspan = 1;
      } else { colspan++; }
    });
    if (colspan > 0) headers.push({ year: currentYear, startIndex, colspan });
    return headers;
  }, [timelineColumns]);

  // Month headers (middle band for day view)
  const monthHeaders = useMemo(() => {
    const headers: Array<{ label: string; month: number; year: number; startIndex: number; colspan: number }> = [];
    let currentMonth = -1; let currentYear = -1; let startIndex = 0; let colspan = 0;
    timelineColumns.forEach((col, idx) => {
      const month = col.date.getMonth(); const year = col.date.getFullYear();
      if (month !== currentMonth || year !== currentYear) {
        if (colspan > 0) headers.push({ label: new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'short' }), month: currentMonth, year: currentYear, startIndex, colspan });
        currentMonth = month; currentYear = year; startIndex = idx; colspan = 1;
      } else { colspan++; }
    });
    if (colspan > 0) headers.push({ label: new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'short' }), month: currentMonth, year: currentYear, startIndex, colspan });
    return headers;
  }, [timelineColumns]);

  // Column width per view mode
  const columnWidth = useMemo(() => {
    if (viewMode === 'year') return 60;
    if (viewMode === 'month') return 70;
    return 32;
  }, [viewMode]);

  const timelineWidth = useMemo(() => timelineColumns.length * columnWidth, [timelineColumns.length, columnWidth]);

  // Virtualized columns
  const visibleColumns = useMemo(() => {
    const { start, end } = visibleColumnRange;
    if (start === 0 && end === 0) return timelineColumns.slice(0, Math.min(50, timelineColumns.length));
    return timelineColumns.slice(start, end).map((col, idx) => ({ ...col, originalIndex: start + idx }));
  }, [timelineColumns, visibleColumnRange]);

  // Virtualized rows
  const visibleRows = useMemo(() => {
    const { start, end } = visibleRowRange;
    if (start === 0 && end === 0) return rows.slice(0, Math.min(20, rows.length)).map((row, idx) => ({ ...row, originalIndex: idx }));
    return rows.slice(start, end).map((row, idx) => ({ ...row, originalIndex: start + idx }));
  }, [rows, visibleRowRange]);

  const totalContentHeight = rows.length * ROW_HEIGHT;

  // Calculate visible column range
  const updateVisibleColumnRange = useCallback((scrollLeft: number, containerWidth: number) => {
    if (!columnWidth) return;
    const visibleStart = Math.floor(scrollLeft / columnWidth);
    const visibleEnd = Math.ceil((scrollLeft + containerWidth) / columnWidth);
    const renderStart = Math.max(0, visibleStart - BUFFER_COLUMNS);
    const renderEnd = Math.min(timelineColumns.length, visibleEnd + BUFFER_COLUMNS);
    setVisibleColumnRange({ start: renderStart, end: renderEnd });
  }, [columnWidth, timelineColumns.length, BUFFER_COLUMNS]);

  // Calculate visible row range
  const updateVisibleRowRange = useCallback((scrollTop: number, containerHeight: number, totalRows: number) => {
    const visibleStart = Math.floor(scrollTop / ROW_HEIGHT);
    const visibleEnd = Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT);
    const renderStart = Math.max(0, visibleStart - BUFFER_ROWS);
    const renderEnd = Math.min(totalRows, visibleEnd + BUFFER_ROWS);
    setVisibleRowRange({ start: renderStart, end: renderEnd });
  }, [BUFFER_ROWS]);

  // Bar position calculation
  const getBarPosition = useCallback((row: GanttRow) => {
    if (!row.startDate || !row.endDate) return null;
    if (viewMode === 'year') {
      const startYear = row.startDate.getFullYear();
      const startQuarter = Math.floor(row.startDate.getMonth() / 3);
      const endYear = row.endDate.getFullYear();
      const endQuarter = Math.floor(row.endDate.getMonth() / 3);
      const minYear = minDate.getFullYear();
      const minQuarter = Math.floor(minDate.getMonth() / 3);
      const startQuarterIndex = (startYear - minYear) * 4 + (startQuarter - minQuarter);
      const endQuarterIndex = (endYear - minYear) * 4 + (endQuarter - minQuarter);
      const quarterSpan = endQuarterIndex - startQuarterIndex + 1;
      return { left: Math.max(0, startQuarterIndex) * columnWidth, width: Math.max(quarterSpan * columnWidth - 4, 60) };
    } else if (viewMode === 'month') {
      const startYear = row.startDate.getFullYear(); const startMonth = row.startDate.getMonth();
      const endYear = row.endDate.getFullYear(); const endMonth = row.endDate.getMonth();
      const minYear = minDate.getFullYear(); const minMonth = minDate.getMonth();
      const startMonthIndex = (startYear - minYear) * 12 + (startMonth - minMonth);
      const endMonthIndex = (endYear - minYear) * 12 + (endMonth - minMonth);
      const monthSpan = endMonthIndex - startMonthIndex + 1;
      return { left: Math.max(0, startMonthIndex) * columnWidth, width: Math.max(monthSpan * columnWidth - 4, 40) };
    } else {
      const startOffset = Math.floor((row.startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      const duration = Math.ceil((row.endDate.getTime() - row.startDate.getTime()) / (1000 * 60 * 60 * 24));
      return { left: startOffset * columnWidth, width: Math.max(duration * columnWidth - 2, 30) };
    }
  }, [minDate, viewMode, columnWidth]);

  // Scroll sync
  const handleLeftScroll = useCallback(() => {
    if (!leftScrollRef.current || !rightScrollRef.current) return;
    const scrollTop = leftScrollRef.current.scrollTop;
    rightScrollRef.current.scrollTop = scrollTop;
    updateVisibleRowRange(scrollTop, leftScrollRef.current.clientHeight, rows.length);
  }, [updateVisibleRowRange, rows.length]);

  const handleRightScroll = useCallback(() => {
    if (!leftScrollRef.current || !rightScrollRef.current) return;
    const scrollTop = rightScrollRef.current.scrollTop;
    leftScrollRef.current.scrollTop = scrollTop;
    updateVisibleRowRange(scrollTop, rightScrollRef.current.clientHeight, rows.length);
  }, [updateVisibleRowRange, rows.length]);

  const handleTimelineScroll = useCallback((scrollLeft: number) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTimelineScrollLeft(scrollLeft);
      if (timelineHeaderRef.current) timelineHeaderRef.current.scrollLeft = scrollLeft;
      if (timelineBodyRef.current) timelineBodyRef.current.scrollLeft = scrollLeft;
      if (timelineBodyRef.current) updateVisibleColumnRange(scrollLeft, timelineBodyRef.current.clientWidth);
      rafRef.current = null;
    });
  }, [updateVisibleColumnRange]);

  const handleTimelineWheel = useCallback((e: React.WheelEvent) => {
    if (e.shiftKey && timelineBodyRef.current) {
      e.preventDefault();
      handleTimelineScroll(timelineBodyRef.current.scrollLeft + e.deltaY);
    }
  }, [handleTimelineScroll]);

  const handleTimelinePanStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.gantt-bar')) return;
    e.preventDefault();
    setIsPanningTimeline(true);
    setPanStartX(e.clientX);
    setPanStartScrollLeft(timelineScrollLeft);
  }, [timelineScrollLeft]);

  // Initialize visible ranges on mount
  useEffect(() => {
    if (timelineBodyRef.current) {
      updateVisibleColumnRange(timelineScrollLeft, timelineBodyRef.current.clientWidth);
      updateVisibleRowRange(0, timelineBodyRef.current.clientHeight, rows.length);
    }
    if (leftScrollRef.current) {
      updateVisibleRowRange(0, leftScrollRef.current.clientHeight, rows.length);
    }
  }, [timelineBodyRef.current?.clientWidth, columnWidth, timelineColumns.length, rows.length]);

  // Auto-scroll to Today when switching to Day view
  useEffect(() => {
    if (viewMode === 'day' && timelineBodyRef.current && timelineColumns.length > 0) {
      const timer = setTimeout(() => {
        if (!timelineBodyRef.current) return;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayIndex = timelineColumns.findIndex((col: any) => {
          const colDate = new Date(col.date); colDate.setHours(0, 0, 0, 0);
          return colDate.getTime() === today.getTime();
        });
        if (todayIndex >= 0) {
          const containerWidth = timelineBodyRef.current.clientWidth;
          handleTimelineScroll(Math.max(0, todayIndex * columnWidth - containerWidth / 3));
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [viewMode, timelineColumns.length, columnWidth]);

  // Jump to Today
  const handleJumpToToday = useCallback(() => {
    if (!timelineBodyRef.current || timelineColumns.length === 0) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let todayIndex = -1;
    if (viewMode === 'day') {
      todayIndex = timelineColumns.findIndex((col: any) => {
        const colDate = new Date(col.date); colDate.setHours(0, 0, 0, 0);
        return colDate.getTime() === today.getTime();
      });
    } else if (viewMode === 'month') {
      todayIndex = timelineColumns.findIndex((col: any) =>
        col.date.getFullYear() === today.getFullYear() && col.date.getMonth() === today.getMonth()
      );
    } else if (viewMode === 'year') {
      const todayQuarter = Math.floor(today.getMonth() / 3);
      todayIndex = timelineColumns.findIndex((col: any) =>
        col.year === today.getFullYear() && col.quarter === todayQuarter + 1
      );
    }
    if (todayIndex >= 0) {
      const containerWidth = timelineBodyRef.current.clientWidth;
      handleTimelineScroll(Math.max(0, todayIndex * columnWidth - containerWidth / 3));
    }
  }, [viewMode, timelineColumns, columnWidth, handleTimelineScroll]);

  // Timeline pan
  useEffect(() => {
    if (!isPanningTimeline) return;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    const handleMouseMove = (e: MouseEvent) => {
      handleTimelineScroll(Math.max(0, panStartScrollLeft + (panStartX - e.clientX)));
    };
    const handleMouseUp = () => {
      setIsPanningTimeline(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isPanningTimeline, panStartX, panStartScrollLeft, handleTimelineScroll]);

  // Divider drag
  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingDivider(true);
  }, []);

  useEffect(() => {
    if (!isDraggingDivider) return;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const newWidth = e.clientX - containerLeft;
      setLeftWidth(Math.max(LEFT_PANEL_MIN, Math.min(LEFT_PANEL_MAX, newWidth)));
    };
    const handleMouseUp = () => {
      setIsDraggingDivider(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingDivider]);

  // Row click
  const handleRowClick = (row: GanttRow) => {
    setSelectedRowId(row.id);
    const project = projects.find((p) => p.id === row.id);
    if (project && onProjectClick) onProjectClick(project);
  };

  // Bar drag
  const handleBarMouseDown = (e: React.MouseEvent, row: GanttRow) => {
    if (!row.startDate) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggedItem({ id: row.id, startX: e.clientX, startDate: row.startDate });
  };

  useEffect(() => {
    if (!draggedItem) return;
    const handleMouseUp = (e: MouseEvent) => {
      if (!draggedItem || !onProjectUpdate) { setDraggedItem(null); return; }
      const deltaX = e.clientX - draggedItem.startX;
      const row = rows.find((r) => r.id === draggedItem.id);
      if (row && row.startDate && row.endDate) {
        if (viewMode === 'month') {
          const monthsDelta = Math.round(deltaX / columnWidth);
          if (monthsDelta !== 0) {
            const newStart = new Date(row.startDate); newStart.setMonth(newStart.getMonth() + monthsDelta);
            const newEnd = new Date(row.endDate); newEnd.setMonth(newEnd.getMonth() + monthsDelta);
            onProjectUpdate(draggedItem.id, { start_date: newStart.toISOString().split('T')[0], end_date: newEnd.toISOString().split('T')[0] });
          }
        } else {
          const daysDelta = Math.round(deltaX / columnWidth);
          if (daysDelta !== 0) {
            const newStart = new Date(row.startDate); newStart.setDate(newStart.getDate() + daysDelta);
            const newEnd = new Date(row.endDate); newEnd.setDate(newEnd.getDate() + daysDelta);
            onProjectUpdate(draggedItem.id, { start_date: newStart.toISOString().split('T')[0], end_date: newEnd.toISOString().split('T')[0] });
          }
        }
      }
      setDraggedItem(null);
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [draggedItem, rows, onProjectUpdate, viewMode, columnWidth]);

  // Color palette
  const colors = {
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    border: '#F0F0F0',
    borderMedium: '#D9D9D9',
    borderStrong: '#BFBFBF',
    text: '#262626',
    textMuted: '#8C8C8C',
    hover: '#FAFAFA',
    selected: '#E6F7FF',
    selectedBorder: '#91D5FF',
  };

  const statusColors = {
    done:        { bg: '#F6FFED', border: '#95DE64', fill: '#B7EB8F', text: '#135200' },
    in_progress: { bg: '#E6F7FF', border: '#69C0FF', fill: '#91D5FF', text: '#003A8C' },
    blocked:     { bg: '#FFF1F0', border: '#FF7875', fill: '#FFA39E', text: '#820014' },
    not_started: { bg: '#FAFAFA', border: '#D9D9D9', fill: '#F5F5F5', text: '#595959' },
  };

  const getStatusStyle = (status: string) => {
    const normalized = status.toLowerCase();
    return statusColors[normalized as keyof typeof statusColors] || statusColors.not_started;
  };

  // Today line position
  const todayLineLeft = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (viewMode === 'year') {
      const todayQuarter = Math.floor(today.getMonth() / 3);
      const idx = timelineColumns.findIndex((col: any) => col.year === today.getFullYear() && col.quarter === todayQuarter + 1);
      if (idx < 0) return -1;
      const dayInQuarter = Math.floor((today.getTime() - timelineColumns[idx].date.getTime()) / 86400000);
      const quarterDays = [91, 91, 92, 92][todayQuarter] || 91;
      return (idx + dayInQuarter / quarterDays) * columnWidth;
    } else if (viewMode === 'month') {
      const idx = timelineColumns.findIndex((col: any) =>
        col.date.getFullYear() === today.getFullYear() && col.date.getMonth() === today.getMonth()
      );
      if (idx < 0) return -1;
      const day = today.getDate();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      return (idx + day / daysInMonth) * columnWidth;
    } else {
      const idx = timelineColumns.findIndex((col: any) => {
        const d = new Date(col.date); d.setHours(0, 0, 0, 0); return d.getTime() === today.getTime();
      });
      return idx >= 0 ? idx * columnWidth : -1;
    }
  }, [viewMode, timelineColumns, columnWidth]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bg }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div
        className="px-4 py-2.5 border-b flex items-center justify-between flex-shrink-0"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        {/* Left: count */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: colors.text }}>
            {rows.length} {rows.length === 1 ? 'project' : 'projects'}
          </span>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            size="small"
            style={{ width: 148 }}
            options={[
              { label: 'All Statuses', value: 'all' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Not Started', value: 'not_started' },
              { label: 'Blocked', value: 'blocked' },
              { label: 'Done', value: 'done' },
            ]}
          />

          {/* Search */}
          <Input
            placeholder="Search projects…"
            prefix={<FilterOutlined style={{ color: colors.textMuted }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            size="small"
            style={{ width: 220 }}
          />

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* View scale */}
          <Select
            value={viewMode}
            onChange={setViewMode}
            size="small"
            style={{ width: 90 }}
            options={[
              { label: 'Year', value: 'year' },
              { label: 'Month', value: 'month' },
              { label: 'Day', value: 'day' },
            ]}
          />
          <Tooltip title="Zoom In">
            <Button icon={<ZoomInOutlined />} size="small" disabled={viewMode === 'day'}
              onClick={() => { if (viewMode === 'year') setViewMode('month'); else if (viewMode === 'month') setViewMode('day'); }} />
          </Tooltip>
          <Tooltip title="Zoom Out">
            <Button icon={<ZoomOutOutlined />} size="small" disabled={viewMode === 'year'}
              onClick={() => { if (viewMode === 'day') setViewMode('month'); else if (viewMode === 'month') setViewMode('year'); }} />
          </Tooltip>
          <Tooltip title="Reset to Month">
            <Button icon={<FullscreenOutlined />} size="small" onClick={() => setViewMode('month')} />
          </Tooltip>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <Tooltip title="Jump to Today">
            <Button icon={<CalendarOutlined />} size="small" onClick={handleJumpToToday}>Today</Button>
          </Tooltip>

          <Button icon={<DownloadOutlined />} size="small" onClick={onExport}>Export</Button>
        </div>
      </div>

      {/* ── Main: split pane ─────────────────────────────────────────────── */}
      <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT: Frozen table */}
        <div
          className="flex flex-col flex-shrink-0"
          style={{ width: leftWidth, backgroundColor: colors.surface, borderRight: `1px solid ${colors.borderMedium}` }}
        >
          {/* Table header */}
          <div
            className="flex-shrink-0 flex items-center text-xs font-semibold"
            style={{ height: HEADER_HEIGHT, backgroundColor: colors.hover, borderBottom: `1px solid ${colors.border}`, color: colors.textMuted }}
          >
            <div className="px-3 flex items-center h-full truncate" style={{ width: LEFT_COLS.name, borderRight: `1px solid ${colors.border}` }}>
              Task Name
            </div>
            <div className="px-3 flex items-center h-full truncate" style={{ width: LEFT_COLS.owner, borderRight: `1px solid ${colors.border}` }}>
              Owner
            </div>
            <div className="px-2 flex items-center justify-center h-full" style={{ width: LEFT_COLS.start, borderRight: `1px solid ${colors.border}` }}>
              Start
            </div>
            <div className="px-2 flex items-center justify-center h-full" style={{ width: LEFT_COLS.end, borderRight: `1px solid ${colors.border}` }}>
              End
            </div>
            <div className="px-2 flex items-center justify-center h-full" style={{ width: LEFT_COLS.days, borderRight: `1px solid ${colors.border}` }}>
              Days
            </div>
            <div className="px-2 flex items-center justify-center h-full" style={{ width: LEFT_COLS.status }}>
              Status
            </div>
          </div>

          {/* Table body */}
          <div
            ref={leftScrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden"
            onScroll={handleLeftScroll}
          >
            <div style={{ height: totalContentHeight, position: 'relative' }}>
              {loading ? (
                <div className="flex items-center justify-center" style={{ height: 200, color: colors.textMuted }}>Loading…</div>
              ) : rows.length === 0 ? (
                <div className="flex items-center justify-center" style={{ height: 200, color: colors.textMuted }}>No projects found</div>
              ) : (
                visibleRows.map((row) => {
                  const isSelected = selectedRowId === row.id;
                  const statusStyle = getStatusStyle(row.status);
                  const rowTop = row.originalIndex * ROW_HEIGHT;
                  return (
                    <div
                      key={row.id}
                      className="absolute flex items-center text-sm cursor-pointer transition-colors"
                      style={{
                        top: rowTop, left: 0, right: 0, height: ROW_HEIGHT,
                        backgroundColor: isSelected ? colors.selected : 'transparent',
                        borderBottom: `1px solid ${colors.border}`, color: colors.text,
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#F5F5F5'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      onClick={() => handleRowClick(row)}
                    >
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: colors.selectedBorder }} />}

                      {/* Name */}
                      <div className="px-3 truncate font-medium" style={{ width: LEFT_COLS.name, borderRight: `1px solid ${colors.border}` }} title={row.name}>
                        {row.name}
                      </div>
                      {/* Owner */}
                      <div className="px-3 truncate" style={{ width: LEFT_COLS.owner, borderRight: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: 12 }} title={row.owner}>
                        {row.owner}
                      </div>
                      {/* Start */}
                      <div className="px-2 text-center tabular-nums" style={{ width: LEFT_COLS.start, borderRight: `1px solid ${colors.border}`, color: row.startDate ? colors.text : colors.textMuted, fontSize: 12 }}>
                        {row.startDate ? row.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                      </div>
                      {/* End */}
                      <div className="px-2 text-center tabular-nums" style={{ width: LEFT_COLS.end, borderRight: `1px solid ${colors.border}`, color: row.endDate ? colors.text : colors.textMuted, fontSize: 12 }}>
                        {row.endDate ? row.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                      </div>
                      {/* Days */}
                      <div className="px-2 text-center tabular-nums" style={{ width: LEFT_COLS.days, borderRight: `1px solid ${colors.border}`, color: row.duration > 0 ? colors.text : colors.textMuted, fontSize: 12 }}>
                        {row.duration > 0 ? `${row.duration}d` : '—'}
                      </div>
                      {/* Status dot */}
                      <div className="flex justify-center" style={{ width: LEFT_COLS.status }}>
                        <Tooltip title={row.status.replace(/_/g, ' ')}>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusStyle.fill, border: `1px solid ${statusStyle.border}` }} />
                        </Tooltip>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Resizable divider */}
        <div
          className="flex-shrink-0 flex items-center justify-center cursor-col-resize transition-colors"
          style={{
            width: 4,
            backgroundColor: isDraggingDivider ? '#3B82F6' : colors.borderMedium,
            zIndex: 10,
          }}
          onMouseDown={handleDividerMouseDown}
        >
          <div className="w-0.5 h-8 rounded-full opacity-60" style={{ backgroundColor: isDraggingDivider ? '#fff' : '#8c8c8c' }} />
        </div>

        {/* RIGHT: Timeline */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ backgroundColor: colors.surface }}>

          {/* Timeline header */}
          <div
            ref={timelineHeaderRef}
            className="flex-shrink-0 overflow-x-hidden overflow-y-hidden"
            style={{
              height: HEADER_HEIGHT,
              borderBottom: `1px solid ${colors.border}`,
              cursor: isPanningTimeline ? 'grabbing' : 'grab',
            }}
            onWheel={handleTimelineWheel}
            onMouseDown={handleTimelinePanStart}
          >
            <div style={{ width: timelineWidth, minWidth: '100%' }}>
              {viewMode === 'year' ? (
                <div style={{ width: timelineWidth }}>
                  <div className="flex" style={{ height: 30, backgroundColor: '#F7F7F7', borderBottom: `1px solid #DDD` }}>
                    {yearHeaders.map((h, idx) => (
                      <div key={idx} className="flex items-center justify-center text-sm font-bold" style={{ width: h.colspan * columnWidth, minWidth: h.colspan * columnWidth, flexShrink: 0, borderRight: `2px solid #BFBFBF`, color: '#222' }}>{h.year}</div>
                    ))}
                  </div>
                  <div className="flex" style={{ height: 30 }}>
                    {timelineColumns.map((col: any, idx) => (
                      <div key={idx} className="flex items-center justify-center text-xs font-medium" style={{ width: columnWidth, minWidth: columnWidth, flexShrink: 0, borderRight: `1px solid #DDD`, color: '#555' }}>{col.label}</div>
                    ))}
                  </div>
                </div>
              ) : viewMode === 'month' ? (
                <div style={{ width: timelineWidth }}>
                  <div className="flex" style={{ height: 30, backgroundColor: '#F7F7F7', borderBottom: `1px solid #DDD` }}>
                    {yearHeaders.map((h, idx) => (
                      <div key={idx} className="flex items-center justify-center text-sm font-bold" style={{ width: h.colspan * columnWidth, minWidth: h.colspan * columnWidth, flexShrink: 0, borderRight: `2px solid #BFBFBF`, color: '#222' }}>{h.year}</div>
                    ))}
                  </div>
                  <div className="flex" style={{ height: 30 }}>
                    {timelineColumns.map((col: any, idx) => (
                      <div key={idx} className="flex items-center justify-center text-xs font-medium" style={{ width: columnWidth, minWidth: columnWidth, flexShrink: 0, borderRight: `1px solid #DDD`, color: '#555' }}>{col.label}</div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ width: timelineWidth }}>
                  <div className="flex" style={{ height: 24, backgroundColor: '#F7F7F7', borderBottom: `1px solid #DDD` }}>
                    {yearHeaders.map((h, idx) => (
                      <div key={idx} className="flex items-center justify-center text-xs font-bold" style={{ width: h.colspan * columnWidth, minWidth: h.colspan * columnWidth, flexShrink: 0, borderRight: `2px solid #BFBFBF`, color: '#222' }}>{h.year}</div>
                    ))}
                  </div>
                  <div className="flex" style={{ height: 24, backgroundColor: '#FAFAFA', borderBottom: `1px solid #DDD` }}>
                    {monthHeaders.map((h, idx) => (
                      <div key={idx} className="flex items-center justify-center text-xs font-semibold" style={{ width: h.colspan * columnWidth, minWidth: h.colspan * columnWidth, flexShrink: 0, borderRight: `2px solid #BBB`, color: '#333' }}>{h.label}</div>
                    ))}
                  </div>
                  <div className="flex" style={{ height: 24 }}>
                    {timelineColumns.map((col: any, idx) => (
                      <div key={idx} className="flex items-center justify-center text-[10px]" style={{ width: columnWidth, minWidth: columnWidth, flexShrink: 0, borderRight: `1px solid #E5E5E5`, color: '#666', backgroundColor: col.isWeekend ? '#F9F9F9' : 'transparent' }}>{col.dayOfMonth}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline body */}
          <div
            ref={(el) => { (rightScrollRef as any).current = el; (timelineBodyRef as any).current = el; }}
            className="flex-1 overflow-auto"
            style={{ cursor: isPanningTimeline ? 'grabbing' : 'grab' }}
            onScroll={(e) => { handleRightScroll(); handleTimelineScroll(e.currentTarget.scrollLeft); }}
            onWheel={handleTimelineWheel}
            onMouseDown={handleTimelinePanStart}
          >
            <div
              className="relative"
              style={{ width: timelineWidth, minWidth: '100%', height: totalContentHeight }}
            >
              {loading ? (
                <div className="flex items-center justify-center" style={{ height: 200, color: colors.textMuted }}>Loading…</div>
              ) : rows.length === 0 ? (
                <div className="flex items-center justify-center" style={{ height: 200, color: colors.textMuted }}>No projects found</div>
              ) : (
                <>
                  {visibleRows.map((row) => {
                    const barPos = getBarPosition(row);
                    const isSelected = selectedRowId === row.id;
                    const statusStyle = getStatusStyle(row.status);
                    const rowTop = row.originalIndex * ROW_HEIGHT;
                    return (
                      <div
                        key={row.id}
                        className="absolute"
                        style={{ top: rowTop, left: 0, right: 0, height: ROW_HEIGHT, backgroundColor: isSelected ? colors.selected : 'transparent', borderBottom: `1px solid ${colors.border}` }}
                      >
                        {/* Grid columns */}
                        {viewMode === 'month' || viewMode === 'year' ? (
                          <div className="flex absolute inset-0">
                            {timelineColumns.map((col: any, colIdx) => {
                              const isYearBoundary = colIdx > 0 && (viewMode === 'year' ? col.year !== (timelineColumns[colIdx - 1] as any)?.year : col.date.getMonth() === 0);
                              return (
                                <div key={colIdx} style={{ width: columnWidth, minWidth: columnWidth, flexShrink: 0, height: '100%', borderRight: `1px solid ${isYearBoundary ? colors.borderStrong : colors.borderMedium}` }} />
                              );
                            })}
                          </div>
                        ) : (
                          <>
                            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(to right, ${colors.border} 0, ${colors.border} 1px, transparent 1px, transparent ${columnWidth}px)`, backgroundSize: `${columnWidth}px 100%`, opacity: 0.5 }} />
                            {visibleColumns.map((col: any) => {
                              if (!col.isWeekend) return null;
                              const colIdx = col.originalIndex ?? 0;
                              return <div key={`we-${colIdx}`} className="absolute pointer-events-none" style={{ left: colIdx * columnWidth, width: columnWidth, top: 0, height: '100%', backgroundColor: colors.hover }} />;
                            })}
                          </>
                        )}

                        {/* Gantt bar */}
                        {barPos && (
                          <Tooltip
                            title={
                              <div className="text-xs">
                                <div className="font-semibold mb-0.5">{row.name}</div>
                                <div>{row.startDate?.toLocaleDateString()} → {row.endDate?.toLocaleDateString()}</div>
                                <div>{row.duration}d · {row.status.replace(/_/g, ' ')}</div>
                              </div>
                            }
                          >
                            <div
                              className="gantt-bar absolute cursor-move z-10 flex items-center px-2"
                              style={{
                                left: barPos.left, width: barPos.width,
                                height: ROW_HEIGHT - 16, top: 8,
                                backgroundColor: statusStyle.fill,
                                border: `1px solid ${statusStyle.border}`,
                                borderRadius: 2,
                                opacity: draggedItem?.id === row.id ? 0.7 : 1,
                                overflow: 'hidden',
                              }}
                              onMouseDown={(e) => handleBarMouseDown(e, row)}
                            >
                              {barPos.width > 60 && (
                                <span className="text-xs font-medium truncate" style={{ color: statusStyle.text }}>
                                  {row.name}
                                </span>
                              )}
                            </div>
                          </Tooltip>
                        )}
                      </div>
                    );
                  })}

                  {/* Today line */}
                  {todayLineLeft >= 0 && (
                    <div
                      className="absolute top-0 bottom-0 pointer-events-none z-20"
                      style={{ left: todayLineLeft, width: 1, borderLeft: '1px dashed #FA8C16', opacity: 0.7 }}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Legend bar ───────────────────────────────────────────────────── */}
      <div
        className="px-4 py-2 border-t flex items-center justify-between flex-shrink-0"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <div className="flex items-center gap-5 text-xs">
          <span style={{ color: colors.textMuted, fontWeight: 500 }}>Legend:</span>
          {Object.entries({ 'Done': 'done', 'In Progress': 'in_progress', 'Blocked': 'blocked', 'Not Started': 'not_started' }).map(([label, status]) => {
            const style = getStatusStyle(status);
            return (
              <div key={status} className="flex items-center gap-1.5">
                <div className="w-4 h-2.5 rounded" style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }} />
                <span style={{ color: colors.text }}>{label}</span>
              </div>
            );
          })}
        </div>
        <span className="text-xs" style={{ color: colors.textMuted }}>
          Drag bars to reschedule · Drag divider to resize · Click row for details
        </span>
      </div>
    </div>
  );
}
