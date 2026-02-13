import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SessionIndicator - Visual session count display (🍅🍅🍅○)
 */
import { useMyWorkStore } from '@/stores/useMyWorkStore';
import { getSessionIndicator, getPomodoroProgress } from '../../../utils/pomodoroSequence';
export function SessionIndicator() {
    const activePomodoro = useMyWorkStore((state) => state.activePomodoro);
    const preferences = useMyWorkStore((state) => state.preferences);
    if (!activePomodoro) {
        return null;
    }
    const sessionsBeforeLong = preferences?.pomodoroSessionsBeforeLong || 4;
    const indicator = getSessionIndicator(activePomodoro.sessionNumber, sessionsBeforeLong);
    const progress = getPomodoroProgress(activePomodoro.sessionNumber, sessionsBeforeLong);
    return (_jsxs("div", { className: "flex flex-col items-center gap-2 py-3", children: [_jsx("div", { className: "text-2xl tracking-wider", children: indicator }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["Session ", progress.completed, " of ", progress.total] }), progress.completed === progress.total && activePomodoro.sessionType === 'work' && (_jsx("div", { className: "text-xs text-green-600 font-medium", children: "Long break next!" }))] }));
}
