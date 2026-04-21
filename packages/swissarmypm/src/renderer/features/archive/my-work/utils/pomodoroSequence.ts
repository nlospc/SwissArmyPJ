/**
 * Pomodoro sequence calculation utilities
 */

export type SessionType = 'work' | 'short_break' | 'long_break';

export interface PomodoroPreferences {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

/**
 * Calculate the next session type based on current session
 */
export function getNextSessionType(
  currentType: SessionType,
  sessionNumber: number,
  sessionsBeforeLong: number = 4
): SessionType {
  // If currently on a break, next is always a work session
  if (currentType === 'short_break' || currentType === 'long_break') {
    return 'work';
  }

  // If work session just completed, determine break type
  // sessionNumber is 1-indexed: 1, 2, 3, 4 → long break after 4th
  const isLongBreak = sessionNumber % sessionsBeforeLong === 0;

  return isLongBreak ? 'long_break' : 'short_break';
}

/**
 * Get session duration in minutes
 */
export function getSessionDuration(
  sessionType: SessionType,
  preferences: PomodoroPreferences
): number {
  switch (sessionType) {
    case 'work':
      return preferences.workDuration;
    case 'short_break':
      return preferences.shortBreakDuration;
    case 'long_break':
      return preferences.longBreakDuration;
  }
}

/**
 * Get session type label
 */
export function getSessionLabel(sessionType: SessionType): string {
  switch (sessionType) {
    case 'work':
      return 'Work Session';
    case 'short_break':
      return 'Short Break';
    case 'long_break':
      return 'Long Break';
  }
}

/**
 * Get session type emoji
 */
export function getSessionEmoji(sessionType: SessionType): string {
  switch (sessionType) {
    case 'work':
      return '🍅';
    case 'short_break':
      return '☕';
    case 'long_break':
      return '🌴';
  }
}

/**
 * Calculate pomodoro progress (completed sessions / target before long break)
 */
export function getPomodoroProgress(
  sessionNumber: number,
  sessionsBeforeLong: number = 4
): {
  completed: number;
  total: number;
  percentage: number;
} {
  const cyclePosition = ((sessionNumber - 1) % sessionsBeforeLong) + 1;

  return {
    completed: cyclePosition,
    total: sessionsBeforeLong,
    percentage: (cyclePosition / sessionsBeforeLong) * 100,
  };
}

/**
 * Generate session indicator string
 * Examples: "🍅🍅🍅○" (3 complete, 1 remaining)
 */
export function getSessionIndicator(
  sessionNumber: number,
  sessionsBeforeLong: number = 4
): string {
  const progress = getPomodoroProgress(sessionNumber, sessionsBeforeLong);
  const completed = '🍅'.repeat(progress.completed);
  const remaining = '○'.repeat(progress.total - progress.completed);

  return completed + remaining;
}

/**
 * Calculate estimated completion time
 */
export function getEstimatedCompletionTime(
  remainingSeconds: number
): Date {
  const now = new Date();
  return new Date(now.getTime() + remainingSeconds * 1000);
}

/**
 * Format estimated completion time
 * Examples: "Finishes at 3:45 PM"
 */
export function formatCompletionTime(completionTime: Date): string {
  return completionTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
