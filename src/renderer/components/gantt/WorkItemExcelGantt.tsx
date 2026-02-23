/**
 * WorkItemExcelGantt – Excel-style overlay Gantt for work items within a project.
 *
 * Design language matches ExcelGanttChart:
 * - Title + subtitle header above toolbar
 * - BASE LAYER: frozen table with safe-zone (marginRight: SAFE_ZONE_PERCENT%)
 * - OVERLAY LAYER: timeline drawer (position: absolute, right: 0) with drag splitter + shadow
 * - Same AntD neutral color palette (colors object)
 * - ROW_HEIGHT = 40, dynamic HEADER_HEIGHT (60 or 72)
 * - Same scroll sync pattern (leftScrollRef / rightScrollRef / timelineHeaderRef / timelineBodyRef / rafRef)
 */

import React, {
  useState, useMemo, useRef, useCallback, useEffect,
} from 'react';
import { Tag, Select, Button, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  DownloadOutlined,
  CaretRightOutlined,
  CaretDownOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import type { Project, WorkItem } from '@/shared/types';

// ─── constants ────────────────────────────────────────────────────────────────

const ROW_HEIGHT = 40;

// Overlay constraints (match ExcelGanttChart)
const SAFE_ZONE_PERCENT    = 32;
const TIMELINE_MIN_PERCENT = 32;
const TIMELINE_MAX_PERCENT = 85;

const BUFFER_ROWS = 4;
const BUFFER_COLS = 6;

// BASE LAYER table column widths (% of BASE LAYER width, must sum to 100)
const COL = {
  name:     '35%',
  owner:    '13%',
  priority: '9%',
  status:   '15%',
  start:    '14%',
  end:      '14%',
} as const;

// ─── type helpers ─────────────────────────────────────────────────────────────

type ViewScale = 'day' | 'week' | 'month';
type WorkItemType = WorkItem['type'];
type WorkItemStatus = WorkItem['status'];

interface FlatRow extends WorkItem {
  depth: number;
  collapsed?: boolean;
}

// ─── color palette (matches ExcelGanttChart exactly) ─────────────────────────

const colors = {
  bg:             '#FAFAFA',
  surface:        '#FFFFFF',
  border:         '#F0F0F0',
  borderMedium:   '#D9D9D9',
  borderStrong:   '#BFBFBF',
  text:           '#262626',
  textMuted:      '#8C8C8C',
  hover:          '#FAFAFA',
  selected:       '#E6F7FF',
  selectedBorder: '#91D5FF',
};

// ─── visual config ────────────────────────────────────────────────────────────

const TYPE_ICON: Record<WorkItemType, string> = {
  task:      '',
  phase:     '▼',
  milestone: '◆',
  issue:     '⚠',
  clash:     '⛔',
  remark:    '💬',
};

const TYPE_COLOR: Record<WorkItemType, string> = {
  task:      '#1677ff',
  phase:     '#8c8c8c',
  milestone: '#722ed1',
  issue:     '#fa8c16',
  clash:     '#f5222d',
  remark:    '#fadb14',
};

function barStyle(
  type: WorkItemType,
  status: WorkItemStatus,
  isChild: boolean,
): React.CSSProperties {
  const base   = TYPE_COLOR[type];
  const height = isChild ? 10 : 14;
  const top    = isChild ? (ROW_HEIGHT - 10) / 2 : (ROW_HEIGHT - 14) / 2;

  if (status === 'done') {
    return { background: '#52c41a', height, top, opacity: 0.9 };
  }
  if (status === 'blocked') {
    return {
      background: `repeating-linear-gradient(45deg, ${base}, ${base} 4px, #fff0 4px, #fff0 8px)`,
      backgroundColor: '#ffa39e',
      height, top, opacity: 0.95,
    };
  }
  if (status === 'not_started') {
    return { background: 'transparent', border: `2px solid ${base}`, height, top, opacity: 0.7 };
  }
  return { background: base, height, top };
}

const STATUS_LABEL: Record<WorkItemStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  done:        'Done',
  blocked:     'Blocked',
};

const STATUS_COLOR: Record<WorkItemStatus, string> = {
  not_started: 'default',
  in_progress: 'processing',
  done:        'success',
  blocked:     'error',
};

const PRIORITY_COLOR: Record<string, string> = {
  low: 'default', medium: 'blue', high: 'orange', critical: 'red',
};

// ─── component ────────────────────────────────────────────────────────────────

export interface WorkItemExcelGanttProps {
  project: Project;
  workItems: WorkItem[];
  loading?: boolean;
  onBack: () => void;
  onWorkItemUpdate?: (id: number, updates: Partial<WorkItem>) => void;
}

export function WorkItemExcelGantt({
  project,
  workItems,
  loading = false,
  onBack,
  onWorkItemUpdate,
}: WorkItemExcelGanttProps) {

  // ── view / filter state ──────────────────────────────────────────────────
  const [scale, setScale]             = useState<ViewScale>('month');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType]   = useState('all');
  const [collapsed, setCollapsed]     = useState<Set<number>>(new Set());

  // ── overlay / pan state ──────────────────────────────────────────────────
  const [timelineWidthPercent, setTimelineWidthPercent] = useState(TIMELINE_MIN_PERCENT);
  const [isDraggingTimeline, setIsDraggingTimeline]     = useState(false);
  const [isPanningTimeline, setIsPanningTimeline]       = useState(false);
  const [panStartX, setPanStartX]                       = useState(0);
  const [panStartScrollLeft, setPanStartScrollLeft]     = useState(0);
  const [timelineScrollLeft, setTimelineScrollLeft]     = useState(0);

  // ── virtualisation state ─────────────────────────────────────────────────
  const [visRows, setVisRows] = useState({ start: 0, end: 30 });
  const [visCols, setVisCols] = useState({ start: 0, end: 60 });

  // ── refs ─────────────────────────────────────────────────────────────────
  const containerRef      = useRef<HTMLDivElement>(null);
  const leftScrollRef     = useRef<HTMLDivElement>(null);
  const rightScrollRef    = useRef<HTMLDivElement | null>(null);
  const timelineHeaderRef = useRef<HTMLDivElement>(null);
  const timelineBodyRef   = useRef<HTMLDivElement | null>(null);
  const rafRef            = useRef<number | null>(null);

  // ── inline date edit ─────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd]     = useState('');

  // ── dynamic header height ─────────────────────────────────────────────────
  const HEADER_HEIGHT = useMemo(() => (scale === 'day' ? 72 : 60), [scale]);

  // ─── flatten hierarchy ────────────────────────────────────────────────────
  const flatRows = useMemo((): FlatRow[] => {
    const roots = workItems.filter(w =>
      w.parent_id === null &&
      (filterStatus === 'all' || w.status === filterStatus) &&
      (filterType   === 'all' || w.type   === filterType),
    );
    const childMap = new Map<number, WorkItem[]>();
    workItems.forEach(w => {
      if (w.parent_id !== null) {
        const arr = childMap.get(w.parent_id) || [];
        arr.push(w);
        childMap.set(w.parent_id, arr);
      }
    });

    const rows: FlatRow[] = [];
    roots.forEach(root => {
      const isCollapsed = collapsed.has(root.id);
      const children = childMap.get(root.id) || [];
      const filteredChildren = children.filter(c =>
        (filterStatus === 'all' || c.status === filterStatus) &&
        (filterType   === 'all' || c.type   === filterType),
      );
      rows.push({ ...root, depth: 0, collapsed: isCollapsed && filteredChildren.length > 0 });
      if (!isCollapsed) {
        filteredChildren.forEach(child => rows.push({ ...child, depth: 1 }));
      }
    });
    return rows;
  }, [workItems, filterStatus, filterType, collapsed]);

  // ─── date range ───────────────────────────────────────────────────────────
  const { minDate, maxDate } = useMemo(() => {
    const allDates = flatRows.flatMap(r => [
      r.start_date ? new Date(r.start_date) : null,
      r.end_date   ? new Date(r.end_date)   : null,
    ]).filter(Boolean) as Date[];

    if (project.start_date) allDates.push(new Date(project.start_date));
    if (project.end_date)   allDates.push(new Date(project.end_date));

    let min: Date | null = null;
    let max: Date | null = null;
    allDates.forEach(d => {
      if (!min || d < min) min = d;
      if (!max || d > max) max = d;
    });

    const fallback = new Date();
    if (!min) min = new Date(fallback.getFullYear(), fallback.getMonth(), 1);
    if (!max) max = new Date(fallback.getFullYear(), fallback.getMonth() + 3, 0);

    const pMin = new Date(min); pMin.setDate(pMin.getDate() - 7);
    const pMax = new Date(max); pMax.setDate(pMax.getDate() + 14);
    return { minDate: pMin, maxDate: pMax };
  }, [flatRows, project]);

  // ─── timeline columns ─────────────────────────────────────────────────────
  const { columns, colWidth } = useMemo(() => {
    type Col = { date: Date; label: string; isWeekend?: boolean };
    const cols: Col[] = [];
    const cur = new Date(minDate);

    if (scale === 'day') {
      while (cur <= maxDate) {
        const dow = cur.getDay();
        cols.push({ date: new Date(cur), label: String(cur.getDate()), isWeekend: dow === 0 || dow === 6 });
        cur.setDate(cur.getDate() + 1);
      }
      return { columns: cols, colWidth: 32 };
    }

    if (scale === 'week') {
      const start = new Date(cur);
      const day = start.getDay();
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
      while (start <= maxDate) {
        cols.push({ date: new Date(start), label: `W${getISOWeek(start)}` });
        start.setDate(start.getDate() + 7);
      }
      return { columns: cols, colWidth: 60 };
    }

    // month
    while (cur <= maxDate) {
      cols.push({
        date: new Date(cur.getFullYear(), cur.getMonth(), 1),
        label: cur.toLocaleDateString('en-US', { month: 'short' }),
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return { columns: cols, colWidth: 70 };
  }, [minDate, maxDate, scale]);

  const timelineWidth = columns.length * colWidth;

  // ─── year bands ───────────────────────────────────────────────────────────
  const yearBands = useMemo(() => {
    const bands: { year: number; start: number; span: number }[] = [];
    let cur = -1; let start = 0; let span = 0;
    columns.forEach((col, i) => {
      const y = col.date.getFullYear();
      if (y !== cur) {
        if (span) bands.push({ year: cur, start, span });
        cur = y; start = i; span = 1;
      } else {
        span++;
      }
    });
    if (span) bands.push({ year: cur, start, span });
    return bands;
  }, [columns]);

  // ─── month bands (day view only) ──────────────────────────────────────────
  const monthBands = useMemo(() => {
    if (scale !== 'day') return [];
    const bands: { label: string; start: number; span: number }[] = [];
    let curM = -1; let curY = -1; let start = 0; let span = 0;
    columns.forEach((col, i) => {
      const m = col.date.getMonth(); const y = col.date.getFullYear();
      if (m !== curM || y !== curY) {
        if (span) {
          bands.push({
            label: new Date(curY, curM).toLocaleDateString('en-US', { month: 'short' }),
            start, span,
          });
        }
        curM = m; curY = y; start = i; span = 1;
      } else {
        span++;
      }
    });
    if (span) {
      bands.push({
        label: new Date(curY, curM).toLocaleDateString('en-US', { month: 'short' }),
        start, span,
      });
    }
    return bands;
  }, [columns, scale]);

  // ─── visible slices ───────────────────────────────────────────────────────
  const visibleRows = useMemo(() => {
    const { start, end } = visRows;
    if (start === 0 && end === 0) return flatRows.slice(0, Math.min(30, flatRows.length));
    return flatRows.slice(start, end);
  }, [flatRows, visRows]);

  const visibleCols = useMemo(() => {
    const { start, end } = visCols;
    if (start === 0 && end === 0) {
      return columns.slice(0, Math.min(60, columns.length)).map((c, i) => ({ ...c, idx: i }));
    }
    return columns.slice(start, end).map((c, i) => ({ ...c, idx: start + i }));
  }, [columns, visCols]);

  // ─── bar position ─────────────────────────────────────────────────────────
  const getBarPos = useCallback((row: FlatRow) => {
    if (!row.start_date) return null;
    const start = new Date(row.start_date);
    const end   = row.end_date ? new Date(row.end_date) : new Date(start);

    if (scale === 'day') {
      const off = Math.floor((start.getTime() - minDate.getTime()) / 86400000);
      const dur = Math.max(Math.ceil((end.getTime() - start.getTime()) / 86400000), 1);
      return { left: off * colWidth, width: Math.max(dur * colWidth - 2, 20) };
    }
    if (scale === 'week') {
      const ws = getMonday(minDate);
      const sw = Math.floor((getMonday(start).getTime() - ws.getTime()) / (7 * 86400000));
      const ew = Math.floor((getMonday(end).getTime()   - ws.getTime()) / (7 * 86400000));
      return { left: Math.max(sw, 0) * colWidth, width: Math.max((ew - sw + 1) * colWidth - 2, 20) };
    }
    const minY = minDate.getFullYear(); const minM = minDate.getMonth();
    const si = (start.getFullYear() - minY) * 12 + (start.getMonth() - minM);
    const ei = (end.getFullYear()   - minY) * 12 + (end.getMonth()   - minM);
    return { left: Math.max(si, 0) * colWidth, width: Math.max((ei - si + 1) * colWidth - 4, 24) };
  }, [scale, minDate, colWidth]);

  // ─── scroll handlers ──────────────────────────────────────────────────────
  const handleLeftScroll = useCallback(() => {
    if (!leftScrollRef.current || !rightScrollRef.current) return;
    const top = leftScrollRef.current.scrollTop;
    rightScrollRef.current.scrollTop = top;
    const h = leftScrollRef.current.clientHeight;
    setVisRows({
      start: Math.max(0, Math.floor(top / ROW_HEIGHT) - BUFFER_ROWS),
      end:   Math.min(flatRows.length, Math.ceil((top + h) / ROW_HEIGHT) + BUFFER_ROWS),
    });
  }, [flatRows.length]);

  const handleRightScroll = useCallback(() => {
    if (!leftScrollRef.current || !rightScrollRef.current) return;
    const top = rightScrollRef.current.scrollTop;
    leftScrollRef.current.scrollTop = top;
    const h = rightScrollRef.current.clientHeight;
    setVisRows({
      start: Math.max(0, Math.floor(top / ROW_HEIGHT) - BUFFER_ROWS),
      end:   Math.min(flatRows.length, Math.ceil((top + h) / ROW_HEIGHT) + BUFFER_ROWS),
    });
  }, [flatRows.length]);

  const handleTimelineScroll = useCallback((scrollLeft: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTimelineScrollLeft(scrollLeft);
      if (timelineHeaderRef.current) timelineHeaderRef.current.scrollLeft = scrollLeft;
      if (timelineBodyRef.current)   timelineBodyRef.current.scrollLeft   = scrollLeft;
      if (timelineBodyRef.current) {
        const w = timelineBodyRef.current.clientWidth;
        setVisCols({
          start: Math.max(0, Math.floor(scrollLeft / colWidth) - BUFFER_COLS),
          end:   Math.min(columns.length, Math.ceil((scrollLeft + w) / colWidth) + BUFFER_COLS),
        });
      }
      rafRef.current = null;
    });
  }, [colWidth, columns.length]);

  const handleTimelineWheel = useCallback((e: React.WheelEvent) => {
    if (e.shiftKey && timelineBodyRef.current) {
      e.preventDefault();
      handleTimelineScroll(timelineBodyRef.current.scrollLeft + e.deltaY);
    }
  }, [handleTimelineScroll]);

  // ─── pan handlers ─────────────────────────────────────────────────────────
  const handleTimelinePanStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.gantt-bar')) return;
    e.preventDefault();
    setIsPanningTimeline(true);
    setPanStartX(e.clientX);
    setPanStartScrollLeft(timelineScrollLeft);
  }, [timelineScrollLeft]);

  useEffect(() => {
    if (!isPanningTimeline) return;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    const onMove = (e: MouseEvent) => {
      handleTimelineScroll(Math.max(0, panStartScrollLeft + (panStartX - e.clientX)));
    };
    const onUp = () => {
      setIsPanningTimeline(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isPanningTimeline, panStartX, panStartScrollLeft, handleTimelineScroll]);

  // ─── init visible ranges ──────────────────────────────────────────────────
  useEffect(() => {
    if (timelineBodyRef.current) {
      const w = timelineBodyRef.current.clientWidth;
      const h = timelineBodyRef.current.clientHeight;
      setVisCols({ start: 0, end: Math.min(columns.length, Math.ceil(w / colWidth) + BUFFER_COLS) });
      setVisRows({ start: 0, end: Math.min(flatRows.length, Math.ceil(h / ROW_HEIGHT) + BUFFER_ROWS) });
    }
  }, [columns.length, colWidth, flatRows.length]);

  // ─── overlay drag splitter ────────────────────────────────────────────────
  const handleTimelineDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTimeline(true);
  }, []);

  useEffect(() => {
    if (!isDraggingTimeline) return;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct  = ((rect.right - e.clientX) / rect.width) * 100;
      setTimelineWidthPercent(Math.max(TIMELINE_MIN_PERCENT, Math.min(TIMELINE_MAX_PERCENT, pct)));
    };
    const onUp = () => {
      setIsDraggingTimeline(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingTimeline]);

  // ─── inline date edit ─────────────────────────────────────────────────────
  const commitEdit = (id: number) => {
    if (onWorkItemUpdate) {
      onWorkItemUpdate(id, { start_date: editStart || undefined, end_date: editEnd || undefined });
    }
    setEditingId(null);
  };

  // ─── CSV export ───────────────────────────────────────────────────────────
  const handleExport = () => {
    const header = ['Type', 'Title', 'Owner', 'Priority', 'Status', 'Start', 'End', 'Notes'].join(',');
    const body = flatRows.map(r => [
      r.type, `"${r.title}"`, r.owner || '', r.priority || '', r.status,
      r.start_date || '', r.end_date || '',
      r.notes ? `"${r.notes.replace(/"/g, '""')}"` : '',
    ].join(','));
    const csv  = [header, ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-workitems-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── jump to today ────────────────────────────────────────────────────────
  const handleJumpToToday = useCallback(() => {
    if (!timelineBodyRef.current) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let left = 0;
    if (scale === 'day') {
      const off = Math.floor((today.getTime() - minDate.getTime()) / 86400000);
      left = Math.max(0, off * colWidth - timelineBodyRef.current.clientWidth / 3);
    } else if (scale === 'week') {
      const ws  = getMonday(minDate);
      const off = Math.floor((getMonday(today).getTime() - ws.getTime()) / (7 * 86400000));
      left = Math.max(0, off * colWidth - timelineBodyRef.current.clientWidth / 3);
    } else {
      const idx = (today.getFullYear() - minDate.getFullYear()) * 12 + (today.getMonth() - minDate.getMonth());
      left = Math.max(0, idx * colWidth - timelineBodyRef.current.clientWidth / 3);
    }
    handleTimelineScroll(left);
  }, [scale, minDate, colWidth, handleTimelineScroll]);

  // ─── collapse toggle ──────────────────────────────────────────────────────
  const toggleCollapse = (id: number) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ─── stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:       workItems.length,
    done:        workItems.filter(w => w.status === 'done').length,
    in_progress: workItems.filter(w => w.status === 'in_progress').length,
    blocked:     workItems.filter(w => w.status === 'blocked').length,
  }), [workItems]);

  const statusOpts = useMemo(() => Array.from(new Set(workItems.map(w => w.status))), [workItems]);
  const typeOpts   = useMemo(() => Array.from(new Set(workItems.map(w => w.type))),   [workItems]);

  const totalHeight = flatRows.length * ROW_HEIGHT;

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bg }}>

      {/* ── Header: Title + Subtitle + Toolbar ─────────────────────────── */}
      <div
        className="border-b flex-shrink-0"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        {/* Title + subtitle */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-3">
          <Button
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            style={{ flexShrink: 0 }}
          >
            All Projects
          </Button>
          <div>
            <h1 className="text-xl font-semibold leading-tight" style={{ color: colors.text }}>
              {project.name}
            </h1>
            <p className="text-sm leading-snug" style={{ color: colors.textMuted }}>
              {stats.total} items · {stats.done} done · {stats.in_progress} in progress
              {stats.blocked > 0 && (
                <span style={{ color: '#F5222D' }}> · {stats.blocked} blocked</span>
              )}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 pb-3 flex items-center justify-between">
          {/* Left: row count */}
          <span
            className="px-3 py-1 rounded text-sm font-medium"
            style={{ backgroundColor: colors.hover, color: colors.text }}
          >
            {flatRows.length} {flatRows.length === 1 ? 'row' : 'rows'}
          </span>

          {/* Right: controls */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: colors.textMuted }}>Status:</label>
            <Select
              size="small"
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 130 }}
              options={[
                { value: 'all', label: 'All Statuses' },
                ...statusOpts.map(s => ({ value: s, label: STATUS_LABEL[s] })),
              ]}
            />
            <Select
              size="small"
              value={filterType}
              onChange={setFilterType}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: 'All Types' },
                ...typeOpts.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
              ]}
            />

            <div className="w-px h-5" style={{ backgroundColor: colors.borderMedium }} />

            <Select
              size="small"
              value={scale}
              onChange={setScale}
              style={{ width: 90 }}
              options={[
                { value: 'month', label: 'Month' },
                { value: 'week',  label: 'Week'  },
                { value: 'day',   label: 'Day'   },
              ]}
            />
            <Tooltip title="Zoom In (finer)">
              <Button
                size="small"
                icon={<ZoomInOutlined />}
                disabled={scale === 'day'}
                onClick={() => { if (scale === 'month') setScale('week'); else if (scale === 'week') setScale('day'); }}
              />
            </Tooltip>
            <Tooltip title="Zoom Out (coarser)">
              <Button
                size="small"
                icon={<ZoomOutOutlined />}
                disabled={scale === 'month'}
                onClick={() => { if (scale === 'day') setScale('week'); else if (scale === 'week') setScale('month'); }}
              />
            </Tooltip>

            <div className="w-px h-5" style={{ backgroundColor: colors.borderMedium }} />

            <Tooltip title="Jump to Today">
              <Button size="small" icon={<CalendarOutlined />} onClick={handleJumpToToday}>Today</Button>
            </Tooltip>
            <Button size="small" icon={<DownloadOutlined />} onClick={handleExport}>Export</Button>
          </div>
        </div>
      </div>

      {/* ── Main: BASE LAYER table + OVERLAY LAYER timeline ─────────────── */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative">

        {/* BASE LAYER: frozen table */}
        <div
          className="absolute inset-0 flex flex-col"
          style={{ backgroundColor: colors.surface, marginRight: `${SAFE_ZONE_PERCENT}%` }}
        >
          {/* Table header */}
          <div
            className="flex-shrink-0 flex items-center text-xs font-medium"
            style={{
              height: HEADER_HEIGHT,
              backgroundColor: colors.hover,
              borderBottom: `1px solid ${colors.border}`,
              color: colors.text,
            }}
          >
            <div className="px-3 flex items-center h-full truncate" style={{ width: COL.name,     borderRight: `1px solid ${colors.border}` }}>Name</div>
            <div className="px-3 flex items-center h-full truncate" style={{ width: COL.owner,    borderRight: `1px solid ${colors.border}` }}>Owner</div>
            <div className="px-2 flex items-center justify-center h-full" style={{ width: COL.priority, borderRight: `1px solid ${colors.border}` }}>Priority</div>
            <div className="px-2 flex items-center h-full"              style={{ width: COL.status,    borderRight: `1px solid ${colors.border}` }}>Status</div>
            <div className="px-2 flex items-center justify-center h-full" style={{ width: COL.start,    borderRight: `1px solid ${colors.border}` }}>Start</div>
            <div className="px-2 flex items-center justify-center h-full" style={{ width: COL.end }}>End</div>
          </div>

          {/* Table body */}
          <div
            ref={leftScrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden"
            onScroll={handleLeftScroll}
          >
            <div style={{ height: visRows.start * ROW_HEIGHT }} />

            {loading ? (
              <div className="flex items-center justify-center" style={{ height: 200, color: colors.textMuted }}>
                Loading…
              </div>
            ) : flatRows.length === 0 ? (
              <div className="flex items-center justify-center" style={{ height: 200, color: colors.textMuted }}>
                No items found
              </div>
            ) : (
              visibleRows.map(row => (
                <LeftRow
                  key={row.id}
                  row={row}
                  onToggle={toggleCollapse}
                  editingId={editingId}
                  editStart={editStart}
                  editEnd={editEnd}
                  setEditStart={setEditStart}
                  setEditEnd={setEditEnd}
                  onEdit={id => {
                    setEditingId(id);
                    const r = flatRows.find(f => f.id === id)!;
                    setEditStart(r.start_date || '');
                    setEditEnd(r.end_date || '');
                  }}
                  onCommit={commitEdit}
                  onCancelEdit={() => setEditingId(null)}
                />
              ))
            )}

            <div style={{ height: Math.max(0, (flatRows.length - visRows.end) * ROW_HEIGHT) }} />
          </div>
        </div>

        {/* OVERLAY LAYER: timeline drawer */}
        <div
          className="absolute top-0 bottom-0 flex flex-col overflow-hidden"
          style={{
            right: 0,
            width: `${timelineWidthPercent}%`,
            backgroundColor: colors.surface,
            borderLeft: `2px solid ${colors.borderStrong}`,
            boxShadow: '-6px 0 16px rgba(0,0,0,0.12)',
            zIndex: 50,
            transition: isDraggingTimeline ? 'none' : 'width 0.2s ease-out',
          }}
        >
          {/* Drag splitter */}
          <div
            className="absolute top-0 bottom-0 left-0 flex items-center justify-center cursor-col-resize z-[100]"
            style={{
              width: 12,
              backgroundColor: isDraggingTimeline ? '#3B82F6' : colors.borderStrong,
              marginLeft: -2,
              transition: 'background-color 0.15s',
            }}
            onMouseDown={handleTimelineDragStart}
          >
            <div className="w-1 h-16 rounded-full bg-white opacity-80" style={{ pointerEvents: 'none' }} />
          </div>

          {/* Timeline header (sticky, scrolls horizontally with body) */}
          <div
            ref={timelineHeaderRef}
            className="flex-shrink-0 overflow-x-hidden overflow-y-hidden z-20"
            style={{
              height: HEADER_HEIGHT,
              borderBottom: `1px solid ${colors.border}`,
              cursor: isPanningTimeline ? 'grabbing' : 'grab',
            }}
            onWheel={handleTimelineWheel}
            onMouseDown={handleTimelinePanStart}
          >
            <div style={{ width: timelineWidth, minWidth: '100%' }}>
              {scale === 'day' ? (
                /* DAY VIEW: Year → Month → Day numbers (3 rows × 24px = 72px) */
                <div className="flex flex-col" style={{ width: timelineWidth, backgroundColor: '#FFFFFF' }}>
                  {/* Year row */}
                  <div className="flex" style={{ height: 24, backgroundColor: '#F7F7F7', borderBottom: '1px solid #DDD' }}>
                    {yearBands.map((b, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center text-xs font-bold"
                        style={{ width: b.span * colWidth, minWidth: b.span * colWidth, flexShrink: 0, borderRight: '3px solid #999', color: '#222', boxSizing: 'border-box' }}
                      >
                        {b.year}
                      </div>
                    ))}
                  </div>
                  {/* Month row */}
                  <div className="flex" style={{ height: 24, backgroundColor: '#FAFAFA', borderBottom: '1px solid #DDD' }}>
                    {monthBands.map((b, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center text-xs font-semibold"
                        style={{ width: b.span * colWidth, minWidth: b.span * colWidth, flexShrink: 0, borderRight: '2px solid #BBB', color: '#333', boxSizing: 'border-box' }}
                      >
                        {b.label}
                      </div>
                    ))}
                  </div>
                  {/* Day numbers */}
                  <div className="flex" style={{ height: 24, backgroundColor: '#FFFFFF' }}>
                    {columns.map((col, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-center text-[10px]"
                        style={{
                          width: colWidth, minWidth: colWidth, flexShrink: 0,
                          borderRight: '1px solid #E5E5E5', color: '#666', boxSizing: 'border-box',
                          backgroundColor: (col as any).isWeekend ? '#F9F9F9' : 'transparent',
                        }}
                      >
                        {col.label}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* WEEK / MONTH VIEW: Year → Period (2 rows × 30px = 60px) */
                <div className="flex flex-col" style={{ width: timelineWidth, backgroundColor: '#FFFFFF' }}>
                  {/* Year row */}
                  <div className="flex" style={{ height: 30, backgroundColor: '#F7F7F7', borderBottom: '1px solid #DDD' }}>
                    {yearBands.map((b, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center text-sm font-bold"
                        style={{ width: b.span * colWidth, minWidth: b.span * colWidth, flexShrink: 0, borderRight: '3px solid #999', color: '#222', boxSizing: 'border-box' }}
                      >
                        {b.year}
                      </div>
                    ))}
                  </div>
                  {/* Month / Week labels */}
                  <div className="flex" style={{ height: 30, backgroundColor: '#FFFFFF', borderBottom: '1px solid #DDD' }}>
                    {columns.map((col, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-center text-xs font-medium"
                        style={{ width: colWidth, minWidth: colWidth, flexShrink: 0, borderRight: '1px solid #DDD', color: '#555', boxSizing: 'border-box' }}
                      >
                        {col.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline body */}
          <div
            ref={el => {
              rightScrollRef.current  = el;
              timelineBodyRef.current = el;
            }}
            className="flex-1 overflow-auto relative"
            style={{ cursor: isPanningTimeline ? 'grabbing' : 'grab' }}
            onScroll={e => {
              handleRightScroll();
              handleTimelineScroll(e.currentTarget.scrollLeft);
            }}
            onWheel={handleTimelineWheel}
            onMouseDown={handleTimelinePanStart}
          >
            <div style={{ width: timelineWidth, minWidth: '100%', position: 'relative' }}>
              {/* Spacer top */}
              <div style={{ height: visRows.start * ROW_HEIGHT }} />

              {visibleRows.map(row => {
                const pos          = getBarPos(row);
                const bStyle       = barStyle(row.type, row.status, row.depth === 1);
                const isMilestone  = row.type === 'milestone';
                const isPhase      = row.type === 'phase';

                return (
                  <div
                    key={row.id}
                    className="relative"
                    style={{ height: ROW_HEIGHT, borderBottom: `1px solid ${colors.border}` }}
                  >
                    {/* Weekend highlights (day view) */}
                    {scale === 'day' && visibleCols.map(col =>
                      (col as any).isWeekend ? (
                        <div
                          key={col.idx}
                          className="absolute top-0 bottom-0 pointer-events-none"
                          style={{ left: col.idx * colWidth, width: colWidth, backgroundColor: colors.hover, opacity: 0.6 }}
                        />
                      ) : null,
                    )}

                    {/* Grid lines (month/week: CSS background, day: inline) */}
                    {(scale === 'month' || scale === 'week') && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          backgroundImage: `repeating-linear-gradient(to right, ${colors.border} 0, ${colors.border} 1px, transparent 1px, transparent ${colWidth}px)`,
                          backgroundSize: `${colWidth}px 100%`,
                          opacity: 0.8,
                        }}
                      />
                    )}

                    {/* Bar */}
                    {pos && (
                      isMilestone ? (
                        <div
                          className="gantt-bar absolute"
                          style={{
                            left: pos.left + pos.width / 2 - 8,
                            top: (ROW_HEIGHT - 16) / 2,
                            width: 16, height: 16,
                            background: row.status === 'done' ? '#52c41a' : TYPE_COLOR.milestone,
                            transform: 'rotate(45deg)',
                            borderRadius: 2,
                          }}
                          title={`${row.title} — ${row.start_date || '?'}`}
                        />
                      ) : isPhase ? (
                        <div
                          className="gantt-bar absolute flex items-center"
                          style={{ left: pos.left, top: (ROW_HEIGHT - 16) / 2, width: pos.width, height: 16 }}
                          title={row.title}
                        >
                          <div style={{ width: 4, height: 16, background: '#8c8c8c', flexShrink: 0 }} />
                          <div style={{ flex: 1, height: 6, background: row.status === 'done' ? '#52c41a' : '#8c8c8c', opacity: 0.5 }} />
                          <div style={{ width: 4, height: 16, background: '#8c8c8c', flexShrink: 0 }} />
                        </div>
                      ) : (
                        <Tooltip title={`${row.title} · ${row.start_date || '?'} → ${row.end_date || '?'}`}>
                          <div
                            className="gantt-bar absolute rounded flex items-center overflow-hidden cursor-pointer select-none"
                            style={{ left: pos.left, width: pos.width, ...bStyle, position: 'absolute' }}
                          >
                            {(row.type === 'issue' || row.type === 'clash' || row.type === 'remark') && (
                              <span className="ml-1 text-xs leading-none flex-shrink-0">{TYPE_ICON[row.type]}</span>
                            )}
                            {pos.width > 40 && (
                              <span className="ml-1 truncate text-white font-medium" style={{ fontSize: 10, lineHeight: '14px' }}>
                                {row.title}
                              </span>
                            )}
                          </div>
                        </Tooltip>
                      )
                    )}
                  </div>
                );
              })}

              {/* Spacer bottom */}
              <div style={{ height: Math.max(0, (flatRows.length - visRows.end) * ROW_HEIGHT) }} />

              {/* Today line (dashed orange — matches ExcelGanttChart) */}
              {(() => {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                let left = -1;
                if (scale === 'day') {
                  const off = Math.floor((today.getTime() - minDate.getTime()) / 86400000);
                  if (off >= 0 && off <= columns.length) left = off * colWidth;
                } else if (scale === 'week') {
                  const ws  = getMonday(minDate);
                  const off = Math.floor((getMonday(today).getTime() - ws.getTime()) / (7 * 86400000));
                  if (off >= 0 && off <= columns.length) left = off * colWidth;
                } else {
                  const minY = minDate.getFullYear(); const minM = minDate.getMonth();
                  const idx  = (today.getFullYear() - minY) * 12 + (today.getMonth() - minM);
                  const day  = today.getDate();
                  const dim  = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                  if (idx >= 0 && idx <= columns.length) left = (idx + day / dim) * colWidth;
                }
                if (left < 0) return null;
                return (
                  <div
                    className="absolute top-0 pointer-events-none z-20"
                    style={{ left, width: 1, bottom: 0, borderLeft: '1px dashed #FA8C16', opacity: 0.7 }}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar: type legend + hints ─────────────────────────────── */}
      <div
        className="px-6 py-2.5 border-t flex items-center justify-between flex-shrink-0"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <div className="flex items-center gap-4 text-xs flex-wrap">
          <span style={{ color: colors.textMuted, fontWeight: 500 }}>Legend:</span>
          {([
            ['task',      TYPE_COLOR.task,      'Task'],
            ['phase',     TYPE_COLOR.phase,     'Phase'],
            ['milestone', TYPE_COLOR.milestone, 'Milestone ◆'],
            ['issue',     TYPE_COLOR.issue,     'Issue ⚠'],
            ['clash',     TYPE_COLOR.clash,     'Clash ⛔'],
            ['remark',    TYPE_COLOR.remark,    'Note 💬'],
          ] as [WorkItemType, string, string][]).map(([type, color, label]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-4 h-2.5 rounded" style={{ backgroundColor: color, opacity: 0.85 }} />
              <span style={{ color: colors.text }}>{label}</span>
            </div>
          ))}
        </div>
        <span className="text-xs" style={{ color: colors.textMuted }}>
          Shift+Scroll to pan · Double-click row to edit dates · {flatRows.length} rows
        </span>
      </div>
    </div>
  );
}

// ─── LeftRow sub-component ────────────────────────────────────────────────────

interface LeftRowProps {
  row: FlatRow;
  onToggle: (id: number) => void;
  editingId: number | null;
  editStart: string;
  editEnd: string;
  setEditStart: (v: string) => void;
  setEditEnd: (v: string) => void;
  onEdit: (id: number) => void;
  onCommit: (id: number) => void;
  onCancelEdit: () => void;
}

function LeftRow({
  row, onToggle, editingId, editStart, editEnd,
  setEditStart, setEditEnd, onEdit, onCommit, onCancelEdit,
}: LeftRowProps) {
  const isEditing    = editingId === row.id;
  const hasChildren  = row.type === 'phase';
  const indent       = row.depth === 1 ? 20 : 6;

  return (
    <div
      className="flex transition-colors"
      style={{
        height: ROW_HEIGHT,
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: row.depth === 1 ? '#FDFDFD' : 'transparent',
        color: colors.text,
        cursor: 'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors.selected; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = row.depth === 1 ? '#FDFDFD' : 'transparent'; }}
      onDoubleClick={() => onEdit(row.id)}
    >
      {/* Name */}
      <div
        className="flex items-center overflow-hidden text-xs"
        style={{ width: COL.name, paddingLeft: indent, borderRight: `1px solid ${colors.border}`, flexShrink: 0 }}
      >
        {hasChildren && (
          <button
            className="flex-shrink-0 mr-1"
            style={{ color: colors.textMuted }}
            onClick={() => onToggle(row.id)}
          >
            {row.collapsed
              ? <CaretRightOutlined style={{ fontSize: 10 }} />
              : <CaretDownOutlined  style={{ fontSize: 10 }} />}
          </button>
        )}
        <span
          className="mr-1 flex-shrink-0"
          style={{ color: TYPE_COLOR[row.type], fontSize: row.type === 'milestone' ? 10 : 11 }}
        >
          {TYPE_ICON[row.type]}
        </span>
        <span
          className="truncate"
          style={{ color: row.depth === 1 ? colors.textMuted : colors.text, fontWeight: row.depth === 0 ? 500 : 400 }}
          title={row.title}
        >
          {row.title}
        </span>
      </div>

      {/* Owner */}
      <div
        className="flex items-center px-2 text-xs overflow-hidden"
        style={{ width: COL.owner, borderRight: `1px solid ${colors.border}`, color: colors.textMuted, flexShrink: 0 }}
      >
        <span className="truncate">{row.owner || '—'}</span>
      </div>

      {/* Priority */}
      <div
        className="flex items-center justify-center px-1"
        style={{ width: COL.priority, borderRight: `1px solid ${colors.border}`, flexShrink: 0 }}
      >
        {row.priority
          ? <Tag color={PRIORITY_COLOR[row.priority] || 'default'} style={{ margin: 0, fontSize: 10 }}>{row.priority}</Tag>
          : <span style={{ color: colors.textMuted, fontSize: 11 }}>—</span>}
      </div>

      {/* Status */}
      <div
        className="flex items-center px-1"
        style={{ width: COL.status, borderRight: `1px solid ${colors.border}`, flexShrink: 0 }}
      >
        <Tag color={STATUS_COLOR[row.status]} style={{ margin: 0, fontSize: 10 }}>{STATUS_LABEL[row.status]}</Tag>
      </div>

      {/* Start */}
      <div
        className="flex items-center px-1"
        style={{ width: COL.start, borderRight: `1px solid ${colors.border}`, flexShrink: 0 }}
      >
        {isEditing
          ? <input
              type="date"
              className="w-full border rounded px-1"
              style={{ fontSize: 10 }}
              value={editStart}
              onChange={e => setEditStart(e.target.value)}
            />
          : <span style={{ color: colors.textMuted, fontSize: 11 }}>{row.start_date || '—'}</span>}
      </div>

      {/* End */}
      <div
        className="flex items-center px-1"
        style={{ width: COL.end, flexShrink: 0 }}
      >
        {isEditing ? (
          <div className="flex items-center gap-0.5 w-full">
            <input
              type="date"
              className="flex-1 min-w-0 border rounded px-1"
              style={{ fontSize: 10 }}
              value={editEnd}
              onChange={e => setEditEnd(e.target.value)}
            />
            <button style={{ color: '#52c41a', fontSize: 13, flexShrink: 0 }} onClick={() => onCommit(row.id)}>✓</button>
            <button style={{ color: '#f5222d', fontSize: 13, flexShrink: 0 }} onClick={onCancelEdit}>✕</button>
          </div>
        ) : (
          <span style={{ color: colors.textMuted, fontSize: 11 }}>{row.end_date || '—'}</span>
        )}
      </div>
    </div>
  );
}

// ─── date utilities ───────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day  = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function getISOWeek(d: Date): number {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}
