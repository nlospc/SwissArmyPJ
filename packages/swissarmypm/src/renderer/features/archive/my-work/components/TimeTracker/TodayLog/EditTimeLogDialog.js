import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * EditTimeLogDialog - Edit existing time log entry
 */
import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Input } from 'antd';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
export function EditTimeLogDialog({ log, open, onOpenChange }) {
    const editTimeLog = useMyWorkStore((state) => state.editTimeLog);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Populate form when log changes or dialog opens
    useEffect(() => {
        if (open && log) {
            setStartTime(formatDateTimeLocal(new Date(log.startTime)));
            setEndTime(log.endTime ? formatDateTimeLocal(new Date(log.endTime)) : '');
            setNotes(log.notes || '');
        }
    }, [open, log]);
    // Calculate new duration
    const newDurationMinutes = useMemo(() => {
        if (!startTime || !endTime)
            return null;
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end.getTime() - start.getTime();
        return Math.max(0, Math.floor(diffMs / 1000 / 60));
    }, [startTime, endTime]);
    const handleSubmit = async () => {
        if (!startTime)
            return;
        setIsSubmitting(true);
        try {
            await editTimeLog(log.id, {
                startTime: new Date(startTime).toISOString(),
                endTime: endTime ? new Date(endTime).toISOString() : log.endTime,
                notes: notes.trim() || undefined,
            });
            onOpenChange(false);
        }
        catch (error) {
            console.error('Failed to edit time log:', error);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const originalDuration = log.durationMinutes || 0;
    const hasDurationChange = newDurationMinutes !== null && newDurationMinutes !== originalDuration;
    return (_jsx(Modal, { open: open, onCancel: () => onOpenChange(false), title: "Edit Time Log", width: 500, footer: [
            _jsx(Button, { onClick: () => onOpenChange(false), children: "Cancel" }, "cancel"),
            _jsx(Button, { type: "primary", disabled: !startTime || isSubmitting, onClick: handleSubmit, children: isSubmitting ? 'Saving...' : 'Save Changes' }, "save"),
        ], children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Task" }), _jsx("div", { className: "text-sm font-medium", children: log.itemName }), _jsx("div", { className: "text-xs text-theme-secondary", children: log.projectName })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Log Type" }), _jsx("div", { className: "text-sm capitalize", children: log.logType })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Start Time *" }), _jsx(Input, { type: "datetime-local", value: startTime, onChange: (e) => setStartTime(e.target.value) })] }), log.endTime && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "End Time *" }), _jsx(Input, { type: "datetime-local", value: endTime, onChange: (e) => setEndTime(e.target.value) })] })), hasDurationChange && (_jsxs("div", { className: "text-sm", children: [_jsx("span", { className: "text-theme-secondary", children: "Duration: " }), _jsxs("span", { className: "line-through text-theme-secondary", children: [Math.floor(originalDuration / 60), "h ", originalDuration % 60, "m"] }), ' → ', _jsxs("span", { className: "font-medium text-amber-600", children: [Math.floor(newDurationMinutes / 60), "h ", newDurationMinutes % 60, "m"] })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Notes" }), _jsx(Input.TextArea, { value: notes, onChange: (e) => setNotes(e.target.value), placeholder: "Add notes about what you worked on...", rows: 3 })] }), log.editCount > 0 && (_jsxs("div", { className: "text-xs text-amber-600 bg-amber-50 p-2 rounded", children: ["This entry has been edited ", log.editCount, " time", log.editCount > 1 ? 's' : '', ". Last edited: ", log.editedAt ? new Date(log.editedAt).toLocaleString() : 'Unknown'] }))] }) }));
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
