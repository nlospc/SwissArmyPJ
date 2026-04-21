/**
 * Gantt Chart Types
 */

export type GanttViewMode = 'day' | 'week' | 'month' | 'quarter';

export interface GanttDateRange {
  startDate: Date;
  endDate: Date;
}

export interface GanttBar {
  id: string | number;
  name: string;
  startDate: Date;
  endDate: Date;
  progress?: number;
  status?: string;
  color?: string;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

export interface GanttGroup {
  id: string | number;
  name: string;
  bars: GanttBar[];
  expanded?: boolean;
}

export interface GanttChartData {
  groups: GanttGroup[];
  dateRange: GanttDateRange;
}

export interface GanttConfig {
  viewMode: GanttViewMode;
  showWeekends: boolean;
  showMilestones: boolean;
  barHeight: number;
  rowHeight: number;
  headerHeight: number;
  dayWidth: number;
}

export const DEFAULT_GANTT_CONFIG: GanttConfig = {
  viewMode: 'month',
  showWeekends: true,
  showMilestones: true,
  barHeight: 28,
  rowHeight: 40,
  headerHeight: 50,
  dayWidth: 30,
};
