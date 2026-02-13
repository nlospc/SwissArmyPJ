import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * TrackerSidebar - Right sidebar container for time tracking
 */
import { TimerWidget } from './PomodoroTimer/TimerWidget';
import { TimerControls } from './PomodoroTimer/TimerControls';
import { SessionIndicator } from './PomodoroTimer/SessionIndicator';
import { LogSummary } from './TodayLog/LogSummary';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
export function TrackerSidebar() {
    const activePomodoro = useMyWorkStore((state) => state.activePomodoro);
    return (_jsxs("div", { className: "flex flex-col gap-6 h-full overflow-y-auto p-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsx(TimerWidget, {}), activePomodoro && (_jsxs(_Fragment, { children: [_jsx(TimerControls, {}), _jsx(SessionIndicator, {})] }))] }), _jsx("div", { className: "flex-1", children: _jsx(LogSummary, {}) })] }));
}
