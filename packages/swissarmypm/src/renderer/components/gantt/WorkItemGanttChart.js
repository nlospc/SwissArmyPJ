import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * WorkItemGanttChart - Displays work items for a specific project
 * Refactored to use vis-timeline library for improved performance
 */
import { useState, useMemo, useCallback } from 'react';
import { Card, Button, Space, Typography, Breadcrumb, Tag, Select, Progress, message } from 'antd';
import { HomeOutlined, ProjectOutlined, CalendarOutlined, DownloadOutlined, } from '@ant-design/icons';
import { VisTimelineWrapper } from './VisTimelineWrapper';
import { workItemsToTimelineItems, workItemsToGroups, timelineItemToWorkItemUpdate, calculateDateRange, } from './timeline-adapter';
const { Text, Title } = Typography;
export function WorkItemGanttChart({ project, workItems, loading = false, onBack, onWorkItemClick, onWorkItemUpdate, onExport, }) {
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [showHierarchy, setShowHierarchy] = useState(true);
    // Filter work items by project
    const projectWorkItems = useMemo(() => {
        return workItems.filter(w => w.project_id === project.id);
    }, [workItems, project.id]);
    // Apply status and type filters
    const filteredWorkItems = useMemo(() => {
        return projectWorkItems.filter(item => {
            if (filterStatus !== 'all' && item.status !== filterStatus)
                return false;
            if (filterType !== 'all' && item.type !== filterType)
                return false;
            return true;
        });
    }, [projectWorkItems, filterStatus, filterType]);
    // Calculate statistics
    const stats = useMemo(() => {
        const byType = {};
        const byStatus = {};
        projectWorkItems.forEach(item => {
            byType[item.type] = (byType[item.type] || 0) + 1;
            byStatus[item.status] = (byStatus[item.status] || 0) + 1;
        });
        return {
            total: projectWorkItems.length,
            done: byStatus.done || 0,
            in_progress: byStatus.in_progress || 0,
            blocked: byStatus.blocked || 0,
            byType,
            byStatus,
        };
    }, [projectWorkItems]);
    // Convert to vis-timeline items
    const timelineItems = useMemo(() => {
        return workItemsToTimelineItems(filteredWorkItems);
    }, [filteredWorkItems]);
    // Create groups if showing hierarchy
    const timelineGroups = useMemo(() => {
        return showHierarchy ? workItemsToGroups(filteredWorkItems) : undefined;
    }, [filteredWorkItems, showHierarchy]);
    // Calculate date range
    const dateRange = useMemo(() => {
        return calculateDateRange(filteredWorkItems.length > 0 ? filteredWorkItems : [project]);
    }, [filteredWorkItems, project]);
    // vis-timeline options
    const timelineOptions = useMemo(() => ({
        editable: {
            updateTime: true,
            updateGroup: false,
            add: false,
            remove: false,
        },
        stack: true,
        orientation: 'top',
        start: dateRange.start,
        end: dateRange.end,
        zoomMin: 86400000, // 1 day
        zoomMax: 31536000000, // 1 year
        margin: {
            item: {
                horizontal: 5,
                vertical: 3,
            },
            axis: 5,
        },
        height: '100%',
    }), [dateRange]);
    // Get unique values for filters
    const uniqueStatuses = useMemo(() => {
        return Array.from(new Set(projectWorkItems.map(item => item.status)));
    }, [projectWorkItems]);
    const uniqueTypes = useMemo(() => {
        return Array.from(new Set(projectWorkItems.map(item => item.type)));
    }, [projectWorkItems]);
    // Event handlers
    const handleItemClick = useCallback((item) => {
        const workItem = workItems.find(w => w.id === Number(item.id));
        if (workItem && onWorkItemClick) {
            onWorkItemClick(workItem);
        }
    }, [workItems, onWorkItemClick]);
    const handleItemDoubleClick = useCallback((item) => {
        const workItem = workItems.find(w => w.id === Number(item.id));
        if (workItem) {
            message.info(`Opening work item: ${workItem.title}`);
            if (onWorkItemClick) {
                onWorkItemClick(workItem);
            }
        }
    }, [workItems, onWorkItemClick]);
    const handleItemUpdate = useCallback((item, callback) => {
        const workItemId = Number(item.id);
        const updates = timelineItemToWorkItemUpdate(item);
        if (onWorkItemUpdate) {
            onWorkItemUpdate(workItemId, updates);
            message.success('Work item dates updated');
            callback(item);
        }
        else {
            console.log('Work item update:', workItemId, updates);
            callback(item);
        }
    }, [onWorkItemUpdate]);
    // Export handler
    const handleExport = () => {
        if (onExport) {
            onExport();
        }
        else {
            // Default CSV export
            const csvContent = [
                ['Type', 'Title', 'Status', 'Start Date', 'End Date', 'Notes'].join(','),
                ...filteredWorkItems.map(item => [
                    item.type,
                    `"${item.title}"`,
                    item.status,
                    item.start_date || '',
                    item.end_date || '',
                    item.notes ? `"${item.notes.replace(/"/g, '""')}"` : '',
                ].join(','))
            ].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name}-workitems-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            message.success('Work items exported to CSV');
        }
    };
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsxs("div", { className: "border-b border-gray-200 bg-white px-6 py-4", children: [_jsxs(Breadcrumb, { className: "mb-2", children: [_jsxs(Breadcrumb.Item, { onClick: onBack, className: "cursor-pointer hover:text-blue-500", children: [_jsx(HomeOutlined, {}), " Portfolio"] }), _jsxs(Breadcrumb.Item, { children: [_jsx(ProjectOutlined, {}), " ", project.name] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(Title, { level: 4, className: "mb-1", children: project.name }), _jsxs(Space, { size: "large", className: "text-sm", children: [_jsxs(Text, { children: [_jsx("strong", { children: stats.total }), " work items"] }), _jsxs(Text, { type: "success", children: [_jsx("strong", { children: stats.done }), " done"] }), _jsxs(Text, { className: "text-blue-600", children: [_jsx("strong", { children: stats.in_progress }), " in progress"] }), stats.blocked > 0 && (_jsxs(Text, { type: "danger", children: [_jsx("strong", { children: stats.blocked }), " blocked"] }))] })] }), project.end_date && (_jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-xs text-gray-500 mb-1", children: "Project Progress" }), _jsx(Progress, { percent: stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0, size: "small", style: { width: 200 } })] }))] })] }), _jsxs(Card, { className: "flex-1 flex flex-col", styles: { body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 } }, children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b border-gray-200", children: [_jsxs(Space, { size: "middle", children: [_jsx(Button, { icon: _jsx(HomeOutlined, {}), onClick: onBack, children: "Back" }), _jsxs(Tag, { color: "blue", children: [filteredWorkItems.length, " items"] })] }), _jsxs(Space, { size: "middle", children: [_jsx(Select, { placeholder: "Filter by status", value: filterStatus, onChange: setFilterStatus, style: { width: 150 }, size: "small", options: [
                                            { label: 'All Statuses', value: 'all' },
                                            ...uniqueStatuses.map(s => ({
                                                label: s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' '),
                                                value: s
                                            })),
                                        ] }), _jsx(Select, { placeholder: "Filter by type", value: filterType, onChange: setFilterType, style: { width: 150 }, size: "small", options: [
                                            { label: 'All Types', value: 'all' },
                                            ...uniqueTypes.map(t => ({
                                                label: t.charAt(0).toUpperCase() + t.slice(1),
                                                value: t
                                            })),
                                        ] }), _jsx(Select, { value: showHierarchy ? 'hierarchy' : 'flat', onChange: (v) => setShowHierarchy(v === 'hierarchy'), style: { width: 120 }, size: "small", options: [
                                            { label: 'Flat View', value: 'flat' },
                                            { label: 'Hierarchy', value: 'hierarchy' },
                                        ] }), _jsx(Button, { icon: _jsx(CalendarOutlined, {}), size: "small", onClick: () => message.info('Navigate to today'), children: "Today" }), _jsx(Button, { icon: _jsx(DownloadOutlined, {}), size: "small", onClick: handleExport, children: "Export CSV" })] })] }), _jsx("div", { className: "flex-1 relative", style: { minHeight: 400 }, children: loading ? (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" }), _jsx("div", { className: "text-sm text-gray-500", children: "Loading work items..." })] }) })) : filteredWorkItems.length === 0 ? (_jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(CalendarOutlined, { style: { fontSize: 48, color: '#d9d9d9' } }), _jsx("div", { className: "mt-4 text-gray-500", children: "No work items to display" }), _jsx("div", { className: "mt-2 text-sm text-gray-400", children: filterStatus !== 'all' || filterType !== 'all'
                                            ? 'Try adjusting your filters'
                                            : 'Add work items to this project to get started' })] }) })) : (_jsx(VisTimelineWrapper, { items: timelineItems, groups: timelineGroups, options: timelineOptions, onItemClick: handleItemClick, onItemDoubleClick: handleItemDoubleClick, onItemUpdate: handleItemUpdate, className: loading ? 'loading' : '' })) }), _jsx("div", { className: "px-4 py-2 border-t border-gray-200 bg-gray-50", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(Space, { size: "large", className: "text-xs", children: [_jsx("span", { className: "text-gray-500", children: "Type Legend:" }), _jsxs(Space, { size: "small", children: [_jsx("div", { className: "w-4 h-2 bg-blue-100 border border-blue-500 rounded" }), _jsx("span", { className: "text-gray-600", children: "Task" })] }), _jsxs(Space, { size: "small", children: [_jsx("div", { className: "w-4 h-2 bg-red-100 border border-red-500 rounded" }), _jsx("span", { className: "text-gray-600", children: "Issue" })] }), _jsxs(Space, { size: "small", children: [_jsx("div", { className: "w-2 h-2 bg-purple-500 border border-purple-700 rounded-sm transform rotate-45" }), _jsx("span", { className: "text-gray-600 ml-1", children: "Milestone" })] }), _jsxs(Space, { size: "small", children: [_jsx("div", { className: "w-4 h-2 border-2 border-green-500 border-dashed rounded" }), _jsx("span", { className: "text-gray-600", children: "Phase" })] })] }), _jsx("span", { className: "text-xs text-gray-400", children: "\u2022 Drag to change dates \u2022 Double-click to open \u2022 Ctrl+Scroll to zoom" })] }) })] })] }));
}
