/**
 * Timeline utility functions for Gantt chart calculations
 */

import dayjs, { Dayjs } from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import type { TimeScale } from './TimelineProvider';

dayjs.extend(quarterOfYear);
dayjs.extend(weekOfYear);

/**
 * Convert a date to pixel position on the timeline
 */
export function dateToPixel(
  date: Dayjs,
  viewStart: Dayjs,
  columnWidth: number,
  scale: TimeScale
): number {
  const diff = date.diff(viewStart, 'day');
  const dayWidth = getDayWidth(scale, columnWidth);
  return diff * dayWidth;
}

/**
 * Convert pixel position to date
 */
export function pixelToDate(
  pixel: number,
  viewStart: Dayjs,
  columnWidth: number,
  scale: TimeScale
): Dayjs {
  const dayWidth = getDayWidth(scale, columnWidth);
  const days = pixel / dayWidth;
  return viewStart.add(days, 'day');
}

/**
 * Get the width of one day in pixels for the given scale
 */
export function getDayWidth(scale: TimeScale, columnWidth: number): number {
  switch (scale) {
    case 'day':
      return columnWidth; // 40px per day
    case 'week':
      return columnWidth / 7; // 200px / 7 = ~28.6px per day
    case 'month':
      return columnWidth / 30; // 400px / 30 = ~13.3px per day
    case 'quarter':
      return columnWidth / 90; // 800px / 90 = ~8.9px per day
  }
}

/**
 * Calculate total timeline width in pixels
 */
export function getTimelineWidth(
  viewStart: Dayjs,
  viewEnd: Dayjs,
  columnWidth: number,
  scale: TimeScale
): number {
  const dayWidth = getDayWidth(scale, columnWidth);
  const totalDays = viewEnd.diff(viewStart, 'day');
  return totalDays * dayWidth;
}

/**
 * Get the display text for a date based on scale
 */
export function formatDateLabel(date: Dayjs, scale: TimeScale): string {
  switch (scale) {
    case 'day':
      return date.format('MMM DD');
    case 'week':
      return date.format('MMM DD');
    case 'month':
      return date.format('MMM YYYY');
    case 'quarter':
      return `Q${date.quarter()} ${date.format('YYYY')}`;
  }
}

/**
 * Generate header columns for the timeline
 */
export interface TimelineHeaderColumn {
  key: string;
  label: string;
  start: Dayjs;
  end: Dayjs;
  width: number;
  isWeekend?: boolean;
}

export function generateHeaderColumns(
  viewStart: Dayjs,
  viewEnd: Dayjs,
  scale: TimeScale
): TimelineHeaderColumn[] {
  const columns: TimelineHeaderColumn[] = [];
  let current = viewStart.clone();

  while (current.isBefore(viewEnd)) {
    let start: Dayjs;
    let end: Dayjs;
    let label: string;
    let width: number;

    switch (scale) {
      case 'day':
        start = current.startOf('day');
        end = current.endOf('day');
        label = current.format('DD');
        width = 40;
        current = current.add(1, 'day');
        break;

      case 'week':
        start = current.startOf('week');
        end = current.endOf('week');
        label = `W${current.week()}`;
        width = 200;
        current = current.add(1, 'week');
        break;

      case 'month':
        start = current.startOf('month');
        end = current.endOf('month');
        label = current.format('MMM');
        width = 400;
        current = current.add(1, 'month');
        break;

      case 'quarter':
        start = current.startOf('quarter');
        end = current.endOf('quarter');
        label = `Q${current.quarter()}`;
        width = 800;
        current = current.add(1, 'quarter');
        break;
    }

    columns.push({
      key: start.toISOString(),
      label,
      start,
      end,
      width,
      isWeekend: scale === 'day' && (start.day() === 0 || start.day() === 6),
    });
  }

  return columns;
}

/**
 * Generate vertical grid lines for the timeline
 */
export interface GridLine {
  x: number;
  type: 'major' | 'minor';
  date: Dayjs;
}

export function generateGridLines(
  viewStart: Dayjs,
  viewEnd: Dayjs,
  scale: TimeScale,
  columnWidth: number
): GridLine[] {
  const lines: GridLine[] = [];
  let current = viewStart.clone();

  while (current.isBefore(viewEnd)) {
    const x = dateToPixel(current, viewStart, columnWidth, scale);

    switch (scale) {
      case 'day':
        lines.push({ x, type: 'major', date: current.clone() });
        current = current.add(1, 'day');
        break;

      case 'week':
        lines.push({ x, type: 'major', date: current.clone() });
        // Add minor lines for each day in the week
        for (let i = 1; i < 7; i++) {
          const dayDate = current.add(i, 'day');
          if (dayDate.isBefore(viewEnd)) {
            lines.push({
              x: dateToPixel(dayDate, viewStart, columnWidth, scale),
              type: 'minor',
              date: dayDate,
            });
          }
        }
        current = current.add(1, 'week');
        break;

      case 'month':
        lines.push({ x, type: 'major', date: current.clone() });
        // Add minor lines for weeks
        for (let i = 1; i < 4; i++) {
          const weekDate = current.add(i * 7, 'day');
          if (weekDate.isBefore(viewEnd)) {
            lines.push({
              x: dateToPixel(weekDate, viewStart, columnWidth, scale),
              type: 'minor',
              date: weekDate,
            });
          }
        }
        current = current.add(1, 'month');
        break;

      case 'quarter':
        lines.push({ x, type: 'major', date: current.clone() });
        // Add minor lines for months
        for (let i = 1; i < 3; i++) {
          const monthDate = current.add(i, 'month');
          if (monthDate.isBefore(viewEnd)) {
            lines.push({
              x: dateToPixel(monthDate, viewStart, columnWidth, scale),
              type: 'minor',
              date: monthDate,
            });
          }
        }
        current = current.add(1, 'quarter');
        break;
    }
  }

  return lines;
}

/**
 * Calculate bar position and width for an item
 */
export interface BarPosition {
  x: number;
  width: number;
  start: Dayjs;
  end: Dayjs;
}

export function calculateBarPosition(
  startDate: Dayjs | null | undefined,
  endDate: Dayjs | null | undefined,
  viewStart: Dayjs,
  columnWidth: number,
  scale: TimeScale,
  minBarWidth: number = 4
): BarPosition | null {
  if (!startDate) {
    return null;
  }

  const end = endDate || startDate;
  const start = startDate;

  const x = dateToPixel(start, viewStart, columnWidth, scale);
  const endX = dateToPixel(end, viewStart, columnWidth, scale);
  let width = Math.max(endX - x, minBarWidth);

  return { x, width, start, end };
}

/**
 * Check if a date is a weekend
 */
export function isWeekend(date: Dayjs): boolean {
  const day = date.day();
  return day === 0 || day === 6;
}

/**
 * Snap a date to the nearest grid line based on scale
 */
export function snapToGrid(date: Dayjs, scale: TimeScale): Dayjs {
  switch (scale) {
    case 'day':
      return date.startOf('day');
    case 'week':
      return date.startOf('week');
    case 'month':
      return date.startOf('month');
    case 'quarter':
      return date.startOf('quarter');
  }
}

/**
 * Get the color for an item based on its status
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    // Story/Task statuses
    Backlog: '#9ca3af', // gray
    Ready: '#3b82f6', // blue
    'In Progress': '#2563eb', // dark blue
    'In Review': '#8b5cf6', // purple
    'In Test': '#f59e0b', // orange
    Done: '#10b981', // green
    Blocked: '#ef4444', // red

    // Bug statuses
    New: '#ef4444', // red
    Triage: '#f59e0b', // orange
    'In Fix': '#3b82f6', // blue
    'In Verification': '#8b5cf6', // purple
    Closed: '#10b981', // green

    // Spike statuses
    Proposed: '#9ca3af', // gray
    'In Research': '#3b82f6', // blue
    'Findings Ready': '#f59e0b', // orange
  };

  return colorMap[status] || '#9ca3af';
}

/**
 * Get the icon for an item type
 */
export function getItemIcon(type: string): string {
  const iconMap: Record<string, string> = {
    Task: '📝',
    Story: '📖',
    Bug: '🐛',
    Spike: '🔬',
    Milestone: '◆',
    Epic: '📚',
    Phase: '▼',
  };

  return iconMap[type] || '📄';
}
