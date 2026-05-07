import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * LogEntry - Single time log entry with edit button
 */
import { useState } from 'react';
import { Clock, Edit, Timer, Hand } from 'lucide-react';
import { Button } from 'antd';
import { formatTimeRange, formatDuration } from '../../../utils/timeFormatters';
import { EditTimeLogDialog } from './EditTimeLogDialog';
export function LogEntry({ log }) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const logTypeIcons = {
        manual: Hand,
        timer: Clock,
        pomodoro: Timer,
    };
    const LogIcon = logTypeIcons[log.logType] || Clock;
    const wasEdited = log.editCount > 0;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-start gap-3 p-3 rounded-lg hover:bg-theme-container transition-colors group", children: [_jsx("div", { className: "p-2 rounded-md bg-theme-container", children: _jsx(LogIcon, { className: "h-4 w-4 text-theme-secondary" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "font-medium text-sm truncate", title: log.itemName, children: log.itemName }), _jsx("div", { className: "text-xs text-theme-secondary truncate", title: log.projectName, children: log.projectName }), _jsx("div", { className: "text-xs text-theme-secondary mt-1", children: formatTimeRange(log.startTime, log.endTime) }), _jsx("div", { className: "text-xs font-medium mt-1", children: log.durationMinutes ? formatDuration(log.durationMinutes) : 'In progress...' }), log.notes && (_jsxs("div", { className: "text-xs text-theme-secondary mt-1 italic line-clamp-2", children: ["\"", log.notes, "\""] })), log.pomodoroCount > 0 && (_jsxs("div", { className: "text-xs text-theme-secondary mt-1", children: ["\uD83C\uDF45 ", log.pomodoroCount, " pomodoro", log.pomodoroCount > 1 ? 's' : ''] })), wasEdited && (_jsxs("div", { className: "text-[10px] text-amber-600 mt-1", children: ["Edited ", log.editCount, " time", log.editCount > 1 ? 's' : ''] }))] }), _jsx(Button, { size: "small", type: "text", onClick: () => setIsEditDialogOpen(true), className: `opacity-0 group-hover:opacity-100 transition-opacity${wasEdited ? ' text-amber-600' : ''}`, children: _jsx(Edit, { className: "h-3 w-3" }) })] }), _jsx(EditTimeLogDialog, { log: log, open: isEditDialogOpen, onOpenChange: setIsEditDialogOpen })] }));
}
