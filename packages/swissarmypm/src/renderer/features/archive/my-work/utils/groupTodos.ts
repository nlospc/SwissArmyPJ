/**
 * Todo grouping and sorting utilities
 */

import type { TodoItem, GroupByOption, SortByOption, FilterOption } from '@/stores/useMyWorkStore';
import { isOverdue } from './dateHelpers';

export interface TodoGroup {
  key: string;
  label: string;
  todos: TodoItem[];
  count: number;
}

/**
 * Group todos by specified option
 */
export function groupTodos(todos: TodoItem[], groupBy: GroupByOption): TodoGroup[] {
  const groups = new Map<string, TodoItem[]>();

  for (const todo of todos) {
    let key: string;
    let label: string;

    switch (groupBy) {
      case 'project':
        key = `project-${todo.projectId}`;
        label = todo.projectName || 'No Project';
        break;

      case 'due_date':
        if (!todo.dueDate) {
          key = 'no-due-date';
          label = 'No Due Date';
        } else if (isOverdue(todo.dueDate)) {
          key = 'overdue';
          label = 'Overdue';
        } else {
          const dueDate = new Date(todo.dueDate);
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          if (dueDate.toDateString() === today.toDateString()) {
            key = 'today';
            label = 'Due Today';
          } else if (dueDate.toDateString() === tomorrow.toDateString()) {
            key = 'tomorrow';
            label = 'Due Tomorrow';
          } else {
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);

            if (dueDate <= weekFromNow) {
              key = 'this-week';
              label = 'This Week';
            } else {
              key = 'later';
              label = 'Later';
            }
          }
        }
        break;

      case 'priority':
        key = `priority-${todo.priority || 'none'}`;
        label = getPriorityLabel(todo.priority);
        break;

      case 'status':
        key = `status-${todo.status}`;
        label = getStatusLabel(todo.status);
        break;

      default:
        key = 'all';
        label = 'All Tasks';
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key)!.push(todo);
  }

  // Convert to array and sort groups
  const groupArray: TodoGroup[] = Array.from(groups.entries()).map(([key, todos]) => ({
    key,
    label: todos[0] ? getGroupLabel(groupBy, key, todos[0]) : key,
    todos,
    count: todos.length,
  }));

  // Sort groups by priority
  return sortGroups(groupArray, groupBy);
}

/**
 * Sort todos within a group
 */
export function sortTodos(todos: TodoItem[], sortBy: SortByOption): TodoItem[] {
  const sorted = [...todos];

  switch (sortBy) {
    case 'due_date':
      sorted.sort((a, b) => {
        // No due date goes last
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      break;

    case 'priority':
      sorted.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;

        return aPriority - bPriority;
      });
      break;

    case 'created':
      sorted.sort((a, b) => {
        // Assuming newer UUIDs are created later (not always true, but simple heuristic)
        return b.id - a.id;
      });
      break;

    case 'estimated_time':
      sorted.sort((a, b) => {
        if (!a.estimatedMinutes && !b.estimatedMinutes) return 0;
        if (!a.estimatedMinutes) return 1;
        if (!b.estimatedMinutes) return -1;

        return a.estimatedMinutes - b.estimatedMinutes;
      });
      break;
  }

  return sorted;
}

/**
 * Filter todos by status
 */
export function filterTodos(todos: TodoItem[], filter: FilterOption): TodoItem[] {
  switch (filter) {
    case 'all':
      return todos;

    case 'active':
      return todos.filter((t) => t.status !== 'done');

    case 'overdue':
      return todos.filter((t) => t.dueDate && isOverdue(t.dueDate));

    case 'today':
      return todos.filter((t) => {
        if (!t.dueDate) return false;

        const dueDate = new Date(t.dueDate);
        const today = new Date();

        return dueDate.toDateString() === today.toDateString();
      });

    default:
      return todos;
  }
}

/**
 * Get priority label
 */
function getPriorityLabel(priority: string | null | undefined): string {
  if (!priority || priority === 'none') return 'No Priority';

  const labels: Record<string, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return labels[priority] || priority;
}

/**
 * Get status label
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    done: 'Done',
    blocked: 'Blocked',
  };

  return labels[status] || status;
}

/**
 * Get group label from first todo in group
 */
function getGroupLabel(groupBy: GroupByOption, key: string, firstTodo: TodoItem): string {
  switch (groupBy) {
    case 'project':
      return firstTodo.projectName || 'No Project';

    case 'priority':
      return getPriorityLabel(firstTodo.priority);

    case 'status':
      return getStatusLabel(firstTodo.status);

    case 'due_date':
      // Use key to determine label
      if (key === 'overdue') return 'Overdue';
      if (key === 'today') return 'Due Today';
      if (key === 'tomorrow') return 'Due Tomorrow';
      if (key === 'this-week') return 'This Week';
      if (key === 'later') return 'Later';
      if (key === 'no-due-date') return 'No Due Date';
      return key;

    default:
      return key;
  }
}

/**
 * Sort groups by priority/relevance
 */
function sortGroups(groups: TodoGroup[], groupBy: GroupByOption): TodoGroup[] {
  const sorted = [...groups];

  switch (groupBy) {
    case 'due_date':
      // Order: Overdue, Today, Tomorrow, This Week, Later, No Due Date
      const dueDateOrder = ['overdue', 'today', 'tomorrow', 'this-week', 'later', 'no-due-date'];
      sorted.sort((a, b) => {
        const aIndex = dueDateOrder.indexOf(a.key);
        const bIndex = dueDateOrder.indexOf(b.key);

        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      });
      break;

    case 'priority':
      // Order: Critical, High, Medium, Low, No Priority
      const priorityOrder = ['priority-critical', 'priority-high', 'priority-medium', 'priority-low', 'priority-none'];
      sorted.sort((a, b) => {
        const aIndex = priorityOrder.indexOf(a.key);
        const bIndex = priorityOrder.indexOf(b.key);

        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      });
      break;

    case 'status':
      // Order: In Progress, Not Started, Blocked, Done
      const statusOrder = ['status-in_progress', 'status-not_started', 'status-blocked', 'status-done'];
      sorted.sort((a, b) => {
        const aIndex = statusOrder.indexOf(a.key);
        const bIndex = statusOrder.indexOf(b.key);

        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      });
      break;

    case 'project':
      // Sort alphabetically by project name
      sorted.sort((a, b) => a.label.localeCompare(b.label));
      break;
  }

  return sorted;
}
