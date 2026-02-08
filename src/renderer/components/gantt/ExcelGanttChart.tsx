/**
 * ExcelGanttChart - Excel-style Gantt chart with table and timeline
 *
 * Layout (like Excel):
 * - Left: Frozen table with task details (vertical scroll only, no horizontal scroll)
 * - Right: Timeline with Gantt bars (horizontal + vertical scroll)
 * - Rows are perfectly aligned 1:1 between left and right
 * - Both sides scroll vertically together
 */

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Tag, Input, Select, Button, Space, Tooltip } from 'antd';
import {
  CalendarOutlined,
  DownloadOutlined,
  FilterOutlined,
  UserOutlined,
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

const ROW_HEIGHT = 40; // Fixed row height for alignment

export function ExcelGanttChart({
  projects,
  workItems = [],
  loading = false,
  onProjectClick,
  onProjectUpdate,
  onExport,
  viewMode: initialViewMode = 'month',
}: ExcelGanttChartProps) {
  const STORAGE_KEY_TIMELINE_WIDTH_PERCENT = 'gantt-timeline-width-percent';
  const STORAGE_KEY_VIEW_MODE = 'gantt-view-mode';

  // Safe zone and timeline constraints (percentage-based)
  const SAFE_ZONE_PERCENT = 32; // Reserved right space (table never renders here)
  const TIMELINE_DEFAULT_PERCENT = 32; // Default drawer width (fits safe zone)
  const TIMELINE_MIN_PERCENT = 32; // Minimum drawer width
  const TIMELINE_MAX_PERCENT = 85; // Maximum drawer width

  const [viewMode, setViewMode] = useState<'year' | 'month' | 'day'>(() => {
    // Use initialViewMode prop if provided, otherwise try localStorage, finally default to 'month'
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

  // Timeline overlay state (percentage of page width)
  // Always start at minimum width, ignore localStorage
  const [timelineWidthPercent, setTimelineWidthPercent] = useState<number>(TIMELINE_MIN_PERCENT);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);

  // Dynamic header height based on view mode
  const HEADER_HEIGHT = useMemo(() => {
    if (viewMode === 'day') return 72; // 3 rows: 24px each
    return 60; // 2 rows: 30px each (year/month views)
  }, [viewMode]);

  // Timeline scroll sync state
  const [timelineScrollLeft, setTimelineScrollLeft] = useState(0);
  const [isPanningTimeline, setIsPanningTimeline] = useState(false);
  const [panStartX, setPanStartX] = useState(0);
  const [panStartScrollLeft, setPanStartScrollLeft] = useState(0);
  const [debugAlignment, setDebugAlignment] = useState(false); // Debug mode

  // Virtualization state
  const [visibleColumnRange, setVisibleColumnRange] = useState({ start: 0, end: 0 });
  const [visibleRowRange, setVisibleRowRange] = useState({ start: 0, end: 0 });
  const BUFFER_COLUMNS = 5; // Render extra columns on each side
  const BUFFER_ROWS = 3; // Render extra rows on each side

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
          owner: project.owner || '-',
          startDate,
          endDate,
          duration,
          type: 'project' as const,
          portfolioId: project.portfolio_id,
        };
      });
  }, [projects, searchQuery, statusFilter]);

  // Calculate date range
  const { minDate, maxDate, totalDays } = useMemo(() => {
    let min: Date | null = null;
    let max: Date | null = null;

    rows.forEach((row) => {
      if (row.startDate && (!min || row.startDate < min)) {
        min = row.startDate;
      }
      if (row.endDate && (!max || row.endDate > max)) {
        max = row.endDate;
      }
    });

    if (!min || !max) {
      const now = new Date();
      min = new Date(now.getFullYear(), now.getMonth(), 1);
      max = new Date(now.getFullYear(), now.getMonth() + 3, 0);
    }

    // Add padding
    const paddedMin = new Date(min);
    paddedMin.setDate(paddedMin.getDate() - 14);
    const paddedMax = new Date(max);
    paddedMax.setDate(paddedMax.getDate() + 14);

    const days = Math.ceil((paddedMax.getTime() - paddedMin.getTime()) / (1000 * 60 * 60 * 24));

    return {
      minDate: paddedMin,
      maxDate: paddedMax,
      totalDays: days,
    };
  }, [rows]);

  // Generate timeline columns based on view mode
  const timelineColumns = useMemo(() => {
    if (viewMode === 'year') {
      // Year view: one column per quarter
      const columns: Array<{
        type: 'quarter';
        date: Date;
        year: number;
        quarter: number;
        label: string;
      }> = [];
      const currentDate = new Date(minDate);
      currentDate.setMonth(Math.floor(currentDate.getMonth() / 3) * 3); // Align to quarter start

      while (currentDate <= maxDate) {
        const year = currentDate.getFullYear();
        const quarter = Math.floor(currentDate.getMonth() / 3) + 1;

        columns.push({
          type: 'quarter',
          date: new Date(year, (quarter - 1) * 3, 1),
          year,
          quarter,
          label: `Q${quarter}`,
        });

        // Move to next quarter
        currentDate.setMonth(currentDate.getMonth() + 3);
      }

      return columns;
    } else if (viewMode === 'month') {
      // Month view: one column per month
      const columns: Array<{
        type: 'month';
        date: Date;
        year: number;
        month: number;
        label: string;
        daysInMonth: number;
      }> = [];
      const currentDate = new Date(minDate);

      while (currentDate <= maxDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        columns.push({
          type: 'month',
          date: new Date(year, month, 1),
          year,
          month,
          label: currentDate.toLocaleDateString('en-US', { month: 'short' }),
          daysInMonth,
        });

        // Move to next month
        currentDate.setMonth(month + 1);
      }

      return columns;
    } else {
      // Day view: one column per day
      const columns: Array<{
        type: 'day';
        date: Date;
        dayOfWeek: number;
        isWeekend: boolean;
        dayOfMonth: number;
      }> = [];
      const currentDate = new Date(minDate);

      while (currentDate <= maxDate) {
        const dayOfWeek = currentDate.getDay();
        columns.push({
          type: 'day',
          date: new Date(currentDate),
          dayOfWeek,
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          dayOfMonth: currentDate.getDate(),
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return columns;
    }
  }, [minDate, maxDate, viewMode]);

  // Generate year headers (top band for all views)
  const yearHeaders = useMemo(() => {
    const headers: Array<{
      year: number;
      startIndex: number;
      colspan: number;
    }> = [];
    let currentYear = -1;
    let startIndex = 0;
    let colspan = 0;

    timelineColumns.forEach((col, idx) => {
      const year = col.date.getFullYear();

      if (year !== currentYear) {
        if (colspan > 0) {
          headers.push({
            year: currentYear,
            startIndex,
            colspan
          });
        }
        currentYear = year;
        startIndex = idx;
        colspan = 1;
      } else {
        colspan++;
      }
    });

    // Add last year
    if (colspan > 0) {
      headers.push({
        year: currentYear,
        startIndex,
        colspan
      });
    }

    return headers;
  }, [timelineColumns]);

  // Generate month headers (middle band)
  const monthHeaders = useMemo(() => {
    const headers: Array<{ label: string; month: number; year: number; startIndex: number; colspan: number }> = [];
    let currentMonth = -1;
    let currentYear = -1;
    let startIndex = 0;
    let colspan = 0;

    timelineColumns.forEach((col, idx) => {
      const month = col.date.getMonth();
      const year = col.date.getFullYear();

      if (month !== currentMonth || year !== currentYear) {
        if (colspan > 0) {
          headers.push({
            label: new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'short' }),
            month: currentMonth,
            year: currentYear,
            startIndex,
            colspan,
          });
        }
        currentMonth = month;
        currentYear = year;
        startIndex = idx;
        colspan = 1;
      } else {
        colspan++;
      }
    });

    // Add last month
    if (colspan > 0) {
      headers.push({
        label: new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'short' }),
        month: currentMonth,
        year: currentYear,
        startIndex,
        colspan,
      });
    }

    return headers;
  }, [timelineColumns]);

  // Column width derived from unit scale (minimal width to fit text)
  // Each column represents exactly ONE unit of the active scale
  const columnWidth = useMemo(() => {
    if (viewMode === 'year') {
      // Unit = Quarter. Width just fits "Q1"-"Q4" text (minimal)
      return 60; // 60px per quarter (4 quarters = 240px/year)
    }
    if (viewMode === 'month') {
      // Unit = Month. Width just fits "Jan"-"Dec" text (minimal)
      return 70; // 70px per month
    }
    // Unit = Day. Width just fits day numbers 1-31 (minimal)
    return 32; // 32px per day
  }, [viewMode]);

  // Timeline content width calculation (for scrollable area)
  // Total width = number of columns × unitWidth
  const timelineWidth = useMemo(() => {
    // Each column represents exactly one unit (quarter/month/day)
    return timelineColumns.length * columnWidth;
  }, [timelineColumns.length, columnWidth]);

  // Virtualized columns (only render visible + buffer)
  const visibleColumns = useMemo(() => {
    const { start, end } = visibleColumnRange;
    if (start === 0 && end === 0) {
      // Not initialized yet, show first screen
      return timelineColumns.slice(0, Math.min(50, timelineColumns.length));
    }
    return timelineColumns.slice(start, end).map((col, idx) => ({
      ...col,
      originalIndex: start + idx, // Keep track of original index for positioning
    }));
  }, [timelineColumns, visibleColumnRange]);

  // Virtualized rows (only render visible + buffer)
  const visibleRows = useMemo(() => {
    const { start, end } = visibleRowRange;
    if (start === 0 && end === 0) {
      // Not initialized yet, show first screen
      return rows.slice(0, Math.min(20, rows.length)).map((row, idx) => ({
        ...row,
        originalIndex: idx,
      }));
    }
    return rows.slice(start, end).map((row, idx) => ({
      ...row,
      originalIndex: start + idx, // Keep track of original index for positioning
    }));
  }, [rows, visibleRowRange]);

  // Total content height for scroll container
  const totalContentHeight = rows.length * ROW_HEIGHT;

  // Calculate visible column range for horizontal virtualization
  const updateVisibleColumnRange = useCallback((scrollLeft: number, containerWidth: number) => {
    if (!columnWidth) return;

    const visibleStart = Math.floor(scrollLeft / columnWidth);
    const visibleEnd = Math.ceil((scrollLeft + containerWidth) / columnWidth);

    const renderStart = Math.max(0, visibleStart - BUFFER_COLUMNS);
    const renderEnd = Math.min(timelineColumns.length, visibleEnd + BUFFER_COLUMNS);

    setVisibleColumnRange({ start: renderStart, end: renderEnd });
  }, [columnWidth, timelineColumns.length, BUFFER_COLUMNS]);

  // Calculate visible row range for vertical virtualization
  const updateVisibleRowRange = useCallback((scrollTop: number, containerHeight: number, totalRows: number) => {
    const visibleStart = Math.floor(scrollTop / ROW_HEIGHT);
    const visibleEnd = Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT);

    const renderStart = Math.max(0, visibleStart - BUFFER_ROWS);
    const renderEnd = Math.min(totalRows, visibleEnd + BUFFER_ROWS);

    setVisibleRowRange({ start: renderStart, end: renderEnd });
  }, [BUFFER_ROWS]);

  // Calculate bar position based on view mode (unit-aligned)
  const getBarPosition = useCallback(
    (row: GanttRow) => {
      if (!row.startDate || !row.endDate) return null;

      if (viewMode === 'year') {
        // Year view: position by quarter columns
        const startYear = row.startDate.getFullYear();
        const startQuarter = Math.floor(row.startDate.getMonth() / 3);
        const endYear = row.endDate.getFullYear();
        const endQuarter = Math.floor(row.endDate.getMonth() / 3);

        const minYear = minDate.getFullYear();
        const minQuarter = Math.floor(minDate.getMonth() / 3);

        // Calculate quarter index (0-based from minDate)
        const startQuarterIndex = (startYear - minYear) * 4 + (startQuarter - minQuarter);
        const endQuarterIndex = (endYear - minYear) * 4 + (endQuarter - minQuarter);

        const quarterSpan = endQuarterIndex - startQuarterIndex + 1;

        const left = Math.max(0, startQuarterIndex) * columnWidth;
        const width = Math.max(quarterSpan * columnWidth - 4, 60); // Minimum 60px for visibility

        return { left, width };
      } else if (viewMode === 'month') {
        // Month view: position by month columns
        const startYear = row.startDate.getFullYear();
        const startMonth = row.startDate.getMonth();
        const endYear = row.endDate.getFullYear();
        const endMonth = row.endDate.getMonth();

        const minYear = minDate.getFullYear();
        const minMonth = minDate.getMonth();

        // Calculate month index (0-based from minDate)
        const startMonthIndex = (startYear - minYear) * 12 + (startMonth - minMonth);
        const endMonthIndex = (endYear - minYear) * 12 + (endMonth - minMonth);

        const monthSpan = endMonthIndex - startMonthIndex + 1;

        const left = Math.max(0, startMonthIndex) * columnWidth;
        const width = Math.max(monthSpan * columnWidth - 4, 40); // Minimum 40px for visibility

        return { left, width };
      } else {
        // Day view: position by day columns (pixel-perfect)
        const startOffset = Math.floor(
          (row.startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const duration = Math.ceil(
          (row.endDate.getTime() - row.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        const left = startOffset * columnWidth;
        const width = Math.max(duration * columnWidth - 2, 30); // Minimum 30px width, -2 for spacing

        return { left, width };
      }
    },
    [minDate, viewMode, columnWidth]
  );

  // Synchronize vertical scroll (with virtualization update)
  const handleLeftScroll = useCallback(() => {
    if (!leftScrollRef.current || !rightScrollRef.current) return;
    const scrollTop = leftScrollRef.current.scrollTop;
    rightScrollRef.current.scrollTop = scrollTop;

    // Update visible row range for virtualization
    if (leftScrollRef.current) {
      const containerHeight = leftScrollRef.current.clientHeight;
      updateVisibleRowRange(scrollTop, containerHeight, rows.length);
    }
  }, [updateVisibleRowRange, rows.length]);

  const handleRightScroll = useCallback(() => {
    if (!leftScrollRef.current || !rightScrollRef.current) return;
    const scrollTop = rightScrollRef.current.scrollTop;
    leftScrollRef.current.scrollTop = scrollTop;

    // Update visible row range for virtualization
    if (rightScrollRef.current) {
      const containerHeight = rightScrollRef.current.clientHeight;
      updateVisibleRowRange(scrollTop, containerHeight, rows.length);
    }
  }, [updateVisibleRowRange, rows.length]);

  // Synchronize horizontal scroll between timeline header and body (with RAF throttling)
  const handleTimelineScroll = useCallback((scrollLeft: number) => {
    // Cancel previous RAF if exists
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use RAF to throttle scroll updates
    rafRef.current = requestAnimationFrame(() => {
      setTimelineScrollLeft(scrollLeft);

      if (timelineHeaderRef.current) {
        timelineHeaderRef.current.scrollLeft = scrollLeft;
      }
      if (timelineBodyRef.current) {
        timelineBodyRef.current.scrollLeft = scrollLeft;
      }

      // Update visible column range for virtualization
      if (timelineBodyRef.current) {
        const containerWidth = timelineBodyRef.current.clientWidth;
        updateVisibleColumnRange(scrollLeft, containerWidth);
      }

      rafRef.current = null;
    });
  }, [updateVisibleColumnRange]);

  // Handle Shift + Wheel for horizontal scrolling
  const handleTimelineWheel = useCallback((e: React.WheelEvent) => {
    if (e.shiftKey && timelineBodyRef.current) {
      e.preventDefault();
      const newScrollLeft = timelineBodyRef.current.scrollLeft + e.deltaY;
      handleTimelineScroll(newScrollLeft);
    }
  }, [handleTimelineScroll]);

  // Handle timeline panning (drag to scroll)
  const handleTimelinePanStart = useCallback((e: React.MouseEvent) => {
    // Only pan on empty areas (not on bars or other interactive elements)
    if ((e.target as HTMLElement).closest('.gantt-bar')) return;

    e.preventDefault();
    setIsPanningTimeline(true);
    setPanStartX(e.clientX);
    setPanStartScrollLeft(timelineScrollLeft);
  }, [timelineScrollLeft]);

  // Initialize visible ranges on mount and when dimensions change
  useEffect(() => {
    if (timelineBodyRef.current) {
      const containerWidth = timelineBodyRef.current.clientWidth;
      const containerHeight = timelineBodyRef.current.clientHeight;
      updateVisibleColumnRange(timelineScrollLeft, containerWidth);
      updateVisibleRowRange(0, containerHeight, rows.length);
    }
    if (leftScrollRef.current) {
      const containerHeight = leftScrollRef.current.clientHeight;
      updateVisibleRowRange(0, containerHeight, rows.length);
    }
  }, [timelineBodyRef.current?.clientWidth, timelineBodyRef.current?.clientHeight, columnWidth, timelineColumns.length, updateVisibleColumnRange, updateVisibleRowRange, timelineScrollLeft, rows.length]);

  // Auto-scroll to Today when switching to Day view
  useEffect(() => {
    if (viewMode === 'day' && timelineBodyRef.current && timelineColumns.length > 0) {
      // Use setTimeout to ensure columns are fully rendered
      const timer = setTimeout(() => {
        if (!timelineBodyRef.current) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find today's column index
        const todayIndex = timelineColumns.findIndex((col: any) => {
          const colDate = new Date(col.date);
          colDate.setHours(0, 0, 0, 0);
          return colDate.getTime() === today.getTime();
        });

        if (todayIndex >= 0) {
          // Calculate scroll position to center today (with slight left offset for context)
          const containerWidth = timelineBodyRef.current.clientWidth;
          const todayPosition = todayIndex * columnWidth;
          const scrollPosition = Math.max(0, todayPosition - containerWidth / 3); // Show today in left-center

          // Use handleTimelineScroll to properly sync state
          handleTimelineScroll(scrollPosition);
        }
      }, 100); // Small delay to ensure rendering is complete

      return () => clearTimeout(timer);
    }
  }, [viewMode, timelineColumns.length, columnWidth, handleTimelineScroll]);

  // Handle "Jump to Today" button
  const handleJumpToToday = useCallback(() => {
    if (!timelineBodyRef.current || timelineColumns.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayIndex = -1;

    if (viewMode === 'day') {
      // Day view: find exact day
      todayIndex = timelineColumns.findIndex((col: any) => {
        const colDate = new Date(col.date);
        colDate.setHours(0, 0, 0, 0);
        return colDate.getTime() === today.getTime();
      });
    } else if (viewMode === 'month') {
      // Month view: find current month
      todayIndex = timelineColumns.findIndex((col: any) => {
        const colDate = new Date(col.date);
        return colDate.getFullYear() === today.getFullYear() &&
               colDate.getMonth() === today.getMonth();
      });
    } else if (viewMode === 'year') {
      // Year view: find current quarter
      const todayQuarter = Math.floor(today.getMonth() / 3);
      todayIndex = timelineColumns.findIndex((col: any) => {
        return col.year === today.getFullYear() &&
               col.quarter === todayQuarter + 1;
      });
    }

    if (todayIndex >= 0) {
      const containerWidth = timelineBodyRef.current.clientWidth;
      const todayPosition = todayIndex * columnWidth;
      const scrollPosition = Math.max(0, todayPosition - containerWidth / 3);

      // Use handleTimelineScroll to properly sync state
      handleTimelineScroll(scrollPosition);
    }
  }, [viewMode, timelineColumns, columnWidth, handleTimelineScroll]);

  useEffect(() => {
    if (!isPanningTimeline) return;

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = panStartX - e.clientX; // Reversed for natural panning
      const newScrollLeft = panStartScrollLeft + deltaX;
      handleTimelineScroll(Math.max(0, newScrollLeft));
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

  // Handle row click
  const handleRowClick = (row: GanttRow) => {
    setSelectedRowId(row.id);
    const project = projects.find((p) => p.id === row.id);
    if (project && onProjectClick) {
      onProjectClick(project);
    }
  };

  // Handle timeline overlay resize drag
  const handleTimelineDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTimeline(true);
  }, []);

  // Handle timeline overlay resize
  useEffect(() => {
    if (!isDraggingTimeline) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;

      // Calculate new timeline width as percentage from right edge
      const pixelWidth = containerRect.right - e.clientX;
      const newPercent = (pixelWidth / containerWidth) * 100;

      // Apply percentage-based constraints (min 32%, max 85%)
      const clampedPercent = Math.max(
        TIMELINE_MIN_PERCENT,
        Math.min(TIMELINE_MAX_PERCENT, newPercent)
      );

      setTimelineWidthPercent(clampedPercent);
    };

    const handleMouseUp = () => {
      setIsDraggingTimeline(false);
      // Don't save to localStorage - always reset to min on next load
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingTimeline, timelineWidthPercent]);

  // Handle bar drag
  const handleBarMouseDown = (e: React.MouseEvent, row: GanttRow) => {
    if (!row.startDate) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggedItem({ id: row.id, startX: e.clientX, startDate: row.startDate });
  };

  useEffect(() => {
    if (!draggedItem) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Visual feedback could be added here
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!draggedItem || !onProjectUpdate) {
        setDraggedItem(null);
        return;
      }

      const deltaX = e.clientX - draggedItem.startX;
      const row = rows.find((r) => r.id === draggedItem.id);

      if (row && row.startDate && row.endDate) {
        if (viewMode === 'month') {
          // Month view: drag by months
          const monthsDelta = Math.round(deltaX / columnWidth);
          if (monthsDelta !== 0) {
            const newStartDate = new Date(row.startDate);
            newStartDate.setMonth(newStartDate.getMonth() + monthsDelta);
            const newEndDate = new Date(row.endDate);
            newEndDate.setMonth(newEndDate.getMonth() + monthsDelta);

            onProjectUpdate(draggedItem.id, {
              start_date: newStartDate.toISOString().split('T')[0],
              end_date: newEndDate.toISOString().split('T')[0],
            });
          }
        } else {
          // Day/Week view: drag by days
          const daysDelta = Math.round(deltaX / columnWidth);
          if (daysDelta !== 0) {
            const newStartDate = new Date(row.startDate);
            newStartDate.setDate(newStartDate.getDate() + daysDelta);
            const newEndDate = new Date(row.endDate);
            newEndDate.setDate(newEndDate.getDate() + daysDelta);

            onProjectUpdate(draggedItem.id, {
              start_date: newStartDate.toISOString().split('T')[0],
              end_date: newEndDate.toISOString().split('T')[0],
            });
          }
        }
      }

      setDraggedItem(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedItem, rows, onProjectUpdate]);

  // Windows/Ant Design neutral color palette
  const colors = {
    bg: '#FAFAFA',           // Neutral light gray background
    surface: '#FFFFFF',       // Pure white surface
    border: '#F0F0F0',        // Very light gray borders (subtle)
    borderMedium: '#D9D9D9',  // Medium gray (month boundaries)
    borderStrong: '#BFBFBF',  // Stronger gray (year boundaries)
    text: '#262626',          // Standard UI text (not pure black)
    textMuted: '#8C8C8C',     // Muted secondary text
    hover: '#FAFAFA',         // Subtle hover (barely visible)
    selected: '#E6F7FF',      // AntD info-1 (very light blue)
    selectedBorder: '#91D5FF', // AntD info-3 (light blue indicator)
  };

  // AntD semantic status colors (soft, tinted fills)
  const statusColors = {
    // Done = success (green) - 10-20% intensity
    done: {
      bg: '#F6FFED',      // AntD success-1 (very light green)
      border: '#95DE64',  // AntD success-4 (medium green border)
      fill: '#B7EB8F',    // AntD success-3 (soft green fill)
      text: '#135200'     // Dark green text
    },
    // In Progress = info (blue) - 10-20% intensity
    in_progress: {
      bg: '#E6F7FF',      // AntD info-1 (very light blue)
      border: '#69C0FF',  // AntD info-4 (medium blue border)
      fill: '#91D5FF',    // AntD info-3 (soft blue fill)
      text: '#003A8C'     // Dark blue text
    },
    // Blocked = error (red) - very light red fill
    blocked: {
      bg: '#FFF1F0',      // AntD error-1 (very light red)
      border: '#FF7875',  // AntD error-4 (medium red border)
      fill: '#FFA39E',    // AntD error-3 (soft red fill)
      text: '#820014'     // Dark red text
    },
    // Not Started = neutral gray
    not_started: {
      bg: '#FAFAFA',      // Neutral light gray
      border: '#D9D9D9',  // Medium gray border
      fill: '#F5F5F5',    // Light gray fill
      text: '#595959'     // Dark gray text
    },
  };

  const getStatusStyle = (status: string) => {
    const normalized = status.toLowerCase();
    return statusColors[normalized as keyof typeof statusColors] || statusColors.not_started;
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bg }}>
      {/* Top Area: Enhanced Header with Title, Subtitle, and Controls */}
      <div
        className="border-b"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border
        }}
      >
        {/* Header: Title + Subtitle */}
        <div className="px-6 pt-5 pb-3">
          <h1 className="text-xl font-semibold mb-1" style={{ color: colors.text }}>
            Project Gantt Chart
          </h1>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Excel-style Gantt: frozen task table + synchronized timeline for fast planning.
          </p>
        </div>

        {/* Toolbar: Controls */}
        <div className="px-6 pb-4 flex items-center justify-between">
          {/* Left: Project Count */}
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1.5 rounded-md text-sm font-medium"
              style={{
                backgroundColor: colors.hover,
                color: colors.text
              }}
            >
              {rows.length} {rows.length === 1 ? 'project' : 'projects'}
            </span>
          </div>

          {/* Right: Controls with improved spacing */}
          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium" style={{ color: colors.textMuted }}>
                Status:
              </label>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
                placeholder="All Statuses"
                options={[
                  { label: 'All Statuses', value: 'all' },
                  { label: 'In Progress', value: 'in_progress' },
                  { label: 'Not Started', value: 'not_started' },
                  { label: 'Blocked', value: 'blocked' },
                  { label: 'Done', value: 'done' },
                ]}
              />
            </div>

            {/* Search Field */}
            <Input
              placeholder="Search projects…"
              prefix={<FilterOutlined style={{ color: colors.textMuted }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ width: 240 }}
            />

            {/* Zoom Controls (Year / Month / Day) */}
            <div className="flex items-center gap-1">
              <Select
                value={viewMode}
                onChange={(value) => {
                  setViewMode(value);
                  // Don't save to localStorage - always reset to prop on next load
                }}
                size="small"
                style={{ width: 100 }}
                options={[
                  { label: 'Year', value: 'year' },
                  { label: 'Month', value: 'month' },
                  { label: 'Day', value: 'day' },
                ]}
              />
              <Tooltip title="Zoom In">
                <Button
                  icon={<ZoomInOutlined />}
                  size="small"
                  onClick={() => {
                    if (viewMode === 'year') setViewMode('month');
                    else if (viewMode === 'month') setViewMode('day');
                  }}
                  disabled={viewMode === 'day'}
                />
              </Tooltip>
              <Tooltip title="Zoom Out">
                <Button
                  icon={<ZoomOutOutlined />}
                  size="small"
                  onClick={() => {
                    if (viewMode === 'day') setViewMode('month');
                    else if (viewMode === 'month') setViewMode('year');
                  }}
                  disabled={viewMode === 'year'}
                />
              </Tooltip>
              <Tooltip title="Reset to Month">
                <Button
                  icon={<FullscreenOutlined />}
                  size="small"
                  onClick={() => {
                    setViewMode('month');
                  }}
                />
              </Tooltip>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              <Tooltip title="Jump to Today">
                <Button
                  icon={<CalendarOutlined />}
                  size="small"
                  onClick={handleJumpToToday}
                >
                  Today
                </Button>
              </Tooltip>
            </div>

            {/* Export Button */}
            <Button
              icon={<DownloadOutlined />}
              onClick={onExport}
              size="small"
            >
              Export
            </Button>

            {/* Debug Alignment Toggle (temporary) */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                type={debugAlignment ? 'primary' : 'default'}
                onClick={() => setDebugAlignment(!debugAlignment)}
                size="small"
                style={{ opacity: 0.6 }}
              >
                Debug
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Layered (Table Base + Safe Zone + Timeline Overlay) */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative">
        {/* BASE LAYER: Table with Reserved Safe Zone (right 32%) */}
        <div
          className="absolute inset-0 flex flex-col"
          style={{
            backgroundColor: colors.surface,
            marginRight: `${SAFE_ZONE_PERCENT}%` // Reserved safe zone (table never renders here)
          }}
        >
          {/* Table Header (sticky) */}
          <div
            className="flex-shrink-0 flex items-center text-xs font-medium"
            style={{
              height: HEADER_HEIGHT,
              backgroundColor: colors.hover,
              borderBottom: `1px solid ${colors.border}`,
              color: colors.text
            }}
          >
            <div
              className="px-4 truncate"
              style={{
                width: '45%',
                borderRight: `1px solid ${colors.border}`
              }}
            >
              Task Name
            </div>
            <div
              className="px-3 text-center"
              style={{
                width: '18%',
                borderRight: `1px solid ${colors.border}`
              }}
            >
              Start Date
            </div>
            <div
              className="px-3 text-center"
              style={{
                width: '18%',
                borderRight: `1px solid ${colors.border}`
              }}
            >
              End Date
            </div>
            <div
              className="px-3 text-center"
              style={{
                width: '11%',
                borderRight: `1px solid ${colors.border}`
              }}
            >
              Days
            </div>
            <div
              className="px-3 text-center"
              style={{ width: '8%' }}
            >
              Status
            </div>
          </div>

          {/* Table Body (scrollable vertically with virtualization) */}
          <div
            ref={leftScrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden relative"
            onScroll={handleLeftScroll}
          >
            {/* Spacer to maintain scroll height */}
            <div style={{ height: totalContentHeight, width: '100%', position: 'relative' }}>
              {loading ? (
                <div className="flex items-center justify-center" style={{ height: 200, color: colors.textMuted }}>
                  <div>Loading...</div>
                </div>
              ) : rows.length === 0 ? (
                <div className="flex items-center justify-center" style={{ height: 200, color: colors.textMuted }}>
                  <div>No projects found</div>
                </div>
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
                        top: rowTop,
                        left: 0,
                        right: 0,
                        height: ROW_HEIGHT,
                        backgroundColor: isSelected ? colors.selected : 'transparent',
                        borderBottom: `1px solid ${colors.border}`,
                        color: colors.text
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = colors.hover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                      onClick={() => handleRowClick(row)}
                    >
                    {/* Left selection indicator */}
                    {isSelected && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{ backgroundColor: colors.selectedBorder }}
                      />
                    )}

                    {/* Task Name */}
                    <div
                      className="px-4 truncate font-medium"
                      style={{
                        width: '45%',
                        borderRight: `1px solid ${colors.border}`,
                        paddingLeft: isSelected ? '20px' : '16px'
                      }}
                      title={row.name}
                    >
                      {row.name}
                    </div>

                    {/* Start Date */}
                    <div
                      className="px-3 text-center"
                      style={{
                        width: '18%',
                        borderRight: `1px solid ${colors.border}`,
                        color: row.startDate ? colors.text : colors.textMuted
                      }}
                    >
                      {row.startDate
                        ? row.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                        : '—'}
                    </div>

                    {/* End Date */}
                    <div
                      className="px-3 text-center"
                      style={{
                        width: '18%',
                        borderRight: `1px solid ${colors.border}`,
                        color: row.endDate ? colors.text : colors.textMuted
                      }}
                    >
                      {row.endDate
                        ? row.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                        : '—'}
                    </div>

                    {/* Days */}
                    <div
                      className="px-3 text-center tabular-nums"
                      style={{
                        width: '11%',
                        borderRight: `1px solid ${colors.border}`,
                        color: row.duration > 0 ? colors.text : colors.textMuted
                      }}
                    >
                      {row.duration > 0 ? `${row.duration}d` : '—'}
                    </div>

                    {/* Status (colored dot) */}
                    <div className="px-3 flex justify-center" style={{ width: '8%' }}>
                      <Tooltip title={row.status.replace(/_/g, ' ').toUpperCase()}>
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: statusStyle.fill,
                            border: `1px solid ${statusStyle.border}`
                          }}
                        />
                      </Tooltip>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>

        {/* OVERLAY LAYER: Timeline Drawer (sits on top of safe zone, min 32%) */}
        <div
          className="absolute top-0 bottom-0 flex flex-col overflow-hidden"
          style={{
            right: 0,
            width: `${timelineWidthPercent}%`,
            backgroundColor: colors.surface,
            borderLeft: `2px solid ${colors.borderStrong}`,
            boxShadow: '-6px 0 16px rgba(0,0,0,0.12)',
            zIndex: 50,
            transition: isDraggingTimeline ? 'none' : 'width 0.2s ease-out'
          }}
        >
          {/* Drag Splitter (left edge of timeline overlay) */}
          <div
            className="absolute top-0 bottom-0 left-0 flex items-center justify-center cursor-col-resize hover:bg-blue-500 transition-colors z-[100]"
            style={{
              width: '12px',
              backgroundColor: isDraggingTimeline ? '#3B82F6' : colors.borderStrong,
              marginLeft: '-2px'
            }}
            onMouseDown={handleTimelineDragStart}
          >
            <div
              className="w-1 h-16 rounded-full bg-white opacity-80"
              style={{ pointerEvents: 'none' }}
            />
          </div>

          {/* Timeline Header (sticky, no scrollbar, follows body scroll) */}
          <div
            ref={timelineHeaderRef}
            className="flex-shrink-0 overflow-x-hidden overflow-y-hidden sticky top-0 z-20"
            style={{
              height: HEADER_HEIGHT,
              borderBottom: `1px solid ${colors.border}`,
              cursor: isPanningTimeline ? 'grabbing' : 'grab',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
            onWheel={handleTimelineWheel}
            onMouseDown={handleTimelinePanStart}
          >
            {/* Header content wrapper - matches body width exactly */}
            <div
              style={{
                width: timelineWidth,
                minWidth: '100%',
                boxSizing: 'border-box',
                margin: 0,
                padding: 0
              }}
            >
              {viewMode === 'year' ? (
                /* YEAR VIEW: Year band + Quarter band (2 rows) */
                <div className="flex flex-col" style={{ width: timelineWidth, boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}>
                  {/* Top: Year band */}
                  <div className="flex" style={{ height: 30, backgroundColor: '#F7F7F7', borderBottom: `1px solid #DDD` }}>
                    {yearHeaders.map((header, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-center text-sm font-bold"
                        style={{
                          width: header.colspan * columnWidth,
                          minWidth: header.colspan * columnWidth,
                          maxWidth: header.colspan * columnWidth,
                          flexShrink: 0,
                          borderRight: `3px solid #999`,
                          color: '#222',
                          boxSizing: 'border-box'
                        }}
                      >
                        {header.year}
                      </div>
                    ))}
                  </div>

                  {/* Bottom: Quarter labels (Q1, Q2, Q3, Q4) */}
                  <div className="flex" style={{ height: 30, backgroundColor: '#FFFFFF', borderBottom: `1px solid #DDD` }}>
                    {timelineColumns.map((col: any, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-center text-xs font-medium"
                        style={{
                          width: columnWidth,
                          minWidth: columnWidth,
                          maxWidth: columnWidth,
                          flexShrink: 0,
                          borderRight: `1px solid #DDD`,
                          color: '#555',
                          boxSizing: 'border-box'
                        }}
                      >
                        {col.label}
                      </div>
                    ))}
                  </div>
                </div>
              ) : viewMode === 'month' ? (
                /* MONTH VIEW: Year band + Month labels (2 rows, NO quarters) */
                <div className="flex flex-col" style={{ width: timelineWidth, boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}>
                  {/* Top: Year band */}
                  <div className="flex" style={{ height: 30, backgroundColor: '#F7F7F7', borderBottom: `1px solid #DDD` }}>
                    {yearHeaders.map((header, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-center text-sm font-bold"
                        style={{
                          width: header.colspan * columnWidth,
                          minWidth: header.colspan * columnWidth,
                          maxWidth: header.colspan * columnWidth,
                          flexShrink: 0,
                          borderRight: `3px solid #999`,
                          color: '#222',
                          boxSizing: 'border-box'
                        }}
                      >
                        {header.year}
                      </div>
                    ))}
                  </div>

                  {/* Bottom: Month labels (Jan, Feb, Mar...) */}
                  <div className="flex" style={{ height: 30, backgroundColor: '#FFFFFF', borderBottom: `1px solid #DDD` }}>
                    {timelineColumns.map((col: any, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-center text-xs font-medium"
                        style={{
                          width: columnWidth,
                          minWidth: columnWidth,
                          maxWidth: columnWidth,
                          flexShrink: 0,
                          borderRight: `1px solid #DDD`,
                          color: '#555',
                          boxSizing: 'border-box'
                        }}
                      >
                        {col.label}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* DAY VIEW: Year band + Month band + Day numbers (3 rows) */
                <div className="flex flex-col" style={{ width: timelineWidth, boxSizing: 'border-box', backgroundColor: '#FFFFFF' }}>
                  {/* Top: Year band */}
                  <div className="flex" style={{ height: 24, backgroundColor: '#F7F7F7', borderBottom: `1px solid #DDD` }}>
                    {yearHeaders.map((header, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-center text-xs font-bold"
                        style={{
                          width: header.colspan * columnWidth,
                          minWidth: header.colspan * columnWidth,
                          maxWidth: header.colspan * columnWidth,
                          flexShrink: 0,
                          borderRight: `3px solid #999`,
                          color: '#222',
                          boxSizing: 'border-box'
                        }}
                      >
                        {header.year}
                      </div>
                    ))}
                  </div>

                  {/* Middle: Month band */}
                  <div className="flex" style={{ height: 24, backgroundColor: '#FAFAFA', borderBottom: `1px solid #DDD` }}>
                    {monthHeaders.map((header, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-center text-xs font-semibold"
                        style={{
                          width: header.colspan * columnWidth,
                          minWidth: header.colspan * columnWidth,
                          maxWidth: header.colspan * columnWidth,
                          flexShrink: 0,
                          borderRight: `2px solid #BBB`,
                          color: '#333',
                          boxSizing: 'border-box'
                        }}
                      >
                        {header.label}
                      </div>
                    ))}
                  </div>

                  {/* Bottom: Day numbers (1-31) */}
                  <div className="flex" style={{ height: 24, backgroundColor: '#FFFFFF' }}>
                    {timelineColumns.map((col: any, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-center text-[10px]"
                        style={{
                          width: columnWidth,
                          minWidth: columnWidth,
                          maxWidth: columnWidth,
                          flexShrink: 0,
                          borderRight: `1px solid #E5E5E5`,
                          color: '#666',
                          boxSizing: 'border-box',
                          backgroundColor: col.isWeekend ? '#F9F9F9' : 'transparent'
                        }}
                      >
                        {col.dayOfMonth}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Body (scrollable, synced with header) */}
          <div
            ref={(el) => {
              rightScrollRef.current = el;
              timelineBodyRef.current = el;
            }}
            className="flex-1 overflow-auto relative"
            style={{
              cursor: isPanningTimeline ? 'grabbing' : 'grab',
              minWidth: 0
            }}
            onScroll={(e) => {
              handleRightScroll();
              handleTimelineScroll(e.currentTarget.scrollLeft);
            }}
            onWheel={handleTimelineWheel}
            onMouseDown={handleTimelinePanStart}
          >
            {/* Body content wrapper - matches header width exactly */}
            <div
              className="relative"
              style={{
                width: timelineWidth,
                minWidth: '100%',
                height: totalContentHeight,
                boxSizing: 'border-box',
                margin: 0,
                padding: 0
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center" style={{ height: 200, color: colors.textMuted }}>
                  <div>Loading...</div>
                </div>
              ) : rows.length === 0 ? (
                <div className="flex items-center justify-center" style={{ height: 200, color: colors.textMuted }}>
                  <div>No projects found</div>
                </div>
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
                        style={{
                          top: rowTop,
                          left: 0,
                          right: 0,
                          height: ROW_HEIGHT,
                          backgroundColor: isSelected ? colors.selected : 'transparent',
                          borderBottom: `1px solid ${colors.border}`,
                          boxSizing: 'border-box'
                        }}
                      >
                        {/* Grid columns - EXACT match with header cells */}
                        {viewMode === 'month' || viewMode === 'year' ? (
                          /* MONTH/YEAR VIEW: Render cells matching header exactly */
                          <div className="flex absolute inset-0">
                            {timelineColumns.map((col: any, colIdx) => {
                              // Check if this is a year boundary (stronger line)
                              const isYearBoundary = colIdx > 0 &&
                                (viewMode === 'year' ? col.year !== timelineColumns[colIdx - 1]?.year :
                                 col.date.getMonth() === 0);

                              return (
                                <div
                                  key={colIdx}
                                  className="relative"
                                  style={{
                                    width: columnWidth,
                                    minWidth: columnWidth,
                                    maxWidth: columnWidth,
                                    flexShrink: 0,
                                    height: '100%',
                                    borderRight: `1px solid ${isYearBoundary ? colors.borderStrong : colors.borderMedium}`,
                                    boxSizing: 'border-box',
                                    margin: 0,
                                    padding: 0
                                  }}
                                >
                                  {/* Debug guide */}
                                  {debugAlignment && (
                                    <div style={{
                                      position: 'absolute',
                                      left: 0,
                                      top: 0,
                                      bottom: 0,
                                      width: 1,
                                      backgroundColor: 'red',
                                      zIndex: 100,
                                      opacity: 0.5
                                    }} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* DAY VIEW: VIRTUALIZED CSS grid + overlays (high performance) */
                          <>
                            {/* Base grid lines - CSS gradient (subtle) */}
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                backgroundImage: `repeating-linear-gradient(to right, ${colors.border} 0, ${colors.border} 1px, transparent 1px, transparent ${columnWidth}px)`,
                                backgroundSize: `${columnWidth}px 100%`,
                                backgroundPosition: '0 0',
                                opacity: 0.5
                              }}
                            />

                            {/* Weekend shading - only render visible weekend columns (VIRTUALIZED) */}
                            {visibleColumns.map((col: any) => {
                              if (!col.isWeekend) return null;
                              const colIdx = col.originalIndex;
                              return (
                                <div
                                  key={`weekend-${colIdx}`}
                                  className="absolute pointer-events-none"
                                  style={{
                                    left: colIdx * columnWidth,
                                    width: columnWidth,
                                    top: 0,
                                    height: '100%',
                                    backgroundColor: colors.hover,
                                    zIndex: 0
                                  }}
                                />
                              );
                            })}

                            {/* Month boundaries - only render visible month starts (VIRTUALIZED) */}
                            {visibleColumns.map((col: any) => {
                              const colIdx = col.originalIndex;
                              const isMonthBoundary = col.date.getDate() === 1;
                              if (!isMonthBoundary || colIdx === 0) return null;

                              return (
                                <div
                                  key={`month-${colIdx}`}
                                  className="absolute pointer-events-none"
                                  style={{
                                    left: colIdx * columnWidth,
                                    width: 2,
                                    top: 0,
                                    height: '100%',
                                    backgroundColor: colors.borderStrong,
                                    zIndex: 2
                                  }}
                                />
                              );
                            })}

                            {/* Debug guides - only render visible columns when debugging (VIRTUALIZED) */}
                            {debugAlignment && visibleColumns.map((col: any) => {
                              const colIdx = col.originalIndex;
                              return (
                                <div
                                  key={`debug-${colIdx}`}
                                  className="absolute pointer-events-none"
                                  style={{
                                    left: colIdx * columnWidth,
                                    width: 1,
                                    top: 0,
                                    height: '100%',
                                    backgroundColor: 'red',
                                    zIndex: 100,
                                    opacity: 0.5
                                  }}
                                />
                              );
                            })}
                          </>
                        )}

                        {/* Gantt Bar (AntD style: soft fill + border + dark text) */}
                        {barPos && (
                          <Tooltip
                            title={
                              <div className="text-xs">
                                <div className="font-semibold mb-1">{row.name}</div>
                                <div>
                                  {row.startDate?.toLocaleDateString()} → {row.endDate?.toLocaleDateString()}
                                </div>
                                <div>{row.duration} days • {row.status.replace(/_/g, ' ')}</div>
                              </div>
                            }
                          >
                            <div
                              className="gantt-bar absolute cursor-move z-10 flex items-center px-2"
                              style={{
                                left: barPos.left,
                                width: barPos.width,
                                height: ROW_HEIGHT - 16,
                                top: 8,
                                backgroundColor: statusStyle.fill,
                                border: `1px solid ${statusStyle.border}`,
                                borderRadius: '2px',
                                opacity: draggedItem?.id === row.id ? 0.7 : 1,
                                boxShadow: 'none', // No shadows (Windows-like)
                                transition: 'opacity 0.2s',
                                overflow: 'hidden'
                              }}
                              onMouseDown={(e) => handleBarMouseDown(e, row)}
                              onMouseEnter={(e) => {
                                if (draggedItem?.id !== row.id) {
                                  e.currentTarget.style.opacity = '0.85';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (draggedItem?.id !== row.id) {
                                  e.currentTarget.style.opacity = '1';
                                }
                              }}
                            >
                              {/* Label INSIDE bar (dark text on light fill) */}
                              {barPos.width > 60 && (
                                <span
                                  className="text-xs font-medium truncate"
                                  style={{
                                    color: statusStyle.text,
                                    fontWeight: 500
                                  }}
                                >
                                  {row.name}
                                </span>
                              )}
                            </div>
                          </Tooltip>
                        )}
                      </div>
                    );
                  })}

                  {/* Today Line (red dotted - OpenProject style) */}
                  {(() => {
                    const today = new Date();
                    let todayPosition = 0;

                    if (viewMode === 'month') {
                      // Find which month column contains today
                      const todayMonth = today.getMonth();
                      const todayYear = today.getFullYear();
                      const monthIndex = timelineColumns.findIndex(
                        (col: any) => col.date.getMonth() === todayMonth && col.date.getFullYear() === todayYear
                      );
                      if (monthIndex >= 0) {
                        // Position within the month (proportional)
                        const dayOfMonth = today.getDate();
                        const daysInMonth = new Date(todayYear, todayMonth + 1, 0).getDate();
                        todayPosition = (monthIndex + dayOfMonth / daysInMonth) * columnWidth;
                      } else {
                        return null;
                      }
                    } else {
                      // Week view: find exact day
                      const todayIndex = timelineColumns.findIndex(
                        (col: any) => col.date.toDateString() === today.toDateString()
                      );
                      if (todayIndex >= 0) {
                        todayPosition = todayIndex * columnWidth;
                      } else {
                        return null;
                      }
                    }

                    return (
                      <div
                        className="absolute top-0 bottom-0 pointer-events-none z-20"
                        style={{
                          left: todayPosition,
                          width: 1,
                          borderLeft: '1px dashed #FA8C16', // AntD warning-5 (muted orange)
                          opacity: 0.6
                        }}
                      />
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Legend + Hints */}
      <div
        className="px-6 py-2.5 border-t flex items-center justify-between"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border
        }}
      >
        {/* Left: Legend */}
        <div className="flex items-center gap-5 text-xs">
          <span style={{ color: colors.textMuted, fontWeight: 500 }}>Legend:</span>

          {Object.entries({
            'Done': 'done',
            'In Progress': 'in_progress',
            'Blocked': 'blocked',
            'Not Started': 'not_started'
          }).map(([label, status]) => {
            const style = getStatusStyle(status);
            return (
              <div key={status} className="flex items-center gap-2">
                <div
                  className="w-4 h-2.5 rounded"
                  style={{
                    backgroundColor: style.bg,
                    border: `1px solid ${style.border}`
                  }}
                />
                <span style={{ color: colors.text }}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* Right: Interaction Hints */}
        <span className="text-xs" style={{ color: colors.textMuted }}>
          Drag bars to reschedule • Click row to select
        </span>
      </div>
    </div>
  );
}
