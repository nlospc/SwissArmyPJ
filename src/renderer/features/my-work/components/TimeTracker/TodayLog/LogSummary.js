import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * LogSummary - Today's time entries list
 */
import { useState } from 'react';
import { Plus, Clock } from 'lucide-react';
import { Card, Button } from 'antd';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
import { LogEntry } from './LogEntry';
import { ManualLogDialog } from './ManualLogDialog';
import { formatDuration } from '../../../utils/timeFormatters';
export function LogSummary() {
    const [isManualLogOpen, setIsManualLogOpen] = useState(false);
    const todayLogs = useMyWorkStore((state) => state.todayLogs);
    // Calculate total time today
    const totalMinutes = todayLogs.reduce((sum, log) => {
        return sum + (log.durationMinutes || 0);
    }, 0);
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { title: _jsxs("span", { className: "text-sm flex items-center gap-2", children: [_jsx(Clock, { className: "h-4 w-4" }), "Today's Time Log"] }), extra: _jsxs(Button, { size: "small", onClick: () => setIsManualLogOpen(true), children: [_jsx(Plus, { className: "h-3 w-3", style: { marginRight: 4 } }), "Manual Entry"] }), children: [totalMinutes > 0 && (_jsxs("div", { className: "mb-4 p-3 bg-blue-50 rounded-lg", children: [_jsx("div", { className: "text-xs text-theme-secondary mb-1", children: "Total Today" }), _jsx("div", { className: "text-2xl font-bold", children: formatDuration(totalMinutes) })] })), todayLogs.length === 0 ? (_jsx("div", { className: "text-center py-8", children: _jsx("div", { className: "text-sm text-theme-secondary", children: "No time logged today. Start a timer or add a manual entry." }) })) : (_jsx("div", { className: "space-y-2", children: todayLogs.map((log) => (_jsx(LogEntry, { log: log }, log.uuid))) }))] }), _jsx(ManualLogDialog, { open: isManualLogOpen, onOpenChange: setIsManualLogOpen })] }));
}
