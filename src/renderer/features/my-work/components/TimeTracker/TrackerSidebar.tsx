/**
 * TrackerSidebar - Right sidebar container for time tracking
 */

import { TimerWidget } from './PomodoroTimer/TimerWidget';
import { TimerControls } from './PomodoroTimer/TimerControls';
import { SessionIndicator } from './PomodoroTimer/SessionIndicator';
import { LogSummary } from './TodayLog/LogSummary';
import { WeeklyChart, TargetProgress } from '../WeeklySummary';
import { useMyWorkStore } from '@/stores/useMyWorkStore';

export function TrackerSidebar() {
  const activePomodoro = useMyWorkStore((state) => state.activePomodoro);
  const weeklyLogs = useMyWorkStore((state) => state.weeklyLogs);

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto p-6">
      {/* Pomodoro Timer Section */}
      <div className="space-y-4">
        <TimerWidget />

        {activePomodoro && (
          <>
            <TimerControls />
            <SessionIndicator />
          </>
        )}
      </div>

      {/* Weekly Summary Section */}
      <div className="space-y-4">
        <WeeklyChart data={weeklyLogs} />
        <TargetProgress data={weeklyLogs} />
      </div>

      {/* Today's Log Section */}
      <div className="flex-1 min-h-0">
        <LogSummary />
      </div>
    </div>
  );
}
