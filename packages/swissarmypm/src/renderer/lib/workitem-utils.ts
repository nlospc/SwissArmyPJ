/**
 * Work Item Utilities
 * Helpers for building hierarchical structures
 */

import type { WorkItem } from '@/shared/types';

export interface WorkItemNode extends WorkItem {
  children: WorkItemNode[];
  level: number;
}

/**
 * Build a tree structure from flat work items
 */
export function buildWorkItemTree(workItems: WorkItem[]): WorkItemNode[] {
  const itemMap = new Map<number, WorkItemNode>();
  const rootItems: WorkItemNode[] = [];

  // First pass: create nodes
  workItems.forEach((item) => {
    itemMap.set(item.id, {
      ...item,
      children: [],
      level: 0,
    });
  });

  // Second pass: build hierarchy
  workItems.forEach((item) => {
    const node = itemMap.get(item.id);
    if (!node) return;

    if (item.parent_id && itemMap.has(item.parent_id)) {
      const parent = itemMap.get(item.parent_id)!;
      parent.children.push(node);
      node.level = parent.level + 1;
    } else {
      rootItems.push(node);
    }
  });

  return rootItems;
}

/**
 * Get all descendants of a work item
 */
export function getDescendants(itemId: number, workItems: WorkItem[]): WorkItem[] {
  const children = workItems.filter((w) => w.parent_id === itemId);
  const descendants: WorkItem[] = [...children];

  children.forEach((child) => {
    descendants.push(...getDescendants(child.id, workItems));
  });

  return descendants;
}

/**
 * Get all ancestors of a work item
 */
export function getAncestors(itemId: number, workItems: WorkItem[]): WorkItem[] {
  const ancestors: WorkItem[] = [];
  let currentItem = workItems.find((w) => w.id === itemId);

  while (currentItem?.parent_id) {
    const parent = workItems.find((w) => w.id === currentItem!.parent_id);
    if (parent) {
      ancestors.unshift(parent);
      currentItem = parent;
    } else {
      break;
    }
  }

  return ancestors;
}

/**
 * Calculate completion progress for a work item based on its children
 */
export function calculateProgress(itemId: number, workItems: WorkItem[]): number {
  const children = workItems.filter((w) => w.parent_id === itemId);

  if (children.length === 0) {
    const item = workItems.find((w) => w.id === itemId);
    return getStatusProgress(item?.status || 'not_started');
  }

  const totalProgress = children.reduce((sum, child) => {
    return sum + calculateProgress(child.id, workItems);
  }, 0);

  return Math.round(totalProgress / children.length);
}

/**
 * Get progress percentage based on status
 */
export function getStatusProgress(status: string): number {
  const progressMap: Record<string, number> = {
    done: 100,
    in_progress: 50,
    blocked: 25,
    not_started: 0,
  };
  return progressMap[status] || 0;
}

/**
 * Get work item level for indentation
 */
export function getWorkItemLevel(itemId: number, workItems: WorkItem[]): number {
  const ancestors = getAncestors(itemId, workItems);
  return ancestors.length;
}
