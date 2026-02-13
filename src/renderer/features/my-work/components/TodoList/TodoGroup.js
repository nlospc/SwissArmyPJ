import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * TodoGroup - Collapsible group header + task rows (renders inside a shared <tbody>)
 */
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TodoItem } from './TodoItem';
export function TodoGroup({ group, defaultExpanded = true, isFirst = false }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    return (_jsxs(_Fragment, { children: [_jsx("tr", { className: `bg-muted/30${isFirst ? '' : ' border-t-2 border-muted'}`, children: _jsx("td", { colSpan: 7, className: "px-3 py-1.5", children: _jsxs("button", { onClick: () => setIsExpanded(!isExpanded), className: "flex items-center gap-2 text-left hover:text-primary transition-colors", children: [isExpanded ? (_jsx(ChevronDown, { className: "h-3.5 w-3.5" })) : (_jsx(ChevronRight, { className: "h-3.5 w-3.5" })), _jsx("span", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: group.label }), _jsxs("span", { className: "text-xs text-muted-foreground/60", children: ["(", group.count, ")"] })] }) }) }), isExpanded && (group.todos.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "text-center text-sm text-muted-foreground py-6", children: "No tasks in this group" }) })) : (group.todos.map((todo) => (_jsx(TodoItem, { todo: todo, isCompleted: todo.status === 'done' && todo.completedAt !== null }, todo.uuid)))))] }));
}
