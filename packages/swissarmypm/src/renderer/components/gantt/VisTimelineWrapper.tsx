/**
 * VisTimelineWrapper - React wrapper for vis-timeline library
 *
 * Provides a React-friendly interface to vis-timeline with:
 * - Lifecycle management (mount, update, unmount)
 * - Event handling (drag, click, zoom)
 * - Data synchronization between React state and vis-timeline DataSet
 */

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import { Timeline } from 'vis-timeline/standalone';

import { DataSet } from 'vis-data';

import type { TimelineOptions, TimelineItem, TimelineGroup } from 'vis-timeline';

import 'vis-timeline/styles/vis-timeline-graph2d.css';



function normalizeTimelineValue(value: unknown): unknown {

  if (value instanceof Date) {

    return value.toISOString();

  }



  if (Array.isArray(value)) {

    return value.map(normalizeTimelineValue);

  }



  if (value && typeof value === 'object') {

    return Object.keys(value as Record<string, unknown>)

      .sort()

      .reduce<Record<string, unknown>>((accumulator, key) => {

        accumulator[key] = normalizeTimelineValue((value as Record<string, unknown>)[key]);

        return accumulator;

      }, {});

  }



  return value;

}



function isSameTimelineRecord(current: unknown, next: unknown): boolean {

  return JSON.stringify(normalizeTimelineValue(current)) === JSON.stringify(normalizeTimelineValue(next));

}


export interface VisTimelineItem {
  id: string | number;
  content: string;
  start: Date | string;
  end?: Date | string;
  type?: 'box' | 'point' | 'range' | 'background';
  className?: string;
  group?: string | number;
  title?: string;
  editable?: boolean | {
    updateTime?: boolean;
    updateGroup?: boolean;
    remove?: boolean;
  };
  style?: string;
}

export interface VisTimelineWrapperProps {
  items: VisTimelineItem[];
  groups?: TimelineGroup[];
  options?: TimelineOptions;
  className?: string;
  style?: React.CSSProperties;

  // Event handlers
  onItemClick?: (item: VisTimelineItem) => void;
  onItemDoubleClick?: (item: VisTimelineItem) => void;
  onItemUpdate?: (item: VisTimelineItem, callback: (item: VisTimelineItem | null) => void) => void;
  onItemMove?: (item: VisTimelineItem, callback: (item: VisTimelineItem | null) => void) => void;
  onItemAdd?: (item: VisTimelineItem, callback: (item: VisTimelineItem | null) => void) => void;
  onItemRemove?: (item: VisTimelineItem, callback: (item: VisTimelineItem | null) => void) => void;
  onRangeChange?: (properties: { start: Date; end: Date; byUser: boolean }) => void;
  onSelect?: (properties: { items: Array<string | number>; event: any }) => void;
}

export interface VisTimelineHandle {
  zoomIn: (percentage?: number) => void;
  zoomOut: (percentage?: number) => void;
  moveTo: (date: Date) => void;
  fit: () => void;
  setWindow: (start: Date, end: Date) => void;
}

export const VisTimelineWrapper = forwardRef<VisTimelineHandle, VisTimelineWrapperProps>(({
  items,
  groups,
  options,
  className,
  style,
  onItemClick,
  onItemDoubleClick,
  onItemUpdate,
  onItemMove,
  onItemAdd,
  onItemRemove,
  onRangeChange,
  onSelect,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const itemsDataSetRef = useRef<DataSet<TimelineItem>>(new DataSet<TimelineItem>());
  const groupsDataSetRef = useRef<DataSet<TimelineGroup>>(new DataSet<TimelineGroup>());

  // Latest handlers ref to avoid re-initializing timeline when handlers change
  const handlersRef = useRef({
    onItemUpdate,
    onItemMove,
    onItemAdd,
    onItemRemove,
    onItemClick,
    onItemDoubleClick,
    onSelect,
    onRangeChange
  });

  useEffect(() => {
    handlersRef.current = {
      onItemUpdate,
      onItemMove,
      onItemAdd,
      onItemRemove,
      onItemClick,
      onItemDoubleClick,
      onSelect,
      onRangeChange
    };
  }, [onItemUpdate, onItemMove, onItemAdd, onItemRemove, onItemClick, onItemDoubleClick, onSelect, onRangeChange]);

  // Initialize timeline on mount
  useEffect(() => {
    if (!containerRef.current) return;

    // Default options with CRUD callbacks integrated
    const mergedOptions: TimelineOptions = {
      width: '100%',
      height: '100%',
      editable: {
        updateTime: true,
        updateGroup: false,
        add: false,
        remove: false,
      },
      stack: false,
      orientation: 'top',
      zoomMin: 1000 * 60 * 60 * 24 * 3, // 3 days
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 5, // 5 years
      margin: {
        item: { horizontal: 0, vertical: 8 },
        axis: 5,
      },
      // Bridge vis-timeline callbacks to React props
      onUpdate: (item: any, callback: any) => {
        if (handlersRef.current.onItemUpdate) {
          handlersRef.current.onItemUpdate(item as VisTimelineItem, callback);
        } else {
          callback(item);
        }
      },
      onMove: (item: any, callback: any) => {
        if (handlersRef.current.onItemMove) {
          handlersRef.current.onItemMove(item as VisTimelineItem, callback);
        } else if (handlersRef.current.onItemUpdate) {
          handlersRef.current.onItemUpdate(item as VisTimelineItem, callback);
        } else {
          callback(item);
        }
      },
      onAdd: (item: any, callback: any) => {
        if (handlersRef.current.onItemAdd) {
          handlersRef.current.onItemAdd(item as VisTimelineItem, callback);
        } else {
          callback(null);
        }
      },
      onRemove: (item: any, callback: any) => {
        if (handlersRef.current.onItemRemove) {
          handlersRef.current.onItemRemove(item as VisTimelineItem, callback);
        } else {
          callback(null);
        }
      },
      ...options,
    };

    // Create timeline
    timelineRef.current = new Timeline(
      containerRef.current,
      itemsDataSetRef.current as any,
      groups ? (groupsDataSetRef.current as any) : undefined,
      mergedOptions
    );

    // Event listeners for non-CRUD events
    timelineRef.current.on('click', (props) => {
      if (props.item && handlersRef.current.onItemClick) {
        const item = itemsDataSetRef.current.get(props.item);
        if (item) handlersRef.current.onItemClick(item as any);
      }
    });

    timelineRef.current.on('doubleClick', (props) => {
      if (props.item && handlersRef.current.onItemDoubleClick) {
        const item = itemsDataSetRef.current.get(props.item);
        if (item) handlersRef.current.onItemDoubleClick(item as any);
      }
    });

    timelineRef.current.on('select', (props) => {
      if (handlersRef.current.onSelect) handlersRef.current.onSelect(props);
    });

    timelineRef.current.on('rangechanged', (props) => {
      if (handlersRef.current.onRangeChange) {
        handlersRef.current.onRangeChange({
          start: props.start,
          end: props.end,
          byUser: props.byUser
        });
      }
    });

    // Cleanup
    return () => {
      if (timelineRef.current) {
        timelineRef.current.destroy();
        timelineRef.current = null;
      }
    };
  }, []); // Run once

  // Update DataSets when items/groups change

  useEffect(() => {

    const itemsDataSet = itemsDataSetRef.current;

    if (!itemsDataSet) return;



    const nextItemsById = new Map(items.map((item) => [item.id, item]));

    const currentIds = itemsDataSet.getIds();

    const idsToRemove = currentIds.filter((id) => !nextItemsById.has(id));



    if (idsToRemove.length > 0) {

      itemsDataSet.remove(idsToRemove);

    }



    const itemsToUpsert = items.filter((item) => {

      const currentItem = itemsDataSet.get(item.id);

      return !currentItem || !isSameTimelineRecord(currentItem, item);

    });



    if (itemsToUpsert.length > 0) {

      itemsDataSet.update(itemsToUpsert as any);

    }

  }, [items]);



  useEffect(() => {

    const groupsDataSet = groupsDataSetRef.current;

    if (!groupsDataSet) return;



    if (!groups || groups.length === 0) {

      const currentIds = groupsDataSet.getIds();

      if (currentIds.length > 0) {

        groupsDataSet.remove(currentIds);

      }

      return;

    }



    const nextGroupsById = new Map(groups.map((group) => [group.id, group]));

    const currentIds = groupsDataSet.getIds();

    const idsToRemove = currentIds.filter((id) => !nextGroupsById.has(id));



    if (idsToRemove.length > 0) {

      groupsDataSet.remove(idsToRemove);

    }



    const groupsToUpsert = groups.filter((group) => {

      const currentGroup = groupsDataSet.get(group.id);

      return !currentGroup || !isSameTimelineRecord(currentGroup, group);

    });



    if (groupsToUpsert.length > 0) {

      groupsDataSet.update(groupsToUpsert as any);

    }

  }, [groups]);


  // Update options dynamically
  useEffect(() => {
    if (timelineRef.current && options) {
      timelineRef.current.setOptions(options);
    }
  }, [options]);

  useImperativeHandle(ref, () => ({
    zoomIn: (percentage = 0.2) => {
      timelineRef.current?.zoomIn(percentage);
    },
    zoomOut: (percentage = 0.2) => {
      timelineRef.current?.zoomOut(percentage);
    },
    moveTo: (date: Date) => {
      timelineRef.current?.moveTo(date);
    },
    fit: () => {
      timelineRef.current?.fit();
    },
    setWindow: (start: Date, end: Date) => {
      timelineRef.current?.setWindow(start, end, { animation: true });
    },
  }), []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '200px', // Ensure visibility
        ...style,
      }}
    />
  );
});

VisTimelineWrapper.displayName = 'VisTimelineWrapper';
