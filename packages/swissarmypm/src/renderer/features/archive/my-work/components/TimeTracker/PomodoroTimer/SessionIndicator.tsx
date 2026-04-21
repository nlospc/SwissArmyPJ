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

  return (
    <div className="flex flex-col items-center gap-2 py-3">
      {/* Session Indicators */}
      <div className="text-2xl tracking-wider">{indicator}</div>

      {/* Text Progress */}
      <div className="text-xs text-muted-foreground">
        Session {progress.completed} of {progress.total}
      </div>

      {/* Next Session Hint */}
      {progress.completed === progress.total && activePomodoro.sessionType === 'work' && (
        <div className="text-xs text-green-600 font-medium">
          Long break next!
        </div>
      )}
    </div>
  );
}
