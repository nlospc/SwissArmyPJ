/**
 * WeeklyChart - Visual bar chart showing time logged per day
 */

import { WeeklySummary } from '@/stores/useMyWorkStore';
import { theme } from 'antd';
import { formatMinutes } from '@/features/my-work/utils/timeFormatters';
import { formatRelativeDate } from '@/features/my-work/utils/timeFormatters';

interface WeeklyChartProps {
  data: WeeklySummary | null;
  loading?: boolean;
}

export function WeeklyChart({ data, loading }: WeeklyChartProps) {
  const { token } = theme.useToken();

  if (loading) {
    return (
      <div className="space-y-3">
        <div
          className="h-32 rounded-lg animate-pulse"
          style={{ backgroundColor: token.colorFillSecondary }}
        />
      </div>
    );
  }

  if (!data || data.days.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: token.colorTextSecondary }}>
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
        <h3 className="text-sm font-medium" style={{ color: token.colorText }}>
          This Week
        </h3>
        <span className="text-xs" style={{ color: token.colorTextSecondary }}>
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
                  className="w-full max-w-[40px] rounded-t-md transition-all duration-200"
                  style={{
                    height: `${Math.max(4, percentage)}%`,
                    backgroundColor: isToday
                      ? token.colorPrimary
                      : hasData
                        ? token.colorInfo
                        : token.colorFillSecondary,
                  }}
                  onMouseEnter={(e) => {
                    if (!isToday && hasData) {
                      e.currentTarget.style.backgroundColor = token.colorPrimaryBg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isToday
                      ? token.colorPrimary
                      : hasData
                        ? token.colorInfo
                        : token.colorFillSecondary;
                  }}
                  title={`
                    ${formatRelativeDate(day.date)}
                    ${formatMinutes(day.totalMinutes)}
                    ${day.pomodoroCount} 🍅
                  `}
                />
              </div>

              {/* Day Label */}
              <span
                className="text-[10px] font-medium tabular-nums"
                style={{
                  color: isToday
                    ? token.colorPrimary
                    : token.colorTextSecondary,
                }}
              >
                {formatRelativeDate(day.date)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        className="flex items-center justify-center gap-4 text-xs"
        style={{ color: token.colorTextSecondary }}
      >
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: token.colorPrimary }}
          />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: token.colorInfo }}
          />
          <span>Logged</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: token.colorFillSecondary }}
          />
          <span>Empty</span>
        </div>
      </div>
    </div>
  );
}
