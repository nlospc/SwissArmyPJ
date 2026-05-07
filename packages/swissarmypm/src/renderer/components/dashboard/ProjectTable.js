import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ArrowUpDown, Search, Filter, MoreVertical } from 'lucide-react';
import { Button, Input } from 'antd';
const STATUS_OPTIONS = [
    { value: 'on_track', label: 'On Track', color: 'text-green-500' },
    { value: 'at_risk', label: 'At Risk', color: 'text-yellow-500' },
    { value: 'critical', label: 'Critical', color: 'text-orange-500' },
    { value: 'blocked', label: 'Blocked', color: 'text-red-500' },
];
const STATUS_ICONS = {
    on_track: '🟢',
    at_risk: '🟡',
    critical: '🟠',
    blocked: '🚫',
};
export function ProjectTable({ projects, onProjectClick }) {
    const [sortField, setSortField] = useState('status');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filters, setFilters] = useState({
        search: '',
        statuses: [],
        portfolioId: null,
        owners: [],
        progressRange: [0, 100],
    });
    const [showFilters, setShowFilters] = useState(false);
    // Get unique owners from projects
    const uniqueOwners = Array.from(new Set(projects.map((p) => p.owner).filter(Boolean)));
    // Apply filters
    const filteredProjects = projects.filter((project) => {
        if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) {
            return false;
        }
        if (filters.statuses.length > 0 && !filters.statuses.includes(project.status)) {
            return false;
        }
        if (filters.owners.length > 0 && !filters.owners.includes(project.owner)) {
            return false;
        }
        if (project.progressPercent < filters.progressRange[0] ||
            project.progressPercent > filters.progressRange[1]) {
            return false;
        }
        return true;
    });
    // Apply sorting
    const sortedProjects = [...filteredProjects].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'status':
                const statusOrder = { blocked: 0, critical: 1, at_risk: 2, on_track: 3 };
                comparison = statusOrder[a.status] - statusOrder[b.status];
                break;
            case 'progress':
                comparison = a.progressPercent - b.progressPercent;
                break;
            case 'owner':
                comparison = a.owner.localeCompare(b.owner);
                break;
            case 'nextMilestone':
                const aDate = a.nextMilestone?.date ? new Date(a.nextMilestone.date).getTime() : 0;
                const bDate = b.nextMilestone?.date ? new Date(b.nextMilestone.date).getTime() : 0;
                comparison = aDate - bDate;
                break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });
    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortField(field);
            setSortOrder('asc');
        }
    };
    const toggleStatusFilter = (status) => {
        setFilters((prev) => ({
            ...prev,
            statuses: prev.statuses.includes(status)
                ? prev.statuses.filter((s) => s !== status)
                : [...prev.statuses, status],
        }));
    };
    const clearFilters = () => {
        setFilters({
            search: '',
            statuses: [],
            portfolioId: null,
            owners: [],
            progressRange: [0, 100],
        });
    };
    const activeFilterCount = [
        filters.search,
        filters.statuses.length,
        filters.owners.length,
    ].filter(Boolean).length;
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "relative flex-1 max-w-sm", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400", style: { zIndex: 1 } }), _jsx(Input, { placeholder: "Search projects...", value: filters.search, onChange: (e) => setFilters({ ...filters, search: e.target.value }), style: { paddingLeft: 36 } })] }), _jsxs(Button, { size: "small", onClick: () => setShowFilters(!showFilters), children: [_jsx(Filter, { className: "h-4 w-4", style: { marginRight: 8 } }), "Filters", activeFilterCount > 0 && (_jsx("span", { className: "ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white", children: activeFilterCount }))] }), activeFilterCount > 0 && (_jsx(Button, { type: "text", size: "small", onClick: clearFilters, children: "Clear all" }))] }), showFilters && (_jsxs("div", { className: "border rounded-lg p-4 space-y-4 bg-theme-container", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium mb-2 block", children: "Status" }), _jsx("div", { className: "flex flex-wrap gap-2", children: STATUS_OPTIONS.map((option) => (_jsxs("button", { onClick: () => toggleStatusFilter(option.value), className: `px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${filters.statuses.includes(option.value)
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-theme-container hover:bg-theme-layout'}`, children: [STATUS_ICONS[option.value], " ", option.label] }, option.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium mb-2 block", children: "Owner" }), _jsx("div", { className: "flex flex-wrap gap-2", children: uniqueOwners.map((owner) => (_jsx("button", { onClick: () => {
                                        setFilters((prev) => ({
                                            ...prev,
                                            owners: prev.owners.includes(owner)
                                                ? prev.owners.filter((o) => o !== owner)
                                                : [...prev.owners, owner],
                                        }));
                                    }, className: `px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${filters.owners.includes(owner)
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-theme-container hover:bg-theme-layout'}`, children: owner }, owner))) })] }), _jsxs("div", { children: [_jsxs("label", { className: "text-sm font-medium mb-2 block", children: ["Progress: ", filters.progressRange[0], "% - ", filters.progressRange[1], "%"] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("input", { type: "range", min: "0", max: "100", value: filters.progressRange[0], onChange: (e) => setFilters((prev) => ({
                                            ...prev,
                                            progressRange: [Number(e.target.value), prev.progressRange[1]],
                                        })), className: "flex-1" }), _jsx("input", { type: "range", min: "0", max: "100", value: filters.progressRange[1], onChange: (e) => setFilters((prev) => ({
                                            ...prev,
                                            progressRange: [prev.progressRange[0], Number(e.target.value)],
                                        })), className: "flex-1" })] })] })] })), _jsxs("div", { className: "border rounded-lg overflow-hidden", children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-theme-container border-b", children: _jsxs("tr", { children: [_jsx(SortableHeader, { field: "status", label: "Status", sortField: sortField, sortOrder: sortOrder, onSort: handleSort }), _jsx(SortableHeader, { field: "name", label: "Project", sortField: sortField, sortOrder: sortOrder, onSort: handleSort }), _jsx(SortableHeader, { field: "owner", label: "Owner", sortField: sortField, sortOrder: sortOrder, onSort: handleSort }), _jsx(SortableHeader, { field: "progress", label: "Progress", sortField: sortField, sortOrder: sortOrder, onSort: handleSort }), _jsx("th", { className: "h-12 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400", children: "Tasks" }), _jsx(SortableHeader, { field: "nextMilestone", label: "Next Milestone", sortField: sortField, sortOrder: sortOrder, onSort: handleSort }), _jsx("th", { className: "h-12 px-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400", children: "Blockers" }), _jsx("th", { className: "h-12 px-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400", children: "Risks" }), _jsx("th", { className: "h-12 px-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400 w-20", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y", children: sortedProjects.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 9, className: "h-32 text-center text-gray-500 dark:text-gray-400", children: "No projects found matching your filters" }) })) : (sortedProjects.map((project) => (_jsxs("tr", { className: "hover:bg-theme-container transition-colors cursor-pointer", onClick: () => onProjectClick?.(project), children: [_jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "text-xl", children: STATUS_ICONS[project.status] }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("div", { className: "font-medium", children: project.name }) }), _jsx("td", { className: "px-4 py-3 text-sm text-gray-500 dark:text-gray-400", children: project.owner || '—' }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "h-2 w-full bg-theme-layout rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-blue-600 rounded-full transition-all", style: { width: `${project.progressPercent}%` } }) }), _jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: [project.progressPercent, "%"] })] }) }), _jsxs("td", { className: "px-4 py-3 text-sm", children: [project.doneTasks, "/", project.totalTasks] }), _jsx("td", { className: "px-4 py-3", children: project.nextMilestone ? (_jsxs("div", { className: "space-y-0.5", children: [_jsx("div", { className: "text-sm font-medium", children: project.nextMilestone.name }), _jsxs("div", { className: "flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400", children: [formatDate(project.nextMilestone.date), _jsx(MilestoneStatusBadge, { status: project.nextMilestone.status })] })] })) : (_jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: "\u2014" })) }), _jsx("td", { className: "px-4 py-3 text-center", children: project.blockerCount > 0 ? (_jsx("span", { className: "inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-medium", children: project.blockerCount })) : (_jsx("span", { className: "text-gray-500 dark:text-gray-400", children: "\u2014" })) }), _jsx("td", { className: "px-4 py-3 text-center", children: project.highRiskCount > 0 ? (_jsx("span", { className: "inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-medium", children: project.highRiskCount })) : (_jsx("span", { className: "text-gray-500 dark:text-gray-400", children: "\u2014" })) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Button, { type: "text", size: "small", style: { height: 32, width: 32, padding: 0 }, onClick: (e) => {
                                                        e.stopPropagation();
                                                    }, children: _jsx(MoreVertical, { className: "h-4 w-4" }) }) })] }, project.id)))) })] }) }), _jsxs("div", { className: "border-t bg-theme-container px-4 py-2 text-sm text-gray-500 dark:text-gray-400", children: ["Showing ", sortedProjects.length, " of ", projects.length, " projects"] })] })] }));
}
function SortableHeader({ field, label, sortField, sortOrder, onSort }) {
    const isActive = sortField === field;
    return (_jsx("th", { className: "h-12 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors select-none", onClick: () => onSort(field), children: _jsxs("div", { className: "flex items-center gap-1", children: [label, _jsx(ArrowUpDown, { className: `h-3 w-3 transition-opacity ${isActive ? 'opacity-100' : 'opacity-30'} ${sortOrder === 'desc' && isActive ? 'rotate-180' : ''}` })] }) }));
}
function MilestoneStatusBadge({ status }) {
    const config = {
        on_track: { label: 'On Track', className: 'text-green-600' },
        at_risk: { label: 'At Risk', className: 'text-yellow-600' },
        overdue: { label: 'Overdue', className: 'text-red-600' },
    };
    const { label, className } = config[status] || config.on_track;
    return _jsxs("span", { className: className, children: ["\u2022 ", label] });
}
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
        return `${Math.abs(diffDays)}d overdue`;
    }
    else if (diffDays === 0) {
        return 'Today';
    }
    else if (diffDays === 1) {
        return 'Tomorrow';
    }
    else if (diffDays <= 7) {
        return `${diffDays}d`;
    }
    else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}
