/**
 * Timeline Adapter - Convert database models to vis-timeline format
 *
 * Transforms Project and WorkItem entities into vis-timeline compatible items
 */

import type { Project, WorkItem, Portfolio } from '@/shared/types';
import type { VisTimelineItem } from './VisTimelineWrapper';
import type { TimelineGroup } from 'vis-timeline';

/**
 * Convert WorkItems to vis-timeline items
 */
export function workItemsToTimelineItems(workItems: WorkItem[]): VisTimelineItem[] {
  return workItems.map(item => {
    const isMilestone = item.type === 'milestone';
    const isPhase = item.type === 'phase';
    const hasEndDate = item.end_date != null;

    // Determine item type

    let type: 'box' | 'point' | 'range' | 'background' = 'range';

    if (isMilestone) {

      type = 'point';

    } else if (isPhase) {

      type = 'range';

    } else if (!hasEndDate) {

      type = 'box';

    }


    // Generate CSS class for styling
    const classNames = [
      `timeline-${item.type}`,
      `status-${item.status}`,
    ];

    return {

      id: item.id,

      content: isPhase ? '' : item.title,

      start: item.start_date ? new Date(item.start_date) : new Date(),

      end: item.end_date ? new Date(item.end_date) : undefined,

      type,

      className: classNames.join(' '),

      group: item.parent_id || 'root',
      title: `${item.type.toUpperCase()}: ${item.title} (${item.status})`,
      editable: {
        updateTime: true,
        updateGroup: false,
        remove: false,
      },
    };
  });
}

/**
 * Convert Projects to vis-timeline items
 */
export function projectsToTimelineItems(projects: Project[]): VisTimelineItem[] {
  return projects.map(project => {
    const hasEndDate = project.end_date != null;

    return {
      id: project.id,
      content: project.name,
      start: project.start_date ? new Date(project.start_date) : new Date(),
      end: project.end_date ? new Date(project.end_date) : undefined,
      type: hasEndDate ? 'range' : 'box',
      className: `timeline-project status-${project.status}`,
      group: project.portfolio_id || 'unassigned',
      title: `PROJECT: ${project.name} (${project.status})`,
      editable: {
        updateTime: true,
        updateGroup: true,
        remove: false,
      },
    };
  });
}

/**
 * Convert WorkItems to groups (Phases as groups)
 */
export function workItemsToGroups(workItems: WorkItem[]): TimelineGroup[] {
  const groups: TimelineGroup[] = [
    { id: 'root', content: 'Tasks' },
  ];

  workItems.filter(item => item.type === 'phase').forEach(phase => {
    groups.push({
      id: phase.id,
      content: phase.title,
      className: 'group-phase',
    });
  });

  return groups;
}

/**
 * Convert Portfolios to groups
 */
export function portfoliosToGroups(portfolios: Portfolio[]): TimelineGroup[] {
  const groups: TimelineGroup[] = portfolios.map(p => ({
    id: p.id,
    content: p.name,
    className: 'group-portfolio',
  }));

  groups.push({ id: 'unassigned', content: 'Individual Projects' });
  return groups;
}

/**
 * Convert vis-timeline item update back to database format
 */
export function timelineItemToWorkItemUpdate(item: VisTimelineItem): Partial<WorkItem> {
  return {
    start_date: typeof item.start === 'string' ? item.start : item.start.toISOString().split('T')[0],
    end_date: item.end
      ? typeof item.end === 'string'
        ? item.end
        : item.end.toISOString().split('T')[0]
      : undefined,
  };
}

/**
 * Convert vis-timeline item update back to Project format
 */
export function timelineItemToProjectUpdate(item: VisTimelineItem): Partial<Project> {
  return {
    start_date: typeof item.start === 'string' ? item.start : item.start.toISOString().split('T')[0],
    end_date: item.end
      ? typeof item.end === 'string'
        ? item.end
        : item.end.toISOString().split('T')[0]
      : undefined,
    portfolio_id: typeof item.group === 'number' ? item.group : undefined,
  };
}

/**
 * Calculate date range for timeline view
 */
export function calculateDateRange(
  items: Array<{ start_date?: string | null; end_date?: string | null }>
): { start: Date; end: Date } {
  if (items.length === 0) {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  }

  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  items.forEach(item => {
    if (item.start_date) {
      const start = new Date(item.start_date);
      if (!minDate || start < minDate) minDate = start;
    }
    if (item.end_date) {
      const end = new Date(item.end_date);
      if (!maxDate || end > maxDate) maxDate = end;
    }
  });

  const padding = 14 * 24 * 60 * 60 * 1000; // 2 weeks padding
  const startBase = minDate ?? new Date();
  const endBase = maxDate ?? new Date();
  const start = new Date(startBase.getTime() - padding);
  const end = new Date(endBase.getTime() + padding * 2);

  return { start, end };
}
