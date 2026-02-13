import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * TodoFilters - Group/sort/filter controls for todo list
 */
import { SlidersHorizontal } from 'lucide-react';
import { Select, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
export function TodoFilters() {
    const groupBy = useMyWorkStore((state) => state.groupBy);
    const sortBy = useMyWorkStore((state) => state.sortBy);
    const filterStatus = useMyWorkStore((state) => state.filterStatus);
    const updateGrouping = useMyWorkStore((state) => state.updateGrouping);
    const updateSorting = useMyWorkStore((state) => state.updateSorting);
    const updateFilter = useMyWorkStore((state) => state.updateFilter);
    return (_jsxs("div", { className: "flex items-center gap-3 px-6 py-4 border-b bg-theme-container flex-wrap", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-theme-secondary", children: [_jsx(SlidersHorizontal, { className: "h-4 w-4" }), _jsx("span", { children: "View:" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("label", { className: "text-sm text-theme-secondary", children: "Group:" }), _jsx(Select, { value: groupBy, onChange: (value) => updateGrouping(value), style: { width: 140 }, options: [
                            { value: 'project', label: 'By Project' },
                            { value: 'due_date', label: 'By Due Date' },
                            { value: 'priority', label: 'By Priority' },
                            { value: 'status', label: 'By Status' },
                        ] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("label", { className: "text-sm text-theme-secondary", children: "Sort:" }), _jsx(Select, { value: sortBy, onChange: (value) => updateSorting(value), style: { width: 140 }, options: [
                            { value: 'due_date', label: 'Due Date' },
                            { value: 'priority', label: 'Priority' },
                            { value: 'created', label: 'Recently Created' },
                            { value: 'estimated_time', label: 'Estimated Time' },
                        ] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("label", { className: "text-sm text-theme-secondary", children: "Filter:" }), _jsx(Select, { value: filterStatus, onChange: (value) => updateFilter(value), style: { width: 120 }, options: [
                            { value: 'all', label: 'All Tasks' },
                            { value: 'active', label: 'Active Only' },
                            { value: 'overdue', label: 'Overdue' },
                            { value: 'today', label: 'Due Today' },
                        ] })] }), _jsx(Button, { size: "small", icon: _jsx(ReloadOutlined, {}), className: "ml-auto", onClick: () => useMyWorkStore.getState().fetchTodos(true), children: "Refresh" })] }));
}
