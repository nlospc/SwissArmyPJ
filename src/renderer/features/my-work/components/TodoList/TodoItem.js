import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * TodoItem - Individual task row in the todo table
 */
import { useState, useMemo } from 'react';
import { CheckCircle2, Circle, Play, Timer, Calendar, Clock, AlertCircle, Square, MoreVertical, Edit, Trash2, } from 'lucide-react';
import { Button, Dropdown, Modal, Select, Input, Tag } from 'antd';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
import { formatDuration } from '../../utils/timeFormatters';
import { formatDueDate } from '../../utils/dateHelpers';
const priorityTagColors = {
    critical: 'red',
    high: 'orange',
    medium: 'blue',
    low: 'default',
};
export function TodoItem({ todo, isCompleted = false }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editData, setEditData] = useState({ title: todo.name, status: todo.status, end_date: todo.dueDate || '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const markDone = useMyWorkStore((state) => state.markDone);
    const startTimer = useMyWorkStore((state) => state.startTimer);
    const startPomodoro = useMyWorkStore((state) => state.startPomodoro);
    const stopTimer = useMyWorkStore((state) => state.stopTimer);
    const fetchTodos = useMyWorkStore((state) => state.fetchTodos);
    const activeLogsMap = useMyWorkStore((state) => state.activeLogs);
    const activeTimerLog = useMemo(() => {
        return Array.from(activeLogsMap.values()).find((log) => log.workItemId === todo.id);
    }, [activeLogsMap, todo.id]);
    const hasActiveTimer = !!activeTimerLog;
    const dueDateInfo = formatDueDate(todo.dueDate);
    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const { ipc } = await import('@/lib/ipc');
            const result = await ipc.workItems.delete(todo.id);
            if (result.success) {
                await fetchTodos(true);
                setIsDeleteOpen(false);
            }
        }
        catch (error) {
            console.error('Failed to delete task:', error);
        }
        finally {
            setIsDeleting(false);
        }
    };
    const handleSaveEdit = async () => {
        if (!editData.title.trim())
            return;
        setIsSaving(true);
        try {
            const { ipc } = await import('@/lib/ipc');
            const result = await ipc.workItems.update(todo.id, {
                title: editData.title.trim(),
                status: editData.status,
                end_date: editData.end_date || null,
            });
            if (result.success) {
                await fetchTodos(true);
                setIsEditOpen(false);
            }
        }
        catch (error) {
            console.error('Failed to update task:', error);
        }
        finally {
            setIsSaving(false);
        }
    };
    const menuItems = [
        {
            key: 'edit',
            label: 'Edit Task',
            icon: _jsx(Edit, { className: "h-4 w-4" }),
            onClick: () => {
                setEditData({ title: todo.name, status: todo.status, end_date: todo.dueDate || '' });
                setIsEditOpen(true);
            },
        },
        {
            key: 'delete',
            label: 'Delete Task',
            icon: _jsx(Trash2, { className: "h-4 w-4" }),
            danger: true,
            onClick: () => setIsDeleteOpen(true),
        },
    ];
    return (_jsxs("tr", { className: [
            'border-b last:border-0 transition-colors hover:bg-theme-container',
            isCompleted ? 'opacity-60' : '',
            dueDateInfo.isOverdue && !isCompleted ? 'bg-red-50' : '',
        ].filter(Boolean).join(' '), children: [_jsx("td", { className: "w-8 px-3 py-2.5", children: _jsx("button", { onClick: () => markDone(todo.id), className: "text-theme-secondary hover:text-blue-600 transition-colors", disabled: isCompleted, children: isCompleted ? (_jsx(CheckCircle2, { className: "h-4 w-4 text-green-600" })) : (_jsx(Circle, { className: "h-4 w-4" })) }) }), _jsx("td", { className: "px-3 py-2.5", children: _jsx("span", { className: `font-medium text-sm${isCompleted ? ' line-through text-theme-secondary' : ''}`, children: todo.name }) }), _jsx("td", { className: "px-3 py-2.5 text-sm text-theme-secondary", children: todo.projectName }), _jsx("td", { className: "px-3 py-2.5", children: todo.priority && todo.priority !== 'none' ? (_jsx(Tag, { color: priorityTagColors[todo.priority] || 'default', style: { fontSize: 10 }, children: todo.priority.toUpperCase() })) : (_jsx("span", { className: "text-xs text-theme-secondary", children: "\u2014" })) }), _jsx("td", { className: "px-3 py-2.5", children: todo.dueDate ? (_jsxs("span", { className: `text-sm flex items-center gap-1${dueDateInfo.isOverdue ? ' text-red-600 font-medium' : dueDateInfo.isToday ? ' text-amber-600 font-medium' : ''}`, children: [_jsx(Calendar, { className: "h-3 w-3" }), dueDateInfo.text, dueDateInfo.isOverdue && _jsx(AlertCircle, { className: "h-3 w-3" })] })) : (_jsx("span", { className: "text-xs text-theme-secondary", children: "\u2014" })) }), _jsx("td", { className: "px-3 py-2.5 text-sm text-theme-secondary", children: todo.estimatedMinutes || todo.loggedMinutes > 0 ? (_jsxs("div", { className: "flex flex-col gap-0.5", children: [todo.estimatedMinutes ? (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "h-3 w-3" }), formatDuration(todo.estimatedMinutes), " est"] })) : null, todo.loggedMinutes > 0 ? (_jsxs("span", { className: "flex items-center gap-1 text-green-600", children: [_jsx(Clock, { className: "h-3 w-3" }), formatDuration(todo.loggedMinutes), " logged"] })) : null] })) : (_jsx("span", { children: "\u2014" })) }), _jsxs("td", { className: "px-3 py-2.5", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [!isCompleted && (_jsx(_Fragment, { children: hasActiveTimer ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-600 rounded text-xs font-medium", children: [_jsx(Clock, { className: "h-3 w-3 animate-pulse" }), "Running"] }), _jsx(Button, { size: "small", onClick: () => activeTimerLog && stopTimer(activeTimerLog.id), title: "Stop timer", style: { height: 28, width: 28, padding: 0 }, children: _jsx(Square, { className: "h-3 w-3" }) })] })) : (_jsxs(_Fragment, { children: [_jsxs(Button, { size: "small", onClick: () => startTimer(todo.id, false), style: { height: 28 }, children: [_jsx(Play, { className: "h-3 w-3", style: { marginRight: 4 } }), "Start"] }), _jsxs(Button, { size: "small", onClick: () => startPomodoro(todo.id), style: { height: 28 }, children: [_jsx(Timer, { className: "h-3 w-3", style: { marginRight: 4 } }), "Pomo"] })] })) })), _jsx(Dropdown, { menu: { items: menuItems }, placement: "bottomRight", trigger: ['click'], children: _jsx(Button, { type: "text", size: "small", style: { height: 28, width: 28, padding: 0 }, children: _jsx(MoreVertical, { className: "h-3.5 w-3.5" }) }) })] }), _jsx(Modal, { open: isDeleteOpen, onCancel: () => setIsDeleteOpen(false), title: "Delete Task", width: 400, footer: [
                            _jsx(Button, { disabled: isDeleting, onClick: () => setIsDeleteOpen(false), children: "Cancel" }, "cancel"),
                            _jsx(Button, { danger: true, type: "primary", disabled: isDeleting, onClick: handleDelete, children: isDeleting ? 'Deleting...' : 'Delete' }, "delete"),
                        ], children: _jsxs("p", { children: ["Are you sure you want to delete \"", todo.name, "\"? This action cannot be undone."] }) }), _jsx(Modal, { open: isEditOpen, onCancel: () => setIsEditOpen(false), title: "Edit Task", width: 500, footer: [
                            _jsx(Button, { disabled: isSaving, onClick: () => setIsEditOpen(false), children: "Cancel" }, "cancel"),
                            _jsx(Button, { type: "primary", disabled: !editData.title.trim() || isSaving, onClick: handleSaveEdit, children: isSaving ? 'Saving...' : 'Save Changes' }, "save"),
                        ], children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Task Name" }), _jsx(Input, { value: editData.title, onChange: (e) => setEditData({ ...editData, title: e.target.value }), placeholder: "Enter task name..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Status" }), _jsx(Select, { value: editData.status, onChange: (value) => setEditData({ ...editData, status: value }), style: { width: '100%' }, options: [
                                                { value: 'not_started', label: 'Not Started' },
                                                { value: 'in_progress', label: 'In Progress' },
                                                { value: 'blocked', label: 'Blocked' },
                                                { value: 'done', label: 'Done' },
                                            ] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Due Date" }), _jsx(Input, { type: "date", value: editData.end_date, onChange: (e) => setEditData({ ...editData, end_date: e.target.value }) })] })] }) })] })] }));
}
