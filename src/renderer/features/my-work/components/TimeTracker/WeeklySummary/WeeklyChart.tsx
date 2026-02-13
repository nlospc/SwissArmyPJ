/**
 * WeeklyChart - Visual bar chart showing time logged per day
 */

import { WeeklySummary } from '@/stores/useMyWorkStore';
import { formatMinutes } from '@/features/my-work/utils/timeFormatters';
import { formatRelativeDate } from '@/features/my-work/utils/dateHelpers';

interface WeeklyChartProps {
  data: WeeklySummary | null;
  loading?: boolean;
}

export function WeeklyChart({ data, loading }: WeeklyChartProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!data || data.days.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No weekly data available</p>
      </div>
    );
  }

  // Find max value for scaling (minimum 60 minutes to avoid tiny bars)
  const maxMinutes = Math.max(60, ...data.days.map((d) => d.totalMinutes));
  
  // Get today's date for highlighting
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          This Week
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatMinutes(data.weeklyActual)} / {formatMinutes(data.weeklyTarget)}
        </span>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-2 h-32">
        {data.days.map((day) => {
          const percentage = Math.min(100, (day.totalMinutes / maxMinutes) * 100);
          const isToday = day.date === today;
          const hasData = day.totalMinutes > 0;

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1 group"
            >
              {/* Bar */}
              <div className="relative w-full flex items-end justify-center h-24">
                <div
                  className={`
                    w-full max-w-[40px] rounded-t-md transition-all duration-200
                    ${isToday 
                      ? 'bg-blue-500 dark:bg-blue-600' 
                      : hasData 
                        ? 'bg-blue-300 dark:bg-blue-800 group-hover:bg-blue-400 dark:group-hover:bg-blue-700' 
                        : 'bg-gray-200 dark:bg-gray-800'
                    }
                  `}
                  style={{ height: `${Math.max(4, percentage)}%` }}
                  title={`
                    ${formatRelativeDate(day.date)}
                    ${formatMinutes(day.totalMinutes)}
                    ${day.pomodoroCount} 🍅
                  `}
                />
              </div>

              {/* Day Label */}
              <span
                className={`
                  text-[10px] font-medium tabular-nums
                  ${isToday 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400'
                  }
                `}
              >
                {formatRelativeDate(day.date)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-sm" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-300 dark:bg-blue-800 rounded-sm" />
          <span>Logged</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-200 dark:bg-gray-800 rounded-sm" />
          <span>Empty</span>
        </div>
      </div>
    </div>
  );
}
