import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * TimerControls - Start/Pause/Resume/Stop controls for Pomodoro timer
 */
import { Play, Pause, Square, SkipForward } from 'lucide-react';
import { Button } from 'antd';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
export function TimerControls() {
    const activePomodoro = useMyWorkStore((state) => state.activePomodoro);
    const pausePomodoro = useMyWorkStore((state) => state.pausePomodoro);
    const resumePomodoro = useMyWorkStore((state) => state.resumePomodoro);
    const stopPomodoro = useMyWorkStore((state) => state.stopPomodoro);
    const skipBreak = useMyWorkStore((state) => state.skipBreak);
    if (!activePomodoro) {
        return null;
    }
    const isBreak = activePomodoro.sessionType === 'short_break' ||
        activePomodoro.sessionType === 'long_break';
    return (_jsxs("div", { className: "flex items-center gap-2", children: [activePomodoro.isPaused ? (_jsxs(Button, { type: "primary", onClick: resumePomodoro, style: { flex: 1 }, children: [_jsx(Play, { className: "h-4 w-4", style: { marginRight: 8 } }), "Resume"] })) : (_jsxs(Button, { onClick: pausePomodoro, style: { flex: 1 }, children: [_jsx(Pause, { className: "h-4 w-4", style: { marginRight: 8 } }), "Pause"] })), _jsx(Button, { onClick: stopPomodoro, children: _jsx(Square, { className: "h-4 w-4" }) }), isBreak && (_jsx(Button, { onClick: skipBreak, title: "Skip break", children: _jsx(SkipForward, { className: "h-4 w-4" }) }))] }));
}
