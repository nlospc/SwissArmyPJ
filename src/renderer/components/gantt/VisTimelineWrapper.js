import { jsx as _jsx } from "react/jsx-runtime";
/**
 * VisTimelineWrapper - React wrapper for vis-timeline library
 *
 * Provides a React-friendly interface to vis-timeline with:
 * - Lifecycle management (mount, update, unmount)
 * - Event handling (drag, click, zoom)
 * - TypeScript support
 * - Data synchronization between React state and vis-timeline DataSet
 */
import { useRef, useEffect, useCallback } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
export const VisTimelineWrapper = ({ items, groups, options, className, style, onItemClick, onItemDoubleClick, onItemUpdate, onItemMove, onItemAdd, onItemRemove, onRangeChange, onSelect, }) => {
    const containerRef = useRef(null);
    const timelineRef = useRef(null);
    const itemsDataSetRef = useRef(null);
    const groupsDataSetRef = useRef(null);
    // Initialize timeline on mount
    useEffect(() => {
        if (!containerRef.current)
            return;
        // Create DataSets
        itemsDataSetRef.current = new DataSet(items);
        groupsDataSetRef.current = groups ? new DataSet(groups) : undefined;
        // Default options
        const defaultOptions = {
            editable: {
                updateTime: true,
                updateGroup: false,
                add: false,
                remove: false,
            },
            stack: true,
            orientation: 'top',
            zoomMin: 86400000, // 1 day in milliseconds
            zoomMax: 31536000000, // 1 year in milliseconds
            margin: {
                item: 10,
                axis: 5,
            },
            ...options,
        };
        // Create timeline
        timelineRef.current = new Timeline(containerRef.current, itemsDataSetRef.current, groupsDataSetRef.current, defaultOptions);
        // Cleanup on unmount
        return () => {
            if (timelineRef.current) {
                timelineRef.current.destroy();
                timelineRef.current = null;
            }
        };
    }, []); // Only run once on mount
    // Update items when they change
    useEffect(() => {
        if (!itemsDataSetRef.current)
            return;
        const currentIds = itemsDataSetRef.current.getIds();
        const newIds = items.map(item => item.id);
        // Remove items that no longer exist
        const idsToRemove = currentIds.filter(id => !newIds.includes(id));
        if (idsToRemove.length > 0) {
            itemsDataSetRef.current.remove(idsToRemove);
        }
        // Update or add items
        items.forEach(item => {
            const existing = itemsDataSetRef.current.get(item.id);
            if (existing) {
                // Update existing item
                itemsDataSetRef.current.update(item);
            }
            else {
                // Add new item
                itemsDataSetRef.current.add(item);
            }
        });
    }, [items]);
    // Update groups when they change
    useEffect(() => {
        if (!groups || !groupsDataSetRef.current || !timelineRef.current)
            return;
        const currentIds = groupsDataSetRef.current.getIds();
        const newIds = groups.map(group => group.id);
        // Remove groups that no longer exist
        const idsToRemove = currentIds.filter(id => !newIds.includes(id));
        if (idsToRemove.length > 0) {
            groupsDataSetRef.current.remove(idsToRemove);
        }
        // Update or add groups
        groups.forEach(group => {
            const existing = groupsDataSetRef.current.get(group.id);
            if (existing) {
                groupsDataSetRef.current.update(group);
            }
            else {
                groupsDataSetRef.current.add(group);
            }
        });
    }, [groups]);
    // Update options when they change
    useEffect(() => {
        if (!timelineRef.current || !options)
            return;
        timelineRef.current.setOptions(options);
    }, [options]);
    // Event handlers setup
    useEffect(() => {
        const timeline = timelineRef.current;
        if (!timeline)
            return;
        // Click event
        const handleClick = (properties) => {
            if (properties.item && onItemClick) {
                const item = itemsDataSetRef.current?.get(properties.item);
                if (item) {
                    onItemClick(item);
                }
            }
        };
        // Double-click event
        const handleDoubleClick = (properties) => {
            if (properties.item && onItemDoubleClick) {
                const item = itemsDataSetRef.current?.get(properties.item);
                if (item) {
                    onItemDoubleClick(item);
                }
            }
        };
        // Item updated event (drag to change time)
        const handleItemUpdate = (item, callback) => {
            if (onItemUpdate) {
                onItemUpdate(item, callback);
            }
            else {
                callback(item); // Accept change by default
            }
        };
        // Item moved event (drag to different position/group)
        const handleItemMove = (item, callback) => {
            if (onItemMove) {
                onItemMove(item, callback);
            }
            else {
                callback(item); // Accept change by default
            }
        };
        // Item added event
        const handleItemAdd = (item, callback) => {
            if (onItemAdd) {
                onItemAdd(item, callback);
            }
            else {
                callback(null); // Cancel by default (we don't allow adding from timeline)
            }
        };
        // Item removed event
        const handleItemRemove = (item, callback) => {
            if (onItemRemove) {
                onItemRemove(item, callback);
            }
            else {
                callback(null); // Cancel by default
            }
        };
        // Range changed event (zoom/pan)
        const handleRangeChanged = (properties) => {
            if (onRangeChange) {
                onRangeChange({
                    start: new Date(properties.start),
                    end: new Date(properties.end),
                    byUser: properties.byUser,
                });
            }
        };
        // Select event
        const handleSelect = (properties) => {
            if (onSelect) {
                onSelect(properties);
            }
        };
        // Register event listeners
        timeline.on('click', handleClick);
        timeline.on('doubleClick', handleDoubleClick);
        timeline.on('rangechanged', handleRangeChanged);
        timeline.on('select', handleSelect);
        // Editable events (only if editable is enabled)
        if (options?.editable) {
            if (typeof options.editable === 'boolean' || options.editable.updateTime) {
                timeline.on('timechange', handleItemUpdate);
            }
            if (typeof options.editable === 'boolean' || options.editable.updateGroup) {
                timeline.on('itemover', handleItemMove);
            }
            if (typeof options.editable === 'boolean' || options.editable.add) {
                timeline.on('add', handleItemAdd);
            }
            if (typeof options.editable === 'boolean' || options.editable.remove) {
                timeline.on('remove', handleItemRemove);
            }
        }
        // Cleanup listeners on unmount or when handlers change
        return () => {
            timeline.off('click', handleClick);
            timeline.off('doubleClick', handleDoubleClick);
            timeline.off('rangechanged', handleRangeChanged);
            timeline.off('select', handleSelect);
            timeline.off('timechange', handleItemUpdate);
            timeline.off('itemover', handleItemMove);
            timeline.off('add', handleItemAdd);
            timeline.off('remove', handleItemRemove);
        };
    }, [onItemClick, onItemDoubleClick, onItemUpdate, onItemMove, onItemAdd, onItemRemove, onRangeChange, onSelect, options?.editable]);
    // Expose timeline methods via ref callback
    const getTimeline = useCallback(() => timelineRef.current, []);
    // Public methods that can be called from parent
    useEffect(() => {
        // Attach public methods to component instance
        containerRef.current?.setAttribute('data-timeline-ready', 'true');
    }, []);
    return (_jsx("div", { ref: containerRef, className: className, style: {
            width: '100%',
            height: '100%',
            ...style,
        } }));
};
// Export helper function to get timeline instance from ref
export const getTimelineFromRef = (ref) => {
    // This is a workaround since we can't expose the timeline ref directly
    // In practice, you'd use a custom ref or imperative handle
    return null;
};
