/**
 * TimerControls - Start/Pause/Resume/Stop controls for Pomodoro timer
 */

import { Play, Pause, Square, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        <Button onClick={resumePomodoro} className="flex-1">
          <Play className="h-4 w-4 mr-2" />
          Resume
        </Button>
      ) : (
        <Button onClick={pausePomodoro} variant="outline" className="flex-1">
          <Pause className="h-4 w-4 mr-2" />
          Pause
        </Button>
      )}

      {/* Stop */}
      <Button onClick={stopPomodoro} variant="outline" size="icon">
        <Square className="h-4 w-4" />
      </Button>

      {/* Skip Break (only show during breaks) */}
      {isBreak && (
        <Button onClick={skipBreak} variant="outline" size="icon" title="Skip break">
          <SkipForward className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
