/**
 * TimerWidget - Timer display with MM:SS countdown
 */

import { useState, useEffect } from 'react';
import { Timer, Coffee, Palmtree, Play, Pause, Square, SkipForward } from 'lucide-react';
import { Card, Button, Progress } from 'antd';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
import { formatSecondsMMSS } from '../../../utils/timeFormatters';
import {
  getSessionLabel,
  getEstimatedCompletionTime,
  formatCompletionTime,
} from '../../../utils/pomodoroSequence';

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
      <Card title={<span className="text-sm flex items-center gap-2"><Timer className="h-4 w-4" /> Timer</span>}>
        <div className="text-center py-8">
          <div className="text-sm text-theme-secondary">
            No active timer. Start a timer or Pomodoro from your tasks.
          </div>
        </div>
      </Card>
    );
  }

  // Show regular timer if no Pomodoro active
  if (!activePomodoro && activeTimerLog) {
    const startTime = new Date(activeTimerLog.startTime);

    return (
      <Card
        title={<span className="text-sm flex items-center gap-2"><Timer className="h-4 w-4" /> Timer Running</span>}
        style={{ borderColor: '#bfdbfe', borderWidth: 2 }}
      >
        {/* Task Name */}
        <div className="text-sm font-medium mb-4 truncate" title={activeTimerLog.itemName}>
          {activeTimerLog.itemName}
        </div>

        {/* Elapsed Time */}
        <div className="text-center mb-6">
          <div className="text-5xl font-bold tabular-nums text-blue-600">
            {formatSecondsMMSS(elapsedSeconds)}
          </div>
          <div className="text-xs text-theme-secondary mt-2">
            Started at {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Stop Button */}
        <Button
          onClick={() => stopTimer(activeTimerLog.id)}
          className="w-full"
        >
          <Square className="h-4 w-4" style={{ marginRight: 8 }} />
          Stop Timer
        </Button>
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

  // Colors based on session type
  const sessionColors = {
    work: { border: '#fca5a5', bg: '#fef2f2', text: '#dc2626', progress: '#ef4444' },
    short_break: { border: '#93c5fd', bg: '#eff6ff', text: '#2563eb', progress: '#3b82f6' },
    long_break: { border: '#86efac', bg: '#f0fdf4', text: '#16a34a', progress: '#22c55e' },
  };

  const colors = sessionColors[activePomodoro.sessionType];
  const progressPercent =
    ((activePomodoro.durationMinutes * 60 - activePomodoro.remainingSeconds) /
      (activePomodoro.durationMinutes * 60)) *
    100;

  return (
    <Card
      title={<span className="text-sm flex items-center gap-2"><SessionIcon className="h-4 w-4" /> {sessionLabel}</span>}
      style={{ borderColor: colors.border, borderWidth: 2, backgroundColor: colors.bg }}
    >
      {/* Task Name */}
      <div className="text-sm font-medium mb-4 truncate" title={activePomodoro.itemName}>
        {activePomodoro.itemName}
      </div>

      {/* Countdown */}
      <div className="text-center mb-6">
        <div
          className={`text-5xl font-bold tabular-nums${activePomodoro.isPaused ? ' opacity-50' : ''}`}
          style={{ color: colors.text }}
        >
          {formatSecondsMMSS(activePomodoro.remainingSeconds)}
        </div>

        {activePomodoro.isPaused && (
          <div className="text-xs text-theme-secondary mt-2">Paused</div>
        )}

        {!activePomodoro.isPaused && (
          <div className="text-xs text-theme-secondary mt-2">
            Finishes at {formatCompletionTime(completionTime)}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <Progress
        percent={progressPercent}
        showInfo={false}
        strokeColor={colors.progress}
        trailColor="#e5e7eb"
        strokeWidth={8}
        className="mb-4"
      />

      {/* Pomodoro Controls */}
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
        {(activePomodoro.sessionType === 'short_break' ||
          activePomodoro.sessionType === 'long_break') && (
          <Button onClick={skipBreak} title="Skip break">
            <SkipForward className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
