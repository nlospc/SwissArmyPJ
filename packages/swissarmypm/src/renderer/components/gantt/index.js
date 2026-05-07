/**
 * Gantt Chart Components
 * Interactive timeline visualization for projects and work items
 */
// vis-timeline integration (new implementation)
export { VisTimelineWrapper } from './VisTimelineWrapper';
export { workItemsToTimelineItems, projectsToTimelineItems, workItemsToGroups, portfoliosToGroups, timelineItemToWorkItemUpdate, timelineItemToProjectUpdate, calculateDateRange, getStatusColor as getStatusColorAdapter, getTypeColor, } from './timeline-adapter';
// Legacy custom implementation (will be deprecated)
export { TimelineProvider, useTimeline } from './TimelineProvider';
export { ProjectGanttChart } from './ProjectGanttChart';
export { WorkItemGanttChart } from './WorkItemGanttChart';
export { GanttBar } from './GanttBar';
export { dateToPixel, pixelToDate, getDayWidth, getTimelineWidth, formatDateLabel, generateHeaderColumns, generateGridLines, calculateBarPosition, isWeekend, snapToGrid, getStatusColor, getItemIcon, } from './timeline-utils';
