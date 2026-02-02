/**
 * TimerWidget - Timer display with MM:SS countdown
 */

import { useState, useEffect } from 'react';
import { Timer, Coffee, Palmtree, Play, Pause, Square, SkipForward } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
import { formatSecondsMMSS } from '../../../utils/timeFormatters';
import {
  getSessionLabel,
  getEstimatedCompletionTime,
  formatCompletionTime,
} from '../../../utils/pomodoroSequence';
import { cn } from '@/components/ui/utils';

export function TimerWidget() {
  const activePomodoro = useMyWorkStore((state) => state.activePomodoro);
  const activeLogsMap = useMyWorkStore((state) => state.activeLogs);
  const stopTimer = useMyWorkStore((state) => state.stopTimer);
  const pausePomodoro = useMyWorkStore((state) => state.pausePomodoro);
  const resumePomodoro = useMyWorkStore((state) => state.resumePomodoro);
  const stopPomodoro = useMyWorkStore((state) => state.stopPomodoro);
  const skipBreak = useMyWorkStore((state) => state.skipBreak);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Get active timer (either Pomodoro or regular timer)
  const activeTimerLog = Array.from(activeLogsMap.values())[0];

  // Update elapsed time for regular timer every second
  useEffect(() => {
    if (!activePomodoro && activeTimerLog) {
      const updateElapsed = () => {
        const startTime = new Date(activeTimerLog.startTime);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedSeconds(elapsed);
      };

      // Update immediately
      updateElapsed();

      // Then update every second
      const interval = setInterval(updateElapsed, 1000);

      return () => clearInterval(interval);
    }
  }, [activePomodoro, activeTimerLog]);

  // If no Pomodoro and no regular timer
  if (!activePomodoro && !activeTimerLog) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Timer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground">
              No active timer. Start a timer or Pomodoro from your tasks.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show regular timer if no Pomodoro active
  if (!activePomodoro && activeTimerLog) {
    const startTime = new Date(activeTimerLog.startTime);

    return (
      <Card className="border-2 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Timer Running
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Task Name */}
          <div className="text-sm font-medium mb-4 truncate" title={activeTimerLog.itemName}>
            {activeTimerLog.itemName}
          </div>

          {/* Elapsed Time */}
          <div className="text-center mb-6">
            <div className="text-5xl font-bold tabular-nums text-blue-600">
              {formatSecondsMMSS(elapsedSeconds)}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Started at {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Stop Button */}
          <Button
            onClick={() => stopTimer(activeTimerLog.id)}
            variant="outline"
            className="w-full"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Timer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completionTime = getEstimatedCompletionTime(activePomodoro.remainingSeconds);
  const sessionLabel = getSessionLabel(activePomodoro.sessionType);

  // Icon based on session type
  const SessionIcon =
    activePomodoro.sessionType === 'work'
      ? Timer
      : activePomodoro.sessionType === 'short_break'
      ? Coffee
      : Palmtree;

  // Color based on session type
  const sessionColors = {
    work: 'text-red-600 bg-red-500/10 border-red-500/20',
    short_break: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
    long_break: 'text-green-600 bg-green-500/10 border-green-500/20',
  };

  return (
    <Card className={cn('border-2', sessionColors[activePomodoro.sessionType])}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <SessionIcon className="h-4 w-4" />
          {sessionLabel}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Task Name */}
        <div className="text-sm font-medium mb-4 truncate" title={activePomodoro.itemName}>
          {activePomodoro.itemName}
        </div>

        {/* Countdown */}
        <div className="text-center mb-6">
          <div
            className={cn(
              'text-5xl font-bold tabular-nums',
              activePomodoro.isPaused && 'opacity-50'
            )}
          >
            {formatSecondsMMSS(activePomodoro.remainingSeconds)}
          </div>

          {activePomodoro.isPaused && (
            <div className="text-xs text-muted-foreground mt-2">Paused</div>
          )}

          {!activePomodoro.isPaused && (
            <div className="text-xs text-muted-foreground mt-2">
              Finishes at {formatCompletionTime(completionTime)}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden mb-4">
          <div
            className={cn(
              'h-full transition-all duration-1000',
              activePomodoro.sessionType === 'work' && 'bg-red-500',
              activePomodoro.sessionType === 'short_break' && 'bg-blue-500',
              activePomodoro.sessionType === 'long_break' && 'bg-green-500'
            )}
            style={{
              width: `${
                ((activePomodoro.durationMinutes * 60 - activePomodoro.remainingSeconds) /
                  (activePomodoro.durationMinutes * 60)) *
                100
              }%`,
            }}
          />
        </div>

        {/* Pomodoro Controls */}
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
          {(activePomodoro.sessionType === 'short_break' ||
            activePomodoro.sessionType === 'long_break') && (
            <Button onClick={skipBreak} variant="outline" size="icon" title="Skip break">
              <SkipForward className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
