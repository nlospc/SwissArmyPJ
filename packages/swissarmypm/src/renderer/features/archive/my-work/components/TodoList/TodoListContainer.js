import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * TodoListContainer - Main container for todo list with grouping logic
 */
import { useMemo } from 'react';
import { TodoFilters } from './TodoFilters';
import { TodoGroup } from './TodoGroup';
import { QuickTaskInput } from './QuickTaskInput';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
import { groupTodos, sortTodos, filterTodos } from '../../utils/groupTodos';
export function TodoListContainer() {
    // Select the Map itself, not a converted array
    const todosMap = useMyWorkStore((state) => state.todos);
    const groupBy = useMyWorkStore((state) => state.groupBy);
    const sortBy = useMyWorkStore((state) => state.sortBy);
    const filterStatus = useMyWorkStore((state) => state.filterStatus);
    const loading = useMyWorkStore((state) => state.loading);
    const error = useMyWorkStore((state) => state.error);
    // Convert Map to array in useMemo to avoid recreating on every render
    const todos = useMemo(() => Array.from(todosMap.values()), [todosMap]);
    // Extract unique projects for Quick Task input
    const projects = useMemo(() => {
        const projectMap = new Map();
        for (const todo of todos) {
            if (!projectMap.has(todo.projectId)) {
                projectMap.set(todo.projectId, todo.projectName || 'Unknown Project');
            }
        }
        return Array.from(projectMap.entries()).map(([id, name]) => ({ id, name }));
    }, [todos]);
    // Apply filtering, sorting, and grouping
    const groupedTodos = useMemo(() => {
        // First filter
        const filtered = filterTodos(todos, filterStatus);
        // Then sort each todo
        const sorted = sortTodos(filtered, sortBy);
        // Then group
        const groups = groupTodos(sorted, groupBy);
        // Sort todos within each group
        return groups.map((group) => ({
            ...group,
            todos: sortTodos(group.todos, sortBy),
        }));
    }, [todos, groupBy, sortBy, filterStatus]);
    if (loading && todos.length === 0) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "text-sm text-muted-foreground", children: "Loading todos..." }) }));
    }
    if (error) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsxs("div", { className: "text-sm text-red-600", children: ["Error: ", error] }) }));
    }
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsx(TodoFilters, {}), projects.length > 0 && (_jsx("div", { className: "sticky top-0 z-10 bg-theme-container px-6 py-3 border-b shadow-sm", children: _jsx(QuickTaskInput, { projects: projects }) })), _jsx("div", { className: "flex-1 overflow-y-auto px-6 py-4", children: groupedTodos.length === 0 ? (_jsx("div", { className: "flex flex-col items-center justify-center py-12 text-center", children: _jsx("div", { className: "text-sm text-muted-foreground mb-4", children: "No tasks found. Add your first task to get started!" }) })) : (_jsx("div", { className: "border rounded-lg overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-muted/50 border-b", children: [_jsx("th", { className: "w-8 px-3 py-2" }), _jsx("th", { className: "text-left px-3 py-2 font-medium text-muted-foreground", children: "Task" }), _jsx("th", { className: "text-left px-3 py-2 font-medium text-muted-foreground", children: "Project" }), _jsx("th", { className: "text-left px-3 py-2 font-medium text-muted-foreground", children: "Priority" }), _jsx("th", { className: "text-left px-3 py-2 font-medium text-muted-foreground", children: "Due" }), _jsx("th", { className: "text-left px-3 py-2 font-medium text-muted-foreground", children: "Time" }), _jsx("th", { className: "text-left px-3 py-2 font-medium text-muted-foreground", children: "Actions" })] }) }), _jsx("tbody", { children: groupedTodos.map((group, index) => (_jsx(TodoGroup, { group: group, isFirst: index === 0 }, group.key))) })] }) })) })] }));
}
