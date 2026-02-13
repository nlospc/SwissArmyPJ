import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ProjectGanttChart - Displays all projects in an interactive Gantt chart
 * Refactored to use vis-timeline library for improved performance and features
 */
import { useState, useMemo, useCallback } from 'react';
import { Card, Button, Select, Space, Input, Tag, message } from 'antd';
import { CalendarOutlined, FilterOutlined, DownloadOutlined, } from '@ant-design/icons';
import { VisTimelineWrapper } from './VisTimelineWrapper';
import { projectsToTimelineItems, portfoliosToGroups, timelineItemToProjectUpdate, calculateDateRange, } from './timeline-adapter';
export function ProjectGanttChart({ projects, workItems = [], portfolios = [], loading = false, onProjectClick, onProjectUpdate, onExport, }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewScale, setViewScale] = useState('month');
    // Filter projects based on search and status
    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const matchesSearch = !searchQuery ||
                project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.owner?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [projects, searchQuery, statusFilter]);
    // Convert projects to vis-timeline items
    const timelineItems = useMemo(() => {
        return projectsToTimelineItems(filteredProjects);
    }, [filteredProjects]);
    // Create groups from portfolios
    const timelineGroups = useMemo(() => {
        return portfolios.length > 0 ? portfoliosToGroups(portfolios) : undefined;
    }, [portfolios]);
    // Calculate date range for initial view
    const dateRange = useMemo(() => {
        return calculateDateRange(filteredProjects);
    }, [filteredProjects]);
    // vis-timeline options
    const timelineOptions = useMemo(() => ({
        editable: {
            updateTime: true,
            updateGroup: portfolios.length > 0,
            add: false,
            remove: false,
        },
        groupOrder: 'content',
        stack: false,
        orientation: 'top',
        start: dateRange.start,
        end: dateRange.end,
        zoomMin: 86400000, // 1 day
        zoomMax: 31536000000 * 2, // 2 years
        margin: {
            item: {
                horizontal: 10,
                vertical: 5,
            },
            axis: 5,
        },
        height: '100%',
        moment: (date) => {
            // Format dates based on view scale
            return date;
        },
    }), [dateRange, portfolios.length]);
    // Handle item click
    const handleItemClick = useCallback((item) => {
        const project = projects.find(p => p.id === Number(item.id));
        if (project && onProjectClick) {
            onProjectClick(project);
        }
    }, [projects, onProjectClick]);
    // Handle item double-click
    const handleItemDoubleClick = useCallback((item) => {
        const project = projects.find(p => p.id === Number(item.id));
        if (project) {
            message.info(`Opening project: ${project.name}`);
            if (onProjectClick) {
                onProjectClick(project);
            }
        }
    }, [projects, onProjectClick]);
    // Handle item update (drag to change dates/portfolio)
    const handleItemUpdate = useCallback((item, callback) => {
        const projectId = Number(item.id);
        const updates = timelineItemToProjectUpdate(item);
        if (onProjectUpdate) {
            onProjectUpdate(projectId, updates);
            message.success('Project dates updated');
            callback(item); // Accept the change
        }
        else {
            console.log('Project update:', projectId, updates);
            callback(item); // Accept the change
        }
    }, [onProjectUpdate]);
    // Handle CSV export
    const handleExport = () => {
        if (onExport) {
            onExport();
        }
        else {
            // Default export implementation
            const csvContent = [
                ['Project Name', 'Status', 'Owner', 'Start Date', 'End Date', 'Portfolio'].join(','),
                ...filteredProjects.map(p => [
                    `"${p.name}"`,
                    p.status,
                    p.owner || '',
                    p.start_date || '',
                    p.end_date || '',
                    portfolios.find(port => port.id === p.portfolio_id)?.name || 'Unassigned',
                ].join(','))
            ].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `projects-timeline-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            message.success('Timeline exported to CSV');
        }
    };
    return (_jsxs(Card, { className: "h-full flex flex-col", styles: { body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 } }, children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b border-gray-200", children: [_jsxs(Space, { size: "middle", children: [_jsx("span", { className: "text-base font-semibold", children: "Project Timeline" }), _jsxs(Tag, { color: "blue", children: [filteredProjects.length, " projects"] })] }), _jsxs(Space, { size: "middle", children: [_jsx(Select, { value: statusFilter, onChange: setStatusFilter, style: { width: 140 }, size: "small", options: [
                                    { label: 'All Statuses', value: 'all' },
                                    { label: 'In Progress', value: 'in_progress' },
                                    { label: 'Not Started', value: 'not_started' },
                                    { label: 'Blocked', value: 'blocked' },
                                    { label: 'Done', value: 'done' },
                                ] }), _jsx(Input, { placeholder: "Search projects...", prefix: _jsx(FilterOutlined, {}), value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), allowClear: true, style: { width: 200 }, size: "small" }), _jsx(Select, { value: viewScale, onChange: setViewScale, style: { width: 100 }, size: "small", options: [
                                    { label: 'Day', value: 'day' },
                                    { label: 'Week', value: 'week' },
                                    { label: 'Month', value: 'month' },
                                ] }), _jsx(Button, { icon: _jsx(CalendarOutlined, {}), size: "small", onClick: () => {
                                    // vis-timeline doesn't expose moveTo easily from wrapper
                                    // Could be implemented with ref to timeline instance
                                    message.info('Navigate to today');
                                }, children: "Today" }), _jsx(Button, { icon: _jsx(DownloadOutlined, {}), size: "small", onClick: handleExport, children: "Export CSV" })] })] }), _jsx("div", { className: "flex-1 relative", style: { minHeight: 400 }, children: loading ? (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-white bg-opacity-50", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" }), _jsx("div", { className: "text-sm text-gray-500", children: "Loading projects..." })] }) })) : filteredProjects.length === 0 ? (_jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(CalendarOutlined, { style: { fontSize: 48, color: '#d9d9d9' } }), _jsx("div", { className: "mt-4 text-gray-500", children: "No projects to display" }), _jsx("div", { className: "mt-2 text-sm text-gray-400", children: searchQuery || statusFilter !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'Create a project to get started' })] }) })) : (_jsx(VisTimelineWrapper, { items: timelineItems, groups: timelineGroups, options: timelineOptions, onItemClick: handleItemClick, onItemDoubleClick: handleItemDoubleClick, onItemUpdate: handleItemUpdate, className: loading ? 'loading' : '' })) }), _jsx("div", { className: "px-4 py-2 border-t border-gray-200 bg-gray-50", children: _jsxs(Space, { size: "large", className: "text-xs", children: [_jsx("span", { className: "text-gray-500", children: "Legend:" }), _jsxs(Space, { size: "small", children: [_jsx("div", { className: "w-4 h-2 bg-green-100 border border-green-500 rounded" }), _jsx("span", { className: "text-gray-600", children: "Done" })] }), _jsxs(Space, { size: "small", children: [_jsx("div", { className: "w-4 h-2 bg-blue-100 border border-blue-500 rounded" }), _jsx("span", { className: "text-gray-600", children: "In Progress" })] }), _jsxs(Space, { size: "small", children: [_jsx("div", { className: "w-4 h-2 bg-red-100 border border-red-500 rounded", style: {
                                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255, 77, 79, 0.2) 4px, rgba(255, 77, 79, 0.2) 8px)'
                                    } }), _jsx("span", { className: "text-gray-600", children: "Blocked" })] }), _jsxs(Space, { size: "small", children: [_jsx("div", { className: "w-4 h-2 bg-gray-100 border border-gray-300 rounded" }), _jsx("span", { className: "text-gray-600", children: "Not Started" })] }), _jsx("span", { className: "text-gray-400 ml-4", children: "\u2022 Drag bars to change dates \u2022 Double-click to open project" })] }) })] }));
}
