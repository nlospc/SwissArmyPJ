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

  const isBreak =
    activePomodoro.sessionType === 'short_break' ||
    activePomodoro.sessionType === 'long_break';

  return (
    <div className="flex items-center gap-2">
      {/* Pause/Resume */}
      {activePomodoro.isPaused ? (
        <Button type="primary" onClick={resumePomodoro} style={{ flex: 1 }}>
          <Play className="h-4 w-4" style={{ marginRight: 8 }} />
          Resume
        </Button>
      ) : (
        <Button onClick={pausePomodoro} style={{ flex: 1 }}>
          <Pause className="h-4 w-4" style={{ marginRight: 8 }} />
          Pause
        </Button>
      )}

      {/* Stop */}
      <Button onClick={stopPomodoro}>
        <Square className="h-4 w-4" />
      </Button>

      {/* Skip Break (only show during breaks) */}
      {isBreak && (
        <Button onClick={skipBreak} title="Skip break">
          <SkipForward className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
