import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ManualLogDialog - Manual time entry form
 */
import { useState, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Modal, Button, Select, Input } from 'antd';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
export function ManualLogDialog({ open, onOpenChange }) {
    const userId = useMyWorkStore((state) => state.userId);
    // Fix: Use shallow comparison to prevent infinite loop caused by creating new array references
    const todos = useMyWorkStore(useShallow((state) => Array.from(state.todos.values())));
    const logManualTime = useMyWorkStore((state) => state.logManualTime);
    const [workItemId, setWorkItemId] = useState(0);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Set default times when dialog opens
    useEffect(() => {
        if (open) {
            const now = new Date();
            setEndTime(formatDateTimeLocal(now));
            const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
            setStartTime(formatDateTimeLocal(thirtyMinutesAgo));
            setWorkItemId(0);
            setNotes('');
        }
    }, [open]);
    // Calculate duration
    const durationMinutes = useMemo(() => {
        if (!startTime || !endTime)
            return 0;
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end.getTime() - start.getTime();
        return Math.max(0, Math.floor(diffMs / 1000 / 60));
    }, [startTime, endTime]);
    const handleSubmit = async () => {
        if (!workItemId || !startTime || !endTime || durationMinutes <= 0) {
            return;
        }
        setIsSubmitting(true);
        try {
            await logManualTime({
                workItemId,
                userId,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                durationMinutes,
                notes: notes.trim() || undefined,
            });
            onOpenChange(false);
        }
        catch (error) {
            console.error('Failed to log manual time:', error);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx(Modal, { open: open, onCancel: () => onOpenChange(false), title: "Log Manual Time", width: 500, footer: [
            _jsx(Button, { onClick: () => onOpenChange(false), children: "Cancel" }, "cancel"),
            _jsx(Button, { type: "primary", disabled: !workItemId || !startTime || !endTime || durationMinutes <= 0 || isSubmitting, onClick: handleSubmit, children: isSubmitting ? 'Saving...' : 'Log Time' }, "submit"),
        ], children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Task *" }), _jsx(Select, { value: workItemId || undefined, onChange: (value) => setWorkItemId(value), placeholder: "Select a task...", style: { width: '100%' }, options: todos.map((todo) => ({
                                value: todo.id,
                                label: `${todo.name} (${todo.projectName})`,
                            })) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Start Time *" }), _jsx(Input, { type: "datetime-local", value: startTime, onChange: (e) => setStartTime(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "End Time *" }), _jsx(Input, { type: "datetime-local", value: endTime, onChange: (e) => setEndTime(e.target.value) })] }), durationMinutes > 0 && (_jsxs("div", { className: "text-sm text-theme-secondary", children: ["Duration: ", Math.floor(durationMinutes / 60), "h ", durationMinutes % 60, "m"] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Notes (optional)" }), _jsx(Input.TextArea, { value: notes, onChange: (e) => setNotes(e.target.value), placeholder: "Add notes about what you worked on...", rows: 3 })] })] }) }));
}
// Helper to format Date to datetime-local input format
function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}
