/**
 * Timeline Adapter - Convert database models to vis-timeline format
 *
 * Transforms Project and WorkItem entities into vis-timeline compatible items
 */

import type { Project, WorkItem } from '@/shared/types';
import type { VisTimelineItem } from './VisTimelineWrapper';
import type { TimelineGroup } from 'vis-timeline/types';

/**
 * Convert WorkItems to vis-timeline items
 */
export function workItemsToTimelineItems(workItems: WorkItem[]): VisTimelineItem[] {
  return workItems.map(item => {
    const isMilestone = item.type === 'milestone';
    const hasEndDate = item.end_date != null;

    // Determine item type
    let type: 'box' | 'point' | 'range' = 'range';
    if (isMilestone) {
      type = 'point';
    } else if (!hasEndDate) {
      type = 'box'; // Single day event
    }

    // Generate CSS class for styling
    const classNames = [
      `timeline-${item.type}`,
      `status-${item.status}`,
    ];

    // Build tooltip content
    const tooltipParts = [
      `${item.type}: ${item.title}`,
      `Status: ${item.status}`,
    ];
    if (item.start_date) {
      tooltipParts.push(`Start: ${item.start_date}`);
    }
    if (item.end_date) {
      tooltipParts.push(`End: ${item.end_date}`);
    }
    if (item.notes) {
      tooltipParts.push(`Notes: ${item.notes}`);
    }

    return {
      id: item.id,
      content: item.title,
      start: item.start_date || new Date().toISOString(),
      end: item.end_date,
      type,
      className: classNames.join(' '),
      group: item.parent_id || 'root',
      title: tooltipParts.join('\n'),
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

    // Generate CSS class for styling
    const classNames = [
      'timeline-project',
      `status-${project.status}`,
    ];

    // Build tooltip content
    const tooltipParts = [
      `Project: ${project.name}`,
      `Status: ${project.status}`,
    ];
    if (project.owner) {
      tooltipParts.push(`Owner: ${project.owner}`);
    }
    if (project.start_date) {
      tooltipParts.push(`Start: ${project.start_date}`);
    }
    if (project.end_date) {
      tooltipParts.push(`End: ${project.end_date}`);
    }
    if (project.description) {
      tooltipParts.push(`Description: ${project.description}`);
    }

    return {
      id: project.id,
      content: project.name,
      start: project.start_date || new Date().toISOString(),
      end: project.end_date || undefined,
      type: hasEndDate ? 'range' : 'box',
      className: classNames.join(' '),
      group: project.portfolio_id?.toString() || 'unassigned',
      title: tooltipParts.join('\n'),
      editable: {
        updateTime: true,
        updateGroup: true,
        remove: false,
      },
    };
  });
}

/**
 * Convert WorkItems to groups (for hierarchical display)
 */
export function workItemsToGroups(workItems: WorkItem[]): TimelineGroup[] {
  // Create groups for parent items only
  const parentItems = workItems.filter(item => item.parent_id == null);

  const groups: TimelineGroup[] = [
    {
      id: 'root',
      content: 'Top Level',
    },
  ];

  parentItems.forEach(item => {
    groups.push({
      id: item.id,
      content: item.title,
      className: `group-${item.type}`,
    });
  });

  return groups;
}

/**
 * Convert Portfolios to groups (for project grouping)
 */
export function portfoliosToGroups(
  portfolios: Array<{ id: number; name: string }>
): TimelineGroup[] {
  const groups: TimelineGroup[] = portfolios.map(portfolio => ({
    id: portfolio.id.toString(),
    content: portfolio.name,
    className: 'group-portfolio',
  }));

  // Add unassigned group
  groups.push({
    id: 'unassigned',
    content: 'Unassigned',
    className: 'group-unassigned',
  });

  return groups;
}

/**
 * Convert vis-timeline item update back to database format
 */
export function timelineItemToWorkItemUpdate(
  item: VisTimelineItem
): Partial<WorkItem> {
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
export function timelineItemToProjectUpdate(
  item: VisTimelineItem
): Partial<Project> {
  return {
    start_date: typeof item.start === 'string' ? item.start : item.start.toISOString().split('T')[0],
    end_date: item.end
      ? typeof item.end === 'string'
        ? item.end
        : item.end.toISOString().split('T')[0]
      : undefined,
    portfolio_id: item.group && item.group !== 'unassigned'
      ? Number(item.group)
      : undefined,
  };
}

/**
 * Calculate date range for timeline view
 */
export function calculateDateRange(
  items: Array<{ start_date?: string | null; end_date?: string | null }>
): { start: Date; end: Date } {
  if (items.length === 0) {
    // Default to current month if no items
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
      if (!minDate || start < minDate) {
        minDate = start;
      }
    }
    if (item.end_date) {
      const end = new Date(item.end_date);
      if (!maxDate || end > maxDate) {
        maxDate = end;
      }
    }
  });

  // Add padding (1 week before and after)
  const padding = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
  const start = minDate ? new Date(minDate.getTime() - padding) : new Date();
  const end = maxDate ? new Date(maxDate.getTime() + padding) : new Date();

  return { start, end };
}

/**
 * Get status color for styling
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    done: '#52c41a',
    in_progress: '#1677ff',
    blocked: '#ff4d4f',
    not_started: '#d9d9d9',
  };
  return colors[status] || '#d9d9d9';
}

/**
 * Get type color for styling
 */
export function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    task: '#1677ff',
    issue: '#ff4d4f',
    milestone: '#722ed1',
    phase: '#52c41a',
    remark: '#faad14',
    clash: '#d9534f',
  };
  return colors[type] || '#1677ff';
}
