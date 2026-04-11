import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * MyWorkPage - Main My Work feature page
 *
 * Three-column layout:
 * - Left: Todo list with filters and grouping
 * - Center: Quick stats
 * - Right: Time tracker (Pomodoro + Today's Log)
 */
import { useMyWorkInit } from '@/stores/useMyWorkStore';
import { TodoListContainer } from './components/TodoList/TodoListContainer';
import { StatsBar } from './components/QuickStats/StatsBar';
import { TrackerSidebar } from './components/TimeTracker/TrackerSidebar';
export function MyWorkPage() {
    // Initialize store on mount (fetches todos, stats, preferences, etc.)
    useMyWorkInit();
    return (_jsxs("div", { className: "flex flex-col h-full bg-white dark:bg-gray-900", children: [_jsx("div", { className: "bg-white dark:bg-gray-900 border-b px-6 py-4", children: _jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-gray-100", children: "My Work" }) }), _jsxs("div", { className: "flex-1 overflow-hidden flex", children: [_jsx("div", { className: "flex-1 overflow-auto border-r bg-white dark:bg-gray-900", children: _jsx(TodoListContainer, {}) }), _jsx("div", { className: "w-80 overflow-auto bg-white dark:bg-gray-900", children: _jsx(TrackerSidebar, {}) })] }), _jsx("div", { className: "bg-white dark:bg-gray-900 border-t", children: _jsx(StatsBar, {}) })] }));
}
