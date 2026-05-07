import { jsx as _jsx } from "react/jsx-runtime";
/**
 * VisTimelineWrapper - React wrapper for vis-timeline library
 *
 * Provides a React-friendly interface to vis-timeline with:
 * - Lifecycle management (mount, update, unmount)
 * - Event handling (drag, click, zoom)
 * - Data synchronization between React state and vis-timeline DataSet
 */
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
function normalizeTimelineValue(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (Array.isArray(value)) {
        return value.map(normalizeTimelineValue);
    }
    if (value && typeof value === 'object') {
        return Object.keys(value)
            .sort()
            .reduce((accumulator, key) => {
            accumulator[key] = normalizeTimelineValue(value[key]);
            return accumulator;
        }, {});
    }
    return value;
}
function isSameTimelineRecord(current, next) {
    return JSON.stringify(normalizeTimelineValue(current)) === JSON.stringify(normalizeTimelineValue(next));
}
export const VisTimelineWrapper = forwardRef(({ items, groups, options, className, style, onItemClick, onItemDoubleClick, onItemUpdate, onItemMove, onItemAdd, onItemRemove, onRangeChange, onSelect, }, ref) => {
    const containerRef = useRef(null);
    const timelineRef = useRef(null);
    const itemsDataSetRef = useRef(new DataSet());
    const groupsDataSetRef = useRef(new DataSet());
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
        if (!containerRef.current)
            return;
        // Default options with CRUD callbacks integrated
        const mergedOptions = {
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
            onUpdate: (item, callback) => {
                if (handlersRef.current.onItemUpdate) {
                    handlersRef.current.onItemUpdate(item, callback);
                }
                else {
                    callback(item);
                }
            },
            onMove: (item, callback) => {
                if (handlersRef.current.onItemMove) {
                    handlersRef.current.onItemMove(item, callback);
                }
                else if (handlersRef.current.onItemUpdate) {
                    handlersRef.current.onItemUpdate(item, callback);
                }
                else {
                    callback(item);
                }
            },
            onAdd: (item, callback) => {
                if (handlersRef.current.onItemAdd) {
                    handlersRef.current.onItemAdd(item, callback);
                }
                else {
                    callback(null);
                }
            },
            onRemove: (item, callback) => {
                if (handlersRef.current.onItemRemove) {
                    handlersRef.current.onItemRemove(item, callback);
                }
                else {
                    callback(null);
                }
            },
            ...options,
        };
        // Create timeline
        timelineRef.current = new Timeline(containerRef.current, itemsDataSetRef.current, groups ? groupsDataSetRef.current : undefined, mergedOptions);
        // Event listeners for non-CRUD events
        timelineRef.current.on('click', (props) => {
            if (props.item && handlersRef.current.onItemClick) {
                const item = itemsDataSetRef.current.get(props.item);
                if (item)
                    handlersRef.current.onItemClick(item);
            }
        });
        timelineRef.current.on('doubleClick', (props) => {
            if (props.item && handlersRef.current.onItemDoubleClick) {
                const item = itemsDataSetRef.current.get(props.item);
                if (item)
                    handlersRef.current.onItemDoubleClick(item);
            }
        });
        timelineRef.current.on('select', (props) => {
            if (handlersRef.current.onSelect)
                handlersRef.current.onSelect(props);
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
        if (!itemsDataSet)
            return;
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
            itemsDataSet.update(itemsToUpsert);
        }
    }, [items]);
    useEffect(() => {
        const groupsDataSet = groupsDataSetRef.current;
        if (!groupsDataSet)
            return;
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
            groupsDataSet.update(groupsToUpsert);
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
        moveTo: (date) => {
            timelineRef.current?.moveTo(date);
        },
        fit: () => {
            timelineRef.current?.fit();
        },
        setWindow: (start, end) => {
            timelineRef.current?.setWindow(start, end, { animation: true });
        },
    }), []);
    return (_jsx("div", { ref: containerRef, className: className, style: {
            width: '100%',
            height: '100%',
            minHeight: '200px', // Ensure visibility
            ...style,
        } }));
});
VisTimelineWrapper.displayName = 'VisTimelineWrapper';
