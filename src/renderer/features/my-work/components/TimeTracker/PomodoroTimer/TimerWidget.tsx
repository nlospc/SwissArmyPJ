/**
 * TimerWidget - Timer display with MM:SS countdown
 */

import { Timer, Coffee, Palmtree } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  if (!activePomodoro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Pomodoro Timer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground">
              No active timer. Start a Pomodoro from your tasks.
            </div>
          </div>
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
      </CardContent>
    </Card>
  );
}
