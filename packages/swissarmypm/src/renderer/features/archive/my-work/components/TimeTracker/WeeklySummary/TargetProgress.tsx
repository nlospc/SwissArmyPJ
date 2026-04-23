/**
 * TargetProgress - Progress bar showing weekly target vs actual
 */

import { WeeklySummary } from '@/stores/useMyWorkStore';
import { formatMinutes } from '@/features/archive/my-work/utils/timeFormatters';

interface TargetProgressProps {
  data: WeeklySummary | null;
  loading?: boolean;
}

export function TargetProgress({ data, loading }: TargetProgressProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const percentage = Math.min(100, (data.weeklyActual / data.weeklyTarget) * 100);
  const isOverTarget = data.weeklyActual > data.weeklyTarget;
  const remaining = Math.max(0, data.weeklyTarget - data.weeklyActual);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Weekly Target
        </h3>
        <span className={`
          text-sm font-semibold
          ${isOverTarget 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-gray-900 dark:text-gray-100'
          }
        `}>
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        {/* Background track */}
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700" />
        
        {/* Progress fill */}
        <div
          className={`
            absolute top-0 left-0 h-full rounded-full transition-all duration-500
            ${isOverTarget 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600'
            }
          `}
          style={{ width: `${percentage}%` }}
        />
        
        {/* Percentage indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`
            text-xs font-semibold
            ${isOverTarget ? 'text-white' : 'text-gray-700 dark:text-gray-300'}
          `}>
            {formatMinutes(data.weeklyActual)}
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs">
        <div className="text-gray-500 dark:text-gray-400">
          Target: <span className="font-medium text-gray-700 dark:text-gray-300">
            {formatMinutes(data.weeklyTarget)}
          </span>
        </div>
        
        {isOverTarget ? (
          <div className="text-green-600 dark:text-green-400 font-medium">
            🎯 Exceeded by {formatMinutes(data.weeklyActual - data.weeklyTarget)}!
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400">
            {formatMinutes(remaining)} remaining
          </div>
        )}
      </div>

      {/* Motivational Message */}
      {percentage >= 100 && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-300 font-medium">
            🎉 Amazing work! You've hit your weekly target!
          </p>
        </div>
      )}
      
      {percentage >= 75 && percentage < 100 && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
            💪 Almost there! Just {formatMinutes(remaining)} more to reach your target.
          </p>
        </div>
      )}
      
      {percentage >= 50 && percentage < 75 && (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
          Keep going! You're making good progress.
        </p>
      )}
      
      {percentage < 50 && percentage > 0 && (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
          {formatMinutes(remaining)} to go. You've got this!
        </p>
      )}
    </div>
  );
}
