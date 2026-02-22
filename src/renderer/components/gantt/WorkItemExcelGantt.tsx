/**
 * WorkItemExcelGantt – Excel-style split-pane Gantt for work items within a project.
 *
 * Left panel (frozen): type icon + title (indented for children), owner, priority, status, start, end
 * Right panel (scrollable): type-coloured timeline bars with status overlays
 *
 * Matches the look-and-feel of ExcelGanttChart used at the project level.
 */

import React, {
  useState, useMemo, useRef, useCallback, useEffect,
} from 'react';
import { Tag, Select, Button, Space, Tooltip, Input } from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  DownloadOutlined,
  FilterOutlined,
  CaretRightOutlined,
  CaretDownOutlined,
} from '@ant-design/icons';
import type { Project, WorkItem } from '@/shared/types';

// ─── constants ────────────────────────────────────────────────────────────────

const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 56; // 2-row header: year/period

const LEFT_COL_WIDTHS = {
  title: 220,
  owner: 90,
  priority: 80,
  status: 100,
  start: 88,
  end: 88,
};
const LEFT_TOTAL_WIDTH = Object.values(LEFT_COL_WIDTHS).reduce((a, b) => a + b, 0);

const BUFFER_ROWS = 4;
const BUFFER_COLS = 6;

// ─── type helpers ─────────────────────────────────────────────────────────────

type ViewScale = 'day' | 'week' | 'month';
type WorkItemType = WorkItem['type'];
type WorkItemStatus = WorkItem['status'];

interface FlatRow extends WorkItem {
  depth: number;       // 0 = top-level, 1 = child
  collapsed?: boolean; // only relevant when depth===0 and has children
  hidden?: boolean;    // true when parent is collapsed
}

// ─── visual config ────────────────────────────────────────────────────────────

const TYPE_ICON: Record<WorkItemType, string> = {
  task:      '',
  phase:     '▼',
  milestone: '◆',
  issue:     '⚠',
  clash:     '⛔',
  remark:    '💬',
};

/** Base bar colour (full opacity = in_progress) */
const TYPE_COLOR: Record<WorkItemType, string> = {
  task:      '#1677ff',
  phase:     '#8c8c8c',
  milestone: '#722ed1',
  issue:     '#fa8c16',
  clash:     '#f5222d',
  remark:    '#fadb14',
};

/** Status-derived modifier */
function barStyle(type: WorkItemType, status: WorkItemStatus, isChild: boolean): React.CSSProperties {
  const base = TYPE_COLOR[type];
  const height = isChild ? 10 : 14;
  const top = isChild ? (ROW_HEIGHT - 10) / 2 : (ROW_HEIGHT - 14) / 2;

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
  // in_progress
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
  // ── view state ──
  const [scale, setScale] = useState<ViewScale>('month');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  // ── scroll sync ──
  const leftRef   = useRef<HTMLDivElement>(null);
  const rightRef  = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const rafRef    = useRef<number | null>(null);

  // ── visible range (virtualisation) ──
  const [visRows, setVisRows]   = useState({ start: 0, end: 30 });
  const [visCols, setVisCols]   = useState({ start: 0, end: 60 });
  const [scrollX, setScrollX]   = useState(0);

  // ─── flatten hierarchy ────────────────────────────────────────────────────

  const flatRows = useMemo((): FlatRow[] => {
    // Separate root items from children
    const roots = workItems.filter(w =>
      w.parent_id === null &&
      (filterStatus === 'all' || w.status === filterStatus) &&
      (filterType   === 'all' || w.type   === filterType)
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
        (filterType   === 'all' || c.type   === filterType)
      );
      rows.push({ ...root, depth: 0, collapsed: isCollapsed && filteredChildren.length > 0 });
      if (!isCollapsed) {
        filteredChildren.forEach(child => {
          rows.push({ ...child, depth: 1 });
        });
      }
    });
    return rows;
  }, [workItems, filterStatus, filterType, collapsed]);

  // ─── date range ───────────────────────────────────────────────────────────

  const { minDate, maxDate } = useMemo(() => {
    let min: Date | null = null;
    let max: Date | null = null;
    const allDates = flatRows.flatMap(r => [
      r.start_date ? new Date(r.start_date) : null,
      r.end_date   ? new Date(r.end_date)   : null,
    ]).filter(Boolean) as Date[];

    if (project.start_date) allDates.push(new Date(project.start_date));
    if (project.end_date)   allDates.push(new Date(project.end_date));

    allDates.forEach(d => {
      if (!min || d < min) min = d;
      if (!max || d > max) max = d;
    });

    const fallback = new Date();
    if (!min) { min = new Date(fallback.getFullYear(), fallback.getMonth(), 1); }
    if (!max) { max = new Date(fallback.getFullYear(), fallback.getMonth() + 3, 0); }

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
      return { columns: cols, colWidth: 30 };
    }

    if (scale === 'week') {
      // Align to Monday
      const start = new Date(cur);
      const day = start.getDay();
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
      while (start <= maxDate) {
        const weekNum = getISOWeek(start);
        cols.push({ date: new Date(start), label: `W${weekNum}` });
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
    return { columns: cols, colWidth: 72 };
  }, [minDate, maxDate, scale]);

  const timelineWidth = columns.length * colWidth;

  // ─── year-band headers ────────────────────────────────────────────────────

  const yearBands = useMemo(() => {
    const bands: { year: number; start: number; span: number }[] = [];
    let cur = -1; let start = 0; let span = 0;
    columns.forEach((col, i) => {
      const y = col.date.getFullYear();
      if (y !== cur) { if (span) bands.push({ year: cur, start, span }); cur = y; start = i; span = 1; }
      else span++;
    });
    if (span) bands.push({ year: cur, start, span });
    return bands;
  }, [columns]);

  // ─── visible slice (virtualisation) ──────────────────────────────────────

  const visibleRows = useMemo(() => {
    const { start, end } = visRows;
    if (start === 0 && end === 0) return flatRows.slice(0, Math.min(30, flatRows.length));
    return flatRows.slice(start, end);
  }, [flatRows, visRows]);

  const visibleCols = useMemo(() => {
    const { start, end } = visCols;
    if (start === 0 && end === 0) return columns.slice(0, Math.min(60, columns.length)).map((c, i) => ({ ...c, idx: i }));
    return columns.slice(start, end).map((c, i) => ({ ...c, idx: start + i }));
  }, [columns, visCols]);

  // ─── bar position ─────────────────────────────────────────────────────────

  const getBarPos = useCallback((row: FlatRow) => {
    if (!row.start_date) return null;
    const start = new Date(row.start_date);
    const end   = row.end_date ? new Date(row.end_date) : new Date(start);

    if (scale === 'day') {
      const startOff = Math.floor((start.getTime() - minDate.getTime()) / 86400000);
      const duration = Math.max(Math.ceil((end.getTime() - start.getTime()) / 86400000), 1);
      return { left: startOff * colWidth, width: Math.max(duration * colWidth - 2, 20) };
    }
    if (scale === 'week') {
      const weekStart = getMonday(minDate);
      const startWeek = Math.floor((getMonday(start).getTime() - weekStart.getTime()) / (7 * 86400000));
      const endWeek   = Math.floor((getMonday(end).getTime()   - weekStart.getTime()) / (7 * 86400000));
      const span = Math.max(endWeek - startWeek + 1, 1);
      return { left: Math.max(startWeek, 0) * colWidth, width: Math.max(span * colWidth - 2, 20) };
    }
    // month
    const minYear = minDate.getFullYear(); const minMonth = minDate.getMonth();
    const startIdx = (start.getFullYear() - minYear) * 12 + (start.getMonth() - minMonth);
    const endIdx   = (end.getFullYear()   - minYear) * 12 + (end.getMonth()   - minMonth);
    const span = Math.max(endIdx - startIdx + 1, 1);
    return { left: Math.max(startIdx, 0) * colWidth, width: Math.max(span * colWidth - 4, 24) };
  }, [scale, minDate, colWidth]);

  // ─── scroll sync ──────────────────────────────────────────────────────────

  const syncLeft = useCallback(() => {
    if (!leftRef.current || !rightRef.current) return;
    rightRef.current.scrollTop = leftRef.current.scrollTop;
    const h = leftRef.current.clientHeight;
    const top = leftRef.current.scrollTop;
    setVisRows({ start: Math.max(0, Math.floor(top / ROW_HEIGHT) - BUFFER_ROWS), end: Math.min(flatRows.length, Math.ceil((top + h) / ROW_HEIGHT) + BUFFER_ROWS) });
  }, [flatRows.length]);

  const syncRight = useCallback(() => {
    if (!leftRef.current || !rightRef.current) return;
    leftRef.current.scrollTop = rightRef.current.scrollTop;
    const h = rightRef.current.clientHeight;
    const top = rightRef.current.scrollTop;
    setVisRows({ start: Math.max(0, Math.floor(top / ROW_HEIGHT) - BUFFER_ROWS), end: Math.min(flatRows.length, Math.ceil((top + h) / ROW_HEIGHT) + BUFFER_ROWS) });
  }, [flatRows.length]);

  const syncTimeline = useCallback((sl: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setScrollX(sl);
      if (headerRef.current)  headerRef.current.scrollLeft  = sl;
      if (rightRef.current)   rightRef.current.scrollLeft   = sl;
      if (rightRef.current) {
        const w = rightRef.current.clientWidth;
        setVisCols({ start: Math.max(0, Math.floor(sl / colWidth) - BUFFER_COLS), end: Math.min(columns.length, Math.ceil((sl + w) / colWidth) + BUFFER_COLS) });
      }
      rafRef.current = null;
    });
  }, [colWidth, columns.length]);

  const handleRightScroll = useCallback(() => {
    if (!rightRef.current) return;
    syncRight();
    syncTimeline(rightRef.current.scrollLeft);
  }, [syncRight, syncTimeline]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.shiftKey && rightRef.current) {
      e.preventDefault();
      syncTimeline(rightRef.current.scrollLeft + e.deltaY);
    }
  }, [syncTimeline]);

  // Initialise visible ranges on mount
  useEffect(() => {
    if (rightRef.current) {
      const w = rightRef.current.clientWidth;
      const h = rightRef.current.clientHeight;
      setVisCols({ start: 0, end: Math.min(columns.length, Math.ceil(w / colWidth) + BUFFER_COLS) });
      setVisRows({ start: 0, end: Math.min(flatRows.length, Math.ceil(h / ROW_HEIGHT) + BUFFER_ROWS) });
    }
  }, [columns.length, colWidth, flatRows.length]);

  // ─── inline date edit ─────────────────────────────────────────────────────

  const [editingId, setEditingId]     = useState<number | null>(null);
  const [editStart, setEditStart]     = useState('');
  const [editEnd, setEditEnd]         = useState('');

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
      r.type,
      `"${r.title}"`,
      r.owner || '',
      r.priority || '',
      r.status,
      r.start_date || '',
      r.end_date || '',
      r.notes ? `"${r.notes.replace(/"/g, '""')}"` : '',
    ].join(','));
    const csv = [header, ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-workitems-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── jump to today ────────────────────────────────────────────────────────

  const handleJumpToToday = useCallback(() => {
    if (!rightRef.current) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let left = 0;
    if (scale === 'day') {
      const off = Math.floor((today.getTime() - minDate.getTime()) / 86400000);
      left = Math.max(0, off * colWidth - rightRef.current.clientWidth / 3);
    } else if (scale === 'week') {
      const ws = getMonday(minDate);
      const off = Math.floor((getMonday(today).getTime() - ws.getTime()) / (7 * 86400000));
      left = Math.max(0, off * colWidth - rightRef.current.clientWidth / 3);
    } else {
      const minYear = minDate.getFullYear();
      const minMonth = minDate.getMonth();
      const idx = (today.getFullYear() - minYear) * 12 + (today.getMonth() - minMonth);
      left = Math.max(0, idx * colWidth - rightRef.current.clientWidth / 3);
    }
    syncTimeline(left);
  }, [scale, minDate, colWidth, syncTimeline]);

  // ─── collapse toggle ──────────────────────────────────────────────────────

  const toggleCollapse = (id: number) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ─── statistics ───────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const all = workItems;
    return {
      total:       all.length,
      done:        all.filter(w => w.status === 'done').length,
      in_progress: all.filter(w => w.status === 'in_progress').length,
      blocked:     all.filter(w => w.status === 'blocked').length,
    };
  }, [workItems]);

  // ─── unique filter options ────────────────────────────────────────────────

  const statusOpts = useMemo(() => Array.from(new Set(workItems.map(w => w.status))), [workItems]);
  const typeOpts   = useMemo(() => Array.from(new Set(workItems.map(w => w.type))),   [workItems]);

  // ─── total content height ─────────────────────────────────────────────────

  const totalHeight = flatRows.length * ROW_HEIGHT;

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
        <Space size="small">
          <Button size="small" icon={<ArrowLeftOutlined />} onClick={onBack}>
            All Projects
          </Button>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 ml-2">{project.name}</span>
          <span className="text-xs text-gray-400 hidden sm:inline">
            — {stats.total} items · {stats.done} done · {stats.in_progress} in progress
            {stats.blocked > 0 && <span className="text-red-500"> · {stats.blocked} blocked</span>}
          </span>
        </Space>

        <Space size="small">
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
          <Select
            size="small"
            value={scale}
            onChange={setScale}
            style={{ width: 90 }}
            options={[
              { value: 'day',   label: 'Day' },
              { value: 'week',  label: 'Week' },
              { value: 'month', label: 'Month' },
            ]}
          />
          <Button size="small" icon={<CalendarOutlined />} onClick={handleJumpToToday}>
            Today
          </Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={handleExport}>
            Export
          </Button>
        </Space>
      </div>

      {/* ── Main body (left table + right timeline) ──────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT PANEL ──────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col"
          style={{ width: LEFT_TOTAL_WIDTH }}
        >
          {/* Header */}
          <div
            className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
            style={{ height: HEADER_HEIGHT }}
          >
            <div className="flex items-center h-full text-xs font-semibold text-gray-500 dark:text-gray-400">
              <div style={{ width: LEFT_COL_WIDTHS.title }}    className="px-2 h-full flex items-center border-r border-gray-200 dark:border-gray-700">Name</div>
              <div style={{ width: LEFT_COL_WIDTHS.owner }}    className="px-2 h-full flex items-center border-r border-gray-200 dark:border-gray-700">Owner</div>
              <div style={{ width: LEFT_COL_WIDTHS.priority }} className="px-2 h-full flex items-center border-r border-gray-200 dark:border-gray-700">Priority</div>
              <div style={{ width: LEFT_COL_WIDTHS.status }}   className="px-2 h-full flex items-center border-r border-gray-200 dark:border-gray-700">Status</div>
              <div style={{ width: LEFT_COL_WIDTHS.start }}    className="px-2 h-full flex items-center border-r border-gray-200 dark:border-gray-700">Start</div>
              <div style={{ width: LEFT_COL_WIDTHS.end }}      className="px-2 h-full flex items-center">End</div>
            </div>
          </div>

          {/* Rows */}
          <div
            ref={leftRef}
            className="flex-1 overflow-y-auto overflow-x-hidden"
            onScroll={syncLeft}
          >
            {/* spacer top */}
            <div style={{ height: visRows.start * ROW_HEIGHT }} />

            {visibleRows.map((row) => (
              <LeftRow
                key={row.id}
                row={row}
                colWidths={LEFT_COL_WIDTHS}
                onToggle={toggleCollapse}
                editingId={editingId}
                editStart={editStart}
                editEnd={editEnd}
                setEditStart={setEditStart}
                setEditEnd={setEditEnd}
                onEdit={(id) => {
                  setEditingId(id);
                  const r = flatRows.find(f => f.id === id)!;
                  setEditStart(r.start_date || '');
                  setEditEnd(r.end_date || '');
                }}
                onCommit={commitEdit}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}

            {/* spacer bottom */}
            <div style={{ height: Math.max(0, (flatRows.length - visRows.end) * ROW_HEIGHT) }} />
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Timeline header (fixed horizontal, synced) */}
          <div
            ref={headerRef}
            className="flex-shrink-0 overflow-hidden border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
            style={{ height: HEADER_HEIGHT }}
          >
            <div style={{ width: timelineWidth, position: 'relative' }}>
              {/* Year band */}
              <div className="flex" style={{ height: 24 }}>
                {yearBands.map(b => (
                  <div
                    key={b.year}
                    className="border-r border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center px-2 bg-gray-100 dark:bg-gray-700"
                    style={{ width: b.span * colWidth, flexShrink: 0 }}
                  >
                    {b.year}
                  </div>
                ))}
              </div>
              {/* Period band – render ALL columns (no virtualization) to stay in sync with scroll */}
              <div className="flex" style={{ height: 32 }}>
                {columns.map((col, idx) => (
                  <div
                    key={idx}
                    className={`flex-shrink-0 border-r text-xs flex items-center justify-center font-medium
                      ${(col as any).isWeekend
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600'
                        : 'text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}
                    style={{ width: colWidth }}
                  >
                    {col.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline body */}
          <div
            ref={rightRef}
            className="flex-1 overflow-auto"
            onScroll={handleRightScroll}
            onWheel={handleWheel}
          >
            <div style={{ width: timelineWidth, position: 'relative' }}>
              {/* spacer top */}
              <div style={{ height: visRows.start * ROW_HEIGHT }} />

              {visibleRows.map((row) => {
                const pos = getBarPos(row);
                const bStyle = barStyle(row.type, row.status, row.depth === 1);
                const isMilestone = row.type === 'milestone';
                const isPhase     = row.type === 'phase';

                return (
                  <div
                    key={row.id}
                    className="relative border-b border-gray-100 dark:border-gray-800"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Weekend/weekend column highlights */}
                    {visibleCols.map(col => (
                      (col as any).isWeekend ? (
                        <div
                          key={col.idx}
                          className="absolute top-0 bottom-0 bg-gray-50 dark:bg-gray-800 opacity-50"
                          style={{ left: col.idx * colWidth, width: colWidth }}
                        />
                      ) : null
                    ))}

                    {pos && (
                      isMilestone ? (
                        /* Diamond marker */
                        <div
                          className="gantt-bar absolute flex items-center justify-center"
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
                        /* Phase bracket */
                        <div
                          className="gantt-bar absolute flex items-center"
                          style={{
                            left: pos.left, top: (ROW_HEIGHT - 16) / 2,
                            width: pos.width, height: 16,
                          }}
                          title={row.title}
                        >
                          {/* Left cap */}
                          <div style={{ width: 4, height: 16, background: '#8c8c8c', flexShrink: 0 }} />
                          {/* Bar fill */}
                          <div style={{ flex: 1, height: 6, background: row.status === 'done' ? '#52c41a' : '#8c8c8c', opacity: 0.5 }} />
                          {/* Right cap */}
                          <div style={{ width: 4, height: 16, background: '#8c8c8c', flexShrink: 0 }} />
                        </div>
                      ) : (
                        /* Regular bar */
                        <Tooltip title={`${row.title} · ${row.start_date || '?'} → ${row.end_date || '?'}`}>
                          <div
                            className="gantt-bar absolute rounded flex items-center overflow-hidden cursor-pointer select-none"
                            style={{
                              left: pos.left,
                              width: pos.width,
                              ...bStyle,
                              position: 'absolute',
                            }}
                          >
                            {(row.type === 'issue' || row.type === 'clash' || row.type === 'remark') && (
                              <span className="ml-1 text-xs leading-none" style={{ flexShrink: 0 }}>
                                {TYPE_ICON[row.type]}
                              </span>
                            )}
                            {pos.width > 40 && (
                              <span
                                className="ml-1 text-xs truncate text-white dark:text-gray-100 font-medium"
                                style={{ fontSize: 10, lineHeight: '14px' }}
                              >
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

              {/* spacer bottom */}
              <div style={{ height: Math.max(0, (flatRows.length - visRows.end) * ROW_HEIGHT) }} />

              {/* Today line */}
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                let left = -1;
                if (scale === 'day') {
                  const off = Math.floor((today.getTime() - minDate.getTime()) / 86400000);
                  if (off >= 0 && off <= columns.length) left = off * colWidth;
                } else if (scale === 'week') {
                  const ws = getMonday(minDate);
                  const off = Math.floor((getMonday(today).getTime() - ws.getTime()) / (7 * 86400000));
                  if (off >= 0 && off <= columns.length) left = off * colWidth;
                } else {
                  const minYear = minDate.getFullYear();
                  const minMonth = minDate.getMonth();
                  const idx = (today.getFullYear() - minYear) * 12 + (today.getMonth() - minMonth);
                  const day = today.getDate();
                  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                  if (idx >= 0 && idx <= columns.length) left = (idx + day / daysInMonth) * colWidth;
                }
                if (left < 0) return null;
                return (
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none z-20"
                    style={{ left, width: 2, borderLeft: '2px dashed #ff7875', opacity: 0.8 }}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-1.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
        <span className="font-medium text-gray-600 dark:text-gray-300">Legend:</span>
        {([
          ['task',      'Task (blue)'],
          ['phase',     'Phase (bracket)'],
          ['milestone', 'Milestone (◆)'],
          ['issue',     'Issue ⚠'],
          ['clash',     'Clash ⛔'],
          ['remark',    'Note 💬'],
        ] as [WorkItemType, string][]).map(([t, label]) => (
          <span key={t} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: TYPE_COLOR[t] }} />
            {label}
          </span>
        ))}
        <span className="ml-auto text-gray-400">Shift+Scroll to pan · {flatRows.length} rows</span>
      </div>
    </div>
  );
}

// ─── LeftRow sub-component ────────────────────────────────────────────────────

interface LeftRowProps {
  row: FlatRow;
  colWidths: typeof LEFT_COL_WIDTHS;
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

function LeftRow({ row, colWidths, onToggle, editingId, editStart, editEnd, setEditStart, setEditEnd, onEdit, onCommit, onCancelEdit }: LeftRowProps) {
  const isEditing = editingId === row.id;
  const hasChildren = (row.children?.length ?? 0) > 0 || row.type === 'phase';
  const indent = row.depth === 1 ? 20 : 4;

  return (
    <div
      className={`flex border-b border-gray-100 dark:border-gray-800 text-xs hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors
        ${row.depth === 1 ? 'bg-gray-50 dark:bg-gray-850' : ''}`}
      style={{ height: ROW_HEIGHT }}
      onDoubleClick={() => onEdit(row.id)}
    >
      {/* Title */}
      <div
        className="flex items-center border-r border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{ width: colWidths.title, paddingLeft: indent }}
      >
        {hasChildren && (
          <button
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mr-1"
            onClick={() => onToggle(row.id)}
          >
            {row.collapsed ? <CaretRightOutlined style={{ fontSize: 10 }} /> : <CaretDownOutlined style={{ fontSize: 10 }} />}
          </button>
        )}
        <span
          className="mr-1 flex-shrink-0"
          style={{ color: TYPE_COLOR[row.type], fontSize: row.type === 'milestone' ? 10 : 11 }}
        >
          {TYPE_ICON[row.type]}
        </span>
        <span
          className={`truncate ${row.depth === 1 ? 'text-gray-500 dark:text-gray-400' : 'font-medium text-gray-700 dark:text-gray-200'}`}
          title={row.title}
        >
          {row.title}
        </span>
      </div>

      {/* Owner */}
      <div className="flex items-center px-2 border-r border-gray-200 dark:border-gray-700 truncate text-gray-500 dark:text-gray-400" style={{ width: colWidths.owner }}>
        <span className="truncate">{row.owner || '—'}</span>
      </div>

      {/* Priority */}
      <div className="flex items-center px-1 border-r border-gray-200 dark:border-gray-700" style={{ width: colWidths.priority }}>
        {row.priority
          ? <Tag color={PRIORITY_COLOR[row.priority] || 'default'} style={{ margin: 0, fontSize: 10 }}>{row.priority}</Tag>
          : <span className="text-gray-400">—</span>}
      </div>

      {/* Status */}
      <div className="flex items-center px-1 border-r border-gray-200 dark:border-gray-700" style={{ width: colWidths.status }}>
        <Tag color={STATUS_COLOR[row.status]} style={{ margin: 0, fontSize: 10 }}>{STATUS_LABEL[row.status]}</Tag>
      </div>

      {/* Start */}
      <div className="flex items-center px-1 border-r border-gray-200 dark:border-gray-700" style={{ width: colWidths.start }}>
        {isEditing
          ? <input type="date" className="w-full text-xs border rounded px-1" value={editStart} onChange={e => setEditStart(e.target.value)} />
          : <span className="text-gray-500 dark:text-gray-400 text-xs">{row.start_date || '—'}</span>}
      </div>

      {/* End */}
      <div className="flex items-center px-1" style={{ width: colWidths.end }}>
        {isEditing ? (
          <div className="flex gap-1">
            <input type="date" className="w-full text-xs border rounded px-1" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
            <button className="text-green-600 text-xs" onClick={() => onCommit(row.id)}>✓</button>
            <button className="text-red-500 text-xs" onClick={onCancelEdit}>✕</button>
          </div>
        ) : (
          <span className="text-gray-500 dark:text-gray-400 text-xs">{row.end_date || '—'}</span>
        )}
      </div>
    </div>
  );
}

// ─── date utilities ───────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
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
