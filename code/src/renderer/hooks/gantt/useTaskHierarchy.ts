import { useMemo } from 'react';
import type { WorkPackage } from '@shared/types';

export interface FlatRow {
  wp: WorkPackage;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

export function useTaskHierarchy(
  workPackages: WorkPackage[],
  expandedIds: Set<number>
): FlatRow[] {
  return useMemo(() => {
    // Build parent->children map
    const childrenMap = new Map<number | null, WorkPackage[]>();
    for (const wp of workPackages) {
      const parentId = wp.parent_id;
      if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
      childrenMap.get(parentId)!.push(wp);
    }

    const rows: FlatRow[] = [];
    const walk = (parentId: number | null, depth: number) => {
      const children = childrenMap.get(parentId) || [];
      for (const wp of children) {
        const wpChildren = childrenMap.get(wp.id) || [];
        const hasChildren = wpChildren.length > 0;
        const isExpanded = expandedIds.has(wp.id);
        rows.push({ wp, depth, hasChildren, isExpanded });
        if (hasChildren && isExpanded) {
          walk(wp.id, depth + 1);
        }
      }
    };
    walk(null, 0);
    return rows;
  }, [workPackages, expandedIds]);
}
