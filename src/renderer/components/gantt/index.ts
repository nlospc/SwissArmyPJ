/**
 * Gantt Chart Components
 * Interactive timeline visualization for projects and work items
 */

export { TimelineProvider, useTimeline } from './TimelineProvider';
export type { TimeScale, TimelineViewConfig, TimelineState } from './TimelineProvider';
export { ProjectGanttChart } from './ProjectGanttChart';
export { WorkItemGanttChart } from './WorkItemGanttChart';
export { GanttBar } from './GanttBar';
export type { GanttBarItem } from './GanttBar';
export {
  dateToPixel,
  pixelToDate,
  getDayWidth,
  getTimelineWidth,
  formatDateLabel,
  generateHeaderColumns,
  generateGridLines,
  calculateBarPosition,
  isWeekend,
  snapToGrid,
  getStatusColor,
  getItemIcon,
} from './timeline-utils';
export type { TimelineHeaderColumn, GridLine, BarPosition } from './timeline-utils';
